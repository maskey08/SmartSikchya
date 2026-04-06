-- ============================================================
-- SmartSikshya — DB Migration
-- Run this on your existing database. Safe to run multiple
-- times (uses IF NOT EXISTS / IF EXISTS guards).
-- ============================================================

-- ── 1. subjects ─────────────────────────────────────────────
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS slug           VARCHAR(120) UNIQUE,
  ADD COLUMN IF NOT EXISTS icon           VARCHAR(80)  DEFAULT 'menu_book',
  ADD COLUMN IF NOT EXISTS color_class    VARCHAR(120) DEFAULT 'bg-primary/10 text-primary';

-- Back-fill slug from subject_name for any existing rows
UPDATE public.subjects
SET slug = LOWER(REGEXP_REPLACE(subject_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ── 2. chapters ─────────────────────────────────────────────
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS order_num     INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS is_locked     BOOLEAN DEFAULT FALSE;

-- ── 3. questions — add type, options, explanation ───────────
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(10)  DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'fib', 'short')),
  ADD COLUMN IF NOT EXISTS options       JSONB,
  ADD COLUMN IF NOT EXISTS explanation   TEXT;

-- ── 4. question_metadata — keep existing, nothing to add ────
-- Already has: question_id, difficulty_level, embedding_vector

-- ── 5. users — Google OAuth + avatar ────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT,
  ADD COLUMN IF NOT EXISTS google_id     VARCHAR(255) UNIQUE;

-- Make password_hash nullable (Google users have no password)
ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

-- ── 6. practice_sessions — add chapter + outcome ────────────
ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS chapter_id    INTEGER REFERENCES public.chapters(chapter_id),
  ADD COLUMN IF NOT EXISTS total_q       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_earned     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_completed  BOOLEAN DEFAULT FALSE;

-- ── 7. session_responses — add answer + chapter context ─────
ALTER TABLE public.session_responses
  ADD COLUMN IF NOT EXISTS given_answer  TEXT,
  ADD COLUMN IF NOT EXISTS chapter_id    INTEGER REFERENCES public.chapters(chapter_id),
  ADD COLUMN IF NOT EXISTS xp_awarded    INTEGER DEFAULT 0;

-- ── 8. user_xp — NEW table for gamification ─────────────────
CREATE TABLE IF NOT EXISTS public.user_xp (
  xp_id       SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  total_xp    INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ── 9. Useful indexes for query performance ──────────────────
CREATE INDEX IF NOT EXISTS idx_questions_chapter    ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.question_metadata(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_session_resp_session ON public.session_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user   ON public.user_progress(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user        ON public.practice_sessions(user_id, chapter_id);

-- ── 10. Seed sample data so frontend has something to render ─
-- Physics subject
INSERT INTO public.subjects (subject_name, slug, description, icon, color_class)
VALUES
  ('Physics',  'physics',  'Mechanics, thermodynamics, optics and modern physics.', 'science',      'bg-blue-100 text-blue-600'),
  ('Mathematics', 'mathematics', 'Calculus, algebra, statistics and more.', 'calculate',   'bg-purple-100 text-purple-600'),
  ('Chemistry', 'chemistry', 'Organic, inorganic, and physical chemistry.', 'biotech',      'bg-green-100 text-green-600')
ON CONFLICT (slug) DO NOTHING;

-- Physics chapters
WITH phys AS (SELECT subject_id FROM public.subjects WHERE slug = 'physics')
INSERT INTO public.chapters (subject_id, chapter_name, order_num, description)
SELECT subject_id, chapter_name, order_num, description FROM phys,
(VALUES
  ('Mechanics',         1, 'Newton''s laws, motion, forces and energy.'),
  ('Thermodynamics',    2, 'Heat, work, entropy and the laws of thermodynamics.'),
  ('Optics',            3, 'Reflection, refraction, lenses and wave optics.')
) AS c(chapter_name, order_num, description)
ON CONFLICT DO NOTHING;

-- Math chapters
WITH math AS (SELECT subject_id FROM public.subjects WHERE slug = 'mathematics')
INSERT INTO public.chapters (subject_id, chapter_name, order_num, description)
SELECT subject_id, chapter_name, order_num, description FROM math,
(VALUES
  ('Differentiation',   1, 'Derivatives, chain rule, implicit differentiation.'),
  ('Integration',       2, 'Definite and indefinite integrals, techniques.'),
  ('Matrices',          3, 'Matrix operations, determinants, eigenvalues.')
) AS c(chapter_name, order_num, description)
ON CONFLICT DO NOTHING;

-- Sample MCQ questions for Mechanics (chapter 1)
WITH mech AS (
  SELECT c.chapter_id, c.subject_id FROM public.chapters c
  JOIN public.subjects s ON s.subject_id = c.subject_id
  WHERE s.slug = 'physics' AND c.order_num = 1
)
INSERT INTO public.questions (subject_id, chapter_id, question_text, question_type, options, correct_answer, explanation)
SELECT
  mech.subject_id, mech.chapter_id,
  q.question_text, q.question_type,
  q.options::jsonb, q.correct_answer, q.explanation
FROM mech, (VALUES
  (
    'What is Newton''s First Law of Motion?',
    'mcq',
    '{"A": "An object at rest stays at rest unless acted on by a net force", "B": "Force equals mass times acceleration", "C": "Every action has an equal and opposite reaction", "D": "Energy cannot be created or destroyed"}',
    'A',
    'Newton''s First Law (Law of Inertia) states that an object remains in its state of rest or uniform motion unless a net external force acts on it.'
  ),
  (
    'A 5 kg object is accelerated at 3 m/s². What net force acts on it?',
    'mcq',
    '{"A": "2 N", "B": "8 N", "C": "15 N", "D": "1.67 N"}',
    'C',
    'Using F = ma: F = 5 kg × 3 m/s² = 15 N.'
  ),
  (
    'Which quantity is a vector?',
    'mcq',
    '{"A": "Speed", "B": "Mass", "C": "Temperature", "D": "Velocity"}',
    'D',
    'Velocity has both magnitude and direction, making it a vector. Speed is a scalar (magnitude only).'
  ),
  (
    'The unit of force in SI is the ___.',
    'fib',
    NULL,
    'Newton',
    'Force is measured in Newtons (N), equivalent to kg·m/s².'
  ),
  (
    'In your own words, explain the difference between mass and weight.',
    'short',
    NULL,
    'Mass is the amount of matter in an object (measured in kg, constant everywhere). Weight is the gravitational force on that mass (W = mg), which varies by location.',
    NULL
  )
) AS q(question_text, question_type, options, correct_answer, explanation)
ON CONFLICT DO NOTHING;

-- Add difficulty metadata for those questions
INSERT INTO public.question_metadata (question_id, difficulty_level)
SELECT q.question_id, meta.difficulty_level
FROM public.questions q
JOIN public.chapters c ON c.chapter_id = q.chapter_id
JOIN public.subjects s ON s.subject_id = q.subject_id
CROSS JOIN (VALUES
  (1, 'easy'),
  (2, 'medium'),
  (3, 'easy'),
  (4, 'medium'),
  (5, 'hard')
) AS meta(rn, difficulty_level)
WHERE s.slug = 'physics' AND c.order_num = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.question_metadata qm WHERE qm.question_id = q.question_id
  )
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================================
-- Done. Verify with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public';
-- ============================================================

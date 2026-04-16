/**
 * AdminOCRPage — Upload PDF → Review extracted questions → Submit to DB.
 * Three sub-phases handled in one page:
 *   1. Upload: drag-drop or click to upload PDF, select subject/chapter
 *   2. Review: editable cards for each extracted question (missing answers highlighted red)
 *   3. Submitted: success screen with count
 */
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { Select } from "../components/Modal";

interface Subject {
  subject_id: number;
  subject_name: string;
}
interface Chapter {
  chapter_id: number;
  chapter_name: string;
  subject_id: number;
}
interface ExtractedQ {
  temp_id: number;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  question_type: number;
  difficulty: string;
  answer_found: boolean;
}

const TYPE_LABELS: Record<number, string> = {
  1: "MCQ",
  2: "Short Answer",
  3: "Fill-in-Blank",
};
const DIFF_OPTIONS = ["easy", "medium", "hard"];

// ── Single editable question card ─────────────────────────────
function ReviewCard({
  q,
  index,
  onChange,
  onRemove,
}: {
  q: ExtractedQ;
  index: number;
  onChange: (updated: ExtractedQ) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(!q.answer_found);

  function update(key: keyof ExtractedQ, value: unknown) {
    onChange({ ...q, [key]: value });
  }

  function updateOption(i: number, val: string) {
    const opts = [...(q.options ?? ["", "", "", ""])];
    opts[i] = val;
    onChange({ ...q, options: opts });
  }

  const isMCQ = q.question_type === 1;
  const hasMissingAnswer = !q.answer_found || !q.correct_answer?.trim();

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface shadow-sm transition-all",
        hasMissingAnswer ? "border-warning/50 bg-warning/3" : "border-border",
      )}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium text-text-main",
                !expanded && "line-clamp-2",
              )}
            >
              {q.question_text}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                  q.difficulty === "easy"
                    ? "border-success/30 bg-success/10 text-success"
                    : q.difficulty === "hard"
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : "border-warning/30 bg-warning/10 text-warning",
                )}
              >
                {q.difficulty}
              </span>
              <span className="rounded-full bg-border/50 px-2 py-0.5 text-[10px] text-text-muted">
                {TYPE_LABELS[q.question_type]}
              </span>
              {hasMissingAnswer && (
                <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  <span className="material-symbols-outlined text-[12px]">
                    warning
                  </span>
                  Missing answer
                </span>
              )}
              {!hasMissingAnswer && (
                <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <span className="material-symbols-outlined text-[12px]">
                    check_circle
                  </span>
                  Answer: {q.correct_answer}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-lg p-1 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete
            </span>
          </button>
          <span
            className="material-symbols-outlined text-text-muted text-[20px] transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "" }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div
          className="border-t border-border p-4 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Question text */}
          <div>
            <label className="text-xs font-semibold text-text-muted mb-1 block">
              Question text
            </label>
            <textarea
              value={q.question_text}
              onChange={(e) => update("question_text", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">
                Type
              </label>
              <Select
                value={q.question_type}
                onChange={(e) =>
                  update("question_type", Number(e.target.value))
                }
                className="h-9 text-xs"
              >
                <option value={1}>MCQ</option>
                <option value={2}>Short Answer</option>
                <option value={3}>Fill-in-Blank</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">
                Difficulty
              </label>
              <Select
                value={q.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
                className="h-9 text-xs"
              >
                {DIFF_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* MCQ options */}
          {isMCQ && q.options && (
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">
                Options (click ✓ to mark correct)
              </label>
              <div className="flex flex-col gap-1.5">
                {(q.options.length < 4
                  ? [...q.options, ...Array(4 - q.options.length).fill("")]
                  : q.options
                )
                  .slice(0, 4)
                  .map((opt, i) => {
                    const key = ["A", "B", "C", "D"][i];
                    const isCorrect =
                      opt.trim() && opt.trim() === q.correct_answer?.trim();
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-1.5",
                          isCorrect
                            ? "border-success/30 bg-success/5"
                            : "border-border",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-black w-4",
                            isCorrect ? "text-success" : "text-text-muted",
                          )}
                        >
                          {key}
                        </span>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                          className="flex-1 bg-transparent text-sm text-text-main outline-none"
                          placeholder={`Option ${key}`}
                        />
                        <button
                          type="button"
                          onClick={() => update("correct_answer", opt.trim())}
                          disabled={!opt.trim()}
                          className={cn(
                            "text-text-muted hover:text-success transition-colors",
                            isCorrect && "text-success",
                          )}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isCorrect
                              ? "check_circle"
                              : "radio_button_unchecked"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Non-MCQ answer */}
          {!isMCQ && (
            <div>
              <label
                className={cn(
                  "text-xs font-semibold mb-1 block",
                  hasMissingAnswer ? "text-warning" : "text-text-muted",
                )}
              >
                Correct answer {hasMissingAnswer && "⚠ Required"}
              </label>
              <input
                value={q.correct_answer ?? ""}
                onChange={(e) => update("correct_answer", e.target.value)}
                placeholder="Enter correct answer"
                className={cn(
                  "h-9 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2",
                  hasMissingAnswer
                    ? "border-warning bg-warning/5 focus:ring-warning/20"
                    : "border-border bg-background focus:border-primary focus:ring-primary/20",
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main OCR page ──────────────────────────────────────────────
export default function AdminOCRPage() {
  const [phase, setPhase] = useState<"upload" | "review" | "done">("upload");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [autoChapter, setAutoChapter] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQ[]>([]);
  const [uploadErr, setUploadErr] = useState("");
  const [submitCount, setSubmitCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["admin-subjects"],
    queryFn: () => api.get("/admin/subjects").then((r) => r.data),
  });
  const { data: allChapters = [] } = useQuery<Chapter[]>({
    queryKey: ["admin-chapters"],
    queryFn: () => api.get("/admin/chapters").then((r) => r.data),
  });
  const chapters = allChapters.filter(
    (c) => !subjectId || c.subject_id === Number(subjectId),
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("subject_id", subjectId);
      if (chapterId) form.append("chapter_id", chapterId);
      form.append("auto_chapter", autoChapter.toString());
      return api
        .post("/ocr/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      setQuestions(data.questions);
      setPhase("review");
      setUploadErr("");
    },
    onError: (err: any) =>
      setUploadErr(err?.response?.data?.detail ?? "Upload failed."),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api
        .post("/ocr/submit", {
          subject_id: Number(subjectId),
          chapter_id: chapterId ? Number(chapterId) : null,
          questions: questions.filter((q) => q.question_text.trim()),
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setSubmitCount(data.inserted);
      setPhase("done");
    },
  });

  function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setUploadErr("Please upload a PDF file.");
      return;
    }
    if (!subjectId) {
      setUploadErr("Please select a subject first.");
      return;
    }
    setUploadErr("");
    uploadMutation.mutate(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const missingAnswers = questions.filter(
    (q) => !q.correct_answer?.trim(),
  ).length;

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      <div>
        <h1 className="text-2xl font-black text-text-main">
          Upload Question Bank (PDF)
        </h1>
        <p className="text-sm text-text-muted">
          OCR extracts questions, AI classifies difficulty, you review and
          submit.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {[
          ["upload", "Upload PDF"],
          ["review", "Review & Edit"],
          ["done", "Done"],
        ].map(([id, label], i) => (
          <div key={id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-black transition-colors",
                  phase === id
                    ? "bg-primary text-white"
                    : i < ["upload", "review", "done"].indexOf(phase)
                      ? "bg-success text-white"
                      : "bg-border text-text-muted",
                )}
              >
                {i < ["upload", "review", "done"].indexOf(phase) ? (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  phase === id ? "text-primary" : "text-text-muted",
                )}
              >
                {label}
              </span>
            </div>
            {i < 2 && <div className="mx-3 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {/* ── PHASE 1: Upload ─────────────────────────────── */}
      {phase === "upload" && (
        <div className="flex flex-col gap-5">
          {/* Subject + Chapter selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                Subject <span className="text-danger">*</span>
              </label>
              <Select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId("");
                }}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                Chapter (optional)
              </label>
              <Select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={!subjectId || autoChapter}
              >
                <option value="">All chapters / Auto-detect</option>
                {chapters.map((c) => (
                  <option key={c.chapter_id} value={c.chapter_id}>
                    {c.chapter_name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/40 hover:bg-primary/3",
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">
                upload_file
              </span>
            </div>
            <div>
              <p className="font-bold text-text-main">
                Drop your PDF here or click to browse
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Supports digital PDFs and scanned documents. Max 10MB.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Upload error */}
          {uploadErr && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined">error</span>
              {uploadErr}
            </div>
          )}

          {/* Upload loading */}
          {uploadMutation.isPending && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
              <div>
                <p className="text-sm font-bold text-primary">
                  Processing PDF...
                </p>
                <p className="text-xs text-text-muted">
                  OCR is extracting text and classifying difficulty.
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Tips for best results
            </p>
            <ul className="space-y-1 text-xs text-text-muted">
              <li className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-success text-[14px] mt-0.5">
                  check_circle
                </span>
                Number questions: 1. 2. 3.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-success text-[14px] mt-0.5">
                  check_circle
                </span>
                MCQ options on separate lines: A) text B) text
              </li>
              <li className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-success text-[14px] mt-0.5">
                  check_circle
                </span>
                Answers inline: "Answer: B" or in an answer key at the end
              </li>
              <li className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-warning text-[14px] mt-0.5">
                  info
                </span>
                Scanned PDFs need Tesseract OCR installed on the server
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── PHASE 2: Review ─────────────────────────────── */}
      {phase === "review" && (
        <div className="flex flex-col gap-5">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                quiz
              </span>
              <span className="font-bold text-text-main">
                {questions.length} questions extracted
              </span>
            </div>
            {missingAnswers > 0 && (
              <div className="flex items-center gap-2 text-warning">
                <span className="material-symbols-outlined text-[18px]">
                  warning
                </span>
                <span className="text-sm font-semibold">
                  {missingAnswers} missing answers — fill them in below
                </span>
              </div>
            )}
            {missingAnswers === 0 && (
              <div className="flex items-center gap-2 text-success">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                <span className="text-sm font-semibold">
                  All answers found — ready to submit!
                </span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setPhase("upload")}
                className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-muted hover:bg-border/40 transition-colors"
              >
                ← Start over
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || questions.length === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {submitMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[14px]">
                      progress_activity
                    </span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      upload
                    </span>
                    Submit {questions.length} questions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Question cards */}
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <ReviewCard
                key={q.temp_id}
                q={q}
                index={i}
                onChange={(updated) =>
                  setQuestions((prev) =>
                    prev.map((p) => (p.temp_id === q.temp_id ? updated : p)),
                  )
                }
                onRemove={() =>
                  setQuestions((prev) =>
                    prev.filter((p) => p.temp_id !== q.temp_id),
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE 3: Done ───────────────────────────────── */}
      {phase === "done" && (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface py-16 text-center shadow-sm">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
            <span className="material-symbols-outlined text-5xl text-success icon-fill">
              check_circle
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">
              {submitCount} questions added!
            </h2>
            <p className="mt-2 text-text-muted">
              They are now live in the question bank for students.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase("upload");
                setQuestions([]);
              }}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:bg-border/40 transition-colors"
            >
              Upload another PDF
            </button>
            <button
              onClick={() => (window.location.href = "/admin/questions")}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
            >
              View question bank
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

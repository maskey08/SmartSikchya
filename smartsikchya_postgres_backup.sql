--
-- PostgreSQL database dump
--

\restrict csbTle81YyROtFEKPYyqzlKArkIhdPFuBew2CBAjOlljKUI4Hygdl29cy6wqk3Z

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-21 16:40:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 33042)
-- Name: chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chapters (
    chapter_id integer NOT NULL,
    subject_id integer,
    chapter_name character varying(150) NOT NULL,
    order_num integer DEFAULT 1,
    description text,
    is_locked boolean DEFAULT false
);


ALTER TABLE public.chapters OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 33041)
-- Name: chapters_chapter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chapters_chapter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chapters_chapter_id_seq OWNER TO postgres;

--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 223
-- Name: chapters_chapter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chapters_chapter_id_seq OWNED BY public.chapters.chapter_id;


--
-- TOC entry 244 (class 1259 OID 41210)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    email character varying(100) NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 41209)
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNER TO postgres;

--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 243
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNED BY public.password_reset_tokens.token_id;


--
-- TOC entry 229 (class 1259 OID 33092)
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.practice_sessions (
    session_id integer NOT NULL,
    user_id integer,
    subject_id integer,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    chapter_id integer,
    total_q integer DEFAULT 0,
    correct_count integer DEFAULT 0,
    xp_earned integer DEFAULT 0,
    is_completed boolean DEFAULT false
);


ALTER TABLE public.practice_sessions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 33091)
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.practice_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.practice_sessions_session_id_seq OWNER TO postgres;

--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 228
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.practice_sessions_session_id_seq OWNED BY public.practice_sessions.session_id;


--
-- TOC entry 242 (class 1259 OID 41189)
-- Name: question_irt_params; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_irt_params (
    question_id integer NOT NULL,
    b_param double precision DEFAULT 0.0 NOT NULL,
    a_param double precision DEFAULT 1.0 NOT NULL,
    n_responses integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now()
);


ALTER TABLE public.question_irt_params OWNER TO postgres;

--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE question_irt_params; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.question_irt_params IS '2PL IRT calibration parameters per question. b_param seeded from DistilBERT labels, updated online.';


--
-- TOC entry 227 (class 1259 OID 33077)
-- Name: question_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_metadata (
    question_id integer NOT NULL,
    difficulty_level character varying(10),
    embedding_vector jsonb,
    CONSTRAINT question_metadata_difficulty_level_check CHECK (((difficulty_level)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])))
);


ALTER TABLE public.question_metadata OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 40963)
-- Name: question_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_type (
    question_type_id integer NOT NULL,
    type_name text NOT NULL
);


ALTER TABLE public.question_type OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 40972)
-- Name: question_type_question_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.question_type ALTER COLUMN question_type_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.question_type_question_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 33056)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    question_id integer NOT NULL,
    subject_id integer,
    chapter_id integer,
    question_text text NOT NULL,
    correct_answer text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    options jsonb,
    question_type integer
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 33055)
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_question_id_seq OWNER TO postgres;

--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 225
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_question_id_seq OWNED BY public.questions.question_id;


--
-- TOC entry 235 (class 1259 OID 33153)
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    recommendation_id integer NOT NULL,
    user_id integer,
    chapter_id integer,
    recommendation_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 33152)
-- Name: recommendations_recommendation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recommendations_recommendation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recommendations_recommendation_id_seq OWNER TO postgres;

--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 234
-- Name: recommendations_recommendation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recommendations_recommendation_id_seq OWNED BY public.recommendations.recommendation_id;


--
-- TOC entry 231 (class 1259 OID 33110)
-- Name: session_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_responses (
    response_id integer NOT NULL,
    session_id integer,
    question_id integer,
    is_correct boolean,
    time_taken_seconds integer,
    given_answer text,
    chapter_id integer,
    xp_awarded integer DEFAULT 0
);


ALTER TABLE public.session_responses OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 33109)
-- Name: session_responses_response_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_responses_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_responses_response_id_seq OWNER TO postgres;

--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 230
-- Name: session_responses_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_responses_response_id_seq OWNED BY public.session_responses.response_id;


--
-- TOC entry 222 (class 1259 OID 33033)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    subject_id integer NOT NULL,
    subject_name character varying(100) NOT NULL,
    description text,
    slug character varying(120),
    icon character varying(80) DEFAULT 'menu_book'::character varying,
    color_class character varying(120) DEFAULT 'bg-primary/10 text-primary'::character varying
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 33032)
-- Name: subjects_subject_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_subject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_subject_id_seq OWNER TO postgres;

--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 221
-- Name: subjects_subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_subject_id_seq OWNED BY public.subjects.subject_id;


--
-- TOC entry 241 (class 1259 OID 41163)
-- Name: user_irt_params; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_irt_params (
    id integer NOT NULL,
    user_id integer NOT NULL,
    chapter_id integer NOT NULL,
    theta double precision DEFAULT 0.0 NOT NULL,
    responses integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_irt_params OWNER TO postgres;

--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE user_irt_params; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_irt_params IS '2PL IRT ability estimates per student per chapter. theta=0 is population mean.';


--
-- TOC entry 240 (class 1259 OID 41162)
-- Name: user_irt_params_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_irt_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_irt_params_id_seq OWNER TO postgres;

--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 240
-- Name: user_irt_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_irt_params_id_seq OWNED BY public.user_irt_params.id;


--
-- TOC entry 233 (class 1259 OID 33128)
-- Name: user_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_progress (
    progress_id integer NOT NULL,
    user_id integer,
    subject_id integer,
    chapter_id integer,
    total_attempts integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    weakness_score double precision,
    current_theta double precision DEFAULT 0.0
);


ALTER TABLE public.user_progress OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 33127)
-- Name: user_progress_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_progress_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_progress_progress_id_seq OWNER TO postgres;

--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 232
-- Name: user_progress_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_progress_progress_id_seq OWNED BY public.user_progress.progress_id;


--
-- TOC entry 239 (class 1259 OID 41051)
-- Name: user_xp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_xp (
    xp_id integer NOT NULL,
    user_id integer NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_xp OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 41050)
-- Name: user_xp_xp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_xp_xp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_xp_xp_id_seq OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 238
-- Name: user_xp_xp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_xp_xp_id_seq OWNED BY public.user_xp.xp_id;


--
-- TOC entry 220 (class 1259 OID 33018)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100),
    email character varying(100) NOT NULL,
    password_hash text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar_url text,
    google_id character varying(255),
    role character varying(20) DEFAULT 'student'::character varying,
    refresh_token text,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    last_active_date date,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33017)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4927 (class 2604 OID 33045)
-- Name: chapters chapter_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters ALTER COLUMN chapter_id SET DEFAULT nextval('public.chapters_chapter_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 41213)
-- Name: password_reset_tokens token_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.password_reset_tokens_token_id_seq'::regclass);


--
-- TOC entry 4932 (class 2604 OID 33095)
-- Name: practice_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.practice_sessions_session_id_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 33059)
-- Name: questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN question_id SET DEFAULT nextval('public.questions_question_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 33156)
-- Name: recommendations recommendation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations ALTER COLUMN recommendation_id SET DEFAULT nextval('public.recommendations_recommendation_id_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 33113)
-- Name: session_responses response_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_responses ALTER COLUMN response_id SET DEFAULT nextval('public.session_responses_response_id_seq'::regclass);


--
-- TOC entry 4924 (class 2604 OID 33036)
-- Name: subjects subject_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN subject_id SET DEFAULT nextval('public.subjects_subject_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 41166)
-- Name: user_irt_params id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_irt_params ALTER COLUMN id SET DEFAULT nextval('public.user_irt_params_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 33131)
-- Name: user_progress progress_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress ALTER COLUMN progress_id SET DEFAULT nextval('public.user_progress_progress_id_seq'::regclass);


--
-- TOC entry 4945 (class 2604 OID 41054)
-- Name: user_xp xp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp ALTER COLUMN xp_id SET DEFAULT nextval('public.user_xp_xp_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 33021)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5179 (class 0 OID 33042)
-- Dependencies: 224
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chapters (chapter_id, subject_id, chapter_name, order_num, description, is_locked) FROM stdin;
1	1	Algebra	1	Equations, expressions, variables and algebraic thinking.	f
2	1	Geometry	2	Shapes, angles, area, perimeter and spatial reasoning.	f
3	2	Physics	1	Forces, motion, energy and the laws of the universe.	f
4	2	Chemistry	2	Elements, compounds, reactions and the periodic table.	f
5	3	Grammar	1	Parts of speech, sentence structure, tense and punctuation.	f
6	3	Comprehension	2	Reading passages, inference, vocabulary in context.	f
7	4	Programming	1	Variables, loops, conditions and basic algorithms.	f
8	4	Networking	2	IP addressing, protocols, OSI model and internet basics.	f
\.


--
-- TOC entry 5199 (class 0 OID 41210)
-- Dependencies: 244
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (token_id, user_id, email, token, expires_at, used, created_at) FROM stdin;
1	5	pragun.storage@gmail.com	203661	2026-04-20 18:29:35.247813	t	2026-04-20 18:14:35.237976
2	5	pragun.storage@gmail.com	138963	2026-04-20 18:59:17.40839	t	2026-04-20 18:44:17.39216
3	5	pragun.storage@gmail.com	737187	2026-04-21 08:23:41.772941	t	2026-04-21 08:08:41.75926
\.


--
-- TOC entry 5184 (class 0 OID 33092)
-- Dependencies: 229
-- Data for Name: practice_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.practice_sessions (session_id, user_id, subject_id, start_time, end_time, chapter_id, total_q, correct_count, xp_earned, is_completed) FROM stdin;
1	2	1	2026-04-07 07:49:40.411852+05:45	\N	1	7	0	0	f
30	2	1	2026-04-10 16:00:28.355744+05:45	\N	2	7	0	0	f
31	2	1	2026-04-10 16:00:28.36565+05:45	\N	2	7	0	0	f
32	2	1	2026-04-10 16:08:44.047839+05:45	\N	2	7	0	0	f
33	2	1	2026-04-10 16:08:44.050764+05:45	\N	2	7	0	0	f
34	2	1	2026-04-10 17:20:37.146193+05:45	\N	2	7	0	0	f
35	2	1	2026-04-10 17:20:37.149103+05:45	\N	2	7	0	0	f
36	2	1	2026-04-10 21:30:16.786964+05:45	\N	2	7	0	0	f
2	2	1	2026-04-07 07:49:40.530431+05:45	2026-04-07 07:53:01.364191+05:45	1	7	5	140	t
3	2	1	2026-04-07 07:53:48.380237+05:45	\N	2	7	0	0	f
4	2	1	2026-04-07 07:53:48.448908+05:45	\N	2	7	0	0	f
6	2	3	2026-04-07 07:54:19.26588+05:45	\N	6	5	0	0	f
37	2	1	2026-04-10 21:30:16.793949+05:45	\N	2	7	0	0	f
38	2	1	2026-04-10 22:39:56.501925+05:45	\N	2	7	0	0	f
39	2	1	2026-04-10 22:39:56.50681+05:45	\N	2	7	0	0	f
41	2	1	2026-04-11 10:02:29.536172+05:45	\N	2	7	0	0	f
5	2	3	2026-04-07 07:54:19.263701+05:45	2026-04-07 07:55:49.386139+05:45	6	5	3	90	t
7	2	1	2026-04-07 12:03:17.864685+05:45	\N	1	7	0	0	f
40	2	1	2026-04-11 10:02:29.525897+05:45	\N	2	7	0	0	f
42	2	1	2026-04-11 10:25:12.623784+05:45	\N	2	7	0	0	f
43	2	1	2026-04-11 10:25:12.685018+05:45	\N	2	7	0	0	f
44	2	1	2026-04-11 10:28:13.280337+05:45	\N	2	7	0	0	f
8	2	1	2026-04-07 12:03:17.889054+05:45	2026-04-07 12:03:53.353517+05:45	1	7	1	80	t
9	2	1	2026-04-07 13:43:21.490582+05:45	\N	1	7	0	0	f
10	2	1	2026-04-07 13:43:21.560086+05:45	\N	1	7	0	0	f
11	2	1	2026-04-07 13:48:25.666167+05:45	2026-04-07 13:51:48.319619+05:45	\N	14	10	210	t
12	1	1	2026-04-07 13:54:24.942614+05:45	\N	1	7	0	0	f
13	1	1	2026-04-07 13:54:24.989039+05:45	\N	1	7	0	0	f
14	2	1	2026-04-07 14:55:28.412641+05:45	\N	1	7	0	0	f
45	2	1	2026-04-11 10:28:13.345982+05:45	\N	2	7	0	0	f
46	2	1	2026-04-11 10:31:36.096454+05:45	\N	2	7	0	0	f
86	2	1	2026-04-20 17:05:42.868279+05:45	\N	2	7	0	0	f
69	2	1	2026-04-11 16:19:46.038905+05:45	\N	2	7	1	20	f
47	2	1	2026-04-11 10:31:36.160864+05:45	\N	2	7	1	10	f
15	2	1	2026-04-07 14:55:28.41627+05:45	2026-04-07 14:57:10.284475+05:45	1	7	7	180	t
16	2	1	2026-04-07 14:59:33.1147+05:45	2026-04-07 15:04:03.228113+05:45	\N	14	11	230	t
17	2	4	2026-04-07 15:05:11.507904+05:45	\N	8	5	0	0	f
48	2	1	2026-04-11 13:07:12.472043+05:45	\N	2	7	0	0	f
49	2	1	2026-04-11 13:07:12.513374+05:45	\N	2	7	1	20	f
51	2	1	2026-04-11 13:24:08.124027+05:45	\N	2	7	0	0	f
18	2	4	2026-04-07 15:05:11.510093+05:45	2026-04-07 15:06:33.197648+05:45	8	5	5	140	t
19	2	2	2026-04-07 15:06:48.72582+05:45	\N	4	6	0	0	f
71	2	1	2026-04-12 11:23:00.231019+05:45	\N	2	7	0	0	f
50	2	1	2026-04-11 13:24:08.123457+05:45	\N	2	7	2	30	f
52	2	1	2026-04-11 13:54:53.709578+05:45	\N	2	7	0	0	f
53	2	1	2026-04-11 13:54:53.827392+05:45	\N	2	7	0	0	f
20	2	2	2026-04-07 15:06:48.729992+05:45	2026-04-07 15:08:44.202077+05:45	4	6	5	140	t
21	2	2	2026-04-07 15:09:02.133365+05:45	2026-04-07 15:11:40.339542+05:45	\N	13	12	250	t
22	2	3	2026-04-07 15:12:14.969724+05:45	2026-04-07 15:15:29.566316+05:45	\N	11	8	170	t
23	2	1	2026-04-08 14:55:19.883853+05:45	\N	1	7	0	0	f
24	2	1	2026-04-08 14:55:19.868863+05:45	\N	1	7	0	0	f
25	2	1	2026-04-08 14:56:05.23164+05:45	\N	\N	14	0	0	f
27	2	4	2026-04-10 06:23:10.723+05:45	\N	8	5	0	0	f
54	2	1	2026-04-11 14:00:41.71878+05:45	\N	2	7	0	0	f
55	2	1	2026-04-11 14:00:41.766077+05:45	\N	2	7	0	0	f
56	2	1	2026-04-11 14:09:10.547526+05:45	\N	2	7	0	0	f
26	2	4	2026-04-10 06:23:10.730917+05:45	2026-04-10 06:23:58.461325+05:45	8	5	5	140	t
28	2	1	2026-04-10 11:38:00.893457+05:45	\N	2	7	0	0	f
70	2	1	2026-04-12 11:23:00.242753+05:45	\N	2	7	0	0	f
29	2	1	2026-04-10 11:38:00.898524+05:45	\N	2	7	0	0	f
72	2	1	2026-04-12 11:49:28.168366+05:45	\N	1	7	0	0	f
57	2	1	2026-04-11 14:09:10.654213+05:45	\N	2	7	1	20	f
58	2	1	2026-04-11 14:35:46.364266+05:45	\N	2	7	0	0	f
59	2	1	2026-04-11 14:35:46.366795+05:45	\N	2	7	0	0	f
60	2	1	2026-04-11 16:03:15.03909+05:45	\N	2	7	0	0	f
61	2	1	2026-04-11 16:03:15.042884+05:45	\N	2	7	0	0	f
62	2	1	2026-04-11 16:05:44.200998+05:45	\N	2	7	0	0	f
63	2	1	2026-04-11 16:05:44.202111+05:45	\N	2	7	0	0	f
64	2	1	2026-04-11 16:07:39.510335+05:45	\N	2	7	0	0	f
65	2	1	2026-04-11 16:07:39.511242+05:45	\N	2	7	1	20	f
66	2	1	2026-04-11 16:13:52.090397+05:45	\N	2	7	0	0	f
67	2	1	2026-04-11 16:13:52.222197+05:45	\N	2	7	1	20	f
68	2	1	2026-04-11 16:19:45.970739+05:45	\N	2	7	0	0	f
82	2	2	2026-04-18 23:38:12.043611+05:45	2026-04-18 23:39:39.043359+05:45	4	6	5	130	t
73	2	1	2026-04-12 11:49:28.195631+05:45	\N	1	7	1	30	f
74	2	1	2026-04-12 11:51:10.759814+05:45	\N	\N	14	0	0	f
75	2	1	2026-04-15 12:28:16.933146+05:45	\N	2	7	0	0	f
76	2	1	2026-04-15 12:28:17.03531+05:45	\N	2	7	0	0	f
77	2	3	2026-04-18 15:26:04.213834+05:45	\N	5	6	0	0	f
78	2	3	2026-04-18 15:26:04.275902+05:45	\N	5	6	3	50	f
83	3	1	2026-04-20 16:04:06.059504+05:45	\N	2	7	0	0	f
84	3	1	2026-04-20 16:04:06.074728+05:45	\N	2	7	0	0	f
79	2	1	2026-04-18 23:35:57.188581+05:45	\N	2	7	0	0	f
80	2	1	2026-04-18 23:35:57.19616+05:45	2026-04-18 23:37:17.594467+05:45	2	7	5	130	t
81	2	2	2026-04-18 23:38:12.043119+05:45	\N	4	6	0	0	f
85	3	1	2026-04-20 16:05:55.630637+05:45	\N	\N	14	0	0	f
87	2	1	2026-04-20 17:05:42.917669+05:45	2026-04-20 17:06:31.389383+05:45	2	7	3	110	t
\.


--
-- TOC entry 5197 (class 0 OID 41189)
-- Dependencies: 242
-- Data for Name: question_irt_params; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_irt_params (question_id, b_param, a_param, n_responses, last_updated) FROM stdin;
1	-1	1	0	2026-04-18 15:21:55.988412+05:45
2	0	1	0	2026-04-18 15:21:55.988412+05:45
3	-1	1	0	2026-04-18 15:21:55.988412+05:45
4	0	1	0	2026-04-18 15:21:55.988412+05:45
5	1	1	0	2026-04-18 15:21:55.988412+05:45
6	-1	1	0	2026-04-18 15:21:55.988412+05:45
7	1	1	0	2026-04-18 15:21:55.988412+05:45
15	-1	1	0	2026-04-18 15:21:55.988412+05:45
16	-1	1	0	2026-04-18 15:21:55.988412+05:45
17	0	1	0	2026-04-18 15:21:55.988412+05:45
18	0	1	0	2026-04-18 15:21:55.988412+05:45
19	-1	1	0	2026-04-18 15:21:55.988412+05:45
20	1	1	0	2026-04-18 15:21:55.988412+05:45
21	0	1	0	2026-04-18 15:21:55.988412+05:45
34	0	1	0	2026-04-18 15:21:55.988412+05:45
35	-1	1	0	2026-04-18 15:21:55.988412+05:45
36	0	1	0	2026-04-18 15:21:55.988412+05:45
37	-1	1	0	2026-04-18 15:21:55.988412+05:45
38	-1	1	0	2026-04-18 15:21:55.988412+05:45
39	-1	1	0	2026-04-18 15:21:55.988412+05:45
40	0	1	0	2026-04-18 15:21:55.988412+05:45
41	-1	1	0	2026-04-18 15:21:55.988412+05:45
42	0	1	0	2026-04-18 15:21:55.988412+05:45
43	-1	1	0	2026-04-18 15:21:55.988412+05:45
44	-1	1	0	2026-04-18 15:21:55.988412+05:45
45	-1	1	0	2026-04-18 15:21:55.988412+05:45
46	0	1	0	2026-04-18 15:21:55.988412+05:45
47	-1	1	0	2026-04-18 15:21:55.988412+05:45
48	0	1	0	2026-04-18 15:21:55.988412+05:45
49	1	1	0	2026-04-18 15:21:55.988412+05:45
31	0	1	1	2026-04-18 15:21:55.988412+05:45
32	0	1	1	2026-04-18 15:21:55.988412+05:45
29	0	1	1	2026-04-18 15:21:55.988412+05:45
28	0	1	1	2026-04-18 15:21:55.988412+05:45
30	0	1	1	2026-04-18 15:21:55.988412+05:45
33	0	1	1	2026-04-18 15:21:55.988412+05:45
26	0	1	1	2026-04-18 15:21:55.988412+05:45
24	-0.4	1	1	2026-04-18 15:21:55.988412+05:45
27	0.4052	1	1	2026-04-18 15:21:55.988412+05:45
23	0.2254	1	1	2026-04-18 15:21:55.988412+05:45
25	0.2268	1	1	2026-04-18 15:21:55.988412+05:45
22	0.6029	1	1	2026-04-18 15:21:55.988412+05:45
14	0.2238	1	2	2026-04-18 15:21:55.988412+05:45
10	0.3295	1	2	2026-04-18 15:21:55.988412+05:45
9	0.42405000000000004	1	2	2026-04-18 15:21:55.988412+05:45
13	0.2405	1	2	2026-04-18 15:21:55.988412+05:45
11	0.09739999999999999	1	2	2026-04-18 15:21:55.988412+05:45
12	-0.34495	1	2	2026-04-18 15:21:55.988412+05:45
8	-0.44275	1	2	2026-04-18 15:21:55.988412+05:45
\.


--
-- TOC entry 5182 (class 0 OID 33077)
-- Dependencies: 227
-- Data for Name: question_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_metadata (question_id, difficulty_level, embedding_vector) FROM stdin;
1	easy	\N
2	medium	\N
3	easy	\N
4	medium	\N
5	hard	\N
6	easy	\N
7	hard	\N
8	easy	\N
9	medium	\N
10	easy	\N
11	easy	\N
12	medium	\N
13	medium	\N
14	hard	\N
15	easy	\N
16	easy	\N
17	medium	\N
18	medium	\N
19	easy	\N
20	hard	\N
21	medium	\N
22	easy	\N
23	easy	\N
24	medium	\N
25	hard	\N
26	medium	\N
27	easy	\N
28	easy	\N
29	medium	\N
30	easy	\N
31	medium	\N
32	medium	\N
33	easy	\N
34	medium	\N
35	easy	\N
36	medium	\N
37	easy	\N
38	easy	\N
39	easy	\N
40	medium	\N
41	easy	\N
42	medium	\N
43	easy	\N
44	easy	\N
45	easy	\N
46	medium	\N
47	easy	\N
48	medium	\N
49	hard	\N
51	medium	\N
52	medium	\N
53	medium	\N
54	medium	\N
55	medium	\N
\.


--
-- TOC entry 5191 (class 0 OID 40963)
-- Dependencies: 236
-- Data for Name: question_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_type (question_type_id, type_name) FROM stdin;
1	mcq
2	short
3	fill in the blanks
\.


--
-- TOC entry 5181 (class 0 OID 33056)
-- Dependencies: 226
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, subject_id, chapter_id, question_text, correct_answer, created_at, options, question_type) FROM stdin;
1	1	1	What is the value of x if 2x = 10?	5	2026-04-04 21:20:34.241229	["3", "4", "5", "6"]	1
2	1	1	Simplify: 3a + 2a	5a	2026-04-04 21:20:34.241229	["6a", "5a", "4a", "3a"]	1
3	1	1	If y = 3x and x = 4, what is y?	12	2026-04-04 21:20:34.241229	["8", "10", "12", "14"]	1
4	1	1	Solve for x: x/4 = 3	12	2026-04-04 21:20:34.241229	\N	2
5	1	1	What is the degree of the polynomial 4x³ + 2x - 1?	3	2026-04-04 21:20:34.241229	["1", "2", "3", "4"]	1
6	1	1	The solution to 5x - 10 = 0 is x = ___.	2	2026-04-04 21:20:34.241229	\N	3
7	1	1	Factor: x² - 9	(x+3)(x-3)	2026-04-04 21:20:34.241229	["(x+3)(x-3)", "(x+9)(x-9)", "(x-3)²", "(x+3)²"]	1
8	1	2	How many sides does a pentagon have?	5	2026-04-04 21:20:34.241229	["4", "5", "6", "7"]	1
9	1	2	Area of a rectangle with length 8 and width 5?	40	2026-04-04 21:20:34.241229	["13", "26", "40", "80"]	1
10	1	2	The sum of angles in a triangle is ___ degrees.	180	2026-04-04 21:20:34.241229	\N	3
11	1	2	A circle has how many degrees?	360	2026-04-04 21:20:34.241229	["90", "180", "270", "360"]	1
12	1	2	Perimeter of a square with side 6?	24	2026-04-04 21:20:34.241229	["12", "18", "24", "36"]	1
13	1	2	What is the formula for the area of a triangle?	1/2 × base × height	2026-04-04 21:20:34.241229	\N	2
14	1	2	The hypotenuse is the longest side in a ___ triangle.	right	2026-04-04 21:20:34.241229	\N	3
15	2	3	What is the SI unit of force?	Newton	2026-04-04 21:20:34.241229	["Joule", "Newton", "Watt", "Pascal"]	1
16	2	3	Speed = Distance / ___.	Time	2026-04-04 21:20:34.241229	\N	3
17	2	3	Which law states F = ma?	Newton's 2nd Law	2026-04-04 21:20:34.241229	["Newton's 1st Law", "Newton's 2nd Law", "Newton's 3rd Law", "Law of Gravitation"]	1
18	2	3	What is the approximate value of gravitational acceleration on Earth?	9.8 m/s²	2026-04-04 21:20:34.241229	["8 m/s²", "9.8 m/s²", "10.5 m/s²", "11 m/s²"]	1
19	2	3	The SI unit of energy is ___.	Joule	2026-04-04 21:20:34.241229	\N	3
20	2	3	What happens to momentum when a net force acts on an object?	Momentum changes	2026-04-04 21:20:34.241229	\N	2
21	2	3	Which type of wave requires a medium to travel?	Sound wave	2026-04-04 21:20:34.241229	["Light wave", "Electromagnetic wave", "Sound wave", "Gamma ray"]	1
22	2	4	Chemical formula of water?	H2O	2026-04-04 21:20:34.241229	["H2O", "CO2", "NaCl", "O2"]	1
23	2	4	pH of a neutral solution is ___.	7	2026-04-04 21:20:34.241229	\N	3
24	2	4	What is the symbol for Gold?	Au	2026-04-04 21:20:34.241229	["Go", "Gd", "Au", "Ag"]	1
25	2	4	Atoms of the same element with different neutrons are called?	Isotopes	2026-04-04 21:20:34.241229	["Ions", "Isotopes", "Allotropes", "Molecules"]	1
26	2	4	What type of bond is formed by sharing electrons?	Covalent bond	2026-04-04 21:20:34.241229	\N	2
27	2	4	NaCl is the chemical name for common ___.	Salt	2026-04-04 21:20:34.241229	\N	3
28	3	5	Which of these is a noun?	Happiness	2026-04-04 21:20:34.241229	["Run", "Beautiful", "Happiness", "Quickly"]	1
29	3	5	Choose the correct verb form: She ___ to school every day.	goes	2026-04-04 21:20:34.241229	["go", "goes", "going", "gone"]	1
30	3	5	A ___ is a word that describes a verb.	Adverb	2026-04-04 21:20:34.241229	\N	3
31	3	5	Identify the tense: "They were playing cricket."	Past Continuous	2026-04-04 21:20:34.241229	["Simple Past", "Past Perfect", "Past Continuous", "Present Perfect"]	1
32	3	5	What punctuation ends a question sentence?	Question mark	2026-04-04 21:20:34.241229	\N	2
33	3	5	The word "quickly" is an ___.	Adverb	2026-04-04 21:20:34.241229	\N	3
34	3	6	What does "benevolent" mean?	Kind and generous	2026-04-04 21:20:34.241229	["Cruel", "Kind and generous", "Angry", "Confused"]	1
35	3	6	A synonym for "happy" is?	Joyful	2026-04-04 21:20:34.241229	["Sad", "Angry", "Joyful", "Tired"]	1
36	3	6	An antonym for "ancient" is?	Modern	2026-04-04 21:20:34.241229	\N	2
37	3	6	What is the main idea of a paragraph usually found in?	The topic sentence	2026-04-04 21:20:34.241229	["The last sentence", "The topic sentence", "The middle", "A footnote"]	1
38	3	6	Inference means drawing a conclusion based on ___ and reasoning.	Evidence	2026-04-04 21:20:34.241229	\N	3
39	4	7	Which symbol is used for comments in Python?	#	2026-04-04 21:20:34.241229	["//", "/*", "#", "--"]	1
40	4	7	What does a loop do?	Repeats a block of code	2026-04-04 21:20:34.241229	["Stops the program", "Repeats a block of code", "Declares a variable", "Defines a function"]	1
41	4	7	In Python, print("Hello") outputs ___.	Hello	2026-04-04 21:20:34.241229	\N	3
42	4	7	What is a variable?	A named storage location that holds a value	2026-04-04 21:20:34.241229	\N	2
43	4	7	Which data type stores True or False?	Boolean	2026-04-04 21:20:34.241229	["Integer", "String", "Boolean", "Float"]	1
44	4	7	The ___ statement is used to make decisions in code.	if	2026-04-04 21:20:34.241229	\N	3
45	4	8	What does IP stand for?	Internet Protocol	2026-04-04 21:20:34.241229	["Internet Protocol", "Internal Process", "Input Port", "Interface Program"]	1
46	4	8	How many layers does the OSI model have?	7	2026-04-04 21:20:34.241229	["4", "5", "7", "8"]	1
47	4	8	HTTP stands for HyperText Transfer ___.	Protocol	2026-04-04 21:20:34.241229	\N	3
48	4	8	Which device connects different networks together?	Router	2026-04-04 21:20:34.241229	["Switch", "Hub", "Router", "Repeater"]	1
49	4	8	DNS converts domain names to ___.	IP addresses	2026-04-04 21:20:34.241229	\N	2
51	1	\N	Solve for x: 2x + 5 = 15	x = 5	2026-04-19 15:41:54.918317	["x=6", "x=5", "x=18", "x=10"]	1
52	1	\N	Simplify: 3(x + 4) - 2x	x + 12	2026-04-19 15:41:54.918317	null	2
53	1	\N	Solve: x^2 - 9 = 0	x = 3 or x = -3	2026-04-19 15:41:54.918317	null	2
54	1	\N	Factor: x^2 + 5x + 6	(x+2)(x+3)	2026-04-19 15:41:54.918317	null	2
55	1	\N	Solve: 4x - 7 = 9	x = 4	2026-04-19 15:41:54.918317	null	2
\.


--
-- TOC entry 5190 (class 0 OID 33153)
-- Dependencies: 235
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recommendations (recommendation_id, user_id, chapter_id, recommendation_text, created_at) FROM stdin;
\.


--
-- TOC entry 5186 (class 0 OID 33110)
-- Dependencies: 231
-- Data for Name: session_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_responses (response_id, session_id, question_id, is_correct, time_taken_seconds, given_answer, chapter_id, xp_awarded) FROM stdin;
1	1	4	\N	\N	\N	1	0
2	1	2	\N	\N	\N	1	0
3	1	1	\N	\N	\N	1	0
4	1	6	\N	\N	\N	1	0
5	1	7	\N	\N	\N	1	0
6	1	5	\N	\N	\N	1	0
7	1	3	\N	\N	\N	1	0
8	2	4	t	21	12	1	20
9	2	2	t	5	B	1	20
10	2	6	t	18	2	1	10
11	2	1	f	6	B	1	0
12	2	5	f	49	B	1	0
13	2	7	t	13	A	1	30
14	2	3	t	39	C	1	10
15	3	13	\N	\N	\N	2	0
16	3	12	\N	\N	\N	2	0
17	3	9	\N	\N	\N	2	0
18	3	10	\N	\N	\N	2	0
19	3	11	\N	\N	\N	2	0
20	3	14	\N	\N	\N	2	0
21	3	8	\N	\N	\N	2	0
22	4	13	\N	\N	\N	2	0
23	4	12	\N	\N	\N	2	0
24	4	9	\N	\N	\N	2	0
25	4	10	\N	\N	\N	2	0
26	4	8	\N	\N	\N	2	0
27	4	14	\N	\N	\N	2	0
28	4	11	\N	\N	\N	2	0
34	6	36	\N	\N	\N	6	0
35	6	34	\N	\N	\N	6	0
36	6	37	\N	\N	\N	6	0
37	6	38	\N	\N	\N	6	0
38	6	35	\N	\N	\N	6	0
29	5	34	f	12	A	6	0
30	5	36	t	14	new	6	20
31	5	37	t	11	B	6	10
32	5	38	f	17	clues	6	0
33	5	35	t	9	C	6	10
39	7	7	\N	\N	\N	1	0
41	7	5	\N	\N	\N	1	0
42	7	4	\N	\N	\N	1	0
43	7	2	\N	\N	\N	1	0
44	7	6	\N	\N	\N	1	0
45	7	1	\N	\N	\N	1	0
46	7	3	\N	\N	\N	1	0
48	8	4	\N	\N	\N	1	0
40	8	5	t	6	C	1	30
47	8	7	f	0		1	0
49	8	2	f	0		1	0
50	8	3	f	0		1	0
51	8	6	f	0		1	0
52	8	1	f	3	D	1	0
53	9	4	\N	\N	\N	1	0
54	9	2	\N	\N	\N	1	0
55	9	6	\N	\N	\N	1	0
56	9	3	\N	\N	\N	1	0
57	9	7	\N	\N	\N	1	0
58	9	5	\N	\N	\N	1	0
59	9	1	\N	\N	\N	1	0
60	10	4	\N	\N	\N	1	0
61	10	2	\N	\N	\N	1	0
62	10	3	\N	\N	\N	1	0
63	10	1	\N	\N	\N	1	0
64	10	7	\N	\N	\N	1	0
65	10	5	\N	\N	\N	1	0
66	10	6	\N	\N	\N	1	0
67	11	13	t	\N	idk	2	20
68	11	3	t	\N	C	1	10
69	11	2	f	\N	A	1	0
70	11	7	t	\N	A	1	30
71	11	8	t	\N	B	2	10
72	11	12	f	\N	B	2	0
73	11	6	t	\N	2	1	10
74	11	4	t	\N	12\n	1	20
75	11	14	f	\N	obtuse	2	0
76	11	9	f	\N	D	2	0
77	11	5	t	\N	C	1	30
78	11	10	t	\N	180	2	10
79	11	11	t	\N	D	2	10
80	11	1	t	\N	C	1	10
81	12	2	\N	\N	\N	1	0
82	12	4	\N	\N	\N	1	0
83	12	3	\N	\N	\N	1	0
84	12	1	\N	\N	\N	1	0
85	12	7	\N	\N	\N	1	0
86	12	5	\N	\N	\N	1	0
87	12	6	\N	\N	\N	1	0
88	13	2	\N	\N	\N	1	0
89	13	4	\N	\N	\N	1	0
90	13	1	\N	\N	\N	1	0
91	13	3	\N	\N	\N	1	0
92	13	5	\N	\N	\N	1	0
93	13	7	\N	\N	\N	1	0
94	13	6	\N	\N	\N	1	0
95	14	4	\N	\N	\N	1	0
96	14	2	\N	\N	\N	1	0
97	14	1	\N	\N	\N	1	0
98	14	6	\N	\N	\N	1	0
99	14	5	\N	\N	\N	1	0
100	14	7	\N	\N	\N	1	0
101	14	3	\N	\N	\N	1	0
102	15	4	t	10	12	1	20
103	15	2	t	7	B	1	20
104	15	1	t	7	C	1	10
105	15	3	t	8	C	1	10
106	15	5	t	15	C	1	30
107	15	7	t	9	A	1	30
108	15	6	t	8	2	1	10
109	16	9	t	\N	C	2	20
110	16	13	t	\N	1/2*b*h	2	20
111	16	3	t	\N	C	1	10
112	16	6	t	\N	2	1	10
113	16	5	t	\N	C	1	30
114	16	2	f	\N	A	1	0
115	16	8	t	\N	B	2	10
116	16	10	t	\N	180	2	10
117	16	7	t	\N	A	1	30
118	16	12	f	\N	A	2	0
119	16	11	t	\N	D	2	10
120	16	4	t	\N	12	1	20
121	16	14	f	\N	right angle	2	0
122	16	1	t	\N	C	1	10
123	17	48	\N	\N	\N	8	0
125	17	46	\N	\N	\N	8	0
126	17	47	\N	\N	\N	8	0
127	17	45	\N	\N	\N	8	0
128	17	49	\N	\N	\N	8	0
124	18	46	t	10	C	8	20
129	18	48	t	16	C	8	20
130	18	45	t	6	A	8	10
131	18	47	t	12	protocol	8	10
132	18	49	t	13	IP	8	30
133	19	24	\N	\N	\N	4	0
134	19	26	\N	\N	\N	4	0
135	19	27	\N	\N	\N	4	0
136	19	22	\N	\N	\N	4	0
137	19	25	\N	\N	\N	4	0
138	19	23	\N	\N	\N	4	0
139	20	26	t	10	covalent	4	20
140	20	24	t	8	C	4	20
141	20	27	f	10	Sodium Chloride	4	0
142	20	23	t	17	7	4	10
144	20	22	t	12	A	4	10
143	20	25	t	22	B	4	30
158	22	31	t	\N	C	5	20
159	22	29	t	\N	B	5	20
160	22	35	t	\N	C	6	10
161	22	37	t	\N	B	6	10
162	22	38	t	\N	evidence	6	10
163	22	28	f	\N	B	5	0
164	22	36	t	\N	Modern	6	20
165	22	32	t	\N	?	5	20
166	22	30	f	\N	adjective	5	0
167	22	33	t	\N	adverb	5	10
168	22	34	f	\N	A	6	0
145	21	22	t	\N	A	4	10
146	21	17	f	\N	A	3	0
147	21	21	t	\N	C	3	20
148	21	20	t	\N	Moves	3	30
149	21	27	t	\N	Salt	4	10
150	21	23	t	\N	7	4	10
151	21	16	t	\N	Time	3	10
152	21	15	t	\N	B	3	10
153	21	24	t	\N	C	4	20
154	21	18	t	\N	B	3	20
155	21	26	t	\N	Covalent	4	20
156	21	19	t	\N	Joule	3	10
157	21	25	t	\N	B	4	30
170	23	7	\N	\N	\N	1	0
171	23	5	\N	\N	\N	1	0
172	23	4	\N	\N	\N	1	0
173	23	2	\N	\N	\N	1	0
174	23	1	\N	\N	\N	1	0
175	23	3	\N	\N	\N	1	0
176	23	6	\N	\N	\N	1	0
177	24	7	\N	\N	\N	1	0
178	24	4	\N	\N	\N	1	0
179	24	2	\N	\N	\N	1	0
180	24	1	\N	\N	\N	1	0
181	24	3	\N	\N	\N	1	0
182	24	6	\N	\N	\N	1	0
169	24	5	f	5	A	1	0
183	25	1	\N	\N	\N	1	0
184	25	10	\N	\N	\N	2	0
185	25	11	\N	\N	\N	2	0
186	25	9	\N	\N	\N	2	0
187	25	8	\N	\N	\N	2	0
188	25	5	\N	\N	\N	1	0
189	25	12	\N	\N	\N	2	0
190	25	7	\N	\N	\N	1	0
191	25	3	\N	\N	\N	1	0
192	25	14	\N	\N	\N	2	0
193	25	2	\N	\N	\N	1	0
194	25	4	\N	\N	\N	1	0
195	25	6	\N	\N	\N	1	0
196	25	13	\N	\N	\N	2	0
197	27	49	\N	\N	\N	8	0
199	27	46	\N	\N	\N	8	0
200	27	48	\N	\N	\N	8	0
201	27	45	\N	\N	\N	8	0
202	27	47	\N	\N	\N	8	0
198	26	49	t	8	IP\n	8	30
203	26	46	t	7	C	8	20
204	26	48	t	4	C	8	20
205	26	47	t	11	Protocol	8	10
206	26	45	t	5	A	8	10
207	28	9	\N	\N	\N	2	0
208	28	12	\N	\N	\N	2	0
209	28	13	\N	\N	\N	2	0
210	28	10	\N	\N	\N	2	0
211	28	8	\N	\N	\N	2	0
212	28	14	\N	\N	\N	2	0
213	28	11	\N	\N	\N	2	0
216	29	13	\N	\N	\N	2	0
217	29	8	\N	\N	\N	2	0
218	29	10	\N	\N	\N	2	0
219	29	14	\N	\N	\N	2	0
220	29	11	\N	\N	\N	2	0
214	29	12	f	3	A	2	0
215	29	9	f	4	A	2	0
222	31	13	\N	\N	\N	2	0
223	31	12	\N	\N	\N	2	0
224	31	9	\N	\N	\N	2	0
225	31	10	\N	\N	\N	2	0
226	31	8	\N	\N	\N	2	0
227	31	14	\N	\N	\N	2	0
228	31	11	\N	\N	\N	2	0
221	30	12	\N	\N	\N	2	0
229	30	13	\N	\N	\N	2	0
230	30	9	\N	\N	\N	2	0
231	30	11	\N	\N	\N	2	0
232	30	10	\N	\N	\N	2	0
233	30	14	\N	\N	\N	2	0
234	30	8	\N	\N	\N	2	0
235	32	13	\N	\N	\N	2	0
237	32	9	\N	\N	\N	2	0
238	32	12	\N	\N	\N	2	0
239	32	11	\N	\N	\N	2	0
240	32	8	\N	\N	\N	2	0
241	32	14	\N	\N	\N	2	0
242	32	10	\N	\N	\N	2	0
236	33	13	\N	\N	\N	2	0
243	33	9	\N	\N	\N	2	0
244	33	12	\N	\N	\N	2	0
245	33	10	\N	\N	\N	2	0
246	33	11	\N	\N	\N	2	0
247	33	14	\N	\N	\N	2	0
248	33	8	\N	\N	\N	2	0
249	34	12	\N	\N	\N	2	0
250	34	13	\N	\N	\N	2	0
251	34	9	\N	\N	\N	2	0
252	34	8	\N	\N	\N	2	0
253	34	11	\N	\N	\N	2	0
254	34	14	\N	\N	\N	2	0
255	34	10	\N	\N	\N	2	0
256	35	9	\N	\N	\N	2	0
257	35	12	\N	\N	\N	2	0
258	35	13	\N	\N	\N	2	0
259	35	11	\N	\N	\N	2	0
260	35	8	\N	\N	\N	2	0
261	35	14	\N	\N	\N	2	0
262	35	10	\N	\N	\N	2	0
264	37	12	\N	\N	\N	2	0
265	37	13	\N	\N	\N	2	0
266	37	8	\N	\N	\N	2	0
267	37	11	\N	\N	\N	2	0
268	37	14	\N	\N	\N	2	0
269	37	10	\N	\N	\N	2	0
270	36	9	\N	\N	\N	2	0
271	36	13	\N	\N	\N	2	0
272	36	12	\N	\N	\N	2	0
273	36	8	\N	\N	\N	2	0
274	36	10	\N	\N	\N	2	0
275	36	14	\N	\N	\N	2	0
276	36	11	\N	\N	\N	2	0
263	37	9	f	0		2	0
277	38	13	\N	\N	\N	2	0
278	38	12	\N	\N	\N	2	0
279	38	9	\N	\N	\N	2	0
280	38	11	\N	\N	\N	2	0
281	38	8	\N	\N	\N	2	0
282	38	14	\N	\N	\N	2	0
283	38	10	\N	\N	\N	2	0
284	39	13	\N	\N	\N	2	0
285	39	9	\N	\N	\N	2	0
286	39	12	\N	\N	\N	2	0
287	39	10	\N	\N	\N	2	0
288	39	11	\N	\N	\N	2	0
289	39	14	\N	\N	\N	2	0
290	39	8	\N	\N	\N	2	0
291	41	12	\N	\N	\N	2	0
292	41	13	\N	\N	\N	2	0
293	41	9	\N	\N	\N	2	0
294	41	10	\N	\N	\N	2	0
295	41	11	\N	\N	\N	2	0
296	41	14	\N	\N	\N	2	0
297	41	8	\N	\N	\N	2	0
298	40	13	\N	\N	\N	2	0
299	40	9	\N	\N	\N	2	0
300	40	12	\N	\N	\N	2	0
301	40	8	\N	\N	\N	2	0
302	40	10	\N	\N	\N	2	0
303	40	14	\N	\N	\N	2	0
304	40	11	\N	\N	\N	2	0
305	42	13	\N	\N	\N	2	0
306	42	9	\N	\N	\N	2	0
307	42	12	\N	\N	\N	2	0
308	42	11	\N	\N	\N	2	0
309	42	10	\N	\N	\N	2	0
310	42	14	\N	\N	\N	2	0
311	42	8	\N	\N	\N	2	0
313	43	9	\N	\N	\N	2	0
314	43	13	\N	\N	\N	2	0
315	43	11	\N	\N	\N	2	0
316	43	8	\N	\N	\N	2	0
317	43	14	\N	\N	\N	2	0
318	43	10	\N	\N	\N	2	0
312	43	12	f	0		2	0
319	44	9	\N	\N	\N	2	0
320	44	13	\N	\N	\N	2	0
321	44	12	\N	\N	\N	2	0
322	44	11	\N	\N	\N	2	0
323	44	8	\N	\N	\N	2	0
324	44	14	\N	\N	\N	2	0
325	44	10	\N	\N	\N	2	0
327	45	12	\N	\N	\N	2	0
328	45	13	\N	\N	\N	2	0
329	45	11	\N	\N	\N	2	0
330	45	8	\N	\N	\N	2	0
331	45	14	\N	\N	\N	2	0
332	45	10	\N	\N	\N	2	0
326	45	9	f	0		2	0
333	46	12	\N	\N	\N	2	0
334	46	9	\N	\N	\N	2	0
335	46	13	\N	\N	\N	2	0
336	46	8	\N	\N	\N	2	0
337	46	10	\N	\N	\N	2	0
338	46	14	\N	\N	\N	2	0
339	46	11	\N	\N	\N	2	0
340	47	13	\N	\N	\N	2	0
345	47	14	\N	\N	\N	2	0
346	47	10	\N	\N	\N	2	0
341	47	12	f	0		2	0
342	47	9	f	13	B	2	0
343	47	8	f	0		2	0
344	47	11	t	17	D	2	10
347	48	9	\N	\N	\N	2	0
348	48	13	\N	\N	\N	2	0
349	48	12	\N	\N	\N	2	0
350	48	8	\N	\N	\N	2	0
351	48	11	\N	\N	\N	2	0
352	48	14	\N	\N	\N	2	0
353	48	10	\N	\N	\N	2	0
355	49	12	\N	\N	\N	2	0
356	49	13	\N	\N	\N	2	0
357	49	8	\N	\N	\N	2	0
358	49	11	\N	\N	\N	2	0
359	49	14	\N	\N	\N	2	0
360	49	10	\N	\N	\N	2	0
354	49	9	t	10	C	2	20
361	50	13	\N	\N	\N	2	0
365	50	11	\N	\N	\N	2	0
366	50	14	\N	\N	\N	2	0
367	50	10	\N	\N	\N	2	0
368	51	9	\N	\N	\N	2	0
369	51	13	\N	\N	\N	2	0
370	51	12	\N	\N	\N	2	0
371	51	8	\N	\N	\N	2	0
372	51	10	\N	\N	\N	2	0
373	51	14	\N	\N	\N	2	0
374	51	11	\N	\N	\N	2	0
362	50	12	t	32	C	2	20
363	50	9	f	4	A	2	0
364	50	8	t	4	B	2	10
375	52	13	\N	\N	\N	2	0
376	52	9	\N	\N	\N	2	0
377	52	12	\N	\N	\N	2	0
378	52	10	\N	\N	\N	2	0
379	52	8	\N	\N	\N	2	0
380	52	14	\N	\N	\N	2	0
381	52	11	\N	\N	\N	2	0
383	53	13	\N	\N	\N	2	0
384	53	9	\N	\N	\N	2	0
385	53	11	\N	\N	\N	2	0
386	53	10	\N	\N	\N	2	0
387	53	14	\N	\N	\N	2	0
388	53	8	\N	\N	\N	2	0
382	53	12	f	10	D	2	0
389	54	13	\N	\N	\N	2	0
390	54	9	\N	\N	\N	2	0
391	54	12	\N	\N	\N	2	0
392	54	8	\N	\N	\N	2	0
393	54	11	\N	\N	\N	2	0
394	54	14	\N	\N	\N	2	0
395	54	10	\N	\N	\N	2	0
397	55	9	\N	\N	\N	2	0
398	55	12	\N	\N	\N	2	0
399	55	11	\N	\N	\N	2	0
400	55	10	\N	\N	\N	2	0
401	55	14	\N	\N	\N	2	0
402	55	8	\N	\N	\N	2	0
396	55	13	f	6		2	0
403	56	12	\N	\N	\N	2	0
404	56	9	\N	\N	\N	2	0
405	56	13	\N	\N	\N	2	0
406	56	10	\N	\N	\N	2	0
407	56	8	\N	\N	\N	2	0
408	56	14	\N	\N	\N	2	0
409	56	11	\N	\N	\N	2	0
411	57	13	\N	\N	\N	2	0
414	57	10	\N	\N	\N	2	0
415	57	14	\N	\N	\N	2	0
416	57	8	\N	\N	\N	2	0
410	57	9	f	0		2	0
412	57	12	t	8	C	2	20
413	57	11	f	5	B	2	0
417	58	9	\N	\N	\N	2	0
418	58	12	\N	\N	\N	2	0
419	58	13	\N	\N	\N	2	0
420	58	11	\N	\N	\N	2	0
421	58	8	\N	\N	\N	2	0
422	58	14	\N	\N	\N	2	0
423	58	10	\N	\N	\N	2	0
425	59	13	\N	\N	\N	2	0
427	59	11	\N	\N	\N	2	0
428	59	8	\N	\N	\N	2	0
429	59	14	\N	\N	\N	2	0
430	59	10	\N	\N	\N	2	0
424	59	9	f	0		2	0
426	59	12	f	0		2	0
431	60	13	\N	\N	\N	2	0
432	60	12	\N	\N	\N	2	0
433	60	9	\N	\N	\N	2	0
434	60	11	\N	\N	\N	2	0
435	60	10	\N	\N	\N	2	0
436	60	14	\N	\N	\N	2	0
437	60	8	\N	\N	\N	2	0
438	61	13	\N	\N	\N	2	0
439	61	9	\N	\N	\N	2	0
440	61	12	\N	\N	\N	2	0
441	61	8	\N	\N	\N	2	0
442	61	10	\N	\N	\N	2	0
443	61	14	\N	\N	\N	2	0
444	61	11	\N	\N	\N	2	0
445	62	12	\N	\N	\N	2	0
446	62	9	\N	\N	\N	2	0
447	62	13	\N	\N	\N	2	0
448	62	10	\N	\N	\N	2	0
449	62	8	\N	\N	\N	2	0
450	62	14	\N	\N	\N	2	0
451	62	11	\N	\N	\N	2	0
452	63	13	\N	\N	\N	2	0
453	63	9	\N	\N	\N	2	0
454	63	12	\N	\N	\N	2	0
455	63	8	\N	\N	\N	2	0
456	63	10	\N	\N	\N	2	0
457	63	14	\N	\N	\N	2	0
458	63	11	\N	\N	\N	2	0
459	64	12	\N	\N	\N	2	0
460	64	9	\N	\N	\N	2	0
461	64	13	\N	\N	\N	2	0
462	64	10	\N	\N	\N	2	0
463	64	11	\N	\N	\N	2	0
464	64	14	\N	\N	\N	2	0
465	64	8	\N	\N	\N	2	0
467	65	13	\N	\N	\N	2	0
468	65	12	\N	\N	\N	2	0
469	65	11	\N	\N	\N	2	0
470	65	10	\N	\N	\N	2	0
471	65	14	\N	\N	\N	2	0
472	65	8	\N	\N	\N	2	0
466	65	9	t	205	C	2	20
473	66	12	\N	\N	\N	2	0
474	66	13	\N	\N	\N	2	0
475	66	9	\N	\N	\N	2	0
476	66	10	\N	\N	\N	2	0
477	66	8	\N	\N	\N	2	0
478	66	14	\N	\N	\N	2	0
479	66	11	\N	\N	\N	2	0
481	67	9	\N	\N	\N	2	0
482	67	13	\N	\N	\N	2	0
483	67	8	\N	\N	\N	2	0
484	67	11	\N	\N	\N	2	0
485	67	14	\N	\N	\N	2	0
486	67	10	\N	\N	\N	2	0
480	67	12	t	15	C	2	20
487	68	12	\N	\N	\N	2	0
488	68	9	\N	\N	\N	2	0
489	68	13	\N	\N	\N	2	0
490	68	11	\N	\N	\N	2	0
491	68	8	\N	\N	\N	2	0
492	68	14	\N	\N	\N	2	0
493	68	10	\N	\N	\N	2	0
496	69	9	\N	\N	\N	2	0
497	69	10	\N	\N	\N	2	0
498	69	8	\N	\N	\N	2	0
499	69	14	\N	\N	\N	2	0
500	69	11	\N	\N	\N	2	0
494	69	13	t	35	adsad	2	20
495	69	12	f	8	D	2	0
502	71	12	\N	\N	\N	2	0
501	70	13	\N	\N	\N	2	0
503	71	13	\N	\N	\N	2	0
504	71	9	\N	\N	\N	2	0
505	71	11	\N	\N	\N	2	0
506	71	8	\N	\N	\N	2	0
507	71	14	\N	\N	\N	2	0
509	70	12	\N	\N	\N	2	0
510	70	10	\N	\N	\N	2	0
511	70	11	\N	\N	\N	2	0
512	70	14	\N	\N	\N	2	0
513	70	8	\N	\N	\N	2	0
514	71	10	\N	\N	\N	2	0
508	70	9	f	3	A	2	0
515	72	5	\N	\N	\N	1	0
516	72	7	\N	\N	\N	1	0
517	72	2	\N	\N	\N	1	0
518	72	4	\N	\N	\N	1	0
519	72	3	\N	\N	\N	1	0
520	72	6	\N	\N	\N	1	0
521	72	1	\N	\N	\N	1	0
524	73	2	\N	\N	\N	1	0
525	73	4	\N	\N	\N	1	0
526	73	6	\N	\N	\N	1	0
527	73	1	\N	\N	\N	1	0
528	73	3	\N	\N	\N	1	0
522	73	7	t	12	A	1	30
523	73	5	f	3	B	1	0
529	74	14	\N	\N	\N	2	0
530	74	9	\N	\N	\N	2	0
531	74	1	\N	\N	\N	1	0
532	74	2	\N	\N	\N	1	0
533	74	8	\N	\N	\N	2	0
534	74	13	\N	\N	\N	2	0
535	74	10	\N	\N	\N	2	0
536	74	3	\N	\N	\N	1	0
537	74	11	\N	\N	\N	2	0
538	74	5	\N	\N	\N	1	0
539	74	7	\N	\N	\N	1	0
540	74	4	\N	\N	\N	1	0
541	74	12	\N	\N	\N	2	0
542	74	6	\N	\N	\N	1	0
543	75	12	\N	\N	\N	2	0
544	75	13	\N	\N	\N	2	0
545	75	9	\N	\N	\N	2	0
546	75	10	\N	\N	\N	2	0
547	75	8	\N	\N	\N	2	0
548	75	14	\N	\N	\N	2	0
549	75	11	\N	\N	\N	2	0
551	76	13	\N	\N	\N	2	0
552	76	9	\N	\N	\N	2	0
553	76	11	\N	\N	\N	2	0
554	76	8	\N	\N	\N	2	0
555	76	14	\N	\N	\N	2	0
556	76	10	\N	\N	\N	2	0
550	76	12	f	20	A	2	0
557	77	31	\N	\N	\N	5	0
558	77	29	\N	\N	\N	5	0
559	77	32	\N	\N	\N	5	0
560	77	28	\N	\N	\N	5	0
561	77	33	\N	\N	\N	5	0
562	77	30	\N	\N	\N	5	0
563	78	31	t	24	C	5	20
564	78	32	f	7	?	5	0
565	78	29	t	25	B	5	20
566	78	28	f	10	A	5	0
567	78	30	t	31	adverb	5	10
568	78	33	f	43	verb	5	0
569	79	13	\N	\N	\N	2	0
571	79	12	\N	\N	\N	2	0
572	79	9	\N	\N	\N	2	0
573	79	10	\N	\N	\N	2	0
574	79	8	\N	\N	\N	2	0
575	79	14	\N	\N	\N	2	0
576	79	11	\N	\N	\N	2	0
570	80	13	f	6	idk\n	2	0
577	80	12	t	11	C	2	20
578	80	9	f	2	D	2	0
579	80	8	t	2	B	2	10
580	80	10	t	6	180	2	10
581	80	14	t	9	right	2	30
582	80	11	t	7	D	2	10
583	81	26	\N	\N	\N	4	0
584	81	24	\N	\N	\N	4	0
585	81	27	\N	\N	\N	4	0
586	81	23	\N	\N	\N	4	0
587	81	25	\N	\N	\N	4	0
588	81	22	\N	\N	\N	4	0
589	82	26	f	17	covalent\n	4	0
590	82	24	t	7	C	4	20
591	82	27	t	8	salt	4	10
592	82	23	t	5	7	4	10
593	82	25	t	21	B	4	30
594	82	22	t	9	A	4	10
595	84	13	\N	\N	\N	2	0
597	84	10	\N	\N	\N	2	0
598	84	14	\N	\N	\N	2	0
599	84	12	\N	\N	\N	2	0
600	84	9	\N	\N	\N	2	0
601	84	8	\N	\N	\N	2	0
602	84	11	\N	\N	\N	2	0
596	83	13	\N	\N	\N	2	0
603	83	10	\N	\N	\N	2	0
604	83	14	\N	\N	\N	2	0
605	83	12	\N	\N	\N	2	0
606	83	9	\N	\N	\N	2	0
607	83	8	\N	\N	\N	2	0
608	83	11	\N	\N	\N	2	0
609	85	9	\N	\N	\N	2	0
610	85	13	\N	\N	\N	2	0
611	85	11	\N	\N	\N	2	0
612	85	6	\N	\N	\N	1	0
613	85	3	\N	\N	\N	1	0
614	85	5	\N	\N	\N	1	0
615	85	2	\N	\N	\N	1	0
616	85	4	\N	\N	\N	1	0
617	85	8	\N	\N	\N	2	0
618	85	1	\N	\N	\N	1	0
619	85	10	\N	\N	\N	2	0
620	85	14	\N	\N	\N	2	0
621	85	7	\N	\N	\N	1	0
622	85	12	\N	\N	\N	2	0
623	86	14	\N	\N	\N	2	0
624	86	10	\N	\N	\N	2	0
625	86	9	\N	\N	\N	2	0
626	86	13	\N	\N	\N	2	0
627	86	11	\N	\N	\N	2	0
628	86	12	\N	\N	\N	2	0
629	86	8	\N	\N	\N	2	0
630	87	14	t	5	right	2	30
631	87	10	t	7	180	2	10
632	87	9	t	4	C	2	20
633	87	13	f	5	igjhj	2	0
634	87	11	f	5	C	2	0
635	87	12	f	1	B	2	0
636	87	8	f	1	C	2	0
\.


--
-- TOC entry 5177 (class 0 OID 33033)
-- Dependencies: 222
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (subject_id, subject_name, description, slug, icon, color_class) FROM stdin;
1	Mathematics	Algebra, geometry, calculus and more.	mathematics	calculate	bg-purple-100 text-purple-600
2	Science	Physics, chemistry and natural sciences.	science	science	bg-blue-100 text-blue-600
3	English	Grammar, comprehension and writing skills.	english	menu_book	bg-green-100 text-green-600
4	Computer	Programming, hardware, networks and algorithms.	computer	computer	bg-orange-100 text-orange-600
\.


--
-- TOC entry 5196 (class 0 OID 41163)
-- Dependencies: 241
-- Data for Name: user_irt_params; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_irt_params (id, user_id, chapter_id, theta, responses, last_updated) FROM stdin;
8	2	4	0.2209	6	2026-04-18 23:39:33.881386+05:45
1	2	2	-0.4811	14	2026-04-20 17:06:28.86548+05:45
\.


--
-- TOC entry 5188 (class 0 OID 33128)
-- Dependencies: 233
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_progress (progress_id, user_id, subject_id, chapter_id, total_attempts, correct_answers, weakness_score, current_theta) FROM stdin;
1	2	1	1	35	25	0.286	0
6	2	2	3	7	6	0.143	0
7	2	3	5	6	4	0.333	0
2	2	3	6	10	7	0.3	0
4	2	4	8	10	10	0	0
5	2	2	4	18	16	0.111	0
3	2	1	2	28	17	0.393	0
\.


--
-- TOC entry 5194 (class 0 OID 41051)
-- Dependencies: 239
-- Data for Name: user_xp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_xp (xp_id, user_id, total_xp, level, updated_at) FROM stdin;
1	1	0	1	2026-04-06 18:20:59.91413
3	3	0	1	2026-04-07 14:25:19.843977
4	4	0	1	2026-04-12 10:42:57.657631
2	2	2140	5	2026-04-06 18:22:45.374768
5	5	0	1	2026-04-20 17:42:29.305387
\.


--
-- TOC entry 5175 (class 0 OID 33018)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, full_name, email, password_hash, created_at, avatar_url, google_id, role, refresh_token, current_streak, longest_streak, last_active_date) FROM stdin;
3	Ramesh Maharjan	ram123@gmail.com	$5$rounds=535000$av1zwn9A7GdXDfMS$DfVUcbjNzbveSydYDL62sgFipr99.n5Q4ZaacdiUOM0	2026-04-07 14:25:19.843977	\N	\N	student	\N	0	0	\N
4	Renid	renid@smartsikchya.com	$5$rounds=535000$Qm5NyeSTi8siXnqv$cgJd77Ph/.5CPsIVgL3n.WoQxIX7TwElcjLj7UrZUo9	2026-04-12 10:42:57.657631	\N	\N	admin	\N	0	0	\N
2	Pragun Raj Maskey	pragunmaskeyofficial@gmail.com	\N	2026-04-06 18:22:45.374768	https://lh3.googleusercontent.com/a/ACg8ocLnksMT4oWMfDnicCTj4XBO8xRhUu1wGMFydvGxiwIFDm0R4Mxj=s96-c	103370013229523543190	student	\N	1	1	2026-04-20
1	Admin	admin@smartsikchya.com	$5$rounds=535000$tQOifmJb75hZfcy6$VoIinsM.uysARWLu1Adn3fa/.aXbSvtcGYi9ueptkU2	2026-04-06 18:20:59.91413	\N	\N	admin	\N	0	0	\N
5	Pragun S	pragun.storage@gmail.com	$5$rounds=535000$qi16m.hOlTBtHwgH$46bjr/FccKiPyAkwdhbRx254j2hsrrAjHHXMsLwECe4	2026-04-20 17:42:29.305387	\N	\N	student	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1IiwiZXhwIjoxNzc3MzQzMDg0LCJ0eXBlIjoicmVmcmVzaCJ9.tBz2J6ABpH3nGyVjTPqI2al_hvRWXYdpE7zH1oCvzCs	0	0	\N
\.


--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 223
-- Name: chapters_chapter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chapters_chapter_id_seq', 8, true);


--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 243
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_token_id_seq', 3, true);


--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 228
-- Name: practice_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.practice_sessions_session_id_seq', 87, true);


--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 237
-- Name: question_type_question_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_type_question_type_id_seq', 3, true);


--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 225
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 55, true);


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 234
-- Name: recommendations_recommendation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recommendations_recommendation_id_seq', 1, false);


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 230
-- Name: session_responses_response_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_responses_response_id_seq', 636, true);


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 221
-- Name: subjects_subject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_subject_id_seq', 4, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 240
-- Name: user_irt_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_irt_params_id_seq', 20, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 232
-- Name: user_progress_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_progress_progress_id_seq', 7, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 238
-- Name: user_xp_xp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_xp_xp_id_seq', 5, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- TOC entry 4972 (class 2606 OID 33049)
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (chapter_id);


--
-- TOC entry 5005 (class 2606 OID 41225)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 4983 (class 2606 OID 33098)
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 5003 (class 2606 OID 41201)
-- Name: question_irt_params question_irt_params_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_irt_params
    ADD CONSTRAINT question_irt_params_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4980 (class 2606 OID 33085)
-- Name: question_metadata question_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_metadata
    ADD CONSTRAINT question_metadata_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4993 (class 2606 OID 40971)
-- Name: question_type question_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_type
    ADD CONSTRAINT question_type_pkey PRIMARY KEY (question_type_id);


--
-- TOC entry 4977 (class 2606 OID 33066)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4991 (class 2606 OID 33162)
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (recommendation_id);


--
-- TOC entry 4986 (class 2606 OID 33116)
-- Name: session_responses session_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_responses
    ADD CONSTRAINT session_responses_pkey PRIMARY KEY (response_id);


--
-- TOC entry 4974 (class 2606 OID 40962)
-- Name: chapters subject_id_chapter_name_UNIQUE; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT "subject_id_chapter_name_UNIQUE" UNIQUE (subject_id, chapter_name);


--
-- TOC entry 4968 (class 2606 OID 33040)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (subject_id);


--
-- TOC entry 4970 (class 2606 OID 41024)
-- Name: subjects subjects_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_slug_key UNIQUE (slug);


--
-- TOC entry 4999 (class 2606 OID 41176)
-- Name: user_irt_params user_irt_params_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_irt_params
    ADD CONSTRAINT user_irt_params_pkey PRIMARY KEY (id);


--
-- TOC entry 5001 (class 2606 OID 41178)
-- Name: user_irt_params user_irt_params_user_id_chapter_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_irt_params
    ADD CONSTRAINT user_irt_params_user_id_chapter_id_key UNIQUE (user_id, chapter_id);


--
-- TOC entry 4989 (class 2606 OID 33136)
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (progress_id);


--
-- TOC entry 4995 (class 2606 OID 41063)
-- Name: user_xp user_xp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_pkey PRIMARY KEY (xp_id);


--
-- TOC entry 4997 (class 2606 OID 41065)
-- Name: user_xp user_xp_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_user_id_key UNIQUE (user_id);


--
-- TOC entry 4962 (class 2606 OID 33031)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4964 (class 2606 OID 41032)
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- TOC entry 4966 (class 2606 OID 33029)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4975 (class 1259 OID 41071)
-- Name: idx_questions_chapter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_chapter ON public.questions USING btree (chapter_id);


--
-- TOC entry 4978 (class 1259 OID 41072)
-- Name: idx_questions_difficulty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_difficulty ON public.question_metadata USING btree (difficulty_level);


--
-- TOC entry 4984 (class 1259 OID 41073)
-- Name: idx_session_resp_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_resp_session ON public.session_responses USING btree (session_id);


--
-- TOC entry 4981 (class 1259 OID 41075)
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.practice_sessions USING btree (user_id, chapter_id);


--
-- TOC entry 4987 (class 1259 OID 41074)
-- Name: idx_user_progress_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_progress_user ON public.user_progress USING btree (user_id, chapter_id);


--
-- TOC entry 5006 (class 2606 OID 33050)
-- Name: chapters chapters_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id) ON DELETE CASCADE;


--
-- TOC entry 5026 (class 2606 OID 41226)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5011 (class 2606 OID 41037)
-- Name: practice_sessions practice_sessions_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- TOC entry 5012 (class 2606 OID 33104)
-- Name: practice_sessions practice_sessions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);


--
-- TOC entry 5013 (class 2606 OID 33099)
-- Name: practice_sessions practice_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5025 (class 2606 OID 41202)
-- Name: question_irt_params question_irt_params_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_irt_params
    ADD CONSTRAINT question_irt_params_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 33086)
-- Name: question_metadata question_metadata_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_metadata
    ADD CONSTRAINT question_metadata_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 5007 (class 2606 OID 33072)
-- Name: questions questions_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- TOC entry 5008 (class 2606 OID 40973)
-- Name: questions questions_question_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_question_type_fkey FOREIGN KEY (question_type) REFERENCES public.question_type(question_type_id);


--
-- TOC entry 5009 (class 2606 OID 33067)
-- Name: questions questions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);


--
-- TOC entry 5020 (class 2606 OID 33168)
-- Name: recommendations recommendations_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- TOC entry 5021 (class 2606 OID 33163)
-- Name: recommendations recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5014 (class 2606 OID 41043)
-- Name: session_responses session_responses_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_responses
    ADD CONSTRAINT session_responses_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- TOC entry 5015 (class 2606 OID 33122)
-- Name: session_responses session_responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_responses
    ADD CONSTRAINT session_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id);


--
-- TOC entry 5016 (class 2606 OID 33117)
-- Name: session_responses session_responses_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_responses
    ADD CONSTRAINT session_responses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.practice_sessions(session_id);


--
-- TOC entry 5023 (class 2606 OID 41184)
-- Name: user_irt_params user_irt_params_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_irt_params
    ADD CONSTRAINT user_irt_params_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id) ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 41179)
-- Name: user_irt_params user_irt_params_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_irt_params
    ADD CONSTRAINT user_irt_params_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5017 (class 2606 OID 33147)
-- Name: user_progress user_progress_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id);


--
-- TOC entry 5018 (class 2606 OID 33142)
-- Name: user_progress user_progress_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);


--
-- TOC entry 5019 (class 2606 OID 33137)
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5022 (class 2606 OID 41066)
-- Name: user_xp user_xp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-04-21 16:40:46

--
-- PostgreSQL database dump complete
--

\unrestrict csbTle81YyROtFEKPYyqzlKArkIhdPFuBew2CBAjOlljKUI4Hygdl29cy6wqk3Z


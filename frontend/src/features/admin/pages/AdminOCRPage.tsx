/**
 * AdminOCRPage  Upload PDF  Review → Submit
 *
 * ROOT CAUSE OF "Field required; Field required":
 * The shared axios instance has a request interceptor that sets
 * Content-Type: application/json on ALL requests. For multipart/form-data
 * this is fatal — it replaces the boundary-aware Content-Type that the
 * browser sets automatically, so FastAPI receives a request it cannot parse.
 *
 * FIX: Use native fetch() for the upload call only. fetch() never touches
 * Content-Type when you pass a FormData object — the browser handles it
 * correctly every time. All other calls (load subjects/chapters, submit JSON)
 * still use the shared axios instance normally.
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

// ── Editable question card ────────────────────────────────────
function ReviewCard({
  q,
  index,
  onChange,
  onRemove,
}: {
  q: ExtractedQ;
  index: number;
  onChange: (u: ExtractedQ) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(!q.answer_found);
  const isMCQ = q.question_type === 1;
  const noAnswer = !q.correct_answer?.trim();

  function upd(key: keyof ExtractedQ, val: unknown) {
    onChange({ ...q, [key]: val });
  }
  function updOpt(i: number, val: string) {
    const opts = [...(q.options ?? ["", "", "", ""])];
    opts[i] = val;
    onChange({ ...q, options: opts });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface overflow-hidden shadow-sm",
        noAnswer ? "border-warning/50" : "border-border",
      )}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary mt-0.5">
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
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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
            <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] text-text-muted">
              {TYPE_LABELS[q.question_type]}
            </span>
            {noAnswer ? (
              <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                <span className="material-symbols-outlined text-[11px]">
                  warning
                </span>
                No answer
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                <span className="material-symbols-outlined text-[11px]">
                  check_circle
                </span>
                {(q.correct_answer ?? "").slice(0, 35)}
                {(q.correct_answer?.length ?? 0) > 35 ? "…" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 ml-2">
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
            className="material-symbols-outlined text-[20px] text-text-muted transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "" }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Edit form */}
      {expanded && (
        <div
          className="border-t border-border p-4 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">
              Question text
            </label>
            <textarea
              rows={3}
              value={q.question_text}
              onChange={(e) => upd("question_text", e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">
                Type
              </label>
              <Select
                value={q.question_type}
                onChange={(e) => upd("question_type", Number(e.target.value))}
                className="h-9 text-xs"
              >
                <option value={1}>MCQ</option>
                <option value={2}>Short Answer</option>
                <option value={3}>Fill-in-Blank</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">
                Difficulty
              </label>
              <Select
                value={q.difficulty}
                onChange={(e) => upd("difficulty", e.target.value)}
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
          {isMCQ && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-muted">
                Options — click ○ to mark correct
              </label>
              <div className="flex flex-col gap-1.5">
                {["A", "B", "C", "D"].map((key, i) => {
                  const opt = q.options?.[i] ?? "";
                  const isCorrect =
                    opt.trim() !== "" &&
                    opt.trim() === q.correct_answer?.trim();
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-1.5",
                        isCorrect
                          ? "border-success/40 bg-success/5"
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
                        onChange={(e) => updOpt(i, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted/50"
                        placeholder={`Option ${key}`}
                      />
                      <button
                        type="button"
                        onClick={() => upd("correct_answer", opt.trim())}
                        disabled={!opt.trim()}
                        className={cn(
                          "transition-colors",
                          isCorrect
                            ? "text-success"
                            : "text-text-muted hover:text-success",
                        )}
                      >
                        <span className="material-symbols-outlined text-[18px]">
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
          {!isMCQ && (
            <div>
              <label
                className={cn(
                  "mb-1 block text-xs font-semibold",
                  noAnswer ? "text-warning" : "text-text-muted",
                )}
              >
                Correct answer{noAnswer && " ⚠ Required"}
              </label>
              <input
                value={q.correct_answer ?? ""}
                onChange={(e) => upd("correct_answer", e.target.value)}
                placeholder="Enter the correct answer"
                className={cn(
                  "h-9 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2",
                  noAnswer
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

// ── Main page ────────────────────────────────────────────────
export default function AdminOCRPage() {
  const [phase, setPhase] = useState<"upload" | "review" | "done">("upload");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQ[]>([]);
  const [uploadErr, setUploadErr] = useState("");
  const [fmt, setFmt] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [uploading, setUploading] = useState(false);
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

  // ── Upload using native fetch() — NOT axios ──────────────────
  // WHY: The shared axios instance has request interceptors that inject
  // Content-Type: application/json. For FormData this destroys the multipart
  // boundary string, causing FastAPI to return "Field required" for all fields.
  // fetch() leaves Content-Type alone when given a FormData object.
  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadErr("Only PDF files are supported.");
      return;
    }
    if (!subjectId) {
      setUploadErr("Please select a subject first.");
      return;
    }

    setUploadErr("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("subject_id", subjectId);
      if (chapterId) form.append("chapter_id", chapterId);

      // Get backend URL — same origin as API base or from env
      const base = (import.meta.env.VITE_API_URL ??
        "http://localhost:8000") as string;
      const res = await fetch(`${base}/ocr/upload`, {
        method: "POST",
        credentials: "include", // send JWT cookie
        body: form,
        // ✅ No Content-Type header — fetch sets it automatically with boundary
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
              ? data.detail
                  .map(
                    (d: any) => `${d.loc?.slice(-1)[0] ?? "field"}: ${d.msg}`,
                  )
                  .join(" | ")
              : `Upload failed (HTTP ${res.status})`;
        setUploadErr(msg);
        return;
      }

      setQuestions(data.questions ?? []);
      setFmt(data.format_detected ?? "");
      setPhase("review");
    } catch (err: any) {
      setUploadErr(err?.message ?? "Network error — is the backend running?");
    } finally {
      setUploading(false);
    }
  }

  const submitMutation = useMutation({
    mutationFn: () =>
      api
        .post("/ocr/submit", {
          subject_id: Number(subjectId),
          chapter_id: chapterId ? Number(chapterId) : null,
          questions: questions.filter((q) => q.question_text.trim()),
        })
        .then((r) => r.data),
    onSuccess: (d) => {
      setDoneCount(d.inserted);
      setPhase("done");
    },
    onError: (e: any) =>
      setUploadErr(e?.response?.data?.detail ?? "Submit failed."),
  });

  function reset() {
    setPhase("upload");
    setQuestions([]);
    setUploadErr("");
    setFmt("");
  }

  const missingCount = questions.filter(
    (q) => !q.correct_answer?.trim(),
  ).length;
  const PHASES = ["upload", "review", "done"] as const;

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-text-main">
          Upload Question Bank (PDF)
        </h1>
        <p className="text-sm text-text-muted">
          Supports numbered (1. Q…) and SAT / College Board (RW question 1)
          formats.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {PHASES.map((id, i) => (
          <div key={id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-black transition-colors",
                  phase === id
                    ? "bg-primary text-white"
                    : i < PHASES.indexOf(phase)
                      ? "bg-success text-white"
                      : "bg-border text-text-muted",
                )}
              >
                {i < PHASES.indexOf(phase) ? (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold capitalize",
                  phase === id ? "text-primary" : "text-text-muted",
                )}
              >
                {id === "upload"
                  ? "Upload PDF"
                  : id === "review"
                    ? "Review & Edit"
                    : "Done"}
              </span>
            </div>
            {i < 2 && <div className="mx-3 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {/* ── PHASE 1 ─────────────────────────────────────── */}
      {phase === "upload" && (
        <div className="flex flex-col gap-4">
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
                <option value="">Select subject…</option>
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
                disabled={!subjectId}
              >
                <option value="">Auto / All chapters</option>
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
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) uploadFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all",
              dragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-primary/3",
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">
                upload_file
              </span>
            </div>
            <div>
              <p className="font-bold text-text-main">
                Drop PDF here or click to browse
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Max 20 MB · Digital PDFs only (not scanned)
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]">
                error
              </span>
              <p className="whitespace-pre-wrap">{uploadErr}</p>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
              <div>
                <p className="text-sm font-bold text-primary">
                  Processing PDF…
                </p>
                <p className="text-xs text-text-muted">
                  Extracting text and classifying difficulty.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background p-4 space-y-1.5 text-xs text-text-muted">
            <p className="font-bold uppercase tracking-wider mb-2">
              Supported formats
            </p>
            <p>
              <span className="font-semibold text-text-main">
                Format A — Numbered:
              </span>{" "}
              1. Question… / A) option / Answer: C
            </p>
            <p>
              <span className="font-semibold text-text-main">
                Format B — SAT:
              </span>{" "}
              "RW question 1" or "Math question 1" / "Key C"
            </p>
          </div>
        </div>
      )}

      {/* ── PHASE 2 ─────────────────────────────────────── */}
      {phase === "review" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                quiz
              </span>
              <span className="font-bold text-text-main">
                {questions.length} questions extracted
              </span>
            </div>
            {fmt && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {fmt === "sat" ? "SAT / College Board" : "Numbered"} format
              </span>
            )}
            {missingCount > 0 ? (
              <span className="flex items-center gap-1 text-sm font-semibold text-warning">
                <span className="material-symbols-outlined text-[16px]">
                  warning
                </span>
                {missingCount} missing answers
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-semibold text-success">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                All answers found
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={reset}
                className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-muted hover:bg-border/40"
              >
                ← Start over
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || questions.length === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[14px]">
                      progress_activity
                    </span>
                    Submitting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      cloud_upload
                    </span>
                    Submit {questions.length} questions
                  </>
                )}
              </button>
            </div>
          </div>
          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span className="material-symbols-outlined shrink-0 text-[18px]">
                error
              </span>
              <p>{uploadErr}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <ReviewCard
                key={q.temp_id}
                q={q}
                index={i}
                onChange={(u) =>
                  setQuestions((p) =>
                    p.map((x) => (x.temp_id === q.temp_id ? u : x)),
                  )
                }
                onRemove={() =>
                  setQuestions((p) => p.filter((x) => x.temp_id !== q.temp_id))
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE 3 ─────────────────────────────────────── */}
      {phase === "done" && (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
            <span className="material-symbols-outlined text-5xl text-success icon-fill">
              check_circle
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main">
              {doneCount} questions added!
            </h2>
            <p className="mt-2 text-text-muted">
              Now live in the question bank.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:bg-border/40"
            >
              Upload another PDF
            </button>
            <button
              onClick={() => (window.location.href = "/admin/questions")}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
            >
              View question bank →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

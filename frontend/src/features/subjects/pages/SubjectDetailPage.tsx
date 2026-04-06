import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { subjectsApi } from "@/api/practice";
import { cn } from "@/lib/cn";

interface Chapter {
  chapter_id: number;
  chapter_name: string;
  order_num: number;
  description: string | null;
  is_locked: boolean;
  total_attempts: number;
  correct_answers: number;
  accuracy_pct: number;
}

interface Subject {
  subject_id: number;
  subject_name: string;
  description: string | null;
  icon: string | null;
  color_class: string | null;
}

function ChapterSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="h-4 w-8 animate-pulse rounded bg-border" />
      <div className="h-6 w-48 animate-pulse rounded bg-border" />
      <div className="h-4 w-full animate-pulse rounded bg-border" />
      <div className="h-2 w-full animate-pulse rounded-full bg-border" />
      <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-border" />
    </div>
  );
}

export default function SubjectDetailPage() {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  const id = Number(subjectId);

  const { data: subject, isLoading: loadingSubject } = useQuery<Subject>({
    queryKey: ["subject", id],
    queryFn: () => subjectsApi.get(id),
    enabled: !!id,
  });

  const {
    data: chapters = [],
    isLoading: loadingChapters,
    isError,
  } = useQuery<Chapter[]>({
    queryKey: ["chapters", id],
    queryFn: () => subjectsApi.chapters(id),
    enabled: !!id,
  });

  const loading = loadingSubject || loadingChapters;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/subjects" className="hover:text-primary transition-colors">
          Subjects
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        {loading ? (
          <div className="h-4 w-24 animate-pulse rounded bg-border" />
        ) : (
          <span className="font-semibold text-primary">
            {subject?.subject_name}
          </span>
        )}
      </div>

      {/* Subject header */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="h-10 w-64 animate-pulse rounded bg-border" />
          <div className="h-4 w-96 animate-pulse rounded bg-border" />
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
            {subject?.subject_name}
          </h1>
          {subject?.description && (
            <p className="mt-2 max-w-2xl text-text-muted">
              {subject.description}
            </p>
          )}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
          <span className="material-symbols-outlined">error</span>
          <p>Could not load chapters. Is the backend running?</p>
        </div>
      )}

      {/* Chapters grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <ChapterSkeleton key={i} />)
          : chapters.map((chapter) => (
              <div
                key={chapter.chapter_id}
                className={cn(
                  "group flex flex-col justify-between rounded-2xl border bg-surface p-6 shadow-sm transition-all",
                  chapter.is_locked
                    ? "border-border opacity-55 cursor-not-allowed"
                    : "border-border cursor-pointer hover:border-primary/40 hover:shadow-md",
                )}
                onClick={() =>
                  !chapter.is_locked &&
                  navigate(
                    `/practice?chapter=${chapter.chapter_id}&subject=${id}`,
                  )
                }
              >
                <div className="flex flex-col gap-3">
                  {/* Chapter number + lock */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      {String(chapter.order_num).padStart(2, "0")}
                    </span>
                    {chapter.is_locked && (
                      <span className="material-symbols-outlined text-text-muted text-lg">
                        lock
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-lg font-bold transition-colors",
                      !chapter.is_locked && "group-hover:text-primary",
                      "text-text-main",
                    )}
                  >
                    {chapter.chapter_name}
                  </h3>

                  {chapter.description && (
                    <p className="line-clamp-2 text-sm text-text-muted">
                      {chapter.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        {chapter.total_attempts > 0
                          ? `${chapter.total_attempts} attempts`
                          : "Not started"}
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          chapter.accuracy_pct >= 70
                            ? "text-success"
                            : chapter.accuracy_pct >= 40
                              ? "text-warning"
                              : chapter.total_attempts > 0
                                ? "text-danger"
                                : "text-text-muted",
                        )}
                      >
                        {chapter.total_attempts > 0
                          ? `${chapter.accuracy_pct}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          chapter.accuracy_pct >= 70
                            ? "bg-success"
                            : chapter.accuracy_pct >= 40
                              ? "bg-warning"
                              : chapter.total_attempts > 0
                                ? "bg-danger"
                                : "bg-border",
                        )}
                        style={{ width: `${chapter.accuracy_pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  disabled={chapter.is_locked}
                  onClick={(e) => {
                    e.stopPropagation();
                    !chapter.is_locked &&
                      navigate(
                        `/practice?chapter=${chapter.chapter_id}&subject=${id}`,
                      );
                  }}
                  className={cn(
                    "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all",
                    chapter.is_locked
                      ? "cursor-not-allowed bg-border text-text-muted"
                      : "bg-primary text-white hover:bg-primary-hover",
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {chapter.total_attempts > 0 ? "replay" : "play_arrow"}
                  </span>
                  {chapter.is_locked
                    ? "Locked"
                    : chapter.total_attempts > 0
                      ? "Practice again"
                      : "Start practice"}
                </button>
              </div>
            ))}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { subjectsApi } from "@/api/practice";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

interface Subject {
  subject_id: number;
  subject_name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  color_class: string | null;
}

function SubjectSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="size-12 animate-pulse rounded-xl bg-border" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-border" />
      </div>
      <div className="h-6 w-32 animate-pulse rounded bg-border" />
      <div className="h-4 w-full animate-pulse rounded bg-border" />
      <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-border" />
    </div>
  );
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: subjects = [],
    isLoading,
    isError,
  } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: subjectsApi.list,
  });

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Let's keep learning,{" "}
          <span className="text-primary">
            {user?.fullName?.split(" ")[0] ?? "Student"}
          </span>
          !
        </h1>
        <p className="mt-2 text-text-muted">
          Pick a subject to view chapters and start a practice session.
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
          <span className="material-symbols-outlined">error</span>
          <p>
            Could not load subjects. Make sure the backend is running on port
            8000.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SubjectSkeleton key={i} />)
          : subjects.map((subject) => (
              <div
                key={subject.subject_id}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                onClick={() => navigate(`/subjects/${subject.subject_id}`)}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                        subject.color_class ?? "bg-primary/10 text-primary",
                      )}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {subject.icon ?? "book"}
                      </span>
                    </div>
                    <span className="rounded-full bg-border/50 px-2.5 py-1 text-xs font-medium text-text-muted">
                      Active
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">
                      {subject.subject_name}
                    </h3>
                    {subject.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-1 text-sm font-bold text-primary transition-all group-hover:gap-2">
                  View Chapters
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      {/* Welcome Section */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="group relative flex-[2] overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm md:p-8">
            <div className="relative z-10 flex max-w-xl flex-col gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
                  Welcome, {user?.fullName?.split(" ")[0] ?? "Student"}!
                </h2>
                <p className="text-base text-text-muted md:text-lg">
                  You've completed{" "}
                  <span className="font-bold text-primary">40%</span> of the
                  Physics syllabus. Keep it up!
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <span>Overall Completion</span>
                  <span className="text-text-main font-bold text-sm">40%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full w-[40%] rounded-full bg-primary transition-all duration-1000" />
                </div>
              </div>
              <Button
                onClick={() => navigate("/subjects")}
                className="mt-2 inline-flex w-fit items-center gap-2 bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
              >
                Continue Learning
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </Button>
            </div>
            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-text-main">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: "play_circle",
              title: "Start Practice",
              desc: "Jump into a quick 10-question set.",
              to: "/practice",
              label: "Start Now",
              color:
                "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
            },
            {
              icon: "quiz",
              title: "Take Exam",
              desc: "Simulate a full-length timed test.",
              to: "/exam/1",
              label: "View Exams",
              color:
                "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
            },
            {
              icon: "monitoring",
              title: "My Progress",
              desc: "See detailed analytics on your improvement.",
              to: "/progress",
              label: "Check Stats",
              color:
                "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
            },
          ].map((a) => (
            <div
              key={a.title}
              onClick={() => navigate(a.to)}
              className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`rounded-lg p-3 transition-colors ${a.color}`}>
                <span className="material-symbols-outlined">{a.icon}</span>
              </div>
              <div>
                <h4 className="mb-1 text-lg font-bold text-text-main">
                  {a.title}
                </h4>
                <p className="text-sm text-text-muted">{a.desc}</p>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-bold text-primary transition-all group-hover:gap-2">
                {a.label}{" "}
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

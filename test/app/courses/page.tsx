import { redirect } from "next/navigation"

// /courses is now accessed via /courses/[subjectId]
// Redirect to /subjects so users can pick a subject first
export default function CoursesPage() {
    redirect("/subjects")
}

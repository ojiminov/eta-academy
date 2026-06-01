import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/login");

  return (
    <div className="app-shell">
      <Sidebar role="TEACHER" userName={`${user.firstName} ${user.lastName}`} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

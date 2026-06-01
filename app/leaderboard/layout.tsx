import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = user.role as "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

  return (
    <div className="app-shell">
      <Sidebar role={role} userName={`${user.firstName} ${user.lastName}`} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

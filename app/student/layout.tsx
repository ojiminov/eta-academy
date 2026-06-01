import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/login");

  return (
    <div className="app-shell">
      <Sidebar role="STUDENT" userName={`${user.firstName} ${user.lastName}`} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

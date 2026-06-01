import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/login");

  return (
    <div className="app-shell">
      <Sidebar role="ADMIN" userName={`${user.firstName} ${user.lastName}`} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

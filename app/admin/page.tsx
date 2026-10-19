import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

export default async function Admin() {
  const u = await currentUser();
  if (u?.role !== "ADMIN") redirect("/login");
  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-center">Admin</h1>
      <AdminPanel />
    </main>
  );
}

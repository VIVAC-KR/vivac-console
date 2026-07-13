import { auth, signOut } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AdminShell
      email={session?.user?.email}
      userId={session?.user?.id}
      signOutAction={signOutAction}
    >
      {children}
    </AdminShell>
  );
}

import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Musician</h1>
          <div className="flex items-center gap-3 text-sm">
            {isAdmin ? (
              <Link
                href="/admin"
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="safe-bottom-with-player flex-1 px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

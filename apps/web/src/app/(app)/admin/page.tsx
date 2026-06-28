import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/library");

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: trackCount } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true });

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("email, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          User and library overview (metadata only).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="text-3xl font-bold">{userCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Tracks (metadata)</p>
          <p className="text-3xl font-bold">{trackCount ?? 0}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Recent users</h3>
        <div className="space-y-2">
          {(recentUsers ?? []).map((u) => (
            <div
              key={`${u.email}-${u.created_at}`}
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
            >
              <p className="font-medium">{u.display_name ?? u.email}</p>
              <p className="text-xs text-muted-foreground">
                {u.email} · {u.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

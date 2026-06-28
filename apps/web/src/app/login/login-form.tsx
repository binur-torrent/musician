"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? decodeURIComponent(searchParams.get("error")!)
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) setError(signInError.message);
    else window.location.href = "/library";

    setLoading(false);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Musician</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your offline YouTube audio library
        </p>
      </div>

      <form onSubmit={(e) => void handleEmailLogin(e)} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 outline-none ring-accent focus:ring-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 outline-none ring-accent focus:ring-2"
        />

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-xl bg-accent py-3 font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          Sign in
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => void handleGoogleLogin()}
        className="w-full cursor-pointer rounded-xl border border-border py-3 font-medium hover:bg-muted/50"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

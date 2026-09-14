"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";

export function LoginScreen() {
  const { login } = useStore();
  const [email, setEmail] = useState("cari.chadwick@nfl.com");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value.endsWith("@nfl.com")) {
      setError("QB1 is gated to NFL Okta accounts (@nfl.com).");
      return;
    }
    const local = value.split("@")[0];
    const name = local
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    login({
      name,
      email: value,
      office: "Media Design",
    });
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#0b0d12] px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#10141c] p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#e31837] text-sm font-black">
            Q1
          </span>
          <div>
            <h1 className="text-lg font-semibold text-white">QB1</h1>
            <p className="text-xs text-white/45">NFL Media Design · image processing</p>
          </div>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-white/60">
          Sign in with Okta. Any league email can use the tool — Photo Shelter,
          AP Images, local ingest, and analytics.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-xs text-white/50">
            NFL email
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 border-white/15 bg-black/30 text-white"
              placeholder="you@nfl.com"
              autoComplete="username"
            />
          </label>
          {error && <p className="text-xs text-[#e31837]">{error}</p>}
          <Button type="submit" className="h-10 w-full bg-[#e31837] text-white hover:bg-[#c4142f]">
            Continue with Okta
          </Button>
        </form>
        <button
          type="button"
          className="mt-3 w-full text-xs text-white/40 hover:text-white"
          onClick={() =>
            login({
              name: "Shawn Baden",
              email: "shawn.baden@nfl.com",
              office: "Media Design",
            })
          }
        >
          Demo as Shawn Baden
        </button>
        <p className="mt-6 text-[11px] leading-relaxed text-white/30">
          Reconstruction of the April 29, 2026 walkthrough. Photo Shelter, AP,
          Adobe, and AWS calls are stubbed.
        </p>
      </div>
    </div>
  );
}

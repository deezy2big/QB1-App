"use client";

import { ANALYTICS } from "@/lib/data";
import type { ReactNode } from "react";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function AnalyticsView() {
  const a = ANALYTICS;
  const maxMonth = Math.max(...a.monthly.map((m) => m.jobs));
  const maxFail = Math.max(...a.failures.map((f) => f.count));

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto p-6">
      <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
        Analytics · first {a.liveMonths} months live
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Jobs" value={a.jobs.toLocaleString()} hint="3,000+ cited on the call" />
        <Kpi label="Images" value={a.images.toLocaleString()} hint="29,000+ cited on the call" />
        <Kpi label="Success rate" value={`${(a.successRate * 100).toFixed(1)}%`} hint="Failed-image trends on the Errors tab" />
        <Kpi label="Avg job time" value={`${a.avgJobMinutes} min`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Panel title="Cost vs. savings">
          <p className="text-3xl font-semibold text-white">{money(a.savedUsd)} saved</p>
          <p className="mt-1 text-sm text-white/55">on {money(a.spendUsd)} of AWS / API spend</p>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Before QB1, cutting out 32 teams / {a.baseline.headshots.toLocaleString()} headshots
            took {a.baseline.designers} designers and {a.baseline.hoursBefore} hours. Today:{" "}
            {a.baseline.humansAfter} person, {a.baseline.hoursAfter} hours.
          </p>
        </Panel>
        <Panel title="Usage through the year">
          <div className="flex h-40 items-end gap-2">
            {a.monthly.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#c8a24a]"
                  style={{ height: `${(m.jobs / maxMonth) * 100}%` }}
                  title={`${m.jobs} jobs · ${m.images} images`}
                />
                <span className="text-[10px] text-white/45">{m.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Bars title="By image type" rows={a.byType} />
        <Bars title="By office" rows={a.byOffice} />
        <Bars title="By person" rows={a.byPerson} />
      </div>

      <Panel title="Failed images" className="mt-4">
        <p className="mb-3 text-xs text-white/45">
          Spike on Apr 9 matches the day Shawn flagged on the call.
        </p>
        <div className="flex h-28 items-end gap-3">
          {a.failures.map((f) => (
            <div key={f.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[#e31837]"
                style={{ height: `${(f.count / maxFail) * 100}%` }}
              />
              <span className="text-[10px] text-white/45">{f.day}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#10141c] p-4">
      <p className="text-[11px] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-[#10141c] p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Bars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <Panel title={title}>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex justify-between text-[11px] text-white/60">
              <span>{r.label}</span>
              <span>{r.value.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
              <div
                className="h-full bg-[#c8a24a]"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CrashAnalyze from "@/components/CrashAnalyze"; // Live feature

// --------------------------------------------------
// Tiny UI helpers (no extra packages)
// --------------------------------------------------
function Toast({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-md shadow-xl">
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent px-4 py-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative whitespace-nowrap px-4 py-2 text-sm transition ${
        active
          ? "text-white"
          : "text-zinc-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
      {active && (
        <span className="pointer-events-none absolute inset-x-3 -bottom-[6px] h-[2px] rounded-full bg-gradient-to-r from-fuchsia-400 to-orange-300" />
      )}
    </button>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const tone =
    s === "critical"
      ? "bg-red-500"
      : s === "high"
      ? "bg-orange-500"
      : s === "medium"
      ? "bg-yellow-400 text-black"
      : "bg-blue-500";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tone}`}>
      {s.toUpperCase()}
    </span>
  );
}

function IssueCard({
  issue,
  index,
}: {
  issue: { id?: number; message: string; suggestion?: string; severity?: string; line?: number };
  index: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#2E2E4D] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm opacity-70">
            Issue #{issue.id ?? index + 1} • Line {issue.line ?? "?"}
          </div>
          <div className="font-semibold">{issue.message}</div>
          {issue.suggestion && (
            <div className="text-sm opacity-90">
              <span className="opacity-70">Suggestion: </span>
              {issue.suggestion}
            </div>
          )}
        </div>
        <SeverityBadge s={(issue.severity || "medium").toLowerCase()} />
      </div>
    </div>
  );
}

function ComingSoon({
  title,
  description,
  bullets = [],
  note,
}: {
  title: string;
  description: string;
  bullets?: string[];
  note?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-2 inline-flex items-center gap-2">
        <span className="text-xl font-semibold">{title}</span>
        <span className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-1 text-xs text-yellow-200">
          Coming Soon
        </span>
      </div>
      <p className="mb-3 opacity-90">{description}</p>
      {bullets.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {note && <p className="mt-3 text-sm opacity-70">{note}</p>}
      <div className="mt-5 text-sm">
        Want early access?{" "}
        <a
          href="mailto:founders@bugzap.ai?subject=BugZap%20Early%20Access"
          className="underline hover:opacity-80"
        >
          Email us
        </a>
        .
      </div>
    </section>
  );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------
function BugZapPageInner() {
  // Code Debugger state (kept)
  const [snippet, setSnippet] = useState<string>("");
  const [issues, setIssues] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // FBX state (kept)
  const [fbxFile, setFbxFile] = useState<File | null>(null);
  const [fbxIssues, setFbxIssues] = useState<any[]>([]);
  const [fbxLoading, setFbxLoading] = useState<boolean>(false);

  // Crash Analyzer report capture (NEW)
  const [crashReport, setCrashReport] = useState<any | null>(null);

  // Toast
  const [toast, setToast] = useState<string>("");

  // API
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Handlers (same endpoints you had)
  const runAnalyze = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("code", snippet);
      const res = await fetch(`${API}/analyze`, { method: "POST", body: form });
      const data = await res.json();
      setSessionId(data.session_id);
      setIssues(data.issues);
      setTimeSaved(null);
      setToast("Scan complete");
      setTimeout(() => setToast(""), 1400);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runFix = async (issueId?: number) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("code", snippet);
      form.append("session_id", sessionId);
      if (issueId != null) form.append("issue_id", String(issueId));
      else form.append("all", "true");
      const res = await fetch(`${API}/fix`, { method: "POST", body: form });
      const data = await res.json();
      setSnippet(data.fixed_code);
      setTimeSaved(data.time_saved);
      setIssues([]);
      setToast("Auto-fix applied");
      setTimeout(() => setToast(""), 1400);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFbx = async () => {
    if (!fbxFile) return;
    setFbxLoading(true);
    try {
      const form = new FormData();
      form.append("file", fbxFile);
      const res = await fetch(`${API}/analyze-fbx`, { method: "POST", body: form });
      const data = await res.json();
      setFbxIssues(data.issues);
      setToast("FBX analyzed");
      setTimeout(() => setToast(""), 1400);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setFbxLoading(false);
    }
  };

  const fixFbx = async (all = false) => {
    if (!fbxFile) return;
    setFbxLoading(true);
    try {
      const form = new FormData();
      form.append("file", fbxFile);
      form.append("all", all ? "true" : "false");
      const res = await fetch(`${API}/fix-fbx`, { method: "POST", body: form });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixed_${fbxFile.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setToast(`Downloaded fixed_${fbxFile.name}`);
      setTimeout(() => setToast(""), 1400);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setFbxLoading(false);
    }
  };

  // --------------------------------------------------
  // Tabs with deep-link
  // --------------------------------------------------
  type TabKey =
    | "debugger"
    | "crash"
    | "fbx"
    | "tester"
    | "profiler"
    | "advisor"
    | "multiplayer"
    | "sdk"
    | "team"
    | "integrations"
    | "buildhealth"
    | "storeready"
    | "pricing";

  const params = useSearchParams();
  const router = useRouter();
  const initialTab = (params.get("tab") as TabKey) || "debugger";
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  // Keyboard shortcut to scan
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        runAnalyze();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [snippet, sessionId, issues]);

  // Capture crash report from CrashAnalyze via CustomEvent
  // In your CrashAnalyze component, dispatch after analysis:
  // window.dispatchEvent(new CustomEvent("bugzap:crashReport", { detail: reportObject }));
  useEffect(() => {
    const onReport = (e: Event) => {
      // @ts-ignore
      const detail = (e as CustomEvent).detail;
      if (detail) setCrashReport(detail);
    };
    window.addEventListener("bugzap:crashReport", onReport as EventListener);
    return () => window.removeEventListener("bugzap:crashReport", onReport as EventListener);
  }, []);

  const downloadCrashReport = () => {
    if (!crashReport) return;
    const blob = new Blob([JSON.stringify(crashReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bugzap_crash_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Crash report downloaded");
    setTimeout(() => setToast(""), 1400);
  };

  // Fun static stats
  const stats = useMemo(
    () => [
      { label: "Crashes analyzed", value: "128" },
      { label: "Avg. turnaround", value: "2.1s" },
      { label: "Top signature", value: "NullReferenceException" },
    ],
    []
  );

  return (
    <div className="relative min-h-screen text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#12081f] via-[#151a3c] to-[#2a0f3a]" />
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(transparent,transparent_23px,rgba(255,255,255,0.08)_24px),linear-gradient(90deg,transparent,transparent_23px,rgba(255,255,255,0.08)_24px)] [background-size:24px_24px]" />
        {/* glows */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/25 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent px-6 pb-6 pt-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-400 text-lg font-extrabold">
                BZ
              </div>
              <div>
                <h1 className="text-3xl font-extrabold md:text-4xl">
                  BugZap <span className="opacity-80">— find it. fix it. ship.</span>
                </h1>
                <p className="mt-2 max-w-2xl opacity-85">
                  AI debugging for game teams. Today: code linting & crash analysis. Next: automated playtesting,
                  performance insights, asset advice, multiplayer desync diffing, and more.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Pill>Unity-first</Pill>
                  <Pill>Unreal support soon</Pill>
                  <Pill>No vendor lock-in</Pill>
                </div>
              </div>
            </div>
            <div className="grid min-w-[280px] grid-cols-3 gap-2">
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#151a3c]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="py-3">
            <div className="inline-flex overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              {[
                ["debugger", "Code Debugger"],
                ["crash", "Crash Analyzer"],
                ["fbx", "FBX Checker"],
                ["tester", "AI Game Tester"],
                ["profiler", "Performance Profiler"],
                ["advisor", "Asset Advisor"],
                ["multiplayer", "Multiplayer Sync Debugger"],
                ["sdk", "One-Click SDK"],
                ["team", "Team Dashboard"],
                ["integrations", "Integrations"],
                ["buildhealth", "Build Health"],
                ["storeready", "Store Readiness"],
                ["pricing", "Pricing & Plans"],
              ].map(([key, label]) => (
                <TabButton key={key} active={tab === key} onClick={() => setTab(key as any)}>
                  {label}
                </TabButton>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* PANELS */}
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8 md:px-10">
        {/* ---- Debugger ---- */}
        {tab === "debugger" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">BugZap Debugger</h2>
              <div className="text-xs opacity-70">Paste code → scan → optional download</div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs opacity-70">Paste code or use a sample.</div>
              <button
                onClick={() =>
                  setSnippet(
                    `def safe_div(a,b):\n    return a/b\n\nprint(safe_div(1,0))  # division by zero`
                  )
                }
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                Insert sample (division by zero)
              </button>
            </div>

            <textarea
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              rows={12}
              className="mb-4 w-full rounded-xl border border-white/10 bg-[#2E2E4D] p-4 font-mono text-sm outline-none focus:border-white/20"
              placeholder="Paste your code here…"
            />

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={runAnalyze}
                disabled={loading}
                className={`rounded-2xl bg-gradient-to-r from-orange-400 to-yellow-300 px-5 py-2 font-semibold text-black transition ${
                  loading ? "opacity-70" : "hover:opacity-90"
                }`}
              >
                {loading ? "Scanning…" : "Scan for Bugs  ⌘/Ctrl+Enter"}
              </button>

              <button
                onClick={() => runFix()}
                disabled={!sessionId || issues.length === 0 || loading}
                className="rounded-2xl bg-fuchsia-500 px-5 py-2 font-semibold transition hover:opacity-90 disabled:opacity-50"
                title="Runs server-side fix for all detected issues"
              >
                Auto-Fix (All)
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([snippet || ""], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "bugzap_fixed_code.py";
                  a.click();
                  URL.revokeObjectURL(url);
                  setToast("Downloaded bugzap_fixed_code.py");
                  setTimeout(() => setToast(""), 1400);
                }}
                disabled={!snippet}
                className="rounded-2xl border border-white/15 px-5  py-2 font-semibold transition hover:border-white/25 disabled:opacity-50"
              >
                Download Fixed Code
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-sm opacity-80">
                  {issues.length
                    ? `${issues.length} issue${issues.length === 1 ? "" : "s"} found`
                    : "No issues yet"}
                  {sessionId ? ` • session ${sessionId.slice(0, 8)}…` : ""}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({ sessionId, issues }, null, 2));
                      setToast("Copied JSON");
                      setTimeout(() => setToast(""), 1200);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs transition hover:bg-white/10"
                    title="Copy raw JSON"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify({ sessionId, issues }, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "bugzap_issues.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs transition hover:bg-white/10"
                    title="Download JSON"
                  >
                    Download JSON
                  </button>
                </div>
              </div>

              {issues.length > 0 ? (
                <div className="space-y-3 px-4 pb-4">
                  {issues.map((it, i) => (
                    <IssueCard key={(it.id ?? i) + "-" + (it.line ?? 0)} issue={it} index={i} />
                  ))}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm opacity-80 hover:opacity-100">
                      Show raw JSON
                    </summary>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-[#2E2E4D] p-3 text-xs">
                      {JSON.stringify({ sessionId, issues }, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="px-4 pb-4">
                  <div className="rounded-xl bg-[#2E2E4D] p-4 text-sm opacity-80">
                    No issues yet. Paste code and click <span className="font-semibold">Scan for Bugs</span>.
                    Try our test snippet to see cards light up.
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ---- Crash Analyzer (colorful) ---- */}
        {tab === "crash" && (
          <section className="relative overflow-hidden rounded-3xl border border-white/10 p-0">
            {/* colorful header strip */}
            <div className="h-2 w-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-orange-300" />
            <div className="relative grid gap-6 p-6 md:grid-cols-[1fr,320px]">
              {/* playful background wash */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="rounded-2xl border border-white/10 bg-[#0f1431]/70 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Crash Log Analyzer</h2>
                  <div className="text-xs opacity-70">
                    Upload logs • explain root cause • suggested fixes
                  </div>
                </div>
                {/* Your live component */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <CrashAnalyze />
                </div>
              </div>

              {/* Side info / actions */}
              <aside className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 text-sm opacity-80">
                    Export or share your latest analysis
                  </div>
                  <button
                    onClick={downloadCrashReport}
                    disabled={!crashReport}
                    className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-400 to-orange-300 px-4 py-2 font-semibold text-black transition disabled:opacity-50"
                  >
                    Download Crash Report (.json)
                  </button>
                  {!crashReport && (
                    <p className="mt-2 text-xs opacity-70">
                      Tip: After analysis, the report becomes downloadable. If nothing happens,
                      update your <code>CrashAnalyze</code> to dispatch:
                      <code className="ml-1 rounded bg-black/40 px-1 py-0.5">
                        {"window.dispatchEvent(new CustomEvent('bugzap:crashReport', { detail: report }))"}
                      </code>
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 text-sm font-semibold">Why it feels good</div>
                  <ul className="space-y-1 text-sm opacity-90">
                    <li>• Color-coded sections reduce cognitive load</li>
                    <li>• Soothing glows + crisp borders = clarity</li>
                    <li>• One-click export for async teamwork</li>
                  </ul>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ---- FBX Checker ---- */}
        {tab === "fbx" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-2xl font-semibold">FBX Asset Checker</h2>
            <input
              type="file"
              accept=".fbx"
              onChange={(e) => setFbxFile(e.target.files?.[0] || null)}
              className="mb-4"
            />
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                onClick={analyzeFbx}
                disabled={fbxLoading || !fbxFile}
                className="rounded-2xl border border-white/15 px-4 py-2 font-semibold transition hover:border-white/25 disabled:opacity-50"
              >
                {fbxLoading ? "Analyzing…" : "Analyze FBX"}
              </button>
              <button
                onClick={() => fixFbx(true)}
                disabled={fbxLoading || !fbxFile}
                className="rounded-2xl bg-green-500 px-4 py-2 font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {fbxLoading ? "Fixing…" : "Fix All Issues"}
              </button>
              <a
                href="/samples/dummy.fbx"
                download
                className="rounded-2xl border border-white/15 px-4 py-2 font-semibold transition hover:border-white/25"
              >
                Get fake .fbx
              </a>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg bg-[#2E2E4D] p-4">
              {JSON.stringify(fbxIssues, null, 2)}
            </pre>
          </section>
        )}

        {/* ---- Coming Soon Panels (kept) ---- */}
        {tab === "tester" && (
          <ComingSoon
            title="AI Game Tester"
            description="Upload builds; our headless bots explore menus & scenes, reproduce crashes, and return video + repro steps automatically."
            bullets={["Script-free exploration & coverage", "Auto-collected logs + repro steps", "Video highlights of failures"]}
            note="Unity standalone/WebGL & Android first; Unreal next."
          />
        )}

        {tab === "profiler" && (
          <ComingSoon
            title="Performance Profiler"
            description="Drop in Unity Profiler CSV or Unreal Insights logs — get hot paths, GC spikes, and targeted fixes."
            bullets={["Frame time trendlines & hitches", "CPU/GPU bottlenecks ranked", "Memory leak signatures & remedies"]}
            note="Export a shareable report for producers and tech leads."
          />
        )}

        {tab === "advisor" && (
          <ComingSoon
            title="Asset Advisor"
            description="Flag oversized textures, missing mipmaps, and shader/import settings that bloat builds."
            bullets={["Per-platform import presets", "Shader pass & SRP hints", "Broken GUIDs / missing metas"]}
            note="Pairs with Crash Analyzer to resolve asset-driven failures."
          />
        )}

        {tab === "multiplayer" && (
          <ComingSoon
            title="Multiplayer Sync Debugger"
            description="Upload multiple player logs; we align timelines, diff events, and surface probable desync causes."
            bullets={["Event alignment & anomaly detection", "Packet loss & clock drift hints", "Suggested repro scene & steps"]}
            note="Focus: co-op & small-team netcode pain."
          />
        )}

        {tab === "sdk" && (
          <ComingSoon
            title="One-Click SDK"
            description="A tiny SDK for Unity/Unreal that auto-captures crashes and uploads logs to your BugZap workspace."
            bullets={["Zero-config upload on crash", "Breadcrumbs + device info", "Privacy-safe redaction"]}
            note="Plug-and-play adoption = lower friction for your team."
          />
        )}

        {tab === "team" && (
          <ComingSoon
            title="Team Dashboard"
            description="Invite teammates, assign issues, track fixes, and share build health across the studio."
            bullets={["Roles & permissions", "Issue assignment & status", "Project-level analytics"]}
            note="Reduce Slack chaos; centralize triage & decisions."
          />
        )}

        {tab === "integrations" && (
          <ComingSoon
            title="Integrations"
            description="Pipe findings into the tools you already use."
            bullets={["Jira / Linear ticket creation", "GitHub PR comments with patches", "Slack alerts for regressions"]}
            note="Webhooks for custom pipelines."
          />
        )}

        {tab === "buildhealth" && (
          <ComingSoon
            title="Build Health"
            description="A single snapshot of stability across branches, builds, and platforms."
            bullets={["Crash-free sessions & trendlines", "Top regressions by commit", "Quality gates for release"]}
            note="Perfect for weekly reviews with production."
          />
        )}

        {tab === "storeready" && (
          <ComingSoon
            title="Store Readiness"
            description="Pass submission checks the first time. Fix platform-specific issues before they cost you time."
            bullets={["Texture & audio compliance", "Controller/input coverage", "Localization & save-data sanity"]}
            note="Target checklists for Steam, Switch, PlayStation, Xbox, Mobile."
          />
        )}

        {/* ---- Pricing (kept) ---- */}
        {tab === "pricing" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-2 text-2xl font-semibold">Pricing & Plans</h2>
            <p className="mb-4 opacity-80">
              Try BugZap free, then pick a plan that fits your team. Early-access discounts available for our first cohort.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-semibold">Free</div>
                <div className="my-2 text-3xl font-extrabold">$0</div>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• 3 crash analyses / month</li>
                  <li>• Basic code scan</li>
                  <li>• Community support</li>
                </ul>
                <button className="mt-4 w-full rounded-xl border px-4 py-2">Get Started</button>
              </div>

              <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-5">
                <div className="text-lg font-semibold">Indie</div>
                <div className="my-2 text-3xl font-extrabold">$49</div>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• Unlimited crash analyses</li>
                  <li>• Priority patches</li>
                  <li>• Email support</li>
                </ul>
                <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-400 to-yellow-300 px-4 py-2 font-semibold text-black">
                  Join Early Access
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-semibold">Studio</div>
                <div className="my-2 text-3xl font-extrabold">$249</div>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• SLA & dedicated support</li>
                  <li>• Team seats</li>
                  <li>• Feature prioritization</li>
                </ul>
                <button className="mt-4 w-full rounded-xl border px-4 py-2">Talk to Us</button>
              </div>
            </div>

            <p className="mt-4 text-xs opacity-60">
              Billing goes live with our first production cohort. Contact{" "}
              <a className="underline" href="mailto:founders@bugzap.ai">
                founders@bugzap.ai
              </a>{" "}
              for a custom plan.
            </p>
          </section>
        )}

        {/* FOOTER CTA */}
        <footer className="pt-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-sm opacity-85">
              “Ship faster, rage less.” — BugZap watches your builds so your team can build.
            </div>
          </div>
        </footer>
      </main>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}

// Minimal change Next requires: wrap the page in Suspense
export default function BugZapPage() {
  return (
    <Suspense fallback={null}>
      <BugZapPageInner />
    </Suspense>
  );
}



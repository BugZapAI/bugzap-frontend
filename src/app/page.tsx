/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CrashAnalyze from "@/components/CrashAnalyze"; // Live feature

// ------------------------------------
// Small shared UI bits (no extra deps)
// ------------------------------------
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
      className={`px-4 py-2 text-sm transition whitespace-nowrap ${
        active ? "bg-yellow-500 text-black" : "hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 border border-white/10">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
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
    <section className="rounded-2xl border border-white/10 p-6 bg-white/5">
      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xl font-semibold">{title}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
          Coming Soon
        </span>
      </div>
      <p className="opacity-90 mb-3">{description}</p>
      {bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
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

// --- UI helpers for the Debugger results ---
function SeverityBadge({ s }: { s: string }) {
  const tone =
    s === "critical" ? "bg-red-500" :
    s === "high"     ? "bg-orange-500" :
    s === "medium"   ? "bg-yellow-500 text-black" :
    "bg-blue-500";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tone}`}>
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

// ------------------------------------
// Main page (keeps your original logic)
// ------------------------------------
export default function BugZapPage() {
  // ---- existing state (unchanged) ----
  const [snippet, setSnippet] = useState<string>("");
  const [issues, setIssues] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // FBX state (unchanged)
  const [fbxFile, setFbxFile] = useState<File | null>(null);
  const [fbxIssues, setFbxIssues] = useState<any[]>([]);
  const [fbxLoading, setFbxLoading] = useState<boolean>(false);

  // Keep your env var name exactly as-is
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ---- existing handlers (unchanged) ----
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
    } catch (e: any) {
      alert(e.message);
    } finally {
      setFbxLoading(false);
    }
  };

  // ---- NEW: tabs with deep-link support ----
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
    // keep URL in sync (shareable links)
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  // fun static stats (wire to backend later if you want)
  const stats = useMemo(
    () => [
      { label: "Crashes analyzed", value: "128" },
      { label: "Avg. turnaround", value: "2.1s" },
      { label: "Top signature", value: "NullReferenceException" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white font-sans">
      {/* HERO */}
      <header className="px-6 md:px-10 pt-10 pb-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                BugZap <span className="opacity-80">— find it. fix it. ship.</span>
              </h1>
              <p className="mt-2 opacity-80 max-w-2xl">
                AI debugging for game teams. Today: code linting & crash analysis.
                Next: automated playtesting, performance insights, asset advice,
                multiplayer desync diffing, and more.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full border border-white/15 bg-white/5">
                  Unity-first
                </span>
                <span className="px-2 py-1 rounded-full border border-white/15 bg-white/5">
                  Unreal support soon
                </span>
                <span className="px-2 py-1 rounded-full border border-white/15 bg-white/5">
                  No vendor lock-in
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 min-w-[280px]">
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* TABS BAR */}
      <nav className="px-6 md:px-10 sticky top-0 z-30 bg-[#1A1A2E]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto py-3 overflow-x-auto">
          <div className="inline-flex rounded-2xl border border-white/10 overflow-hidden">
            <TabButton active={tab === "debugger"} onClick={() => setTab("debugger")}>
              Code Debugger
            </TabButton>
            <TabButton active={tab === "crash"} onClick={() => setTab("crash")}>
              Crash Analyzer
            </TabButton>
            <TabButton active={tab === "fbx"} onClick={() => setTab("fbx")}>
              FBX Checker
            </TabButton>
            <TabButton active={tab === "tester"} onClick={() => setTab("tester")}>
              AI Game Tester
            </TabButton>
            <TabButton active={tab === "profiler"} onClick={() => setTab("profiler")}>
              Performance Profiler
            </TabButton>
            <TabButton active={tab === "advisor"} onClick={() => setTab("advisor")}>
              Asset Advisor
            </TabButton>
            <TabButton active={tab === "multiplayer"} onClick={() => setTab("multiplayer")}>
              Multiplayer Sync Debugger
            </TabButton>
            <TabButton active={tab === "sdk"} onClick={() => setTab("sdk")}>
              One-Click SDK
            </TabButton>
            <TabButton active={tab === "team"} onClick={() => setTab("team")}>
              Team Dashboard
            </TabButton>
            <TabButton active={tab === "integrations"} onClick={() => setTab("integrations")}>
              Integrations
            </TabButton>
            <TabButton active={tab === "buildhealth"} onClick={() => setTab("buildhealth")}>
              Build Health
            </TabButton>
            <TabButton active={tab === "storeready"} onClick={() => setTab("storeready")}>
              Store Readiness
            </TabButton>
            <TabButton active={tab === "pricing"} onClick={() => setTab("pricing")}>
              Pricing & Plans
            </TabButton>
          </div>
        </div>
      </nav>

      {/* PANELS */}
      <main className="px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* ---- Debugger (live) ---- */}
          {tab === "debugger" && (
            <section className="rounded-2xl p-6 border border-white/10 bg-white/5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-semibold">BugZap Debugger</h2>
                <div className="text-xs opacity-70">Paste code → scan → optional download</div>
              </div>

              <textarea
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                rows={12}
                className="w-full bg-[#2E2E4D] p-4 mb-4 rounded-lg font-mono text-sm"
                placeholder="Paste your code here…"
              />

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={runAnalyze}
                  disabled={loading}
                  className="bg-yellow-500 px-6 py-2 rounded-2xl text-black"
                >
                  {loading ? "Scanning…" : "Scan for Bugs"}
                </button>

                {/* (Optional) Fix All via backend if issues exist */}
                <button
                  onClick={() => runFix()}
                  disabled={!sessionId || issues.length === 0 || loading}
                  className="bg-purple-500 px-6 py-2 rounded-2xl disabled:opacity-50"
                  title="Runs server-side fix for all detected issues"
                >
                  Auto-Fix (All)
                </button>

                {/* Download current buffer (kept from your request) */}
                <button
                  onClick={() => {
                    const blob = new Blob([snippet || ""], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "bugzap_fixed_code.py";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!snippet}
                  className="bg-green-500 px-6 py-2 rounded-2xl disabled:opacity-50"
                >
                  Download Fixed Code
                </button>
              </div>

              {/* Results */}
              <div className="rounded-2xl border border-white/10 bg-white/5">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm opacity-80">
                    {issues.length ? `${issues.length} issue${issues.length === 1 ? "" : "s"} found` : "No issues yet"}
                    {sessionId ? ` • session ${sessionId.slice(0, 8)}…` : ""}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify({ sessionId, issues }, null, 2));
                      }}
                      className="text-xs rounded-lg px-3 py-1 border border-white/10 hover:bg-white/10"
                      title="Copy raw JSON"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ sessionId, issues }, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "bugzap_issues.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs rounded-lg px-3 py-1 border border-white/10 hover:bg-white/10"
                      title="Download JSON"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>

                {/* body */}
                {issues.length > 0 ? (
                  <div className="px-4 pb-4 space-y-3">
                    {issues.map((it, i) => (
                      <IssueCard key={(it.id ?? i) + "-" + (it.line ?? 0)} issue={it} index={i} />
                    ))}

                    {/* collapsible raw json */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm opacity-80 hover:opacity-100">
                        Show raw JSON
                      </summary>
                      <pre className="bg-[#2E2E4D] p-3 rounded-lg mt-2 max-h-56 overflow-auto text-xs">
                        {JSON.stringify({ sessionId, issues }, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-[#2E2E4D] p-4 text-sm opacity-80">
                      No issues yet. Paste code and click <span className="font-semibold">Scan for Bugs</span>.
                      Try our test snippet with division by zero or undefined variables to see cards light up.
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---- Crash Analyzer (live) ---- */}
          {tab === "crash" && (
            <section className="rounded-2xl p-6 border border-white/10 bg-white/5">
              <h2 className="text-2xl font-semibold mb-4">Crash Log Analyzer</h2>
              <CrashAnalyze />
            </section>
          )}

          {/* ---- FBX Checker (live) ---- */}
          {tab === "fbx" && (
            <section className="rounded-2xl p-6 border border-white/10 bg-white/5">
              <h2 className="text-2xl font-semibold mb-4">FBX Asset Checker</h2>

              <input
                type="file"
                accept=".fbx"
                onChange={(e) => setFbxFile(e.target.files?.[0] || null)}
                className="mb-4"
              />

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={analyzeFbx}
                  disabled={fbxLoading || !fbxFile}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  {fbxLoading ? "Analyzing…" : "Analyze FBX"}
                </button>
                <button
                  onClick={() => fixFbx(true)}
                  disabled={fbxLoading || !fbxFile}
                  className="bg-green-500 px-4 py-2 rounded-lg"
                >
                  {fbxLoading ? "Fixing…" : "Fix All Issues"}
                </button>
              </div>

              <pre className="bg-[#2E2E4D] p-4 rounded-lg max-h-56 overflow-auto">
                {JSON.stringify(fbxIssues, null, 2)}
              </pre>
            </section>
          )}

          {/* ---- AI Game Tester (coming soon) ---- */}
          {tab === "tester" && (
            <ComingSoon
              title="AI Game Tester"
              description="Upload builds; our headless bots explore menus & scenes, reproduce crashes, and return video + repro steps automatically."
              bullets={[
                "Script-free exploration & coverage",
                "Auto-collected logs + repro steps",
                "Video highlights of failures",
              ]}
              note="Unity standalone/WebGL & Android first; Unreal next."
            />
          )}

          {/* ---- Performance Profiler (coming soon) ---- */}
          {tab === "profiler" && (
            <ComingSoon
              title="Performance Profiler"
              description="Drop in Unity Profiler CSV or Unreal Insights logs — get hot paths, GC spikes, and targeted fixes."
              bullets={[
                "Frame time trendlines & hitches",
                "CPU/GPU bottlenecks ranked",
                "Memory leak signatures & remedies",
              ]}
              note="Export a shareable report for producers and tech leads."
            />
          )}

          {/* ---- Asset Advisor (coming soon) ---- */}
          {tab === "advisor" && (
            <ComingSoon
              title="Asset Advisor"
              description="Flag oversized textures, missing mipmaps, and shader/import settings that bloat builds."
              bullets={[
                "Per-platform import presets",
                "Shader pass & SRP hints",
                "Broken GUIDs / missing metas",
              ]}
              note="Pairs with Crash Analyzer to resolve asset-driven failures."
            />
          )}

          {/* ---- Multiplayer Sync Debugger (coming soon) ---- */}
          {tab === "multiplayer" && (
            <ComingSoon
              title="Multiplayer Sync Debugger"
              description="Upload multiple player logs; we align timelines, diff events, and surface probable desync causes."
              bullets={[
                "Event alignment & anomaly detection",
                "Packet loss & clock drift hints",
                "Suggested repro scene & steps",
              ]}
              note="Focus: co-op & small-team netcode pain."
            />
          )}

          {/* ---- One-Click SDK (coming soon) ---- */}
          {tab === "sdk" && (
            <ComingSoon
              title="One-Click SDK"
              description="A tiny SDK for Unity/Unreal that auto-captures crashes and uploads logs to your BugZap workspace."
              bullets={[
                "Zero-config upload on crash",
                "Breadcrumbs + device info",
                "Privacy-safe redaction",
              ]}
              note="Plug-and-play adoption = lower friction for your team."
            />
          )}

          {/* ---- Team Dashboard (coming soon) ---- */}
          {tab === "team" && (
            <ComingSoon
              title="Team Dashboard"
              description="Invite teammates, assign issues, track fixes, and share build health across the studio."
              bullets={[
                "Roles & permissions",
                "Issue assignment & status",
                "Project-level analytics",
              ]}
              note="Reduce Slack chaos; centralize triage & decisions."
            />
          )}

          {/* ---- Integrations (coming soon) ---- */}
          {tab === "integrations" && (
            <ComingSoon
              title="Integrations"
              description="Pipe findings into the tools you already use."
              bullets={[
                "Jira / Linear ticket creation",
                "GitHub PR comments with patches",
                "Slack alerts for regressions",
              ]}
              note="Webhooks for custom pipelines."
            />
          )}

          {/* ---- Build Health (coming soon) ---- */}
          {tab === "buildhealth" && (
            <ComingSoon
              title="Build Health"
              description="A single snapshot of stability across branches, builds, and platforms."
              bullets={[
                "Crash-free sessions & trendlines",
                "Top regressions by commit",
                "Quality gates for release",
              ]}
              note="Perfect for weekly reviews with production."
            />
          )}

          {/* ---- Store Readiness (coming soon) ---- */}
          {tab === "storeready" && (
            <ComingSoon
              title="Store Readiness"
              description="Pass submission checks the first time. Fix platform-specific issues before they cost you time."
              bullets={[
                "Texture & audio compliance",
                "Controller/input coverage",
                "Localization & save-data sanity",
              ]}
              note="Target checklists for Steam, Switch, PlayStation, Xbox, Mobile."
            />
          )}

          {/* ---- Pricing (marketing) ---- */}
          {tab === "pricing" && (
            <section className="rounded-2xl border border-white/10 p-6 bg-white/5">
              <h2 className="text-2xl font-semibold mb-2">Pricing & Plans</h2>
              <p className="opacity-80 mb-4">
                Try BugZap free, then pick a plan that fits your team. Early-access discounts available for our first cohort.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Free */}
                <div className="rounded-xl border border-white/10 p-5 bg-white/5">
                  <div className="text-lg font-semibold">Free</div>
                  <div className="text-3xl font-extrabold my-2">$0</div>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• 3 crash analyses / month</li>
                    <li>• Basic code scan</li>
                    <li>• Community support</li>
                  </ul>
                  <button className="mt-4 w-full rounded-xl border px-4 py-2">Get Started</button>
                </div>

                {/* Indie */}
                <div className="rounded-xl border border-yellow-500/50 p-5 bg-yellow-500/10">
                  <div className="text-lg font-semibold">Indie</div>
                  <div className="text-3xl font-extrabold my-2">$49</div>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Unlimited crash analyses</li>
                    <li>• Priority patches</li>
                    <li>• Email support</li>
                  </ul>
                  <button className="mt-4 w-full rounded-xl bg-yellow-500 text-black px-4 py-2">Join Early Access</button>
                </div>

                {/* Studio */}
                <div className="rounded-xl border border-white/10 p-5 bg-white/5">
                  <div className="text-lg font-semibold">Studio</div>
                  <div className="text-3xl font-extrabold my-2">$249</div>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• SLA & dedicated support</li>
                    <li>• Team seats</li>
                    <li>• Feature prioritization</li>
                  </ul>
                  <button className="mt-4 w-full rounded-xl border px-4 py-2">Talk to Us</button>
                </div>
              </div>

              <p className="text-xs opacity-60 mt-4">
                Billing goes live with our first production cohort. Contact{" "}
                <a className="underline" href="mailto:founders@bugzap.ai">
                  founders@bugzap.ai
                </a>{" "}
                for a custom plan.
              </p>
            </section>
          )}

          {/* FOOTER CTA */}
          <footer className="pt-4">
            <div className="rounded-2xl border border-white/10 p-4 text-center bg-white/5">
              <div className="text-sm opacity-80">
                “Ship faster, rage less.” — BugZap watches your builds so your team can build.
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

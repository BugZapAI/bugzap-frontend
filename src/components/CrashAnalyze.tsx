"use client";
import React, { useMemo, useState } from "react";

type Result = {
  engine: string;
  summary: string;
  root_cause: string;
  evidence: string[];
  recommendations: string[];
  code_patch?: string | null;
  confidence: number;
  detected_signatures: string[];
};

// --- API base: supports either env name, trims trailing slash
const apiFromEnv =
  (process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "").trim();
const API_BASE = apiFromEnv ? apiFromEnv.replace(/\/$/, "") : "";

// Optional override for exact crash path via env (ignore empty or "/")
const pathEnvRaw = (process.env.NEXT_PUBLIC_CRASH_PATH || "").trim();
const CRASH_PATH_FROM_ENV =
  pathEnvRaw && pathEnvRaw !== "/"
    ? pathEnvRaw.startsWith("/")
      ? pathEnvRaw
      : `/${pathEnvRaw}`
    : "";

// Candidate backend routes (include /crash/analyze-crash and /api/crash/analyze-crash)
const CRASH_ENDPOINTS = CRASH_PATH_FROM_ENV
  ? [CRASH_PATH_FROM_ENV]
  : [
      // plain
      "/analyze-crash",
      "/analyze-crash/",
      // likely mounted with /crash
      "/crash/analyze-crash",
      "/crash/analyze-crash/",
      // other common names we already had
      "/crash/analyze",
      "/crash/analyze/",
      "/analyze_log",
      "/analyze_log/",
      "/crash/analyze-log",
      "/crash/analyze-log/",
      "/crash/analyze_log",
      "/crash/analyze_log/",
      "/analyze_crash",
      "/analyze_crash/",
      "/crashlog/analyze",
      "/crashlog/analyze/",
      // with /api prefix
      "/api/analyze-crash",
      "/api/analyze-crash/",
      "/api/crash/analyze-crash",
      "/api/crash/analyze-crash/",
      "/api/crash/analyze",
      "/api/crash/analyze/",
      "/api/analyze_log",
      "/api/analyze_log/",
      "/api/crash/analyze-log",
      "/api/crash/analyze-log/",
      "/api/crash/analyze_log",
      "/api/crash/analyze_log/",
      "/api/analyze_crash",
      "/api/analyze_crash/",
      "/api/crashlog/analyze",
      "/api/crashlog/analyze/",
    ];

export default function CrashAnalyze() {
  const [file, setFile] = useState<File | null>(null);
  const [engine, setEngine] = useState<"" | "unity" | "unreal">("unity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [fileText, setFileText] = useState<string>("");

  const fileHint = useMemo(() => {
    if (!fileText) return "";
    const lines = fileText.split(/\r?\n/).slice(0, 12).join("\n");
    return lines;
  }, [fileText]);

  async function postToFirstWorkingEndpoint(form: FormData): Promise<Result> {
    if (!API_BASE) {
      throw new Error(
        "Missing NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_API_BASE_URL) on the frontend."
      );
    }

    const tried: string[] = [];

    for (const path of CRASH_ENDPOINTS) {
      const url = `${API_BASE}${path}`;
      tried.push(url);
      try {
        const res = await fetch(url, {
          method: "POST",
          body: form,
          headers: { Accept: "application/json" },
        });

        const ct = res.headers.get("content-type") || "";
        const isJSON = ct.includes("application/json");

        if (!res.ok) {
          const msg = isJSON
            ? JSON.stringify(await res.json()).slice(0, 300)
            : (await res.text()).slice(0, 300);
          if (res.status === 404) continue; // try next path
          throw new Error(`HTTP ${res.status} from ${url}: ${msg}`);
        }

        if (!isJSON) continue;

        const data = (await res.json()) as Result;
        if (data && typeof data.summary === "string") return data;
      } catch {
        continue;
      }
    }

    throw new Error(
      `No crash-analysis endpoint responded successfully.\nTried:\n- ${tried.join(
        "\n- "
      )}`
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      // Your backend might expect different keys — include a few common ones
      form.append("log", file);
      form.append("file", file);
      form.append("crash_log", file);
      form.append("engine", engine);
      form.append("game_engine", engine);

      const data = await postToFirstWorkingEndpoint(form);
      setResult(data);

      // 🔔 Tell the page we have a finished crash report (used for Download button + feedback)
      window.dispatchEvent(
        new CustomEvent("bugzap:crashReport", { detail: data })
      );
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      {/* top controls */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Engine Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { k: "unity", label: "Unity" },
            { k: "unreal", label: "Unreal" },
            { k: "", label: "Auto" },
          ].map((opt) => (
            <label
              key={opt.k || "auto"}
              className={`badge cursor-pointer ${
                engine === opt.k
                  ? "bg-gradient-to-r from-fuchsia-400 to-orange-300 text-black border-transparent"
                  : ""
              }`}
            >
              <input
                type="radio"
                className="hidden"
                name="engine"
                value={opt.k}
                checked={engine === opt.k}
                onChange={() => setEngine(opt.k as any)}
              />
              <span className="px-1">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Dropzone */}
        <div
          className="rounded-xl border-2 border-dashed border-white/20 p-6 text-center transition hover:bg-white/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) {
              setFile(f);
              setFileText("");
              f.text().then((t) => setFileText(t)).catch(() => {});
            }
          }}
        >
          <input
            id="logfile"
            type="file"
            accept=".log,.txt"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setFileText("");
              if (f) {
                try {
                  const t = await f.text();
                  setFileText(t);
                } catch {}
              }
            }}
          />
          <label htmlFor="logfile" className="cursor-pointer text-sm">
            {file ? (
              <span className="font-medium">Selected: {file.name}</span>
            ) : (
              <>
                <span className="font-medium underline">Click to choose a log</span> or drag & drop
              </>
            )}
          </label>
          <div className="mt-1 text-xs opacity-70">
            Unity <code>Editor.log</code> or any crash <code>.log/.txt</code>.
          </div>
        </div>

        {/* Quick preview of the log (first lines) */}
        {fileHint && (
          <details className="rounded-xl border border-white/10 bg-[#0f1431]/50 p-3">
            <summary className="cursor-pointer text-sm opacity-85">
              Preview first lines
            </summary>
            <pre className="nice-scroll mt-2 max-h-40 overflow-auto rounded-md bg-black/30 p-3 text-xs">
{fileHint}
            </pre>
          </details>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!file || loading}
            className={`btn btn-primary ${loading ? "opacity-70" : ""}`}
          >
            {loading ? "Analyzing…" : "Analyze log"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setFileText("");
              setResult(null);
              setError(null);
            }}
            className="btn btn-secondary text-sm"
          >
            Reset
          </button>

          {/* Local backup download (in case page listener is removed) */}
          {result && (
            <button
              type="button"
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(result, null, 2)],
                  { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bugzap_crash_report_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary text-sm"
              title="Download the current analysis as JSON"
            >
              Download JSON (local)
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="font-semibold">Error</div>
          <div className="whitespace-pre-wrap text-sm">{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-1 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Summary</h2>
              <div className="text-xs opacity-80">
                Engine: {result.engine} • Confidence:{" "}
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
            <p className="opacity-90">{result.summary}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold">Root Cause</h3>
            <p className="mt-1 opacity-90">{result.root_cause}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <h3 className="font-semibold">Evidence</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {result.evidence.map((e, i) => (
                <li key={i}>
                  <code className="break-all">{e}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold">Recommendations</h3>
            <ul className="mt-1 list-disc pl-5">
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {result.code_patch && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold">Example Patch</h3>
              <pre className="nice-scroll mt-2 max-h-60 overflow-auto rounded-md bg-black/30 p-3 text-xs">
                <code>{result.code_patch}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


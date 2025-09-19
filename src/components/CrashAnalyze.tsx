"use client";
import React, { useState } from "react";

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
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
const API_BASE = apiFromEnv ? apiFromEnv.replace(/\/$/, "") : "";

// (NEW) Optional override for exact crash path via env (ignore empty or "/")
const pathEnvRaw = (process.env.NEXT_PUBLIC_CRASH_PATH || "").trim();
const CRASH_PATH_FROM_ENV =
  pathEnvRaw && pathEnvRaw !== "/"
    ? (pathEnvRaw.startsWith("/") ? pathEnvRaw : `/${pathEnvRaw}`)
    : "";

// Candidate backend routes (we'll try in order until one returns JSON 200)
const CRASH_ENDPOINTS = CRASH_PATH_FROM_ENV
  ? [CRASH_PATH_FROM_ENV]
  : [
      "/analyze-crash",
      "/crash/analyze",
      "/analyze_log",
      "/crash/analyze-log",
      "/crash/analyze_log",
      "/analyze_crash",
      "/crashlog/analyze",
    ];

export default function CrashAnalyze() {
  const [file, setFile] = useState<File | null>(null);
  const [engine, setEngine] = useState<"" | "unity" | "unreal">("unity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

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
          headers: { Accept: "application/json" }, // (NEW) prefer JSON
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

        if (!isJSON) {
          // Not JSON? try the next candidate
          continue;
        }

        const data = (await res.json()) as Result;
        if (data && typeof data.summary === "string") return data; // basic shape check
      } catch {
        // network/parse issue — move on
        continue;
      }
    }

    throw new Error(
      `No crash-analysis endpoint responded successfully.\nTried:\n- ${tried.join("\n- ")}`
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
      form.append("crash_log", file);          // (NEW)
      form.append("engine", engine);
      form.append("game_engine", engine);      // (NEW)

      const data = await postToFirstWorkingEndpoint(form);
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border shadow-sm bg-white/70 dark:bg-zinc-900/50 backdrop-blur">
      <div className="p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Crash Log Analyzer</h1>
        <p className="mt-2 text-sm opacity-80">
          Upload a Unity/Unreal crash log → structured root cause, evidence, and fixes.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Engine Selector */}
          <div className="flex gap-3 flex-wrap">
            {[
              { k: "unity", label: "Unity" },
              { k: "unreal", label: "Unreal" },
              { k: "", label: "Auto-detect" },
            ].map((opt) => (
              <label
                key={opt.k || "auto"}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer ${
                  engine === opt.k
                    ? "bg-black text-white dark:bg-white dark:text-black"
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
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Dropzone */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-black/5 dark:hover:bg-white/5 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <input
              id="logfile"
              type="file"
              accept=".log,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
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
            <div className="text-xs opacity-70 mt-1">
              Unity <code>Editor.log</code> or any crash <code>.log/.txt</code>.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className="px-5 py-2 rounded-xl border font-medium disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze log"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-xl text-sm opacity-80 hover:opacity-100"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-300/70 p-4">
            <div className="font-semibold">Error</div>
            <div className="text-sm whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Summary</h2>
                <div className="text-sm opacity-80">
                  Engine: {result.engine} • Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>
              <p className="mt-2">{result.summary}</p>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Root Cause</h3>
              <p className="mt-1">{result.root_cause}</p>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Evidence</h3>
              <ul className="list-disc pl-5 mt-1 text-sm">
                {result.evidence.map((e, i) => (
                  <li key={i}><code className="break-all">{e}</code></li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Recommendations</h3>
              <ul className="list-disc pl-5 mt-1">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {result.code_patch && (
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold">Example Patch</h3>
                <pre className="mt-2 overflow-auto text-sm"><code>{result.code_patch}</code></pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


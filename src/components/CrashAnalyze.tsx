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

// Keep the rest of your component/logic unchanged
export default function CrashAnalyze() {
  const [file, setFile] = useState<File | null>(null);
  const [engine, setEngine] = useState<"" | "unity" | "unreal">("unity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!API_BASE) {
        throw new Error(
          "Missing NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_API_BASE_URL) on the frontend."
        );
      }

      const form = new FormData();
      form.append("log", file);
      form.append("engine", engine);

      // NOTE: removed the extra '/api' segment
      const res = await fetch(`${API_BASE}/analyze-crash`, {
        method: "POST",
        body: form,
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const data: Result =
        ct.includes("application/json") ? await res.json() : await res.json(); // backend should return JSON
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
            <div className="text-sm">{error}</div>
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

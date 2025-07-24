"use client";

import { useState } from "react";

type Issue = {
  id: number;
  message: string;
  suggestion: string;
  severity?: string;
  line?: number;
};

interface AnalyzeResponse {
  session_id: string;
  issues: Issue[];
}

interface FixResponse {
  fixed_code: string;
  time_saved: number;
}

export default function BugZapPage() {
  const [snippet, setSnippet] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runAnalyze = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("code", snippet);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analyze`,
        { method: "POST", body: form }
      );
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok) throw new Error((data as any).error || "Analyze error");

      setSessionId(data.session_id);
      setIssues(data.issues);
      setTimeSaved(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert("Analyze failed: " + msg);
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
      if (issueId !== undefined) form.append("issue_id", issueId.toString());
      else form.append("all", "true");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/fix`,
        { method: "POST", body: form }
      );
      const data = (await res.json()) as FixResponse;
      if (!res.ok) throw new Error((data as any).error || "Fix error");

      setSnippet(data.fixed_code);
      setTimeSaved(data.time_saved);
      setIssues([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert("Fix failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>BugZap</h1>

      <textarea
        placeholder="Paste your code here…"
        value={snippet}
        onChange={(e) => setSnippet(e.target.value)}
        rows={12}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 14,
          marginBottom: 10,
        }}
      />

      <button onClick={runAnalyze} disabled={loading}>
        {loading ? "Scanning…" : "Scan for Bugs"}
      </button>

      <pre style={{ background: "#f0f0f0", padding: 10, marginTop: 10 }}>
        {JSON.stringify({ sessionId, issues }, null, 2)}
      </pre>

      {issues.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2>Found {issues.length} issue(s):</h2>
          {issues.map((issue) => (
            <div
              key={issue.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <strong>Line {issue.line ?? "N/A"}:</strong> {issue.message}
              </div>
              <div>
                <em>Suggestion:</em> {issue.suggestion}
              </div>
              <button onClick={() => runFix(issue.id)} disabled={loading}>
                {loading ? "Fixing…" : "Fix This"}
              </button>
            </div>
          ))}
          <button onClick={() => runFix()} disabled={loading}>
            {loading ? "Fixing…" : "Fix All"}
          </button>
        </section>
      )}

      {timeSaved !== null && (
        <section style={{ marginTop: 20 }}>
          <div>
            🎉 You saved approximately{" "}
            <strong>{timeSaved.toFixed(1)} seconds</strong>!
          </div>

          <h2 style={{ marginTop: 20 }}>Fixed Code:</h2>
          <pre
            style={{
              background: "#f4f4f4",
              padding: 10,
              borderRadius: 4,
              overflowX: "auto",
              maxHeight: 300,
            }}
          >
            {snippet}
          </pre>
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(snippet)}`}
            download="fixed_code.py"
            style={{ display: "inline-block", marginTop: 8 }}
          >
            📥 Download Fixed Code
          </a>
        </section>
      )}

      {loading && (
        <div style={{ marginTop: 10, fontStyle: "italic" }}>Working…</div>
      )}
    </main>
  );
}


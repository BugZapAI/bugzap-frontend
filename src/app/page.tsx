/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';

// Minimal debugger UI for BugZap
export default function BugZapPage() {
  const [snippet, setSnippet]     = useState<string>('');
  const [issues, setIssues]       = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading]     = useState<boolean>(false);

  const runAnalyze = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('code', snippet);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setIssues(data.issues);
      setTimeSaved(null);
    } catch (e: any) {
      alert('Analyze failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const runFix = async (issueId?: number) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('code', snippet);
      form.append('session_id', sessionId);
      if (issueId != null) form.append('issue_id', String(issueId)); else form.append('all','true');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/fix`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      setSnippet(data.fixed_code);
      setTimeSaved(data.time_saved);
      setIssues([]);
    } catch (e: any) {
      alert('Fix failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white font-sans p-8">
      <h1 className="text-3xl font-bold mb-4">BugZap Debugger</h1>
      <textarea
        value={snippet}
        onChange={e => setSnippet(e.target.value)}
        rows={10}
        className="w-full bg-[#2E2E4D] text-gray-100 rounded-lg p-4 font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Paste your code here…"
      />
      <button
        onClick={runAnalyze}
        disabled={loading}
        className="bg-yellow-500 text-black px-6 py-2 rounded-2xl shadow hover:bg-yellow-600 transition mb-6"
      >
        {loading ? 'Scanning…' : 'Scan for Bugs'}
      </button>

      <pre className="bg-[#2E2E4D] p-4 rounded-lg text-sm mb-4 overflow-auto max-h-40">
        {JSON.stringify({ sessionId, issues }, null, 2)}
      </pre>

      {issues.length > 0 && (
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold">Found {issues.length} issue(s):</h2>
          {issues.map(issue => (
            <div key={issue.id} className="bg-[#2E2E4D] p-4 rounded-lg border border-gray-700">
              <div><strong>Line {issue.line ?? 'N/A'}:</strong> {issue.message}</div>
              <div className="italic text-gray-300">{issue.suggestion}</div>
              <button
                onClick={() => runFix(issue.id)}
                disabled={loading}
                className="mt-2 bg-yellow-500 text-black px-4 py-1 rounded-lg hover:bg-yellow-600 transition"
              >Fix This</button>
            </div>
          ))}
          <button
            onClick={() => runFix()}
            disabled={loading}
            className="bg-yellow-500 text-black px-6 py-2 rounded-2xl shadow hover:bg-yellow-600 transition"
          >Fix All</button>
        </div>
      )}

      {timeSaved !== null && (
        <div className="mt-6">
          <div>🎉 You saved approximately <strong>{timeSaved.toFixed(1)} seconds</strong>!</div>
          <h3 className="mt-4 text-xl font-semibold">Fixed Code:</h3>
          <pre className="bg-[#2E2E4D] p-4 rounded-lg text-sm overflow-auto max-h-64">
            {snippet}
          </pre>
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(snippet)}`}
            download="fixed_code.py"
            className="inline-block mt-2 bg-yellow-500 text-black px-4 py-1 rounded-lg hover:bg-yellow-600 transition"
          >📥 Download Fixed Code</a>
        </div>
      )}

      {loading && <div className="mt-4 italic text-gray-400">Working…</div>}
    </div>
  );
}



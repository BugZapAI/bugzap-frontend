/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';

// Tailwind-based, dark-themed, professional landing + scan UI
export default function BugZapPage() {
  const [snippet, setSnippet] = useState<string>('');
  const [issues, setIssues] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runAnalyze = async () => {
    setLoading(true);
    const form = new FormData();
    form.append('code', snippet);
    const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: form });
    const data = await res.json();
    setSessionId(data.session_id);
    setIssues(data.issues);
    setTimeSaved(null);
    setLoading(false);
  };

  const runFix = async (issueId?: number) => {
    setLoading(true);
    const form = new FormData();
    form.append('code', snippet);
    form.append('session_id', sessionId);
    if (issueId != null) form.append('issue_id', String(issueId)); else form.append('all','true');
    const res = await fetch('http://localhost:8000/fix', { method: 'POST', body: form });
    const data = await res.json();
    setSnippet(data.fixed_code);
    setTimeSaved(data.time_saved);
    setIssues([]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white font-sans">
      {/* --- Nav Bar --- */}
      <header className="container mx-auto py-6 flex justify-between items-center px-4 lg:px-0">
        <div className="flex items-center space-x-2 text-2xl font-bold text-yellow-400">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a1 1 0 011 1v3h3a1 1 0 011 1v3h3a1 1 0 011 1v3h-3v3a1 1 0 01-1 1h-3v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3H6a1 1 0 01-1-1v-3H2a1 1 0 01-1-1v-3h3V6a1 1 0 011-1h3V2a1 1 0 011-1h3z"/></svg>
          <span>BugZap</span>
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#features" className="hover:text-yellow-400">Features</a>
          <a href="#pricing" className="hover:text-yellow-400">Pricing</a>
          <a href="#docs" className="hover:text-yellow-400">Docs</a>
          <a href="#blog" className="hover:text-yellow-400">Blog</a>
        </nav>
        <div className="space-x-4">
          <button className="bg-yellow-500 text-black px-5 py-2 rounded-2xl shadow-lg hover:bg-yellow-600 transition">
            Try Free Now
          </button>
          <button className="border border-white px-5 py-2 rounded-2xl hover:bg-white hover:text-black transition">
            See Demo
          </button>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <main className="container mx-auto px-4 lg:px-0 mt-16 flex flex-col-reverse lg:flex-row items-center">
        <div className="lg:w-1/2">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Instantly Find and Fix Code Bugs with AI
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            BugZap automatically detects bugs in your game code, offers precise, actionable fixes instantly, and helps reduce debugging time significantly.
          </p>
          <div className="flex space-x-4">
            <button className="bg-yellow-500 text-black px-6 py-3 rounded-2xl shadow-lg hover:bg-yellow-600 transition">
              Try Free Now
            </button>
            <button className="border border-white px-6 py-3 rounded-2xl hover:bg-white hover:text-black transition">
              See Demo
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 mb-12 lg:mb-0">
          <div className="bg-[#2E2E4D] rounded-2xl shadow-2xl p-6">
            <pre className="bg-[#1A1A2E] p-4 rounded-lg text-sm overflow-auto">
{`function updatePlayerPosition(player, delta) {  
  // BugZap detected: Potential null reference  
  if (player.position !== undefined) {  
    player.position.x += player.velocity.x * delta;  
    player.position.y += player.velocity.y * delta;  
    player.position.z += player.velocity.z * delta;  
  }  
}`}
            </pre>
            <div className="mt-4 bg-yellow-700 text-black px-4 py-2 rounded-lg text-sm">
              BugZap: Potential null reference at line 3. Player velocity may be undefined.
            </div>
          </div>
        </div>
      </main>

      {/* --- Scanner Section --- */}
      <section className="container mx-auto px-4 lg:px-0 mt-20">
        <div className="bg-[#2E2E4D] rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">AI-Powered Bug Detection</h2>
          <textarea
            value={snippet}
            onChange={e => setSnippet(e.target.value)}
            rows={8}
            className="w-full bg-[#1A1A2E] text-gray-100 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Paste your code here…"
          />
          <div className="mt-4 flex space-x-4">
            <button
              onClick={runAnalyze}
              disabled={loading}
              className="bg-yellow-500 text-black px-6 py-2 rounded-2xl shadow hover:bg-yellow-600 transition"
            >
              {loading ? 'Scanning…' : 'Scan for Bugs'}
            </button>
          </div>

          {issues.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Found {issues.length} issue(s):</h3>
              <div className="space-y-4">
                {issues.map(issue => (
                  <div key={issue.id} className="bg-[#1A1A2E] p-4 rounded-lg border border-gray-700">
                    <div><strong>Line {issue.line}</strong>: {issue.message}</div>
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
                  className="mt-2 bg-yellow-500 text-black px-6 py-2 rounded-2xl shadow hover:bg-yellow-600 transition"
                >Fix All</button>
              </div>
            </div>
          )}

          {timeSaved !== null && (
            <div className="mt-6 text-yellow-300">
              🎉 You saved approximately <strong>{timeSaved.toFixed(1)} seconds</strong>!
            </div>
          )}

          {timeSaved !== null && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Fixed Code:</h3>
              <pre className="bg-[#1A1A2E] p-4 rounded-lg text-sm overflow-auto max-h-64">
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
      </section>
    </div>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';

export default function BugZapPage() {
  const [snippet, setSnippet]     = useState<string>('');
  const [issues, setIssues]       = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [loading, setLoading]     = useState<boolean>(false);

  // New FBX upload state
  const [fbxFile, setFbxFile]     = useState<File | null>(null);
  const [fbxIssues, setFbxIssues] = useState<any[]>([]);
  const [fbxLoading, setFbxLoading] = useState<boolean>(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const runAnalyze = async () => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('code', snippet);
      const res = await fetch(`${API}/analyze`, { method: 'POST', body: form });
      const data = await res.json();
      setSessionId(data.session_id);
      setIssues(data.issues);
      setTimeSaved(null);
    } catch (e: any) {
      alert(e.message);
    } finally { setLoading(false); }
  };

  const runFix = async (issueId?: number) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('code', snippet);
      form.append('session_id', sessionId);
      if (issueId != null) form.append('issue_id', String(issueId)); else form.append('all','true');
      const res = await fetch(`${API}/fix`, { method: 'POST', body: form });
      const data = await res.json();
      setSnippet(data.fixed_code);
      setTimeSaved(data.time_saved);
      setIssues([]);
    } catch (e: any) {
      alert(e.message);
    } finally { setLoading(false); }
  };

  // New: analyze FBX
  const analyzeFbx = async () => {
    if (!fbxFile) return;
    setFbxLoading(true);
    try {
      const form = new FormData();
      form.append('file', fbxFile);
      const res = await fetch(`${API}/analyze-fbx`, { method: 'POST', body: form });
      const data = await res.json();
      setFbxIssues(data.issues);
    } catch (e: any) {
      alert(e.message);
    } finally { setFbxLoading(false); }
  };

  // New: fix FBX
  const fixFbx = async (all = false) => {
    if (!fbxFile) return;
    setFbxLoading(true);
    try {
      const form = new FormData();
      form.append('file', fbxFile);
      form.append('all', all ? 'true' : 'false');
      const res = await fetch(`${API}/fix-fbx`, { method: 'POST', body: form });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixed_${fbxFile.name}`;
      a.click();
    } catch (e: any) {
      alert(e.message);
    } finally { setFbxLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white font-sans p-8">
      {/* Code Debugger */}
      <h1 className="text-3xl font-bold mb-4">BugZap Debugger</h1>
      <textarea
        value={snippet}
        onChange={e => setSnippet(e.target.value)}
        rows={10}
        className="w-full bg-[#2E2E4D] p-4 mb-4 rounded-lg font-mono text-sm"
        placeholder="Paste your code here…"
      />
      <button onClick={runAnalyze} disabled={loading} className="bg-yellow-500 px-6 py-2 rounded-2xl mb-6">
        {loading ? 'Scanning…' : 'Scan for Bugs'}
      </button>
      <pre className="bg-[#2E2E4D] p-4 rounded-lg mb-6 max-h-40 overflow-auto">
        {JSON.stringify({ sessionId, issues }, null, 2)}
      </pre>
      {/* Preserve all existing code debugger fixes here... */}

      {/* New: FBX Debugger */}
      <hr className="border-gray-700 my-8" />
      <h2 className="text-2xl font-semibold mb-4">FBX Asset Checker</h2>
      <input
        type="file"
        accept=".fbx"
        onChange={e => setFbxFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <div className="flex space-x-4 mb-4">
        <button onClick={analyzeFbx} disabled={fbxLoading || !fbxFile} className="bg-blue-500 px-4 py-2 rounded-lg">
          {fbxLoading ? 'Analyzing…' : 'Analyze FBX'}
        </button>
        <button onClick={() => fixFbx(true)} disabled={fbxLoading || !fbxFile} className="bg-green-500 px-4 py-2 rounded-lg">
          {fbxLoading ? 'Fixing…' : 'Fix All Issues'}
        </button>
      </div>
      <pre className="bg-[#2E2E4D] p-4 rounded-lg max-h-40 overflow-auto">
        {JSON.stringify(fbxIssues, null, 2)}
      </pre>
    </div>
  );
}




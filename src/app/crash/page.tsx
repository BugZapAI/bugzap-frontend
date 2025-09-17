'use client';

import React, { useState } from "react";
import { analyzeCrash, sendFeedback } from "../../lib/api";

export default function CrashPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onAnalyze() {
    try {
      setErr(""); setData(null);
      if (!file) { setErr("Please choose a .log/.txt or crash .zip"); return; }
      setLoading(true);
      const res = await analyzeCrash(file);
      setData(res);
    } catch (e: any) {
      setErr(e.message || "Analyze failed");
    } finally {
      setLoading(false);
    }
  }

  async function onFeedback() {
    const message = window.prompt("Your feedback? (features, accuracy, bugs)") || "";
    if (!message.trim()) return;
    const email = window.prompt("Your email (optional)") || "";
    try {
      await sendFeedback(message, email);
      alert("Thanks! Sent ✅");
    } catch (e: any) {
      alert("Feedback failed: " + (e.message || "Unknown error"));
    }
  }

  const top = data?.summary?.top_issues || [];

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", color:"#eee" }}>
      <h1>BugZap Crash Analyzer (Beta)</h1>
      <p>Upload Unity/Unreal crash logs or a zipped crash folder.</p>

      <input
        type="file"
        accept=".log,.txt,.zip,.crash,.dmp"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={onAnalyze} disabled={loading} style={{ marginLeft: 8 }}>
        {loading ? "Analyzing…" : "Upload & Analyze"}
      </button>
      {err && <p style={{ color: "#ff6b6b" }}>{err}</p>}

      {data && (
        <>
          <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12, marginTop: 16 }}>
            <h3 style={{marginTop:0}}>Summary</h3>
            <p style={{margin:"6px 0"}}>
              Engine: <b>{data.summary.engine_detected || "unknown"}</b><br/>
              Artifacts processed: {data.summary.artifacts_processed}<br/>
              Total issues: {data.summary.issues_total}
            </p>
            <button onClick={()=>{
              const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href=url; a.download="bugzap-report.json"; a.click();
              URL.revokeObjectURL(url);
            }}>Download JSON</button>
          </div>

          <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12, marginTop: 16 }}>
            <h3 style={{marginTop:0}}>Top Issues</h3>
            {top.length === 0 ? <p>No issues detected.</p> : (
              <ul style={{paddingLeft:18}}>
                {top.map((i:any,idx:number)=>(
                  <li key={idx} style={{ marginBottom: 10 }}>
                    <div><b>{i.type}</b> — severity {i.severity} ({i.engine})</div>
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{i.snippet}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={onFeedback}>Send Feedback</button>
          </div>
        </>
      )}
    </div>
  );
}

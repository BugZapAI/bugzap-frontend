"use client";

import { useState } from "react";

type Issue = {
  id: number;
  message: string;
  suggestion: string;
  severity?: string;
  line?: number;
};

// === Add these interfaces ===
interface AnalyzeResponse {
  session_id: string;
  issues: Issue[];
}

interface FixResponse {
  fixed_code: string;
  time_saved: number;
}

export default function BugZapPage() {
  const [snippet, setSnippet]       = useState<string>("")
  // <- change this line:
- const [issues, setIssues]       = useState<any[]>([])
+ const [issues, setIssues]       = useState<Issue[]>([])
  const [sessionId, setSessionId]   = useState<string>("")
  const [timeSaved, setTimeSaved]   = useState<number | null>(null)
  const [loading, setLoading]       = useState<boolean>(false)

  const runAnalyze = async () => {
    setLoading(true)
    try {
      const form = new FormData()
      form.append("code", snippet)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
        method: "POST",
        body: form,
      })

      // tell TS what shape to expect
      const data: AnalyzeResponse = await res.json()
      if (!res.ok) throw new Error((data as any).error || "Analyze error")

      setSessionId(data.session_id)
      setIssues(data.issues)
      setTimeSaved(null)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      alert("Analyze failed: " + msg)
    } finally {
      setLoading(false)
    }
  }

  const runFix = async (issueId?: number) => {
    setLoading(true)
    try {
      const form = new FormData()
      form.append("code", snippet)
      form.append("session_id", sessionId)
      if (issueId !== undefined) form.append("issue_id", issueId.toString())
      else form.append("all", "true")

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fix`, {
        method: "POST",
        body: form,
      })

      // and here as well
      const data: FixResponse = await res.json()
      if (!res.ok) throw new Error((data as any).error || "Fix error")

      setSnippet(data.fixed_code)
      setTimeSaved(data.time_saved)
      setIssues([])
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      alert("Fix failed: " + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>…</main>
  )
}




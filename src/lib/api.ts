const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const CRASH_PATH = process.env.NEXT_PUBLIC_CRASH_PATH || "/api/scan";

export async function analyzeCrash(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}${CRASH_PATH}`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text);
}

export async function sendFeedback(message: string, email?: string) {
  const form = new FormData();
  form.append("message", message);
  form.append("user_email", email || "");
  const res = await fetch(`${API_BASE}/api/feedback`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

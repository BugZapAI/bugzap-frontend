import CrashAnalyze from "@/components/CrashAnalyze";

export default function AnalyzePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Analyze a Crash</h1>
        <p className="mt-2 opacity-80">Turn Unity/Unreal crash logs into actionable fixes.</p>
      </div>
      <CrashAnalyze />
    </main>
  );
}

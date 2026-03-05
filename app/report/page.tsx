export default function ReportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-4 p-8">
      <h1 className="text-3xl font-bold">Client Report View</h1>
      <p>Presentation-optimized snapshot of key metrics, charts, and deterministic insights.</p>
      <a className="inline-block rounded border px-4 py-2" href="/api/report">Export Analysis Summary (CSV)</a>
    </main>
  );
}

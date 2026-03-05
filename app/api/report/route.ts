import { NextResponse } from "next/server";

export async function GET() {
  const csv = "metric,value\nmeta_roas,0\ntrue_roas,0\nattribution_gap,0\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=analysis-summary.csv"
    }
  });
}

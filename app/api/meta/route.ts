import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token, accountId, since, until } = await req.json();
  if (!token || !accountId) {
    return NextResponse.json({ error: "Missing token or accountId" }, { status: 400 });
  }

  // Placeholder server proxy for Meta API integration.
  return NextResponse.json({
    ok: true,
    message: "Meta API proxy ready",
    request: { accountId, since, until }
  });
}

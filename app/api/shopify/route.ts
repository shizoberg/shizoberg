import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { store, token, from, to } = await req.json();
  if (!store || !token) {
    return NextResponse.json({ error: "Missing store or token" }, { status: 400 });
  }

  // Placeholder server proxy for Shopify Admin API integration.
  return NextResponse.json({
    ok: true,
    message: "Shopify API proxy ready",
    request: { store, from, to }
  });
}

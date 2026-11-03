import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { BLOB_PREFIX } from "@/lib/documents";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const pathname = request.nextUrl.searchParams.get("pathname");

    if (!pathname || !pathname.startsWith(BLOB_PREFIX) || pathname.includes("..")) {
      return NextResponse.json({ error: "Neplatný dokument." }, { status: 400 });
    }

    const result = await get(pathname, { access: "private" });
    if (result?.statusCode !== 200) {
      return new NextResponse("Dokument nebyl nalezen.", { status: 404 });
    }

    const filename = pathname.split("/").pop()?.replace(/^\d+-/, "dokument-") ?? "dokument";
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "K dokumentu nemáš přístup." }, { status: 401 });
  }
}

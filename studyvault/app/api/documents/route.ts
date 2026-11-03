import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getDocuments, BLOB_PREFIX } from "@/lib/documents";
import { requireAdmin, requireSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function encodePathPart(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ documents: await getDocuments() });
  } catch {
    return NextResponse.json({ error: "Nepodařilo se načíst knihovnu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "Ostatní").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Vyber soubor." }, { status: 400 });
    }
    if (!title || title.length > 100 || category.length > 50) {
      return NextResponse.json({ error: "Zkontroluj název a kategorii." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Povolené jsou PDF, JPG, PNG a WebP." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Soubor musí mít maximálně 25 MB." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const pathname = `${BLOB_PREFIX}${encodePathPart(category)}/${Date.now()}-${encodePathPart(title)}.${extension}`;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type
    });

    return NextResponse.json({ success: true, pathname: blob.pathname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Nahrávání se nezdařilo." : "Nemáš oprávnění." }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const pathname = String(body.pathname ?? "");

    if (!pathname.startsWith(BLOB_PREFIX) || pathname.includes("..")) {
      return NextResponse.json({ error: "Neplatný dokument." }, { status: 400 });
    }

    await del(pathname, { access: "private" });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Dokument se nepodařilo odstranit." : "Nemáš oprávnění." }, { status });
  }
}

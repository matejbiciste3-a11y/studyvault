import { NextRequest, NextResponse } from "next/server";
import { setSession, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!password || password.length > 512) {
    return NextResponse.redirect(new URL("/?error=login", request.url), 303);
  }

  try {
    const role = verifyPassword(password);
    if (!role) {
      return NextResponse.redirect(new URL("/?error=login", request.url), 303);
    }
    await setSession(role);
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/?error=config", request.url), 303);
  }
}

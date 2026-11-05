import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { themePresets } from "@/db/schema";

export async function GET() {
  try {
    const presets = await db
      .select()
      .from(themePresets)
      .orderBy(desc(themePresets.createdAt))
      .limit(10);

    return NextResponse.json({
      ok: true,
      presets,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      presets: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [saved] = await db
      .insert(themePresets)
      .values({
        name: body?.name || "Custom Studio Theme",
        mode: "custom",
        bgPrimary: body?.bgPrimary || "#0B0F17",
        bgSurface: body?.bgSurface || "#131B2E",
        accentPrimary: body?.accentPrimary || "#6366F1",
        accentSecondary: body?.accentSecondary || "#06B6D4",
        textPrimary: body?.textPrimary || "#F8FAFC",
        radiusPx: Number(body?.radiusPx) || 10,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      preset: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save custom theme",
      },
      { status: 500 }
    );
  }
}

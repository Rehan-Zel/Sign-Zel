import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectFiles, buildRuns } from "@/db/schema";

export async function GET() {
  try {
    const recentProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(12);

    const recentRuns = await db
      .select()
      .from(buildRuns)
      .orderBy(desc(buildRuns.createdAt))
      .limit(12);

    return NextResponse.json({
      ok: true,
      projects: recentProjects,
      buildRuns: recentRuns,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      projects: [],
      buildRuns: [],
      error: error instanceof Error ? error.message : "Database query failed",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = Number(body?.projectId);
    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Invalid projectId" },
        { status: 400 }
      );
    }

    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));

    return NextResponse.json({
      ok: true,
      files,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load files",
      },
      { status: 500 }
    );
  }
}

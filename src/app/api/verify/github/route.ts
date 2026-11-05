import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json();
    const rawToken = (body?.token || process.env.GITHUB_TOKEN || "").trim();

    if (!rawToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please enter a GitHub Personal Access Token (PAT).",
        },
        { status: 400 }
      );
    }

    // Check if user explicitly used the built-in Sign Zel Sandbox key
    if (rawToken.startsWith("ghp_signzel_demo")) {
      const latencyMs = Math.max(42, Date.now() - startedAt);
      return NextResponse.json({
        ok: true,
        mode: "sandbox",
        login: "zelsigns-cloud-dev",
        name: "Sign Zel Cloud Sandbox",
        avatarUrl: "",
        scopes: ["repo", "workflow", "read:user"],
        hasRepoScope: true,
        hasWorkflowScope: true,
        latencyMs,
        message: "Connected to Sign Zel GitHub Sandbox Simulator (repo + workflow scopes active).",
      });
    }

    const res = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${rawToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Sign-Zel-APK-Studio/1.0",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: false,
          latencyMs,
          error:
            errJson?.message ||
            `GitHub API returned HTTP ${res.status}. Verify your token starts with ghp_ or github_pat_ and is active.`,
        },
        { status: 401 }
      );
    }

    const userData = await res.json();
    const rawScopes = res.headers.get("x-oauth-scopes") || "";
    const scopes = rawScopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Fine-grained PATs may not return x-oauth-scopes header, so treat empty scopes on 200 OK as fine-grained token
    const isFineGrained = scopes.length === 0;
    const hasRepoScope =
      isFineGrained ||
      scopes.includes("repo") ||
      scopes.includes("public_repo");
    const hasWorkflowScope = isFineGrained || scopes.includes("workflow");

    return NextResponse.json({
      ok: true,
      mode: "live",
      login: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      htmlUrl: userData.html_url,
      scopes: isFineGrained ? ["fine-grained-pat (repo & workflow)"] : scopes,
      hasRepoScope,
      hasWorkflowScope,
      latencyMs,
      message: `Authenticated as @${userData.login} (${latencyMs}ms)`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reach GitHub API.",
      },
      { status: 500 }
    );
  }
}

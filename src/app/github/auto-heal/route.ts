import { NextResponse } from "next/server";

const GH_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
  "User-Agent": "Sign-Zel-AutoHeal/1.0",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, owner, repo, runId, aiKey } = body;

    if (!token || !owner || !repo || !runId || !aiKey) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check the status of the GitHub Action run
    const runRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
      headers: GH_HEADERS(token),
    });
    const runData = await runRes.json();

    if (runData.status === "in_progress" || runData.status === "queued") {
      return NextResponse.json({ ok: true, status: "building", message: "Build is running..." });
    }

    if (runData.status === "completed" && runData.conclusion === "success") {
      return NextResponse.json({ ok: true, status: "success", message: "Build successful!" });
    }

    if (runData.status === "completed" && runData.conclusion === "failure") {
      // 2. Fetch the failed logs
      const jobsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, {
        headers: GH_HEADERS(token),
      });
      const jobsData = await jobsRes.json();
      const failedJob = jobsData.jobs.find((j: any) => j.conclusion === "failure");

      if (!failedJob) {
        return NextResponse.json({ ok: false, status: "error", message: "Build failed but no logs found." });
      }

      const logsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/jobs/${failedJob.id}/logs`, {
        headers: GH_HEADERS(token),
      });
      const logsText = await logsRes.text();

      // 3. Send logs to OpenRouter to get the fix
      const aiPrompt = `You are an expert Android developer. The GitHub Action for an Android app failed.
      Here are the error logs:
      ${logsText.substring(Math.max(0, logsText.length - 4000))}
      
      Respond ONLY with a valid JSON object containing the exact file path to fix and the complete new content for that file. Format:
      {"filePath": "app/src/main/...", "newContent": "..."}`;

      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://sign-zel.vercel.app", // Optional, for OpenRouter rankings
          "X-Title": "Sign Zel APK Builder",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-coder-32b-instruct", // Excellent free coding model on OpenRouter
          messages: [{ role: "user", content: aiPrompt }],
          response_format: { type: "json_object" }
        }),
      });
      
      const aiData = await aiRes.json();
      const aiText = aiData.choices?.[0]?.message?.content || "";
      
      // Extract JSON from AI response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ ok: false, status: "error", message: "AI failed to provide a valid fix." });
      }
      
      const fix = JSON.parse(jsonMatch[0]);

      // 4. Push the fixed file back to GitHub
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
        headers: GH_HEADERS(token),
      });
      const refData = await refRes.json();
      const baseCommitSha = refData.object.sha;

      const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fix.filePath}`, {
        headers: GH_HEADERS(token),
      });
      const fileData = await fileRes.json();

      const base64Content = Buffer.from(fix.newContent).toString("base64");
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fix.filePath}`, {
        method: "PUT",
        headers: GH_HEADERS(token),
        body: JSON.stringify({
          message: `🤖 Auto-Heal: Fix build error in ${fix.filePath}`,
          content: base64Content,
          sha: fileData.sha,
          branch: "main",
        }),
      });

      if (!commitRes.ok) {
        return NextResponse.json({ ok: false, status: "error", message: "Failed to push AI fix to GitHub." });
      }

      // 5. Trigger the build again
      await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/build-apk.yml/dispatches`, {
        method: "POST",
        headers: GH_HEADERS(token),
        body: JSON.stringify({ ref: "main" }),
      });

      return NextResponse.json({ ok: true, status: "healing", message: "AI applied a fix and restarted the build!" });
    }

    return NextResponse.json({ ok: true, status: "unknown", message: "Checking status..." });
  } catch (error) {
    return NextResponse.json({ ok: false, status: "error", message: "Auto-heal failed" }, { status: 500 });
  }
        }

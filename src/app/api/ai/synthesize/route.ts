import { NextResponse } from "next/server";
import {
  synthesizeSignZelProject,
  UploadedAppFile,
} from "@/lib/android-scaffold";

interface AiSuggestionPayload {
  appName?: string;
  splashHeadline?: string;
  splashSubheadline?: string;
  accentColor?: string;
  auditNotes?: string;
}

async function queryAiForMetadataAndAudit(
  provider: string,
  apiKey: string,
  files: UploadedAppFile[]
): Promise<AiSuggestionPayload> {
  if (!apiKey || apiKey.startsWith("zel_ai_demo")) {
    return {};
  }

  const fileOverview = files
    .slice(0, 8)
    .map(
      (f) =>
        `File: ${f.path} (${f.size} bytes)\nSnippet:\n${f.content.slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are Sign Zel AI, an expert Android APK & Gradle Kotlin DSL architect.
Analyze the user's uploaded application files and return ONLY valid JSON with these keys:
{
  "appName": "A catchy 2-3 word mobile app name based on the uploaded files",
  "splashHeadline": "Bold starting screen title (max 28 chars)",
  "splashSubheadline": "Engaging starting screen subtitle (max 60 chars)",
  "accentColor": "#6366F1 or another vibrant hex color matching the app's vibe",
  "auditNotes": "A concise 2-sentence technical audit explaining what files were uploaded and which missing Android Gradle/Manifest/MainActivity/GitHub Workflow files you synthesized to allow APK compilation."
}`;

  try {
    let effectiveProvider = provider.toLowerCase();
    if (apiKey.startsWith("AIza")) effectiveProvider = "gemini";
    else if (apiKey.startsWith("sk-or-")) effectiveProvider = "openrouter";
    else if (apiKey.startsWith("sk-ant-")) effectiveProvider = "anthropic";
    else if (apiKey.startsWith("sk-")) effectiveProvider = "openai";

    if (effectiveProvider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nUploaded Files:\n${
                      fileOverview || "No files uploaded yet; create a flagship Sign Zel Android app."
                    }`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return JSON.parse(text);
      }
    } else if (effectiveProvider === "openai" || effectiveProvider === "openrouter") {
      const endpoint =
        effectiveProvider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:
            effectiveProvider === "openrouter"
              ? "openai/gpt-4o-mini"
              : "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Uploaded files:\n${fileOverview || "Empty starter project"}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || "{}";
        return JSON.parse(text);
      }
    } else if (effectiveProvider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\nUploaded files:\n${fileOverview}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.content?.[0]?.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    }
  } catch {
    // Fallback to deterministic synthesis if external LLM call times out
  }

  return {};
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = body?.provider || "gemini";
    const apiKey = body?.apiKey || "";
    const uploadedFiles: UploadedAppFile[] = Array.isArray(body?.uploadedFiles)
      ? body.uploadedFiles
      : [];

    const aiSuggestions = await queryAiForMetadataAndAudit(
      provider,
      apiKey,
      uploadedFiles
    );

    const synthesis = synthesizeSignZelProject({
      uploadedFiles,
      optionalAppName: body?.optionalAppName,
      optionalLogoDataUrl: body?.optionalLogoDataUrl,
      optionalSplashHeadline: body?.optionalSplashHeadline,
      optionalSplashSubheadline: body?.optionalSplashSubheadline,
      optionalSplashBg: body?.optionalSplashBg,
      optionalSplashAccent: body?.optionalSplashAccent,
      aiSuggestions,
    });

    return NextResponse.json({
      ok: true,
      synthesis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to synthesize Android project structure.",
      },
      { status: 500 }
    );
  }
}

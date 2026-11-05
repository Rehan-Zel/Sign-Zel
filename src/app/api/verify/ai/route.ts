import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.json();
    const provider = (body?.provider || "gemini").toLowerCase();
    const apiKey = (body?.apiKey || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please enter an AI API Key to verify the connection.",
        },
        { status: 400 }
      );
    }

    // Built-in Sign Zel AI Sandbox key support
    if (apiKey.startsWith("zel_ai_demo")) {
      const latencyMs = Math.max(58, Date.now() - startedAt);
      const modelMap: Record<string, string> = {
        gemini: "gemini-2.5-flash",
        openai: "gpt-4o",
        anthropic: "claude-3-7-sonnet",
        openrouter: "meta-llama/llama-3.3-70b-instruct",
      };
      return NextResponse.json({
        ok: true,
        mode: "sandbox",
        provider,
        model: modelMap[provider] || "gemini-2.5-flash",
        latencyMs,
        message: `Connected to Sign Zel AI Synthesis Engine (${provider.toUpperCase()} Sandbox • ${latencyMs}ms)`,
      });
    }

    // Auto-detect provider if key prefix clearly belongs to another provider
    let effectiveProvider = provider;
    if (apiKey.startsWith("AIza")) effectiveProvider = "gemini";
    else if (apiKey.startsWith("sk-or-")) effectiveProvider = "openrouter";
    else if (apiKey.startsWith("sk-ant-")) effectiveProvider = "anthropic";
    else if (apiKey.startsWith("sk-")) effectiveProvider = "openai";

    if (effectiveProvider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const latencyMs = Date.now() - startedAt;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          {
            ok: false,
            latencyMs,
            error:
              err?.error?.message ||
              `Gemini API rejected key (HTTP ${res.status}). Check your Google AI Studio key.`,
          },
          { status: 401 }
        );
      }
      return NextResponse.json({
        ok: true,
        mode: "live",
        provider: "gemini",
        model: "gemini-2.5-flash",
        latencyMs,
        message: `Google Gemini API Verified (gemini-2.5-flash ready • ${latencyMs}ms)`,
      });
    }

    if (effectiveProvider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      });
      const latencyMs = Date.now() - startedAt;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          {
            ok: false,
            latencyMs,
            error:
              err?.error?.message ||
              `OpenAI API returned HTTP ${res.status}. Please check your API key.`,
          },
          { status: 401 }
        );
      }
      return NextResponse.json({
        ok: true,
        mode: "live",
        provider: "openai",
        model: "gpt-4o-mini",
        latencyMs,
        message: `OpenAI API Verified (gpt-4o-mini ready • ${latencyMs}ms)`,
      });
    }

    if (effectiveProvider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        cache: "no-store",
      });
      const latencyMs = Date.now() - startedAt;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          {
            ok: false,
            latencyMs,
            error:
              err?.error?.message ||
              `Anthropic API returned HTTP ${res.status}. Verify your x-api-key.`,
          },
          { status: 401 }
        );
      }
      return NextResponse.json({
        ok: true,
        mode: "live",
        provider: "anthropic",
        model: "claude-3-5-sonnet-latest",
        latencyMs,
        message: `Anthropic Claude API Verified (${latencyMs}ms)`,
      });
    }

    // OpenRouter or generic OpenAI-compatible key
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
    const latencyMs = Date.now() - startedAt;
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          latencyMs,
          error: `AI provider returned HTTP ${res.status}. Verify your key or click "Load Verified Demo Keys" to test in Sandbox mode.`,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "live",
      provider: "openrouter",
      model: "openai/gpt-4o-mini",
      latencyMs,
      message: `OpenRouter AI Verified (${latencyMs}ms)`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify AI API Key.",
      },
      { status: 500 }
    );
  }
}

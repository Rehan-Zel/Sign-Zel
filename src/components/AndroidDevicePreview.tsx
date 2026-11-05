"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Play,
  Sparkles,
  Grid,
  Layers,
  Wifi,
  BatteryCharging,
} from "lucide-react";
import { BrandingConfig, UploadedAppFile } from "@/lib/android-scaffold";
import { ZelLogo } from "./ZelLogo";

interface AndroidDevicePreviewProps {
  branding: BrandingConfig;
  uploadedFiles: UploadedAppFile[];
  activeStage: number;
}

export function AndroidDevicePreview({
  branding,
  uploadedFiles,
  activeStage,
}: AndroidDevicePreviewProps) {
  const [viewMode, setViewMode] = useState<"splash" | "app" | "launcher">(
    "splash"
  );
  const [simulatingTransition, setSimulatingTransition] = useState(false);

  const htmlFile = uploadedFiles.find(
    (f) =>
      f.path.toLowerCase().endsWith("index.html") ||
      f.path.toLowerCase().endsWith(".html")
  );

  const triggerBootSequence = () => {
    setSimulatingTransition(true);
    setViewMode("splash");
    setTimeout(() => {
      setViewMode("app");
      setSimulatingTransition(false);
    }, 1700);
  };

  return (
    <div className="zel-card p-5 flex flex-col items-center">
      {/* Top Bar of Simulator Panel */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span className="font-display text-sm font-bold zel-text-primary">
            Android 14 Device Preview
          </span>
        </div>
        <button
          onClick={triggerBootSequence}
          disabled={simulatingTransition}
          className="px-2.5 py-1 rounded-md text-xs font-semibold zel-accent-bg text-white flex items-center gap-1 shadow hover:opacity-90 transition"
        >
          <Play className="w-3 h-3 fill-current" />
          {simulatingTransition ? "Booting..." : "Test Boot"}
        </button>
      </div>

      {/* Mode Switch Tabs */}
      <div className="w-full grid grid-cols-3 gap-1.5 p-1 rounded-lg zel-bg-elevated border zel-border mb-4">
        <button
          onClick={() => setViewMode("splash")}
          className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition ${
            viewMode === "splash"
              ? "zel-accent-bg text-white shadow"
              : "zel-text-secondary hover:zel-text-primary"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Splash
        </button>
        <button
          onClick={() => setViewMode("app")}
          className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition ${
            viewMode === "app"
              ? "zel-accent-bg text-white shadow"
              : "zel-text-secondary hover:zel-text-primary"
          }`}
        >
          <Layers className="w-3 h-3" />
          MainActivity
        </button>
        <button
          onClick={() => setViewMode("launcher")}
          className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition ${
            viewMode === "launcher"
              ? "zel-accent-bg text-white shadow"
              : "zel-text-secondary hover:zel-text-primary"
          }`}
        >
          <Grid className="w-3 h-3" />
          Launcher Icon
        </button>
      </div>

      {/* Phone Bezel */}
      <div
        className="relative w-[276px] h-[510px] rounded-[34px] p-2.5 shadow-2xl border-4 border-slate-800 bg-slate-950 flex flex-col overflow-hidden"
        style={{
          boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.65)",
        }}
      >
        {/* Android Status Bar + Camera Punch-hole */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-1 pb-2 text-[10px] text-slate-300 font-mono-code">
          <span>09:41</span>
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Phone Screen Viewport */}
        <div
          className="relative flex-1 rounded-[24px] overflow-hidden flex flex-col"
          style={{
            backgroundColor: branding.splash.backgroundColor || "#0B0F17",
          }}
        >
          {viewMode === "splash" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 35%, ${
                    branding.splash.accentColor || "#6366F1"
                  }, transparent 70%)`,
                }}
              />

              {/* App Icon on Splash */}
              <div className="relative mb-5">
                {branding.logoDataUrl ? (
                  <img
                    src={branding.logoDataUrl}
                    alt={branding.appName}
                    className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-white/15"
                  />
                ) : (
                  <ZelLogo size={76} />
                )}
                {branding.logoGeneratedByAi && (
                  <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white shadow">
                    AI Icon
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                {branding.splash.headline || branding.appName}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[210px]">
                {branding.splash.subheadline}
              </p>

              {/* Loading Indicator */}
              <div className="mt-8 w-36 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{
                    width: "72%",
                    backgroundColor: branding.splash.accentColor || "#6366F1",
                  }}
                />
              </div>
              <span className="mt-2.5 font-mono-code text-[10px] text-slate-400">
                com.zelsigns.app • SDK 34
              </span>
            </div>
          )}

          {viewMode === "app" && (
            <div className="flex-1 flex flex-col bg-slate-950">
              {htmlFile ? (
                <iframe
                  title="Android WebView Asset Preview"
                  srcDoc={htmlFile.content}
                  className="w-full flex-1 border-0 bg-slate-950"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-5 text-center text-white">
                  <ZelLogo size={54} />
                  <h4 className="font-display font-bold text-base mt-3">
                    {branding.appName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    MainActivity.kt Native Container Active. Drop an HTML, ZIP,
                    or app folder to preview live assets here.
                  </p>
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono-code text-indigo-300 w-full text-left">
                    <div>package com.zelsigns.app</div>
                    <div className="text-emerald-400 mt-1">
                      ✓ WebView JS Bridge Ready
                    </div>
                    <div className="text-cyan-400">
                      ✓ Stage {activeStage}/4 Active
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === "launcher" && (
            <div
              className="flex-1 p-5 flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(165deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)",
              }}
            >
              <div className="grid grid-cols-3 gap-4 pt-4">
                {/* Synthesized App Launcher Icon */}
                <button
                  onClick={triggerBootSequence}
                  className="flex flex-col items-center group"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-indigo-400/40 flex items-center justify-center bg-slate-950 group-hover:scale-105 transition">
                    {branding.logoDataUrl ? (
                      <img
                        src={branding.logoDataUrl}
                        alt={branding.appName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ZelLogo size={52} />
                    )}
                  </div>
                  <span className="text-[10px] text-white font-medium mt-1.5 truncate w-16 text-center">
                    {branding.appName}
                  </span>
                </button>

                {/* Placeholder Android OS Icons */}
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Play
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5">
                    Store
                  </span>
                </div>

                <div className="flex flex-col items-center opacity-40">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Files
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5">
                    Sign Zel/
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 backdrop-blur border border-white/10 text-left">
                <div className="text-[10px] font-semibold text-indigo-300">
                  @drawable/ic_launcher.xml
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {branding.logoGeneratedByAi
                    ? "Auto-synthesized Android VectorDrawable by AI."
                    : "Custom uploaded app launcher icon active."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Android Gesture Navigation Pill */}
        <div className="pt-2 pb-0.5 flex justify-center">
          <div className="w-24 h-1 rounded-full bg-slate-600" />
        </div>
      </div>

      {/* Metadata Badges below Phone */}
      <div className="w-full mt-4 pt-3 border-t zel-border grid grid-cols-3 gap-2 text-center">
        <div className="p-1.5 rounded-lg zel-bg-elevated">
          <div className="text-[10px] zel-text-secondary">App Name</div>
          <div className="text-xs font-semibold zel-text-primary truncate">
            {branding.appNameGeneratedByAi ? "✨ AI Auto" : "Custom"}
          </div>
        </div>
        <div className="p-1.5 rounded-lg zel-bg-elevated">
          <div className="text-[10px] zel-text-secondary">Launcher Icon</div>
          <div className="text-xs font-semibold zel-text-primary truncate">
            {branding.logoGeneratedByAi ? "✨ AI Vector" : "Uploaded"}
          </div>
        </div>
        <div className="p-1.5 rounded-lg zel-bg-elevated">
          <div className="text-[10px] zel-text-secondary">Splash Screen</div>
          <div className="text-xs font-semibold zel-text-primary truncate">
            {branding.splash.generatedByAi ? "✨ AI Auto" : "Custom"}
          </div>
        </div>
      </div>
    </div>
  );
}

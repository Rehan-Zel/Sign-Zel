"use client";

import React, { useState } from "react";
import { Palette, X, Check, Sparkles, RotateCcw, Save } from "lucide-react";

export type ThemeMode = "dark" | "light" | "custom";

export interface CustomThemeTokens {
  name: string;
  bgPrimary: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  accentPrimary: string;
  accentSecondary: string;
  borderSubtle: string;
  radiusPx: number;
}

export const DEFAULT_CUSTOM_THEME: CustomThemeTokens = {
  name: "Cyber Violet Studio",
  bgPrimary: "#0D0918",
  bgSurface: "#17112B",
  bgElevated: "#231A42",
  textPrimary: "#FAF5FF",
  textSecondary: "#C4B5FD",
  accentPrimary: "#A855F7",
  accentSecondary: "#EC4899",
  borderSubtle: "#3B2866",
  radiusPx: 14,
};

export const CURATED_CUSTOM_THEMES: CustomThemeTokens[] = [
  DEFAULT_CUSTOM_THEME,
  {
    name: "Emerald Matrix Terminal",
    bgPrimary: "#06120E",
    bgSurface: "#0B1F18",
    bgElevated: "#113026",
    textPrimary: "#ECFDF5",
    textSecondary: "#6EE7B7",
    accentPrimary: "#10B981",
    accentSecondary: "#06B6D4",
    borderSubtle: "#1B4332",
    radiusPx: 8,
  },
  {
    name: "Solar Flare Gold",
    bgPrimary: "#120E07",
    bgSurface: "#1E170C",
    bgElevated: "#2E2312",
    textPrimary: "#FFFBEB",
    textSecondary: "#FCD34D",
    accentPrimary: "#F59E0B",
    accentSecondary: "#EF4444",
    borderSubtle: "#453216",
    radiusPx: 12,
  },
  {
    name: "Arctic Ivory Custom",
    bgPrimary: "#F0F7FF",
    bgSurface: "#FFFFFF",
    bgElevated: "#E0EFFE",
    textPrimary: "#0C1928",
    textSecondary: "#3B5978",
    accentPrimary: "#0284C7",
    accentSecondary: "#6366F1",
    borderSubtle: "#BAE6FD",
    radiusPx: 16,
  },
];

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  customTokens: CustomThemeTokens;
  setCustomTokens: (tokens: CustomThemeTokens) => void;
  savedDbThemes: CustomThemeTokens[];
  onSaveToDb: (tokens: CustomThemeTokens) => Promise<void>;
}

export function ThemeStudioModal({
  isOpen,
  onClose,
  themeMode,
  setThemeMode,
  customTokens,
  setCustomTokens,
  savedDbThemes,
  onSaveToDb,
}: ThemeStudioModalProps) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const updateField = (key: keyof CustomThemeTokens, value: string | number) => {
    setThemeMode("custom");
    setCustomTokens({
      ...customTokens,
      [key]: value,
    });
  };

  const handleSavePreset = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveToDb(customTokens);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="zel-card h-full w-full max-w-md overflow-y-auto p-6 shadow-2xl flex flex-col justify-between border-l">
        <div>
          <div className="flex items-center justify-between pb-4 border-b zel-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg zel-accent-bg text-white">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold zel-text-primary">
                  Sign Zel Theme Studio
                </h2>
                <p className="text-xs zel-text-secondary">
                  Dark, White (Light), & Live Custom Token Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg zel-bg-elevated zel-text-secondary hover:opacity-80"
              aria-label="Close Theme Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Mode Selector */}
          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary block mb-2">
              Active Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["dark", "light", "custom"] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setThemeMode(m)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold capitalize border transition-all flex items-center justify-center gap-1.5 ${
                    themeMode === m
                      ? "zel-accent-bg text-white border-transparent shadow-md"
                      : "zel-bg-elevated zel-text-primary zel-border hover:opacity-90"
                  }`}
                >
                  {themeMode === m && <Check className="w-3.5 h-3.5" />}
                  {m === "light" ? "White / Light" : m}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Custom Presets */}
          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Instant Custom Theme Presets
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[...CURATED_CUSTOM_THEMES, ...savedDbThemes].slice(0, 6).map((preset, idx) => (
                <button
                  key={`${preset.name}-${idx}`}
                  onClick={() => {
                    setThemeMode("custom");
                    setCustomTokens(preset);
                  }}
                  className="p-2.5 rounded-lg border zel-border zel-bg-elevated text-left hover:border-indigo-500 transition-all flex items-center gap-2.5"
                >
                  <div className="flex -space-x-1.5 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.bgPrimary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.accentPrimary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.accentSecondary }}
                    />
                  </div>
                  <span className="text-xs font-medium zel-text-primary truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Color Pickers */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary">
                Custom Color Tokens
              </label>
              <button
                onClick={() => {
                  setThemeMode("custom");
                  setCustomTokens(DEFAULT_CUSTOM_THEME);
                }}
                className="text-xs zel-text-secondary hover: underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div>
              <label className="text-xs zel-text-secondary block mb-1">
                Custom Theme Name
              </label>
              <input
                type="text"
                value={customTokens.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm zel-bg-elevated zel-text-primary border zel-border focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Primary Canvas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTokens.bgPrimary}
                    onChange={(e) => updateField("bgPrimary", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono-code text-xs zel-text-primary">
                    {customTokens.bgPrimary}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Card Surface
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTokens.bgSurface}
                    onChange={(e) => {
                      updateField("bgSurface", e.target.value);
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono-code text-xs zel-text-primary">
                    {customTokens.bgSurface}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Primary Accent (Z)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTokens.accentPrimary}
                    onChange={(e) =>
                      updateField("accentPrimary", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono-code text-xs zel-text-primary">
                    {customTokens.accentPrimary}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Secondary Accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTokens.accentSecondary}
                    onChange={(e) =>
                      updateField("accentSecondary", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono-code text-xs zel-text-primary">
                    {customTokens.accentSecondary}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Primary Text
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTokens.textPrimary}
                    onChange={(e) => updateField("textPrimary", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono-code text-xs zel-text-primary">
                    {customTokens.textPrimary}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg zel-bg-elevated border zel-border">
                <label className="text-xs zel-text-secondary block mb-1">
                  Border Radius ({customTokens.radiusPx}px)
                </label>
                <input
                  type="range"
                  min={4}
                  max={24}
                  value={customTokens.radiusPx}
                  onChange={(e) =>
                    updateField("radiusPx", Number(e.target.value))
                  }
                  className="w-full accent-indigo-500 mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t zel-border flex items-center gap-3">
          <button
            onClick={handleSavePreset}
            disabled={saving}
            className="flex-1 py-2.5 px-4 rounded-lg zel-accent-bg text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved to Studio DB
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Custom Theme"}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg zel-bg-elevated zel-text-primary text-sm font-medium border zel-border"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

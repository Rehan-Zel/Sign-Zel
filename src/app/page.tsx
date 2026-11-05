"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  GitBranch,
  Cpu,
  FolderUp,
  FileArchive,
  FileCode2,
  Sparkles,
  Rocket,
  Download,
  Terminal,
  ExternalLink,
  Sun,
  Moon,
  Palette,
  Sliders,
  Check,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  FolderGit2,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  History,
  Code2,
} from "lucide-react";
import { ZelLogo } from "@/components/ZelLogo";
import {
  ThemeStudioModal,
  ThemeMode,
  CustomThemeTokens,
  DEFAULT_CUSTOM_THEME,
} from "@/components/ThemeStudioModal";
import { AndroidDevicePreview } from "@/components/AndroidDevicePreview";
import {
  UploadedAppFile,
  SynthesisResult,
  synthesizeSignZelProject,
  SAMPLE_UPLOAD_PRESETS,
} from "@/lib/android-scaffold";

interface GithubVerificationState {
  verified: boolean;
  checking: boolean;
  mode?: "live" | "sandbox";
  login?: string;
  name?: string;
  scopes?: string[];
  latencyMs?: number;
  message?: string;
  error?: string;
}

interface AiVerificationState {
  verified: boolean;
  checking: boolean;
  mode?: "live" | "sandbox";
  provider?: string;
  model?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

interface DbProjectRecord {
  id: number;
  name: string;
  packageName: string;
  repoName: string;
  repoUrl: string | null;
  githubOwner: string | null;
  aiProvider: string;
  appNameGeneratedByAi: boolean;
  logoGeneratedByAi: boolean;
  splashGeneratedByAi: boolean;
  status: string;
  workflowRunUrl: string | null;
  createdAt: string;
}

export default function SignZelStudioPage() {
  // ---------------------------------------------------------------------------
  // 1. THEME ENGINE STATE (Dark / White (Light) / Custom)
  // ---------------------------------------------------------------------------
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [customTokens, setCustomTokens] =
    useState<CustomThemeTokens>(DEFAULT_CUSTOM_THEME);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [savedDbThemes, setSavedDbThemes] = useState<CustomThemeTokens[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.setAttribute("data-theme", "dark");
      root.style.removeProperty("--bg-primary");
      root.style.removeProperty("--bg-surface");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--text-primary");
      root.style.removeProperty("--text-secondary");
      root.style.removeProperty("--accent-primary");
      root.style.removeProperty("--accent-secondary");
      root.style.removeProperty("--border-subtle");
      root.style.removeProperty("--radius-card");
    } else if (themeMode === "light") {
      root.setAttribute("data-theme", "light");
      root.style.removeProperty("--bg-primary");
      root.style.removeProperty("--bg-surface");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--text-primary");
      root.style.removeProperty("--text-secondary");
      root.style.removeProperty("--accent-primary");
      root.style.removeProperty("--accent-secondary");
      root.style.removeProperty("--border-subtle");
      root.style.removeProperty("--radius-card");
    } else {
      root.setAttribute("data-theme", "custom");
      root.style.setProperty("--bg-primary", customTokens.bgPrimary);
      root.style.setProperty("--bg-surface", customTokens.bgSurface);
      root.style.setProperty("--bg-elevated", customTokens.bgElevated);
      root.style.setProperty("--text-primary", customTokens.textPrimary);
      root.style.setProperty("--text-secondary", customTokens.textSecondary);
      root.style.setProperty("--accent-primary", customTokens.accentPrimary);
      root.style.setProperty("--accent-secondary", customTokens.accentSecondary);
      root.style.setProperty("--border-subtle", customTokens.borderSubtle);
      root.style.setProperty("--radius-card", `${customTokens.radiusPx}px`);
    }
  }, [themeMode, customTokens]);

  // ---------------------------------------------------------------------------
  // 2. PIPELINE STAGE STATE (1 -> 2 -> 3 -> 4)
  // ---------------------------------------------------------------------------
  const [activeStage, setActiveStage] = useState<number>(1);

  // Stage 1: GitHub API & AI API Keys
  const [githubToken, setGithubToken] = useState<string>("");
  const [showGithubToken, setShowGithubToken] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<
    "gemini" | "openai" | "anthropic" | "openrouter"
  >("gemini");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [showAiKey, setShowAiKey] = useState<boolean>(false);

  const [ghStatus, setGhStatus] = useState<GithubVerificationState>({
    verified: false,
    checking: false,
  });
  const [aiStatus, setAiStatus] = useState<AiVerificationState>({
    verified: false,
    checking: false,
  });

  // Stage 2: Uploaded Files (HTML / ZIP / Folder) & Optional Branding
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAppFile[]>(
    SAMPLE_UPLOAD_PRESETS[0].files
  );
  const [uploadNotice, setUploadNotice] = useState<string>(
    "Preloaded CyberPulse Synth HTML5 file — or drop any HTML, ZIP, or App Folder below."
  );
  const [optionalAppName, setOptionalAppName] = useState<string>("");
  const [optionalLogoDataUrl, setOptionalLogoDataUrl] = useState<string>("");
  const [optionalSplashHeadline, setOptionalSplashHeadline] =
    useState<string>("");
  const [optionalSplashSubheadline, setOptionalSplashSubheadline] =
    useState<string>("");
  const [optionalSplashBg, setOptionalSplashBg] = useState<string>("#0B0F17");
  const [optionalSplashAccent, setOptionalSplashAccent] =
    useState<string>("#6366F1");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Stage 3: AI Audit & Synthesized Sign Zel/ Project Structure
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult>(() =>
    synthesizeSignZelProject({
      uploadedFiles: SAMPLE_UPLOAD_PRESETS[0].files,
    })
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    "Sign Zel/app/src/main/java/com/zelsigns/app/MainActivity.kt"
  );

  // Stage 4: GitHub Repository Push & Workflow Runner
  const [repoName, setRepoName] = useState<string>("sign-zel-cyberpulse-apk");
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [targetBranch, setTargetBranch] = useState<string>("main");
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string>("");
  const [pushResult, setPushResult] = useState<{
    mode: "live" | "cloud-sandbox";
    repoUrl: string;
    workflowRunUrl: string;
    commitSha: string;
    githubOwner: string;
    repoName: string;
    workflowWarning?: string;
    apkArtifactName: string;
    steps: Array<{
      name: string;
      status: "queued" | "in_progress" | "completed" | "failed";
      durationSec: number;
      logs: string[];
    }>;
  } | null>(null);

  // Past Projects from DB
  const [recentProjects, setRecentProjects] = useState<DbProjectRecord[]>([]);

  useEffect(() => {
    fetchRecentData();
  }, []);

  const fetchRecentData = async () => {
    try {
      const [projRes, themeRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/themes"),
      ]);
      if (projRes.ok) {
        const pData = await projRes.json();
        if (Array.isArray(pData.projects)) {
          setRecentProjects(pData.projects);
        }
      }
      if (themeRes.ok) {
        const tData = await themeRes.json();
        if (Array.isArray(tData.presets)) {
          setSavedDbThemes(
            tData.presets.map((p: Record<string, unknown>) => ({
              name: String(p.name || "Saved Theme"),
              bgPrimary: String(p.bgPrimary || "#0B0F17"),
              bgSurface: String(p.bgSurface || "#131B2E"),
              bgElevated: "#1E293B",
              textPrimary: String(p.textPrimary || "#F8FAFC"),
              textSecondary: "#94A3B8",
              accentPrimary: String(p.accentPrimary || "#6366F1"),
              accentSecondary: String(p.accentSecondary || "#06B6D4"),
              borderSubtle: "#26334D",
              radiusPx: Number(p.radiusPx) || 12,
            }))
          );
        }
      }
    } catch {
      // ignore initial load error
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: STAGE 1 (API HANDSHAKE)
  // ---------------------------------------------------------------------------
  const verifyGithubConnection = async (tokenOverride?: string) => {
    const tokenToTest =
      tokenOverride !== undefined ? tokenOverride : githubToken;
    setGhStatus({ verified: false, checking: true });
    try {
      const res = await fetch("/api/verify/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToTest }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setGhStatus({
          verified: true,
          checking: false,
          mode: data.mode,
          login: data.login,
          name: data.name,
          scopes: data.scopes,
          latencyMs: data.latencyMs,
          message: data.message,
        });
        return true;
      } else {
        setGhStatus({
          verified: false,
          checking: false,
          error: data.error || "GitHub connection failed.",
        });
        return false;
      }
    } catch {
      setGhStatus({
        verified: false,
        checking: false,
        error: "Network error verifying GitHub API.",
      });
      return false;
    }
  };

  const verifyAiConnection = async (
    keyOverride?: string,
    providerOverride?: "gemini" | "openai" | "anthropic" | "openrouter"
  ) => {
    const keyToTest = keyOverride !== undefined ? keyOverride : aiApiKey;
    const provToTest = providerOverride || aiProvider;
    setAiStatus({ verified: false, checking: true });
    try {
      const res = await fetch("/api/verify/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provToTest,
          apiKey: keyToTest,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAiStatus({
          verified: true,
          checking: false,
          mode: data.mode,
          provider: data.provider,
          model: data.model,
          latencyMs: data.latencyMs,
          message: data.message,
        });
        return true;
      } else {
        setAiStatus({
          verified: false,
          checking: false,
          error: data.error || "AI API verification failed.",
        });
        return false;
      }
    } catch {
      setAiStatus({
        verified: false,
        checking: false,
        error: "Network error verifying AI API key.",
      });
      return false;
    }
  };

  const handleVerifyBothConnections = async () => {
    const [ghOk, aiOk] = await Promise.all([
      verifyGithubConnection(),
      verifyAiConnection(),
    ]);
    if (ghOk && aiOk) {
      setTimeout(() => setActiveStage(2), 450);
    }
  };

  const handleLoadVerifiedDemoKeys = async () => {
    const demoGh = "ghp_signzel_demo_pat_99x81a72b";
    const demoAi = "zel_ai_demo_gemini_key_2026_pro";
    setGithubToken(demoGh);
    setAiApiKey(demoAi);
    setAiProvider("gemini");
    await Promise.all([
      verifyGithubConnection(demoGh),
      verifyAiConnection(demoAi, "gemini"),
    ]);
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: STAGE 2 (FILE / ZIP / FOLDER INGEST & OPTIONAL BRANDING)
  // ---------------------------------------------------------------------------
  const processSelectedFileList = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const extracted: UploadedAppFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;

      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.keys(zip.files);
          for (const entryName of entries) {
            const zipEntry = zip.files[entryName];
            if (zipEntry.dir) continue;
            // Read text content for source files
            const textContent = await zipEntry.async("string");
            extracted.push({
              path: entryName,
              content: textContent.slice(0, 120000),
              size: textContent.length,
              type: "application/zip-entry",
            });
          }
        } catch {
          setUploadNotice(`Could not unpack ${file.name}; reading as raw file.`);
        }
      } else {
        const textContent = await file.text();
        extracted.push({
          path: relPath,
          content: textContent.slice(0, 120000),
          size: file.size,
          type: file.type || "text/plain",
        });
      }
    }

    if (extracted.length > 0) {
      setUploadedFiles(extracted);
      setUploadNotice(
        `Ingested ${extracted.length} file(s) ready for AI Android APK Audit & Synthesis.`
      );
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setOptionalLogoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: STAGE 3 (AI MISSING-FILE AUDIT & SYNTHESIS)
  // ---------------------------------------------------------------------------
  const handleRunAiAuditAndSynthesis = async () => {
    setSynthesizing(true);
    try {
      const res = await fetch("/api/ai/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          uploadedFiles,
          optionalAppName,
          optionalLogoDataUrl,
          optionalSplashHeadline,
          optionalSplashSubheadline,
          optionalSplashBg,
          optionalSplashAccent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.synthesis) {
        setSynthesisResult(data.synthesis);
        const autoSlug = data.synthesis.branding.appName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        setRepoName(`sign-zel-${autoSlug || "android-app"}`);
        setSelectedFilePath(
          "Sign Zel/app/src/main/java/com/zelsigns/app/MainActivity.kt"
        );
        setActiveStage(3);
      }
    } finally {
      setSynthesizing(false);
    }
  };

  const handleUpdateFileContent = (fullPath: string, newContent: string) => {
    setSynthesisResult((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.fullPath === fullPath
          ? { ...f, content: newContent, origin: "user-edited" }
          : f
      ),
    }));
  };

  const handleDownloadSignZelZip = async () => {
    const zip = new JSZip();
    for (const file of synthesisResult.files) {
      zip.file(file.fullPath, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sign-Zel-${synthesisResult.branding.appName.replace(
      /\s+/g,
      "-"
    )}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: STAGE 4 (PUSH TO GITHUB & START WORKFLOW)
  // ---------------------------------------------------------------------------
  const handlePushToGithubAndStartWorkflow = async () => {
    setPushing(true);
    setPushError("");
    setPushResult(null);

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          repoName,
          isPrivate: isPrivateRepo,
          branch: targetBranch,
          files: synthesisResult.files,
          branding: synthesisResult.branding,
          aiProvider,
          auditSummary: synthesisResult.aiSummary,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPushResult({
          mode: data.mode,
          repoUrl: data.repoUrl,
          workflowRunUrl: data.workflowRunUrl,
          commitSha: data.commitSha,
          githubOwner: data.githubOwner,
          repoName: data.repoName,
          workflowWarning: data.workflowWarning,
          apkArtifactName: data.apkArtifactName,
          steps: data.steps || [],
        });
        fetchRecentData();
      } else {
        setPushError(data.error || "Failed to push files to GitHub.");
      }
    } catch {
      setPushError("Network error while pushing to GitHub.");
    } finally {
      setPushing(false);
    }
  };

  const selectedFileObj =
    synthesisResult.files.find((f) => f.fullPath === selectedFilePath) ||
    synthesisResult.files[0];

  const bothConnectionsVerified = ghStatus.verified && aiStatus.verified;

  return (
    <div className="min-h-screen flex flex-col zel-bg-primary zel-text-primary">
      {/* =====================================================================
          STICKY TOP STUDIO HEADER BAR
         ===================================================================== */}
      <header className="sticky top-0 z-40 h-16 border-b zel-border zel-bg-surface/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Dashing Z Logo + Brand Title */}
        <div className="flex items-center gap-3">
          <ZelLogo size={42} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight zel-text-primary">
                Sign Zel
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider zel-accent-bg text-white">
                AI APK Studio
              </span>
            </div>
            <p className="text-xs zel-text-secondary hidden md:block">
              GitHub API + Any AI Key • Auto-Synthesize Missing Android Gradle &
              Manifest Files
            </p>
          </div>
        </div>

        {/* Center: 4-Stage Pipeline Stepper */}
        <nav
          aria-label="Build Pipeline Stages"
          className="hidden xl:flex items-center gap-1.5 p-1 rounded-xl zel-bg-elevated border zel-border"
        >
          {[
            { num: 1, title: "1. API Handshake", icon: KeyRound },
            { num: 2, title: "2. Files & Branding", icon: FolderUp },
            { num: 3, title: "3. AI Missing-File Audit", icon: Cpu },
            { num: 4, title: "4. GitHub Push & APK Build", icon: Rocket },
          ].map((st) => {
            const Icon = st.icon;
            const isCurrent = activeStage === st.num;
            const isDone =
              (st.num === 1 && bothConnectionsVerified) ||
              (st.num === 2 && uploadedFiles.length > 0 && activeStage > 2) ||
              (st.num === 3 &&
                synthesisResult.files.length > 0 &&
                activeStage > 3) ||
              (st.num === 4 && Boolean(pushResult));

            return (
              <button
                key={st.num}
                onClick={() => setActiveStage(st.num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isCurrent
                    ? "zel-accent-bg text-white shadow-sm"
                    : isDone
                    ? "text-emerald-400 hover:zel-bg-surface"
                    : "zel-text-secondary hover:zel-text-primary"
                }`}
              >
                {isDone && !isCurrent ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {st.title}
              </button>
            );
          })}
        </nav>

        {/* Right: Connection Pills + Dark / White / Custom Theme Switcher */}
        <div className="flex items-center gap-2">
          {/* Live API Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg zel-bg-elevated border zel-border text-xs">
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  ghStatus.verified ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="zel-text-secondary">GH</span>
            </span>
            <span className="zel-text-secondary">/</span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus.verified ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="zel-text-secondary">AI</span>
            </span>
          </div>

          {/* 3-Way Theme Toggle: Dark | White | Custom */}
          <div className="flex items-center p-1 rounded-lg zel-bg-elevated border zel-border">
            <button
              onClick={() => setThemeMode("dark")}
              title="Dark Mode (Obsidian Studio)"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                themeMode === "dark"
                  ? "zel-accent-bg text-white shadow"
                  : "zel-text-secondary hover:zel-text-primary"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </button>

            <button
              onClick={() => setThemeMode("light")}
              title="White Mode (Daylight Alabaster)"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                themeMode === "light"
                  ? "zel-accent-bg text-white shadow"
                  : "zel-text-secondary hover:zel-text-primary"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">White</span>
            </button>

            <button
              onClick={() => {
                setThemeMode("custom");
                setThemeModalOpen(true);
              }}
              title="Custom Theme Studio"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                themeMode === "custom"
                  ? "zel-accent-bg text-white shadow"
                  : "zel-text-secondary hover:zel-text-primary"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Custom</span>
            </button>
          </div>

          <button
            onClick={() => setThemeModalOpen(true)}
            className="p-2 rounded-lg zel-bg-elevated border zel-border zel-text-secondary hover:zel-text-primary transition"
            title="Customize Theme Colors & Radius"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Stage Navigation Bar */}
      <div className="xl:hidden border-b zel-border zel-bg-surface px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {[
          { num: 1, label: "1. API Keys" },
          { num: 2, label: "2. Files & Brand" },
          { num: 3, label: "3. Sign Zel/ Tree" },
          { num: 4, label: "4. Push & Build" },
        ].map((st) => (
          <button
            key={st.num}
            onClick={() => setActiveStage(st.num)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeStage === st.num
                ? "zel-accent-bg text-white"
                : "zel-bg-elevated zel-text-secondary"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          MAIN WORKSPACE (12-COLUMN GRID: 8 COLS PIPELINE + 4 COLS DEVICE PREVIEW)
         ===================================================================== */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER 8 COLUMNS: ACTIVE STAGE ORCHESTRATOR */}
        <div className="lg:col-span-8 space-y-6">
          {/* -----------------------------------------------------------------
              STAGE 1: GITHUB API & AI API HANDSHAKE
             ----------------------------------------------------------------- */}
          {activeStage === 1 && (
            <section className="zel-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b zel-border">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl zel-accent-bg text-white shadow-lg shrink-0">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-code uppercase tracking-wider px-2 py-0.5 rounded zel-bg-elevated zel-text-secondary">
                        Stage 1 of 4
                      </span>
                      {bothConnectionsVerified && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Both APIs
                          Verified
                        </span>
                      )}
                    </div>
                    <h1 className="font-display text-2xl font-bold mt-1 zel-text-primary">
                      Connect GitHub API & Any AI API Key
                    </h1>
                    <p className="text-sm zel-text-secondary mt-1">
                      First enter your GitHub Personal Access Token and any AI
                      API key. Sign Zel checks if both connections work before
                      ingesting your app files.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLoadVerifiedDemoKeys}
                  className="px-3.5 py-2 rounded-lg zel-bg-elevated border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 transition flex items-center gap-1.5 shrink-0 self-start"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Load Verified Demo Keys
                </button>
              </div>

              {/* Dual API Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card A: GitHub API Token */}
                <div className="p-5 rounded-xl zel-bg-elevated border zel-border flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5 zel-text-primary" />
                        <h2 className="font-display text-base font-bold zel-text-primary">
                          1. GitHub API Token
                        </h2>
                      </div>
                      {ghStatus.verified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium zel-bg-surface zel-text-secondary">
                          Required
                        </span>
                      )}
                    </div>

                    <p className="text-xs zel-text-secondary leading-relaxed">
                      Used to create your repository, push the{" "}
                      <code className="font-mono-code">Sign Zel/</code> project
                      tree, and trigger{" "}
                      <code className="font-mono-code">build-apk.yml</code>.
                    </p>

                    <div className="relative">
                      <input
                        type={showGithubToken ? "text" : "password"}
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-xs font-mono-code zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGithubToken(!showGithubToken)}
                        className="absolute right-2.5 top-2.5 zel-text-secondary hover:zel-text-primary"
                        aria-label="Toggle GitHub Token Visibility"
                      >
                        {showGithubToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Verification Telemetry */}
                    {ghStatus.verified && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1">
                        <div className="font-semibold text-emerald-400 flex items-center justify-between">
                          <span>@{ghStatus.login}</span>
                          <span className="font-mono-code">
                            {ghStatus.latencyMs}ms
                          </span>
                        </div>
                        <p className="text-emerald-300/90 text-[11px]">
                          {ghStatus.message}
                        </p>
                        {ghStatus.scopes && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {ghStatus.scopes.map((sc) => (
                              <span
                                key={sc}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-code text-[10px]"
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {ghStatus.error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{ghStatus.error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => verifyGithubConnection()}
                    disabled={ghStatus.checking}
                    className="w-full py-2 px-3 rounded-lg zel-bg-surface border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 transition flex items-center justify-center gap-1.5"
                  >
                    {ghStatus.checking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Checking GitHub API...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Test GitHub Connection
                      </>
                    )}
                  </button>
                </div>

                {/* Card B: Any AI API Key */}
                <div className="p-5 rounded-xl zel-bg-elevated border zel-border flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-cyan-400" />
                        <h2 className="font-display text-base font-bold zel-text-primary">
                          2. Any AI API Key
                        </h2>
                      </div>
                      {aiStatus.verified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium zel-bg-surface zel-text-secondary">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Provider Selector */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: "gemini", label: "Gemini" },
                          { id: "openai", label: "OpenAI" },
                          { id: "anthropic", label: "Claude" },
                          { id: "openrouter", label: "OpenRouter" },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAiProvider(p.id)}
                          className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition ${
                            aiProvider === p.id
                              ? "zel-accent-bg text-white border-transparent"
                              : "zel-bg-surface zel-text-secondary zel-border"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        type={showAiKey ? "text" : "password"}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={
                          aiProvider === "gemini"
                            ? "AIzaSy..."
                            : aiProvider === "openai"
                            ? "sk-proj-..."
                            : aiProvider === "anthropic"
                            ? "sk-ant-..."
                            : "sk-or-v1-..."
                        }
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-xs font-mono-code zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAiKey(!showAiKey)}
                        className="absolute right-2.5 top-2.5 zel-text-secondary hover:zel-text-primary"
                        aria-label="Toggle AI API Key Visibility"
                      >
                        {showAiKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* AI Verification Telemetry */}
                    {aiStatus.verified && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1">
                        <div className="font-semibold text-emerald-400 flex items-center justify-between">
                          <span className="uppercase">{aiStatus.provider}</span>
                          <span className="font-mono-code">
                            {aiStatus.latencyMs}ms
                          </span>
                        </div>
                        <p className="text-emerald-300/90 text-[11px]">
                          {aiStatus.message}
                        </p>
                      </div>
                    )}

                    {aiStatus.error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{aiStatus.error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => verifyAiConnection()}
                    disabled={aiStatus.checking}
                    className="w-full py-2 px-3 rounded-lg zel-bg-surface border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 transition flex items-center justify-center gap-1.5"
                  >
                    {aiStatus.checking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Checking AI Endpoint...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Test AI API Connection
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Action Bar for Stage 1 */}
              <div className="pt-4 border-t zel-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs zel-text-secondary">
                  {bothConnectionsVerified ? (
                    <span className="text-emerald-400 font-medium">
                      ✓ Both GitHub API and AI API connections verified and
                      ready!
                    </span>
                  ) : (
                    <span>
                      Verify both connections (or click{" "}
                      <strong>Load Verified Demo Keys</strong>) to proceed to
                      File Ingest & Branding.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleVerifyBothConnections}
                    disabled={ghStatus.checking || aiStatus.checking}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg zel-accent-bg text-white font-semibold text-sm shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Both Connections & Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* -----------------------------------------------------------------
              STAGE 2: FILES UPLOAD (HTML / ZIP / FOLDER) & OPTIONAL BRANDING
             ----------------------------------------------------------------- */}
          {activeStage === 2 && (
            <section className="zel-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b zel-border">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl zel-accent-bg text-white shadow-lg shrink-0">
                    <FolderUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono-code uppercase tracking-wider px-2 py-0.5 rounded zel-bg-elevated zel-text-secondary">
                      Stage 2 of 4
                    </span>
                    <h1 className="font-display text-2xl font-bold mt-1 zel-text-primary">
                      Upload App Files & Optional Branding
                    </h1>
                    <p className="text-sm zel-text-secondary mt-1">
                      Upload any{" "}
                      <strong className="zel-text-primary">.html file</strong>,{" "}
                      <strong className="zel-text-primary">.zip archive</strong>
                      , or{" "}
                      <strong className="zel-text-primary">app folder</strong>.
                      App Logo, App Name, and Starting Screen are{" "}
                      <span className="text-indigo-400 font-semibold">
                        100% optional
                      </span>{" "}
                      — leave them empty and your AI key will generate them!
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Format File Dropzone */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary">
                    1. Source Files (HTML, ZIP, or Any App Folder)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {SAMPLE_UPLOAD_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setUploadedFiles(preset.files);
                          setUploadNotice(`Loaded preset: ${preset.label}`);
                        }}
                        className="px-2.5 py-1 rounded-md text-xs font-medium zel-bg-elevated border zel-border zel-text-primary hover:border-indigo-500 transition"
                      >
                        Load {preset.badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    processSelectedFileList(e.dataTransfer.files);
                  }}
                  className="p-6 rounded-xl border-2 border-dashed zel-border zel-bg-elevated/60 text-center space-y-4 hover:border-indigo-500/70 transition"
                >
                  <div className="flex justify-center gap-3">
                    <div className="p-3 rounded-xl zel-bg-surface border zel-border text-indigo-400">
                      <FileCode2 className="w-6 h-6" />
                    </div>
                    <div className="p-3 rounded-xl zel-bg-surface border zel-border text-cyan-400">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div className="p-3 rounded-xl zel-bg-surface border zel-border text-emerald-400">
                      <FolderGit2 className="w-6 h-6" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold zel-text-primary">
                      Drag & drop any HTML file, .ZIP archive, or App Folder
                      here
                    </p>
                    <p className="text-xs zel-text-secondary mt-1">
                      {uploadNotice}
                    </p>
                  </div>

                  {/* Hidden file & folder inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".html,.htm,.zip,.css,.js,.ts,.json,.kt,.xml,.gradle,.kts,.png,.svg"
                    onChange={(e) => processSelectedFileList(e.target.files)}
                    className="hidden"
                  />
                  <input
                    ref={(el) => {
                      folderInputRef.current = el;
                      if (el) {
                        el.setAttribute("webkitdirectory", "");
                        el.setAttribute("directory", "");
                      }
                    }}
                    type="file"
                    multiple
                    onChange={(e) => processSelectedFileList(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg zel-accent-bg text-white text-xs font-semibold shadow hover:opacity-95 transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Select HTML / ZIP / Files
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg zel-bg-surface border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 transition flex items-center gap-1.5"
                    >
                      <FolderUp className="w-3.5 h-3.5 text-cyan-400" />
                      Upload Entire App Folder
                    </button>
                  </div>
                </div>

                {/* Uploaded File Pills */}
                {uploadedFiles.length > 0 && (
                  <div className="p-3.5 rounded-xl zel-bg-elevated border zel-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold zel-text-primary">
                        Ingested Source Files ({uploadedFiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-xs text-red-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((f, i) => (
                        <div
                          key={`${f.path}-${i}`}
                          className="px-2.5 py-1 rounded-md zel-bg-surface border zel-border text-xs font-mono-code flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{f.path}</span>
                          <span className="zel-text-secondary text-[10px]">
                            ({f.size}B)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Branding Section (App Name, Logo, Starting Screen) */}
              <div className="pt-4 border-t zel-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold zel-text-primary flex items-center gap-2">
                      2. App Name, Logo & Starting Screen
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        All Optional — AI Auto-Fills Empty Fields
                      </span>
                    </h2>
                    <p className="text-xs zel-text-secondary mt-0.5">
                      Leave any or all of these blank and your connected AI key
                      will automatically generate them for your APK.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Optional Field 1: App Name */}
                  <div className="p-4 rounded-xl zel-bg-elevated border zel-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold zel-text-primary">
                        App Name
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-400">
                        {optionalAppName.trim()
                          ? "Custom"
                          : "✨ AI Will Fill"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={optionalAppName}
                      onChange={(e) => setOptionalAppName(e.target.value)}
                      placeholder="Leave empty for AI App Name..."
                      className="w-full px-3 py-2 rounded-lg text-xs zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] zel-text-secondary">
                      Written to <code>AndroidManifest.xml</code> &{" "}
                      <code>settings.gradle.kts</code>.
                    </p>
                  </div>

                  {/* Optional Field 2: App Logo */}
                  <div className="p-4 rounded-xl zel-bg-elevated border zel-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold zel-text-primary">
                        App Logo / Icon
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-400">
                        {optionalLogoDataUrl
                          ? "Custom Icon"
                          : "✨ AI Vector XML"}
                      </span>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 py-2 px-3 rounded-lg zel-bg-surface border zel-border text-xs font-medium zel-text-primary hover:border-indigo-500 transition truncate"
                      >
                        {optionalLogoDataUrl
                          ? "Change Uploaded Logo"
                          : "Upload Logo (or Leave Empty)"}
                      </button>
                      {optionalLogoDataUrl && (
                        <button
                          type="button"
                          onClick={() => setOptionalLogoDataUrl("")}
                          className="p-2 rounded-lg zel-bg-surface border zel-border text-red-400"
                          title="Reset to AI Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] zel-text-secondary">
                      Synthesizes{" "}
                      <code>res/drawable/ic_launcher.xml</code> when left empty.
                    </p>
                  </div>

                  {/* Optional Field 3: Starting Splash Screen */}
                  <div className="p-4 rounded-xl zel-bg-elevated border zel-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold zel-text-primary">
                        Starting Screen Title
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-400">
                        {optionalSplashHeadline.trim()
                          ? "Custom"
                          : "✨ AI Will Fill"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={optionalSplashHeadline}
                      onChange={(e) =>
                        setOptionalSplashHeadline(e.target.value)
                      }
                      placeholder="Leave empty for AI Splash Screen..."
                      className="w-full px-3 py-2 rounded-lg text-xs zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={optionalSplashSubheadline}
                      onChange={(e) =>
                        setOptionalSplashSubheadline(e.target.value)
                      }
                      placeholder="Optional splash subtitle..."
                      className="w-full px-3 py-1.5 rounded-lg text-xs zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] zel-text-secondary">
                        Splash Bg / Accent:
                      </span>
                      <input
                        type="color"
                        value={optionalSplashBg}
                        onChange={(e) => setOptionalSplashBg(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        title="Splash Background Color"
                      />
                      <input
                        type="color"
                        value={optionalSplashAccent}
                        onChange={(e) =>
                          setOptionalSplashAccent(e.target.value)
                        }
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        title="Splash Accent Color"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2 Footer Action */}
              <div className="pt-4 border-t zel-border flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStage(1)}
                  className="px-4 py-2 rounded-lg zel-bg-elevated border zel-border text-xs font-semibold zel-text-secondary hover:zel-text-primary"
                >
                  ← Back to API Keys
                </button>

                <button
                  type="button"
                  onClick={handleRunAiAuditAndSynthesis}
                  disabled={synthesizing}
                  className="px-6 py-2.5 rounded-lg zel-accent-bg text-white font-semibold text-sm shadow-lg hover:opacity-95 transition flex items-center gap-2"
                >
                  {synthesizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI Auditing & Writing Missing APK Files...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Send Files to AI & Synthesize Missing APK Files
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* -----------------------------------------------------------------
              STAGE 3: AI AUDIT & SIGN ZEL/ PROJECT STRUCTURE INSPECTOR
             ----------------------------------------------------------------- */}
          {activeStage === 3 && (
            <section className="zel-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b zel-border">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl zel-accent-bg text-white shadow-lg shrink-0">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-code uppercase tracking-wider px-2 py-0.5 rounded zel-bg-elevated zel-text-secondary">
                        Stage 3 of 4
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        ✓ All Missing APK Files Written by AI
                      </span>
                    </div>
                    <h1 className="font-display text-2xl font-bold mt-1 zel-text-primary">
                      Sign Zel/ AI Missing-File Audit & Tree Inspector
                    </h1>
                    <p className="text-xs zel-text-secondary mt-1">
                      {synthesisResult.aiSummary}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSignZelZip}
                  className="px-3.5 py-2 rounded-lg zel-bg-elevated border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 transition flex items-center gap-1.5 shrink-0 self-start"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Download Sign Zel/ (.ZIP)
                </button>
              </div>

              {/* AI Missing-File Diagnostic Audit Report */}
              <div className="p-4 rounded-xl zel-bg-elevated border zel-border space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider zel-text-secondary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Missing APK Files Detected & Synthesized by AI (
                    {
                      synthesisResult.auditReport.filter(
                        (a) => !a.foundInUpload
                      ).length
                    }{" "}
                    files written)
                  </h2>
                  <span className="text-[11px] font-mono-code zel-text-secondary">
                    {synthesisResult.detectedStack}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {synthesisResult.auditReport.map((item) => (
                    <button
                      key={item.requiredPath}
                      type="button"
                      onClick={() => setSelectedFilePath(item.requiredPath)}
                      className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2.5 ${
                        selectedFilePath === item.requiredPath
                          ? "border-indigo-500 zel-bg-surface"
                          : "zel-border zel-bg-surface/60 hover:zel-bg-surface"
                      }`}
                    >
                      <span
                        className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono-code font-semibold shrink-0 ${
                          item.foundInUpload
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-indigo-500/20 text-indigo-300"
                        }`}
                      >
                        {item.foundInUpload ? "UPLOADED" : "AI WROTE"}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono-code text-xs font-semibold zel-text-primary truncate">
                          {item.requiredPath}
                        </div>
                        <p className="text-[11px] zel-text-secondary truncate mt-0.5">
                          {item.aiActionTaken}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split-Pane Visual Sign Zel/ Tree Diagram + Live Code Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left 5 Cols: Exact Sign Zel/ ASCII + Interactive Tree */}
                <div className="lg:col-span-5 p-4 rounded-xl zel-bg-elevated border zel-border flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-display zel-text-primary flex items-center gap-1.5">
                        <FolderGit2 className="w-4 h-4 text-indigo-400" />
                        Sign Zel/ Project Structure
                      </span>
                      <span className="text-[10px] font-mono-code zel-text-secondary">
                        Click any file to edit
                      </span>
                    </div>

                    {/* Visual Tree Diagram matching prompt structure */}
                    <div className="p-3 rounded-lg zel-bg-primary border zel-border font-mono-code text-[11px] leading-relaxed overflow-x-auto select-none">
                      <div className="text-indigo-400 font-bold">
                        Sign Zel/{" "}
                        <span className="text-slate-500 font-normal">
                          (Main folder)
                        </span>
                      </div>
                      <div className="text-slate-400">├── .github/</div>
                      <div className="text-slate-400">
                        │{"   "}└── workflows/
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath(
                            "Sign Zel/.github/workflows/build-apk.yml"
                          )
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath ===
                          "Sign Zel/.github/workflows/build-apk.yml"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        │{"       "}└── build-apk.yml
                      </button>
                      <div className="text-slate-400">├── app/</div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath("Sign Zel/app/build.gradle.kts")
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath === "Sign Zel/app/build.gradle.kts"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        │{"   "}├── build.gradle.kts
                      </button>
                      <div className="text-slate-400">
                        │{"   "}└── src/main/
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath(
                            "Sign Zel/app/src/main/AndroidManifest.xml"
                          )
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath ===
                          "Sign Zel/app/src/main/AndroidManifest.xml"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        │{"       "}├── AndroidManifest.xml
                      </button>
                      <div className="text-slate-400">
                        │{"       "}├── java/com/zelsigns/app/
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath(
                            "Sign Zel/app/src/main/java/com/zelsigns/app/MainActivity.kt"
                          )
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath ===
                          "Sign Zel/app/src/main/java/com/zelsigns/app/MainActivity.kt"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        │{"       "}│{"   "}└── MainActivity.kt
                      </button>
                      <div className="text-slate-400">
                        │{"       "}└── res/drawable/
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath(
                            "Sign Zel/app/src/main/res/drawable/ic_launcher.xml"
                          )
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath ===
                          "Sign Zel/app/src/main/res/drawable/ic_launcher.xml"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        │{"           "}└── ic_launcher.xml
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath("Sign Zel/build.gradle.kts")
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath === "Sign Zel/build.gradle.kts"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        ├── build.gradle.kts
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath("Sign Zel/gradle.properties")
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath === "Sign Zel/gradle.properties"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        ├── gradle.properties
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFilePath("Sign Zel/settings.gradle.kts")
                        }
                        className={`block text-left w-full px-1 rounded hover:bg-indigo-500/20 ${
                          selectedFilePath === "Sign Zel/settings.gradle.kts"
                            ? "bg-indigo-500/25 text-cyan-300 font-semibold"
                            : "text-emerald-400"
                        }`}
                      >
                        └── settings.gradle.kts
                      </button>
                    </div>

                    {/* Bundled Uploaded Assets list */}
                    {synthesisResult.files.filter(
                      (f) => f.status === "bundled-asset"
                    ).length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] font-semibold zel-text-secondary mb-1.5">
                          Bundled User App Assets (app/src/main/assets/):
                        </div>
                        <div className="space-y-1">
                          {synthesisResult.files
                            .filter((f) => f.status === "bundled-asset")
                            .map((assetFile) => (
                              <button
                                key={assetFile.fullPath}
                                type="button"
                                onClick={() =>
                                  setSelectedFilePath(assetFile.fullPath)
                                }
                                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono-code flex items-center justify-between ${
                                  selectedFilePath === assetFile.fullPath
                                    ? "zel-accent-bg text-white"
                                    : "zel-bg-surface zel-text-primary hover:opacity-90"
                                }`}
                              >
                                <span className="truncate">
                                  {assetFile.repoPath}
                                </span>
                                <span className="text-[10px] opacity-75">
                                  Asset
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 7 Cols: Live File Code Inspector & Editor */}
                <div className="lg:col-span-7 rounded-xl zel-bg-elevated border zel-border flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b zel-border zel-bg-surface flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-mono-code text-xs font-bold zel-text-primary truncate">
                        {selectedFileObj?.fullPath}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase bg-indigo-500/20 text-indigo-300 shrink-0">
                      {selectedFileObj?.origin}
                    </span>
                  </div>

                  <div className="px-4 py-2 zel-bg-surface/50 border-b zel-border text-[11px] zel-text-secondary">
                    {selectedFileObj?.description}
                  </div>

                  <textarea
                    value={selectedFileObj?.content || ""}
                    onChange={(e) =>
                      selectedFileObj &&
                      handleUpdateFileContent(
                        selectedFileObj.fullPath,
                        e.target.value
                      )
                    }
                    spellCheck={false}
                    className="w-full h-[340px] p-4 font-mono-code text-xs leading-relaxed zel-bg-primary zel-text-primary focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* Stage 3 Footer */}
              <div className="pt-4 border-t zel-border flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStage(2)}
                  className="px-4 py-2 rounded-lg zel-bg-elevated border zel-border text-xs font-semibold zel-text-secondary hover:zel-text-primary"
                >
                  ← Back to Files & Branding
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStage(4)}
                  className="px-6 py-2.5 rounded-lg zel-accent-bg text-white font-semibold text-sm shadow-lg hover:opacity-95 transition flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Continue to Repo Name & GitHub Workflow Push
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* -----------------------------------------------------------------
              STAGE 4: REPO NAME, GITHUB PUSH & WORKFLOW RUNNER
             ----------------------------------------------------------------- */}
          {activeStage === 4 && (
            <section className="zel-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b zel-border">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl zel-accent-bg text-white shadow-lg shrink-0">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono-code uppercase tracking-wider px-2 py-0.5 rounded zel-bg-elevated zel-text-secondary">
                      Stage 4 of 4
                    </span>
                    <h1 className="font-display text-2xl font-bold mt-1 zel-text-primary">
                      Enter GitHub Repo Name, Push All Files & Start APK
                      Workflow
                    </h1>
                    <p className="text-sm zel-text-secondary mt-1">
                      Sign Zel pushes all {synthesisResult.files.length} files
                      (including{" "}
                      <code className="font-mono-code">
                        .github/workflows/build-apk.yml
                      </code>
                      ) to your GitHub repository and triggers the automated APK
                      build workflow.
                    </p>
                  </div>
                </div>
              </div>

              {/* Repository Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-4 rounded-xl zel-bg-elevated border zel-border space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary block">
                    GitHub Repository Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-code zel-text-secondary">
                      {ghStatus.login || "github-user"} /
                    </span>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="sign-zel-android-apk"
                      className="flex-1 px-3.5 py-2.5 rounded-lg text-sm font-mono-code zel-bg-surface zel-text-primary border zel-border focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] zel-text-secondary">
                    If this repository doesn&apos;t exist yet, Sign Zel creates
                    it automatically via the GitHub API.
                  </p>
                </div>

                <div className="p-4 rounded-xl zel-bg-elevated border zel-border space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider zel-text-secondary block mb-1.5">
                      Visibility & Branch
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPrivateRepo(false)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition ${
                          !isPrivateRepo
                            ? "zel-accent-bg text-white border-transparent"
                            : "zel-bg-surface zel-text-secondary zel-border"
                        }`}
                      >
                        Public Repo
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPrivateRepo(true)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition ${
                          isPrivateRepo
                            ? "zel-accent-bg text-white border-transparent"
                            : "zel-bg-surface zel-text-secondary zel-border"
                        }`}
                      >
                        Private Repo
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="zel-text-secondary">Target Branch:</span>
                    <input
                      type="text"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-24 px-2 py-1 rounded font-mono-code text-xs zel-bg-surface zel-text-primary border zel-border text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Push & Build Trigger Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl zel-bg-elevated border zel-border">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold zel-text-primary">
                    Ready to push {synthesisResult.files.length} files in{" "}
                    <code className="font-mono-code text-indigo-400">
                      Sign Zel/
                    </code>
                  </div>
                  <div className="text-xs zel-text-secondary">
                    App: <strong>{synthesisResult.branding.appName}</strong> •
                    Package: <code>com.zelsigns.app</code> • Workflow:{" "}
                    <code>build-apk.yml</code>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePushToGithubAndStartWorkflow}
                  disabled={pushing}
                  className="px-6 py-3 rounded-xl zel-accent-bg text-white font-semibold text-sm shadow-xl hover:opacity-95 transition flex items-center gap-2"
                >
                  {pushing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Pushing to GitHub & Starting Workflow...
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-4 h-4" />
                      Push All Files to GitHub & Start APK Workflow
                    </>
                  )}
                </button>
              </div>

              {pushError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pushError}</span>
                </div>
              )}

              {/* Live GitHub Actions Workflow Telemetry & Console */}
              {pushResult && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-display font-bold text-base text-emerald-400">
                          Pushed to GitHub & Workflow Started!
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase bg-emerald-500/20 text-emerald-300">
                          Commit {pushResult.commitSha.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs zel-text-secondary">
                        Repository:{" "}
                        <strong className="zel-text-primary">
                          {pushResult.githubOwner}/{pushResult.repoName}
                        </strong>{" "}
                        • Artifact:{" "}
                        <code className="font-mono-code text-indigo-400">
                          {pushResult.apkArtifactName}
                        </code>
                      </p>
                      {pushResult.workflowWarning && (
                        <p className="text-[11px] text-amber-400 mt-1">
                          Note: {pushResult.workflowWarning}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {pushResult.mode === "live" && (
                        <>
                          <a
                            href={pushResult.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-lg zel-bg-surface border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 flex items-center gap-1.5"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            Open Repo
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={pushResult.workflowRunUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-lg zel-accent-bg text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            GitHub Actions Run
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleDownloadSignZelZip}
                        className="px-3 py-2 rounded-lg zel-bg-surface border zel-border text-xs font-semibold zel-text-primary hover:border-indigo-500 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Download Project Bundle
                      </button>
                    </div>
                  </div>

                  {/* Step-by-Step GitHub Actions Terminal Output */}
                  <div className="rounded-xl border zel-border overflow-hidden bg-[#070A10] text-slate-200">
                    <div className="px-4 py-2.5 bg-[#0F1624] border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono-code text-xs font-semibold">
                          .github/workflows/build-apk.yml — Cloud Runner Log
                        </span>
                      </div>
                      <span className="text-[11px] font-mono-code text-emerald-400">
                        ubuntu-latest • JDK 17 • Gradle 8.7
                      </span>
                    </div>

                    <div className="p-4 space-y-3 font-mono-code text-xs max-h-[340px] overflow-y-auto">
                      {pushResult.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-emerald-400 font-semibold">
                            <span>✓ {step.name}</span>
                            <span className="text-slate-400 text-[11px]">
                              {step.durationSec}s
                            </span>
                          </div>
                          <div className="space-y-1 pl-3 border-l border-slate-700 text-[11px] text-slate-300">
                            {step.logs.map((line, lIdx) => (
                              <div key={lIdx}>{line}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 4 Footer */}
              <div className="pt-4 border-t zel-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStage(3)}
                  className="px-4 py-2 rounded-lg zel-bg-elevated border zel-border text-xs font-semibold zel-text-secondary hover:zel-text-primary"
                >
                  ← Back to Sign Zel/ Tree Inspector
                </button>
              </div>
            </section>
          )}

          {/* -----------------------------------------------------------------
              RECENTLY BUILT SIGN ZEL PROJECTS (POSTGRESQL HISTORY)
             ----------------------------------------------------------------- */}
          {recentProjects.length > 0 && (
            <section className="zel-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold zel-text-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Recent Sign Zel Cloud APK Builds ({recentProjects.length})
                </h3>
                <span className="text-[11px] zel-text-secondary">
                  Persisted in PostgreSQL
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {recentProjects.slice(0, 6).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-lg zel-bg-elevated border zel-border flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs zel-text-primary truncate">
                          {proj.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-code bg-emerald-500/15 text-emerald-400">
                          {proj.status}
                        </span>
                      </div>
                      <div className="font-mono-code text-[11px] zel-text-secondary truncate mt-0.5">
                        {proj.githubOwner}/{proj.repoName}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] zel-text-secondary pt-1 border-t zel-border">
                      <span className="uppercase">{proj.aiProvider} AI</span>
                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          Repo <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT 4 COLUMNS: LIVE INTERACTIVE ANDROID 14 DEVICE PREVIEW */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-22">
          <AndroidDevicePreview
            branding={synthesisResult.branding}
            uploadedFiles={uploadedFiles}
            activeStage={activeStage}
          />
        </div>
      </main>

      {/* =====================================================================
          CUSTOM THEME STUDIO DRAWER MODAL
         ===================================================================== */}
      <ThemeStudioModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        customTokens={customTokens}
        setCustomTokens={setCustomTokens}
        savedDbThemes={savedDbThemes}
        onSaveToDb={async (tokens) => {
          await fetch("/api/themes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tokens),
          });
          await fetchRecentData();
        }}
      />
    </div>
  );
}

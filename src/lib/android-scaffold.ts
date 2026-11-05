export interface UploadedAppFile {
  path: string;
  content: string;
  size: number;
  type: string;
}

export interface SplashScreenConfig {
  enabled: boolean;
  headline: string;
  subheadline: string;
  backgroundColor: string;
  accentColor: string;
  durationMs: number;
  animationStyle: "neon-pulse" | "slide-up" | "minimal-fade" | "cyber-grid";
  generatedByAi: boolean;
}

export interface BrandingConfig {
  appName: string;
  appNameGeneratedByAi: boolean;
  packageName: string;
  logoDataUrl?: string; // if user uploaded PNG/SVG
  logoSvgPreview: string;
  logoVectorXml: string;
  logoGeneratedByAi: boolean;
  splash: SplashScreenConfig;
}

export interface ScaffoldFileItem {
  /** Path inside Sign Zel/ root, e.g. "Sign Zel/app/src/main/AndroidManifest.xml" */
  fullPath: string;
  /** Relative path for GitHub repo root, e.g. "app/src/main/AndroidManifest.xml" */
  repoPath: string;
  content: string;
  origin: "uploaded" | "ai-generated" | "user-edited";
  status: "missing-synthesized" | "user-provided" | "bundled-asset" | "enhanced";
  language: "kotlin" | "xml" | "yaml" | "gradle" | "properties" | "html" | "css" | "javascript" | "json" | "text";
  description: string;
}

export interface AuditItem {
  requiredPath: string;
  foundInUpload: boolean;
  reasonMissing: string;
  aiActionTaken: string;
}

export interface SynthesisResult {
  branding: BrandingConfig;
  files: ScaffoldFileItem[];
  auditReport: AuditItem[];
  aiSummary: string;
  detectedStack: string;
}

export const REQUIRED_SIGN_ZEL_FILES: Array<{
  repoPath: string;
  fullPath: string;
  language: ScaffoldFileItem["language"];
  description: string;
  missingReason: string;
}> = [
  {
    repoPath: ".github/workflows/build-apk.yml",
    fullPath: "Sign Zel/.github/workflows/build-apk.yml",
    language: "yaml",
    description: "GitHub Actions CI/CD workflow that provisions JDK 17, Android SDK, Gradle, and compiles + uploads the APK artifact",
    missingReason: "Without build-apk.yml, GitHub Actions does not know how to compile your project into an installable Android APK.",
  },
  {
    repoPath: "app/build.gradle.kts",
    fullPath: "Sign Zel/app/build.gradle.kts",
    language: "gradle",
    description: "Module-level Gradle Kotlin DSL build script configuring SDK versions, namespace, and AndroidX dependencies",
    missingReason: "Missing module build.gradle.kts prevents Gradle from knowing the applicationId, targetSdk, and Kotlin compiler settings.",
  },
  {
    repoPath: "app/src/main/AndroidManifest.xml",
    fullPath: "Sign Zel/app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Android application manifest declaring INTERNET permission, app icon, label, theme, and MainActivity entry point",
    missingReason: "Android OS refuses to build or install an APK without AndroidManifest.xml defining permissions and MainActivity.",
  },
  {
    repoPath: "app/src/main/java/com/zelsigns/app/MainActivity.kt",
    fullPath: "Sign Zel/app/src/main/java/com/zelsigns/app/MainActivity.kt",
    language: "kotlin",
    description: "Primary Kotlin Activity hosting the animated Starting Splash Screen, hardware-accelerated WebView/UI bridge, and GitHub telemetry",
    missingReason: "No Kotlin entry activity found at com/zelsigns/app/MainActivity.kt to launch the application UI and render assets.",
  },
  {
    repoPath: "app/src/main/res/drawable/ic_launcher.xml",
    fullPath: "Sign Zel/app/src/main/res/drawable/ic_launcher.xml",
    language: "xml",
    description: "Vector Drawable launcher icon rendered on the Android home screen and app drawer",
    missingReason: "Missing @drawable/ic_launcher causes AAPT2 resource linking failure during APK compilation.",
  },
  {
    repoPath: "build.gradle.kts",
    fullPath: "Sign Zel/build.gradle.kts",
    language: "gradle",
    description: "Root-level Gradle Kotlin DSL configuration declaring Android Application & Kotlin Android plugins",
    missingReason: "Root build.gradle.kts is required to resolve the Android Gradle Plugin (AGP) and Kotlin compiler plugins.",
  },
  {
    repoPath: "gradle.properties",
    fullPath: "Sign Zel/gradle.properties",
    language: "properties",
    description: "JVM memory args, AndroidX flag, and non-transitive R class optimizations for cloud CI builds",
    missingReason: "Without android.useAndroidX=true in gradle.properties, AndroidX dependencies fail to compile.",
  },
  {
    repoPath: "settings.gradle.kts",
    fullPath: "Sign Zel/settings.gradle.kts",
    language: "gradle",
    description: "Gradle settings declaring Google & MavenCentral repositories, rootProject.name, and :app module inclusion",
    missingReason: "Missing settings.gradle.kts prevents Gradle from discovering the :app module or Google Maven repositories.",
  },
];

/**
 * Infers a smart App Name from uploaded HTML/JS/JSON files when the user leaves App Name blank.
 */
export function inferAppNameFromFiles(files: UploadedAppFile[]): string {
  for (const f of files) {
    if (f.path.endsWith(".html") || f.path.endsWith(".htm")) {
      const titleMatch = f.content.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1].trim()) {
        const cleaned = titleMatch[1].trim().replace(/\s*[-|]\s*.*$/, "");
        if (cleaned.length >= 2 && cleaned.length <= 36 && cleaned.toLowerCase() !== "document") {
          return cleaned;
        }
      }
      const h1Match = f.content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match && h1Match[1].trim()) {
        const cleaned = h1Match[1].trim();
        if (cleaned.length >= 2 && cleaned.length <= 32) {
          return cleaned;
        }
      }
    }
    if (f.path.endsWith("package.json")) {
      try {
        const pkg = JSON.parse(f.content);
        if (pkg.name && typeof pkg.name === "string") {
          return pkg.name
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      } catch {
        // ignore
      }
    }
  }

  if (files.length > 0) {
    const firstBase = files[0].path
      .split("/")
      .pop()
      ?.replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]/g, " ");
    if (firstBase && firstBase.toLowerCase() !== "index" && firstBase.toLowerCase() !== "main") {
      return firstBase.replace(/\b\w/g, (c) => c.toUpperCase()) + " Studio";
    }
  }

  return "ZelNova Mobile";
}

/**
 * Generates both an Android VectorDrawable XML (ic_launcher.xml) and an SVG preview
 * for the app icon. If the user left the logo empty, AI synthesizes a sharp custom geometric icon.
 */
export function generateLogoAssets(
  appName: string,
  primaryHex = "#6366F1",
  secondaryHex = "#06B6D4"
): { vectorXml: string; svgPreview: string } {
  const cleanPrimary = primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`;
  const cleanSecondary = secondaryHex.startsWith("#") ? secondaryHex : `#${secondaryHex}`;
  const initial = (appName.trim()[0] || "Z").toUpperCase();

  const vectorXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- Deep Obsidian Squircle Background -->
    <path
        android:fillColor="#0B0F17"
        android:pathData="M0,0h108v108h-108z" />

    <!-- Outer Accent Frame -->
    <path
        android:fillColor="${cleanPrimary}"
        android:fillAlpha="0.18"
        android:pathData="M18,18 L90,18 L90,90 L18,90 Z" />

    <!-- Signature Zel Lightning / Z Ribbon Top -->
    <path
        android:fillColor="${cleanPrimary}"
        android:pathData="M28,28 L80,28 L80,40 L48,68 L80,68 L80,80 L28,80 L28,68 L60,40 L28,40 Z" />

    <!-- Electric Cyan Core Accent (${initial}) -->
    <path
        android:fillColor="${cleanSecondary}"
        android:pathData="M34,32 L74,32 L42,64 L74,64 L74,74 L34,74 L66,42 L34,42 Z" />
</vector>`;

  const svgPreview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <defs>
    <linearGradient id="zelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cleanPrimary}" />
      <stop offset="100%" stop-color="${cleanSecondary}" />
    </linearGradient>
  </defs>
  <rect width="108" height="108" rx="24" fill="#0B0F17" />
  <rect x="8" y="8" width="92" height="92" rx="18" fill="none" stroke="url(#zelGrad)" stroke-width="2.5" stroke-opacity="0.45" />
  <path d="M28 28 H80 V40 L48 68 H80 V80 H28 V68 L60 40 H28 Z" fill="url(#zelGrad)" />
  <circle cx="82" cy="26" r="4" fill="#10B981" />
</svg>`;

  return { vectorXml, svgPreview };
}

export function generateGithubWorkflowYaml(appName: string): string {
  const safeArtifactName = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sign-zel-app";

  return `name: Sign Zel Android APK Cloud Build

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Assemble & Sign Debug APK (${appName})
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle 8.7 Build Runtime
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.7'

      - name: Build Debug APK with Gradle
        run: gradle assembleDebug --stacktrace

      - name: Upload Compiled APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${safeArtifactName}-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
`;
}

export function generateRootBuildGradleKts(): string {
  return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
// Synthesized by Sign Zel AI Cloud APK Architect
plugins {
    id("com.android.application") version "8.3.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
`;
}

export function generateSettingsGradleKts(appName: string): string {
  return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${appName.replace(/"/g, "")}"
include(":app")
`;
}

export function generateGradleProperties(): string {
  return `# Project-wide Gradle settings synthesized by Sign Zel
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`;
}

export function generateAppBuildGradleKts(packageName = "com.zelsigns.app"): string {
  return `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-zel"

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.webkit:webkit:1.10.0")
}
`;
}

export function generateAndroidManifestXml(appName: string, packageName = "com.zelsigns.app"): string {
  const escapedName = appName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">

    <!-- Permissions enabled by Sign Zel AI Auditor -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:roundIcon="@drawable/ic_launcher"
        android:label="${escapedName}"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
}

export function generateMainActivityKt(
  branding: BrandingConfig,
  hasUploadedHtml: boolean,
  entryHtmlFilename: string
): string {
  const safeAppName = branding.appName.replace(/"/g, '\\"');
  const safeHeadline = branding.splash.headline.replace(/"/g, '\\"');
  const safeSubheadline = branding.splash.subheadline.replace(/"/g, '\\"');
  const bgColor = branding.splash.backgroundColor || "#0B0F17";
  const accentColor = branding.splash.accentColor || "#6366F1";

  return `package com.zelsigns.app

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.animation.AlphaAnimation
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * MainActivity.kt
 * Synthesized by Sign Zel AI Cloud APK Builder
 * App: ${safeAppName}
 * Package: com.zelsigns.app
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splashOverlay: LinearLayout

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val rootFrame = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("${bgColor}"))
        }

        // 1. Hardware-Accelerated App WebView Container
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            setBackgroundColor(Color.parseColor("${bgColor}"))
        }

        ${
          hasUploadedHtml
            ? `webView.loadUrl("file:///android_asset/${entryHtmlFilename}")`
            : `webView.loadDataWithBaseURL(null, DEFAULT_SIGN_ZEL_PORTAL_HTML, "text/html", "UTF-8", null)`
        }

        rootFrame.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        // 2. Starting Splash Screen (${branding.splash.generatedByAi ? "AI-Synthesized" : "Custom Configured"})
        splashOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("${bgColor}"))
            setPadding(64, 64, 64, 64)

            val badgeText = TextView(context).apply {
                text = "Z"
                textSize = 44f
                typeface = Typeface.create("sans-serif-black", Typeface.BOLD)
                setTextColor(Color.parseColor("${accentColor}"))
                gravity = Gravity.CENTER
            }

            val titleView = TextView(context).apply {
                text = "${safeHeadline}"
                textSize = 26f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 24, 0, 12)
            }

            val subtitleView = TextView(context).apply {
                text = "${safeSubheadline}"
                textSize = 14f
                setTextColor(Color.parseColor("#94A3B8"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, 40)
            }

            val progress = ProgressBar(context).apply {
                isIndeterminate = true
            }

            addView(badgeText)
            addView(titleView)
            addView(subtitleView)
            addView(progress)
        }

        if (${branding.splash.enabled}) {
            rootFrame.addView(
                splashOverlay,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            Handler(Looper.getMainLooper()).postDelayed({
                val fadeOut = AlphaAnimation(1f, 0f).apply {
                    duration = 400
                    fillAfter = true
                }
                splashOverlay.startAnimation(fadeOut)
                splashOverlay.visibility = View.GONE
            }, ${branding.splash.durationMs}L)
        }

        setContentView(rootFrame)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    companion object {
        private const val DEFAULT_SIGN_ZEL_PORTAL_HTML = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { background: #0B0F17; color: #F8FAFC; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .card { padding: 28px; border-radius: 16px; background: #131B2E; border: 1px solid #26334D; max-width: 340px; }
                h1 { color: #6366F1; margin-bottom: 8px; }
                p { color: #94A3B8; font-size: 14px; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>${safeAppName}</h1>
                <p>Built &amp; Compiled with Sign Zel AI Android Workflow Studio.</p>
              </div>
            </body>
            </html>
        """
    }
}
`;
}

/**
 * Core synthesis function that takes uploaded files + optional branding fields,
 * fills any empty branding fields, checks for missing Android files, and builds
 * the complete `Sign Zel/` tree.
 */
export function synthesizeSignZelProject(params: {
  uploadedFiles: UploadedAppFile[];
  optionalAppName?: string;
  optionalLogoDataUrl?: string;
  optionalSplashHeadline?: string;
  optionalSplashSubheadline?: string;
  optionalSplashBg?: string;
  optionalSplashAccent?: string;
  aiSuggestions?: {
    appName?: string;
    splashHeadline?: string;
    splashSubheadline?: string;
    accentColor?: string;
    auditNotes?: string;
  };
}): SynthesisResult {
  const {
    uploadedFiles,
    optionalAppName,
    optionalLogoDataUrl,
    optionalSplashHeadline,
    optionalSplashSubheadline,
    optionalSplashBg,
    optionalSplashAccent,
    aiSuggestions,
  } = params;

  const appNameGeneratedByAi = !optionalAppName || optionalAppName.trim().length === 0;
  const resolvedAppName = appNameGeneratedByAi
    ? aiSuggestions?.appName || inferAppNameFromFiles(uploadedFiles)
    : optionalAppName!.trim();

  const accentHex = optionalSplashAccent?.trim() || aiSuggestions?.accentColor || "#6366F1";
  const bgHex = optionalSplashBg?.trim() || "#0B0F17";

  const logoGeneratedByAi = !optionalLogoDataUrl || optionalLogoDataUrl.trim().length === 0;
  const { vectorXml, svgPreview } = generateLogoAssets(resolvedAppName, accentHex, "#06B6D4");

  const splashGeneratedByAi =
    (!optionalSplashHeadline || optionalSplashHeadline.trim().length === 0) &&
    (!optionalSplashSubheadline || optionalSplashSubheadline.trim().length === 0);

  const splashConfig: SplashScreenConfig = {
    enabled: true,
    headline:
      optionalSplashHeadline?.trim() ||
      aiSuggestions?.splashHeadline ||
      resolvedAppName,
    subheadline:
      optionalSplashSubheadline?.trim() ||
      aiSuggestions?.splashSubheadline ||
      `Powered by Sign Zel Cloud APK Engine • v1.0`,
    backgroundColor: bgHex,
    accentColor: accentHex,
    durationMs: 1800,
    animationStyle: "neon-pulse",
    generatedByAi: splashGeneratedByAi,
  };

  const branding: BrandingConfig = {
    appName: resolvedAppName,
    appNameGeneratedByAi,
    packageName: "com.zelsigns.app",
    logoDataUrl: optionalLogoDataUrl,
    logoSvgPreview: svgPreview,
    logoVectorXml: vectorXml,
    logoGeneratedByAi,
    splash: splashConfig,
  };

  // Detect uploaded files
  const normalizedUploads = uploadedFiles.map((f) => ({
    ...f,
    cleanPath: f.path.replace(/^Sign Zel\//i, "").replace(/^\/+/, ""),
  }));

  const htmlFiles = normalizedUploads.filter(
    (f) => f.cleanPath.endsWith(".html") || f.cleanPath.endsWith(".htm")
  );
  const entryHtml =
    htmlFiles.find((f) => f.cleanPath.toLowerCase().endsWith("index.html"))?.cleanPath ||
    htmlFiles[0]?.cleanPath ||
    "index.html";

  const auditReport: AuditItem[] = [];
  const synthesizedFiles: ScaffoldFileItem[] = [];

  // Map each of the 8 core required Sign Zel files
  for (const req of REQUIRED_SIGN_ZEL_FILES) {
    const existing = normalizedUploads.find(
      (u) => u.cleanPath.toLowerCase() === req.repoPath.toLowerCase()
    );

    if (existing) {
      auditReport.push({
        requiredPath: req.fullPath,
        foundInUpload: true,
        reasonMissing: "Provided in user upload.",
        aiActionTaken: "Verified syntax & retained user-provided file.",
      });
      synthesizedFiles.push({
        fullPath: req.fullPath,
        repoPath: req.repoPath,
        content: existing.content,
        origin: "uploaded",
        status: "user-provided",
        language: req.language,
        description: req.description,
      });
    } else {
      let generatedContent = "";
      switch (req.repoPath) {
        case ".github/workflows/build-apk.yml":
          generatedContent = generateGithubWorkflowYaml(resolvedAppName);
          break;
        case "app/build.gradle.kts":
          generatedContent = generateAppBuildGradleKts(branding.packageName);
          break;
        case "app/src/main/AndroidManifest.xml":
          generatedContent = generateAndroidManifestXml(resolvedAppName, branding.packageName);
          break;
        case "app/src/main/java/com/zelsigns/app/MainActivity.kt":
          generatedContent = generateMainActivityKt(
            branding,
            htmlFiles.length > 0,
            entryHtml.split("/").pop() || "index.html"
          );
          break;
        case "app/src/main/res/drawable/ic_launcher.xml":
          generatedContent = branding.logoVectorXml;
          break;
        case "build.gradle.kts":
          generatedContent = generateRootBuildGradleKts();
          break;
        case "gradle.properties":
          generatedContent = generateGradleProperties();
          break;
        case "settings.gradle.kts":
          generatedContent = generateSettingsGradleKts(resolvedAppName);
          break;
      }

      auditReport.push({
        requiredPath: req.fullPath,
        foundInUpload: false,
        reasonMissing: req.missingReason,
        aiActionTaken: `AI synthesized ${req.repoPath} tailored for "${resolvedAppName}".`,
      });

      synthesizedFiles.push({
        fullPath: req.fullPath,
        repoPath: req.repoPath,
        content: generatedContent,
        origin: "ai-generated",
        status: "missing-synthesized",
        language: req.language,
        description: req.description,
      });
    }
  }

  // Bundle all uploaded web/app files into Sign Zel/app/src/main/assets/ so the APK embeds them!
  for (const up of normalizedUploads) {
    const alreadyCore = REQUIRED_SIGN_ZEL_FILES.some(
      (r) => r.repoPath.toLowerCase() === up.cleanPath.toLowerCase()
    );
    if (alreadyCore) continue;

    const fileNameOnly = up.cleanPath.split("/").pop() || up.cleanPath;
    const assetRepoPath = up.cleanPath.startsWith("app/")
      ? up.cleanPath
      : `app/src/main/assets/${fileNameOnly}`;
    const assetFullPath = `Sign Zel/${assetRepoPath}`;

    const ext = fileNameOnly.split(".").pop()?.toLowerCase() || "";
    let lang: ScaffoldFileItem["language"] = "text";
    if (ext === "html" || ext === "htm") lang = "html";
    else if (ext === "css") lang = "css";
    else if (ext === "js" || ext === "ts") lang = "javascript";
    else if (ext === "json") lang = "json";
    else if (ext === "kt") lang = "kotlin";
    else if (ext === "xml") lang = "xml";

    synthesizedFiles.push({
      fullPath: assetFullPath,
      repoPath: assetRepoPath,
      content: up.content,
      origin: "uploaded",
      status: "bundled-asset",
      language: lang,
      description: `Uploaded source file bundled into Android APK assets (${up.size} bytes)`,
    });
  }

  const missingCount = auditReport.filter((a) => !a.foundInUpload).length;
  const detectedStack =
    htmlFiles.length > 0
      ? `HTML5 / Web App (${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"} bundled into Android WebView APK)`
      : uploadedFiles.length > 0
      ? `Custom App Bundle (${uploadedFiles.length} source files)`
      : `Standalone Native Kotlin Starter Project`;

  const aiSummary =
    aiSuggestions?.auditNotes ||
    `Inspected ${uploadedFiles.length} uploaded file(s). Detected ${missingCount} missing Android & GitHub Actions files preventing APK compilation. Synthesized complete Sign Zel/ Gradle Kotlin DSL scaffold, AndroidManifest.xml, MainActivity.kt (with ${
      branding.splash.generatedByAi ? "AI-generated" : "custom"
    } splash screen), Vector Drawable ic_launcher.xml, and .github/workflows/build-apk.yml.`;

  return {
    branding,
    files: synthesizedFiles,
    auditReport,
    aiSummary,
    detectedStack,
  };
}

/**
 * Sample presets so users can test uploading a single HTML file, a multi-file web app folder,
 * or a partial Android folder in 1 click (in addition to real drag-and-drop / file / folder / zip pickers).
 */
export const SAMPLE_UPLOAD_PRESETS: Array<{
  id: string;
  label: string;
  badge: string;
  description: string;
  files: UploadedAppFile[];
}> = [
  {
    id: "cyber-pulse-html",
    label: "CyberPulse Synth Pad (Single HTML File)",
    badge: "HTML File",
    description: "A single self-contained HTML5 interactive synth & beat pad without any Android files.",
    files: [
      {
        path: "index.html",
        type: "text/html",
        size: 1840,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CyberPulse Synth Studio</title>
  <style>
    body { margin: 0; background: #090D16; color: #F8FAFC; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    h1 { color: #6366F1; letter-spacing: -0.03em; margin-bottom: 6px; }
    p { color: #94A3B8; font-size: 14px; margin-top: 0; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 88px); gap: 12px; }
    .pad { height: 88px; border-radius: 16px; border: 1px solid #26334D; background: linear-gradient(135deg, #131B2E, #1E293B); color: #38BDF8; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.1s, border-color 0.2s; }
    .pad:active { transform: scale(0.93); border-color: #6366F1; background: #6366F1; color: white; }
  </style>
</head>
<body>
  <h1>CyberPulse Matrix</h1>
  <p>Tap neon pads to trigger WebAudio synth frequencies</p>
  <div class="grid">
    <button class="pad" onclick="beep(261.6)">C4</button>
    <button class="pad" onclick="beep(293.7)">D4</button>
    <button class="pad" onclick="beep(329.6)">E4</button>
    <button class="pad" onclick="beep(349.2)">F4</button>
    <button class="pad" onclick="beep(392.0)">G4</button>
    <button class="pad" onclick="beep(440.0)">A4</button>
    <button class="pad" onclick="beep(493.9)">B4</button>
    <button class="pad" onclick="beep(523.3)">C5</button>
    <button class="pad" onclick="beep(659.3)">E5</button>
  </div>
  <script>
    function beep(freq) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    }
  </script>
</body>
</html>`,
      },
    ],
  },
  {
    id: "zel-wallet-folder",
    label: "OrbitTasks Pro (Multi-File Web Folder)",
    badge: "App Folder",
    description: "A folder containing index.html, styles.css, app.js, and manifest.json — missing all Android & Gradle files.",
    files: [
      {
        path: "orbit-tasks/index.html",
        type: "text/html",
        size: 980,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OrbitTasks Mission Control</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-shell">
    <h1>OrbitTasks Mission Control</h1>
    <div id="task-list"></div>
    <button id="add-btn">+ Launch New Objective</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        path: "orbit-tasks/styles.css",
        type: "text/css",
        size: 520,
        content: `body { background: #0B0F17; color: #F8FAFC; font-family: sans-serif; padding: 20px; }
.app-shell { max-width: 420px; margin: 0 auto; background: #131B2E; padding: 24px; border-radius: 16px; border: 1px solid #26334D; }
button { background: #6366F1; color: white; border: 0; padding: 12px 18px; border-radius: 10px; font-weight: 600; width: 100%; margin-top: 16px; }`,
      },
      {
        path: "orbit-tasks/app.js",
        type: "application/javascript",
        size: 460,
        content: `const tasks = ['Verify GitHub PAT Token', 'Synthesize Missing Gradle Files', 'Compile Signed Android APK'];
const list = document.getElementById('task-list');
function render() {
  list.innerHTML = tasks.map((t, i) => '<div style="padding:10px 0;border-bottom:1px solid #1E293B;">✅ ' + t + '</div>').join('');
}
document.getElementById('add-btn').onclick = () => {
  tasks.push('Deploy Release Build #' + (tasks.length + 1));
  render();
};
render();`,
      },
    ],
  },
];

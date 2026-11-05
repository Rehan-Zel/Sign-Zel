import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  packageName: text("package_name").notNull().default("com.zelsigns.app"),
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url"),
  githubOwner: text("github_owner"),
  aiProvider: text("ai_provider").notNull().default("gemini"),
  appNameGeneratedByAi: boolean("app_name_generated_by_ai").notNull().default(false),
  logoGeneratedByAi: boolean("logo_generated_by_ai").notNull().default(false),
  splashGeneratedByAi: boolean("splash_generated_by_ai").notNull().default(false),
  logoXml: text("logo_xml"),
  logoPreviewSvg: text("logo_preview_svg"),
  splashConfig: jsonb("splash_config").$type<{
    headline: string;
    subheadline: string;
    backgroundColor: string;
    accentColor: string;
    durationMs: number;
    animationStyle: string;
  }>(),
  auditSummary: text("audit_summary"),
  status: text("status").notNull().default("scaffolded"), // uploaded | scaffolded | pushed | building | completed
  workflowRunId: text("workflow_run_id"),
  workflowRunUrl: text("workflow_run_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull(),
  origin: text("origin").notNull().default("ai-generated"), // 'uploaded' | 'ai-generated' | 'user-edited'
  language: text("language").notNull().default("kotlin"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const themePresets = pgTable("theme_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("custom"),
  bgPrimary: text("bg_primary").notNull(),
  bgSurface: text("bg_surface").notNull(),
  accentPrimary: text("accent_primary").notNull(),
  accentSecondary: text("accent_secondary").notNull(),
  textPrimary: text("text_primary").notNull(),
  radiusPx: integer("radius_px").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buildRuns = pgTable("build_runs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  repoFullName: text("repo_full_name").notNull(),
  branch: text("branch").notNull().default("main"),
  commitSha: text("commit_sha").notNull(),
  status: text("status").notNull().default("completed"),
  mode: text("mode").notNull().default("live"), // 'live' | 'cloud-sandbox'
  stepsJson: jsonb("steps_json").$type<
    Array<{
      name: string;
      status: "queued" | "in_progress" | "completed" | "failed";
      durationSec: number;
      logs: string[];
    }>
  >(),
  apkArtifactName: text("apk_artifact_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

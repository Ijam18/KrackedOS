"use client";

import type { ComponentType, SVGProps } from "react";
import { DiRuby } from "react-icons/di";
import {
  SiCss3,
  SiDocker,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiNpm,
  SiPython,
  SiReact,
  SiRust,
  SiSass,
  SiSvg,
  SiTypescript,
  SiYaml,
} from "react-icons/si";
import {
  VscFile,
  VscFileCode,
  VscFileMedia,
  VscFilePdf,
  VscFolder,
  VscFolderLibrary,
  VscFolderOpened,
  VscGitCommit,
  VscJson,
  VscMarkdown,
  VscPackage,
  VscSettingsGear,
  VscSourceControl,
  VscSymbolNamespace,
  VscTerminalBash,
} from "react-icons/vsc";

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

interface FileIconConfig {
  icon: IconComponent;
  color: string;
}

/** Extension to icon mapping */
const extensionMap: Record<string, FileIconConfig> = {
  // JavaScript/TypeScript
  js: { icon: SiJavascript, color: "#f7df1e" },
  mjs: { icon: SiJavascript, color: "#f7df1e" },
  cjs: { icon: SiJavascript, color: "#f7df1e" },
  jsx: { icon: SiReact, color: "#61dafb" },
  ts: { icon: SiTypescript, color: "#3178c6" },
  tsx: { icon: SiReact, color: "#61dafb" },

  // Web
  html: { icon: SiHtml5, color: "#e34f26" },
  htm: { icon: SiHtml5, color: "#e34f26" },
  css: { icon: SiCss3, color: "#1572b6" },
  scss: { icon: SiSass, color: "#cc6699" },
  sass: { icon: SiSass, color: "#cc6699" },
  less: { icon: SiCss3, color: "#1d365d" },

  // Data formats
  json: { icon: VscJson, color: "#cbcb41" },
  yaml: { icon: SiYaml, color: "#cb171e" },
  yml: { icon: SiYaml, color: "#cb171e" },
  xml: { icon: VscFileCode, color: "#e37933" },
  toml: { icon: VscSettingsGear, color: "#9c4121" },

  // Documentation
  md: { icon: VscMarkdown, color: "#519aba" },
  mdx: { icon: VscMarkdown, color: "#519aba" },
  txt: { icon: VscFile, color: "#6d8086" },

  // Programming languages
  py: { icon: SiPython, color: "#3776ab" },
  rb: { icon: DiRuby, color: "#cc342d" },
  rs: { icon: SiRust, color: "#dea584" },
  go: { icon: SiGo, color: "#00add8" },
  java: { icon: VscSymbolNamespace, color: "#b07219" },
  c: { icon: VscFileCode, color: "#555555" },
  cpp: { icon: VscFileCode, color: "#f34b7d" },
  h: { icon: VscFileCode, color: "#555555" },
  hpp: { icon: VscFileCode, color: "#f34b7d" },

  // Shell
  sh: { icon: VscTerminalBash, color: "#89e051" },
  bash: { icon: VscTerminalBash, color: "#89e051" },
  zsh: { icon: VscTerminalBash, color: "#89e051" },
  fish: { icon: VscTerminalBash, color: "#89e051" },

  // Images
  svg: { icon: SiSvg, color: "#ffb13b" },
  png: { icon: VscFileMedia, color: "#a074c4" },
  jpg: { icon: VscFileMedia, color: "#a074c4" },
  jpeg: { icon: VscFileMedia, color: "#a074c4" },
  gif: { icon: VscFileMedia, color: "#a074c4" },
  webp: { icon: VscFileMedia, color: "#a074c4" },
  ico: { icon: VscFileMedia, color: "#a074c4" },

  // Documents
  pdf: { icon: VscFilePdf, color: "#b30b00" },

  // Config
  env: { icon: VscSettingsGear, color: "#ecd53f" },
  gitignore: { icon: VscGitCommit, color: "#f14e32" },
  dockerignore: { icon: SiDocker, color: "#2496ed" },
  editorconfig: { icon: VscSettingsGear, color: "#e0efef" },
};

/** Exact filename to icon mapping */
const filenameMap: Record<string, FileIconConfig> = {
  "package.json": { icon: SiNpm, color: "#cb3837" },
  "package-lock.json": { icon: SiNpm, color: "#cb3837" },
  "tsconfig.json": { icon: SiTypescript, color: "#3178c6" },
  "jsconfig.json": { icon: SiJavascript, color: "#f7df1e" },
  ".gitignore": { icon: VscGitCommit, color: "#f14e32" },
  ".gitattributes": { icon: VscGitCommit, color: "#f14e32" },
  Dockerfile: { icon: SiDocker, color: "#2496ed" },
  "docker-compose.yml": { icon: SiDocker, color: "#2496ed" },
  "docker-compose.yaml": { icon: SiDocker, color: "#2496ed" },
  ".env": { icon: VscSettingsGear, color: "#ecd53f" },
  ".env.local": { icon: VscSettingsGear, color: "#ecd53f" },
  ".env.development": { icon: VscSettingsGear, color: "#ecd53f" },
  ".env.production": { icon: VscSettingsGear, color: "#ecd53f" },
  "vite.config.js": { icon: VscFileCode, color: "#646cff" },
  "vite.config.ts": { icon: VscFileCode, color: "#646cff" },
  "next.config.js": { icon: VscFileCode, color: "#000000" },
  "next.config.ts": { icon: VscFileCode, color: "#000000" },
  "tailwind.config.js": { icon: VscFileCode, color: "#38bdf8" },
  "tailwind.config.ts": { icon: VscFileCode, color: "#38bdf8" },
  "README.md": { icon: VscMarkdown, color: "#519aba" },
  LICENSE: { icon: VscFile, color: "#d4aa00" },
  "bun.lockb": { icon: VscPackage, color: "#fbf0df" },
  "yarn.lock": { icon: VscPackage, color: "#2c8ebb" },
  "pnpm-lock.yaml": { icon: VscPackage, color: "#f69220" },
};

/** Folder name to icon mapping */
const folderMap: Record<string, { color: string }> = {
  src: { color: "#42a5f5" },
  source: { color: "#42a5f5" },
  lib: { color: "#42a5f5" },
  app: { color: "#42a5f5" },
  pages: { color: "#42a5f5" },
  components: { color: "#66bb6a" },
  hooks: { color: "#ab47bc" },
  utils: { color: "#ffa726" },
  helpers: { color: "#ffa726" },
  styles: { color: "#ec407a" },
  css: { color: "#ec407a" },
  assets: { color: "#ffca28" },
  images: { color: "#ffca28" },
  public: { color: "#26a69a" },
  static: { color: "#26a69a" },
  api: { color: "#ef5350" },
  routes: { color: "#ef5350" },
  config: { color: "#8d6e63" },
  types: { color: "#3178c6" },
  interfaces: { color: "#3178c6" },
  test: { color: "#66bb6a" },
  tests: { color: "#66bb6a" },
  __tests__: { color: "#66bb6a" },
  spec: { color: "#66bb6a" },
  node_modules: { color: "#8bc34a" },
  ".git": { color: "#f14e32" },
  dist: { color: "#78909c" },
  build: { color: "#78909c" },
  out: { color: "#78909c" },
};

const defaultFileConfig: FileIconConfig = { icon: VscFile, color: "#6d8086" };

/**
 * Get the icon component and color for a file
 */
export function getFileIcon(filename: string): FileIconConfig {
  // Check exact filename first
  if (filenameMap[filename]) {
    return filenameMap[filename];
  }

  // Check extension
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && extensionMap[ext]) {
    return extensionMap[ext];
  }

  // Check for dotfiles by extension (e.g., .env.local -> env)
  const parts = filename.split(".");
  if (parts.length > 2) {
    const secondExt = parts[1]?.toLowerCase();
    if (secondExt && extensionMap[secondExt]) {
      return extensionMap[secondExt];
    }
  }

  return defaultFileConfig;
}

/**
 * Get folder icon color based on folder name
 */
export function getFolderColor(folderName: string): string {
  return folderMap[folderName]?.color ?? "#dcb67a";
}

interface FileIconProps {
  filename: string;
  className?: string;
  size?: number;
}

/**
 * React component for rendering a file icon
 */
export function FileIcon({ filename, className, size = 16 }: FileIconProps) {
  const { icon: Icon, color } = getFileIcon(filename);
  return <Icon className={className} style={{ color }} size={size} />;
}

interface FolderIconProps {
  folderName: string;
  isOpen?: boolean;
  className?: string;
  size?: number;
}

/**
 * React component for rendering a folder icon
 */
export function FolderIcon({
  folderName,
  isOpen = false,
  className,
  size = 16,
}: FolderIconProps) {
  const color = getFolderColor(folderName);
  const Icon =
    folderName === "node_modules"
      ? VscPackage
      : folderName === ".git"
        ? VscSourceControl
        : folderName === "src" ||
            folderName === "source" ||
            folderName === "lib"
          ? VscFolderLibrary
          : isOpen
            ? VscFolderOpened
            : VscFolder;

  return <Icon className={className} style={{ color }} size={size} />;
}

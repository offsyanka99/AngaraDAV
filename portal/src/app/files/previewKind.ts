/** In-app file viewer kinds (extension-based; HTML/JS/SVG are text). */
export type FilesPreviewKind = "image" | "pdf" | "text" | "audio" | "video" | "unsupported";

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "jfif",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
  "ico",
  "heic",
  "heif",
]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "oga", "flac", "aac", "m4a", "opus", "weba"]);
const VIDEO_EXT = new Set(["mp4", "m4v", "webm", "ogv", "mov"]);
const TEXT_EXT = new Set([
  "txt",
  "md",
  "markdown",
  "rst",
  "csv",
  "tsv",
  "json",
  "jsonc",
  "xml",
  "yml",
  "yaml",
  "html",
  "htm",
  "xhtml",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "css",
  "scss",
  "less",
  "php",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "sh",
  "bash",
  "zsh",
  "sql",
  "log",
  "ini",
  "conf",
  "cfg",
  "env",
  "toml",
  "diff",
  "patch",
  "vue",
  "svelte",
  "svg",
  "rss",
  "atom",
  "ics",
  "vcf",
  "eml",
  "nfo",
  "rtf",
  "tex",
  "lua",
  "kt",
  "swift",
  "pl",
  "pm",
]);

function extensionOf(name: string): string {
  const base = name.split(/[/\\]/).pop() || name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function classifyFilesPreview(name: string): FilesPreviewKind {
  const ext = extensionOf(name);
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (VIDEO_EXT.has(ext)) return "video";
  if (TEXT_EXT.has(ext)) return "text";
  return "unsupported";
}

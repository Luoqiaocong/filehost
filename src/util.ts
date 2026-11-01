import type { ApiErrorBody, Env } from "./types";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 8 位 base62 随机 id（拒绝采样，避免取模偏差） */
export function generateId(length = 8): string {
  let out = "";
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < 248 && out.length < length) out += BASE62.charAt(b % 62); // 248 = 62*4
    }
  }
  return out;
}

/**
 * 文件名清洗：
 * - 去掉路径分隔符（/ \）与控制字符
 * - 去掉开头的点（不会产生隐藏文件或 ".."）
 * - 限制 200 字符（按 Unicode 码点截断，保留扩展名）
 */
export function sanitizeFilename(input: string): string {
  let name = input
    // 控制字符 + DEL + 常见的不可见双向控制符
    .replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[\\/]/g, "")
    .trim();
  name = name.replace(/^\.+/, "").trim();
  name = truncateKeepExt(name, 200);
  return name === "" ? "file" : name;
}

function truncateKeepExt(name: string, max: number): string {
  const chars = Array.from(name);
  if (chars.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const extLen = Array.from(ext).length;
  if (ext !== "" && extLen <= 20) {
    return chars.slice(0, max - extLen).join("") + ext;
  }
  return chars.slice(0, max).join("");
}

/** 标签：支持数组或逗号（含全角逗号）分隔字符串；去重、去空、限长，存为逗号分隔 */
export function normalizeTags(input: unknown): string {
  let parts: string[] = [];
  if (Array.isArray(input)) {
    parts = input.filter((v): v is string => typeof v === "string");
  } else if (typeof input === "string") {
    parts = input.split(/[,，]/);
  }
  const seen = new Set<string>();
  for (const p of parts) {
    const t = p.replace(/[\u0000-\u001f\u007f,，]/g, "").trim().slice(0, 32);
    if (t !== "") seen.add(t);
    if (seen.size >= 20) break;
  }
  return Array.from(seen).join(",");
}

export function splitTags(tags: string): string[] {
  return tags === "" ? [] : tags.split(",");
}

export function normalizeNote(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 500);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i] ?? "TB"}`;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  bmp: "image/bmp",
  pdf: "application/pdf",
  zip: "application/zip",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  gz: "application/gzip",
  tar: "application/x-tar",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
  htm: "text/html",
  xml: "application/xml",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  webm: "video/webm",
  exe: "application/vnd.microsoft.portable-executable",
  msi: "application/x-msi",
  apk: "application/vnd.android.package-archive",
  dmg: "application/x-apple-diskimage",
  iso: "application/x-iso9660-image",
  deb: "application/vnd.debian.binary-package",
  rpm: "application/x-rpm",
};

export function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/**
 * MIME 推断：扩展名已知时以扩展名为准（不信任客户端自报的类型，
 * 这样 /preview 的白名单判断不会被伪造的 Content-Type 绕过）；
 * 扩展名未知时才采用客户端的 Content-Type，最后兜底 octet-stream。
 */
export function inferMime(name: string, clientType: string | null | undefined): string {
  const byExt = MIME_BY_EXT[fileExt(name)];
  if (byExt) return byExt;
  const t = (clientType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  // curl --data-binary 等客户端会带 form-urlencoded，对文件没有意义，按二进制处理
  if (t === "application/x-www-form-urlencoded" || t.startsWith("multipart/")) return "application/octet-stream";
  if (/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(t)) return t;
  return "application/octet-stream";
}

const TAG_GROUPS: { tag: string; ext: string[] }[] = [
  {
    tag: "图片",
    ext: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "heic", "avif", "tiff", "tif", "psd", "raw"],
  },
  { tag: "视频", ext: ["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv", "m4v", "ts", "mpeg", "mpg", "3gp"] },
  { tag: "音频", ext: ["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus", "ape", "wma", "aiff"] },
  {
    tag: "文档",
    ext: [
      "pdf", "doc", "docx", "rtf", "odt", "pages", "txt", "md", "log", "epub", "mobi",
      "xls", "xlsx", "csv", "ods", "numbers", "ppt", "pptx", "odp", "key", "wps",
    ],
  },
  {
    tag: "代码",
    ext: [
      "json", "xml", "html", "htm", "js", "mjs", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "h", "hpp",
      "go", "rs", "sh", "bash", "yml", "yaml", "css", "scss", "sql", "toml", "ini", "bat", "ps1", "php", "rb",
      "swift", "kt", "vue", "lua",
    ],
  },
  { tag: "压缩包", ext: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz", "zst", "cab"] },
  {
    tag: "安装包",
    ext: ["exe", "msi", "apk", "dmg", "deb", "rpm", "iso", "appimage", "pkg", "ipa", "appx", "crx"],
  },
];

/**
 * 根据扩展名（必要时结合 MIME）自动判定类别标签；
 * 认不出的格式统一落到「其他」，避免出现零散标签。
 */
export function autoTag(name: string, mime: string): string {
  const ext = fileExt(name);
  if (ext !== "") {
    for (const g of TAG_GROUPS) if (g.ext.includes(ext)) return g.tag;
  }
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "图片";
  if (m.startsWith("video/")) return "视频";
  if (m.startsWith("audio/")) return "音频";
  if (m.startsWith("text/") || m === "application/pdf" || m === "application/json" || m === "application/xml") {
    return "文档";
  }
  if (m.startsWith("application/vnd.openxmlformats") || m.startsWith("application/vnd.ms-") || m.startsWith("application/msword")) {
    return "文档";
  }
  if (m.includes("zip") || m.includes("rar") || m.includes("7z") || m.includes("tar") || m.includes("gzip")) {
    return "压缩包";
  }
  if (
    m.includes("msi") || m.includes("portable-executable") || m.includes("android.package") ||
    m.includes("diskimage") || m.includes("iso9660") || m.includes("rpm") || m.includes("debian")
  ) {
    return "安装包";
  }
  return "其他";
}

export function maxUploadBytes(env: Env): number {
  const n = Number(env.MAX_UPLOAD_MB ?? "100");
  const mb = Number.isFinite(n) && n > 0 ? n : 100;
  return Math.floor(Math.min(mb, 100) * 1024 * 1024); // Workers 请求体硬上限 100MB
}

export function jsonError(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

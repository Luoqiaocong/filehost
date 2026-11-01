import { Hono } from "hono";
import { getLiveFile, incrementDownloads, listFiles, stats, tagCounts, toItem } from "../db";
import type { AppEnv } from "../types";
import { jsonError, fileExt } from "../util";

export const publicApi = new Hono<AppEnv>();

/* ---------------- 列表 / 统计 ---------------- */

function intParam(v: string | undefined, def: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

publicApi.get("/api/files", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  const tag = (c.req.query("tag") ?? "").trim().slice(0, 32);
  const page = intParam(c.req.query("page"), 1, 1, 1_000_000);
  const limit = intParam(c.req.query("limit"), 24, 1, 100);
  const [{ items, total }, tags] = await Promise.all([
    listFiles(c.env.DB, { q, tag, page, limit }),
    tagCounts(c.env.DB),
  ]);
  return c.json({ items: items.map(toItem), total, page, limit, tags });
});

publicApi.get("/api/stats", async (c) => {
  return c.json(await stats(c.env.DB));
});

/* ---------------- 下载 ---------------- */

type RangeResult =
  | { kind: "none" }
  | { kind: "ok"; start: number; end: number }
  | { kind: "unsatisfiable" };

/** 解析单区间 Range；多区间或语法非法按规范忽略（返回整个文件） */
function parseRange(header: string | undefined, size: number): RangeResult {
  if (header === undefined) return { kind: "none" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return { kind: "none" };
  const [, a = "", b = ""] = m;
  if (a === "" && b === "") return { kind: "none" };
  if (a === "") {
    const suffix = Number(b);
    if (suffix === 0) return { kind: "unsatisfiable" };
    return { kind: "ok", start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(a);
  if (start >= size) return { kind: "unsatisfiable" };
  const end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  if (end < start) return { kind: "none" };
  return { kind: "ok", start, end };
}

/** 能被浏览器当作可执行/可渲染文档的类型：即使 attachment 也不对外声明，统一当二进制 */
const ACTIVE_CONTENT = /^(text\/(html|xml|javascript|css)|application\/(xhtml\+xml|xml|javascript)|image\/svg\+xml)/i;

function contentDisposition(disposition: "attachment" | "inline", name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]|["\\%;]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

publicApi.get("/d/:id", async (c) => {
  const row = await getLiveFile(c.env.DB, c.req.param("id"));
  if (!row) return c.json(jsonError("not_found", "文件不存在或已删除"), 404);

  const range = parseRange(c.req.header("Range"), row.size);
  if (range.kind === "unsatisfiable") {
    return new Response(JSON.stringify(jsonError("range_not_satisfiable", "请求的范围超出文件大小")), {
      status: 416,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Range": `bytes */${row.size}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const obj =
    range.kind === "ok"
      ? await c.env.BUCKET.get(row.r2_key, {
          range: { offset: range.start, length: range.end - range.start + 1 },
        })
      : await c.env.BUCKET.get(row.r2_key);
  if (!obj) return c.json(jsonError("not_found", "文件数据已丢失"), 404);

  // 下载计数：只数 GET；断点续传的后续分段不重复计数（只数从头开始的请求）
  const isHead = c.req.method === "HEAD";
  const startsAtZero = range.kind === "none" || (range.kind === "ok" && range.start === 0);
  if (!isHead && startsAtZero) {
    c.executionCtx.waitUntil(incrementDownloads(c.env.DB, row.id));
  }

  const headers = new Headers({
    "Content-Type": ACTIVE_CONTENT.test(row.mime) ? "application/octet-stream" : row.mime,
    "Content-Disposition": contentDisposition("attachment", row.name),
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
    ETag: obj.httpEtag,
  });

  if (range.kind === "ok") {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${obj.size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
});

/* ---------------- 预览（仅白名单 MIME） ---------------- */

/** 位图：浏览器可直接 <img> 渲染 */
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp", "image/avif"]);

/** PDF：浏览器内置阅读器渲染。注意不含 svg（可执行脚本）与 html（可执行脚本） */
const TEXT_MIMES = new Set([
  "text/plain", "text/markdown", "text/csv", "text/xml", "text/yaml", "text/x-yaml",
  "application/json", "application/xml",
]);

/** 超过这个大小不做文本预览（避免 Worker 把整份文件读进内存 + 前端卡死） */
const TEXT_PREVIEW_MAX = 2 * 1024 * 1024;

/** 可当纯文本预览的扩展名 */
const TEXT_EXTS = new Set([
  "txt", "md", "markdown", "log", "csv", "tsv", "json", "xml", "yml", "yaml", "toml", "ini", "conf",
  "js", "mjs", "cjs", "ts", "jsx", "tsx", "css", "scss", "less", "html", "htm", "sql", "sh", "bash",
  "bat", "ps1", "py", "rb", "php", "go", "rs", "java", "kt", "swift", "c", "h", "cpp", "hpp", "cs",
  "lua", "vue", "svelte", "dockerfile", "gitignore", "env", "properties", "gradle",
]);

/**
 * 预览判定：返回给浏览器的真实 Content-Type，null 表示不支持预览。
 * 一律按扩展名推出的 MIME（row.mime）判断，不信任上传时的自报类型。
 */
function previewMime(row: { mime: string; name: string }): string | null {
  const ext = fileExt(row.name);
  if (IMAGE_MIMES.has(row.mime)) return row.mime;

  if (ext === "pdf") return "application/pdf";
  if (ext === "svg") return null; // SVG 可以内嵌脚本，绝不 inline

  // 文本类统一按 text/plain 下发，避免被浏览器当成 HTML 执行
  if (TEXT_MIMES.has(row.mime) || ext === "txt" || ext === "md" || ext === "log" || ext === "csv") {
    return "text/plain; charset=utf-8";
  }
  // 代码类扩展名（json/xml/yml/代码文件）按纯文本预览
  if (TEXT_EXTS.has(ext)) return "text/plain; charset=utf-8";
  return null;
}


publicApi.get("/preview/:id", async (c) => {
  const row = await getLiveFile(c.env.DB, c.req.param("id"));
  if (!row) return c.json(jsonError("not_found", "文件不存在或已删除"), 404);

  const type = previewMime(row);
  if (type === null) return c.json(jsonError("unsupported", "该文件类型不支持预览"), 415);

  const isText = type.startsWith("text/plain");
  if (isText && row.size > TEXT_PREVIEW_MAX) {
    return c.json(jsonError("too_large", "文件过大，无法预览，请下载查看"), 413);
  }

  const range = parseRange(c.req.header("Range"), row.size);
  if (range.kind === "unsatisfiable") {
    return new Response(JSON.stringify(jsonError("range_not_satisfiable", "请求的范围超出文件大小")), {
      status: 416,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Range": `bytes */${row.size}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // PDF 阅读器会发 Range 请求，必须支持，否则大 PDF 加载不出来
  const obj =
    range.kind === "ok"
      ? await c.env.BUCKET.get(row.r2_key, { range: { offset: range.start, length: range.end - range.start + 1 } })
      : await c.env.BUCKET.get(row.r2_key);
  if (!obj) return c.json(jsonError("not_found", "文件数据已丢失"), 404);

  const isPdf = type === "application/pdf";
  const headers = new Headers({
    "Content-Type": type, // 只可能来自上述白名单，不会是 html / svg
    "Content-Disposition": contentDisposition("inline", row.name),
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
    ETag: obj.httpEtag,
  });
  // PDF 交给浏览器内置阅读器渲染：不能带 sandbox，也不能用过严的 CSP
  // （会拦掉阅读器自身的 UI 资源）。安全由固定的 application/pdf + nosniff 保证，
  // 浏览器不会把 PDF 当页面执行。文本类则用 sandbox 锁死。
  if (!isPdf) headers.set("Content-Security-Policy", "default-src 'none'; sandbox");

  if (range.kind === "ok") {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${obj.size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
});

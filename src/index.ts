import type { Context } from "hono";
import { Hono } from "hono";
import { adminApi } from "./api/admin";
import { publicApi } from "./api/public";
import { isAdmin } from "./auth";
import type { AppEnv } from "./types";
import { jsonError, maxUploadBytes } from "./util";
import { adminPage } from "./ui/admin";
import { homePage } from "./ui/home";
import { loginPage } from "./ui/login";

const app = new Hono<AppEnv>();

function siteName(c: Context<AppEnv>): string {
  return c.env.SITE_NAME?.trim() || "文件托管";
}

/** 每个请求生成一个 CSP nonce，只有带 nonce 的内联脚本才能执行 */
function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function htmlResponse(render: (nonce: string) => string, noStore = false): Response {
  const nonce = makeNonce();
  return new Response(render(nonce), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": [
        "default-src 'none'",
        `script-src 'nonce-${nonce}'`,
        "style-src 'unsafe-inline'",
        "img-src 'self'",
        "connect-src 'self'",
        /* 预览弹窗用 <iframe> 内嵌同源 /preview/xxx（PDF），必须显式放行 */
        "frame-src 'self'",
        "form-action 'self'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
      ].join("; "),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "Cache-Control": noStore ? "no-store" : "no-cache",
    },
  });
}

app.route("/", publicApi);
app.route("/", adminApi);

/* ---------------- 页面 ---------------- */

/* 站点图标由 public/ 下的静态资源提供（见 wrangler.toml 的 [assets]）：
   /favicon.ico           多尺寸 ICO
   /icon-32.png           页面 logo（小）
   /icon-180.png          页面 logo（大，登录页 / iOS 主屏）
   由于 run_worker_first=true，必须由 Worker 显式转发给 ASSETS。 */
app.get("/apple-touch-icon.png", (c) => c.redirect("/icon-180.png", 302));

const STATIC_RE = /^\/(favicon\.ico|icon-\d+\.png)$/;
app.get("*", async (c, next) => {
  if (STATIC_RE.test(c.req.path)) {
    // 交给静态资源服务；只保留 path，避免边缘把完整 URL 当成不存在的键
    return c.env.ASSETS.fetch(new URL(c.req.path, "https://assets.local").toString());
  }
  return next();
});

app.get("/", (c) => htmlResponse((n) => homePage(siteName(c), n)));

app.get("/login", async (c) => {
  if (await isAdmin(c)) return c.redirect("/admin", 302);
  return htmlResponse((n) => loginPage(siteName(c), n), true);
});

app.get("/admin", async (c) => {
  if (!(await isAdmin(c))) return c.redirect("/login", 302);
  return htmlResponse((n) => adminPage(siteName(c), n, maxUploadBytes(c.env)), true);
});

app.notFound((c) => c.json(jsonError("not_found", "资源不存在"), 404));

app.onError((err, c) => {
  console.error(err);
  return c.json(jsonError("internal_error", "服务器内部错误"), 500);
});

export default app;

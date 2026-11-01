import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { clearLoginFails, getLoginGuard, recordLoginFail } from "./db";
import type { AppEnv, Env } from "./types";
import { jsonError } from "./util";

export const COOKIE_NAME = "fh_session";
export const SESSION_TTL_SEC = 86400;
export const MAX_LOGIN_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  let out = "";
  for (const b of new Uint8Array(buf)) out += b.toString(16).padStart(2, "0");
  return out;
}

/** 恒定时间字符串比较：逐字节异或累加，长度不同也走完整循环，不用 === */
export function constantTimeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

async function sha256Hex(message: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(message)));
}

/** secret 是否配置妥当；不妥当时返回给用户看的错误信息 */
export function configProblem(env: Env): string | null {
  if (!env.ADMIN_PASSWORD) return "未设置 ADMIN_PASSWORD（请用 wrangler secret put 设置，本地开发见 .dev.vars）";
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return "SESSION_SECRET 未设置或少于 32 个字符";
  }
  return null;
}

/** 口令校验：先各自做 SHA-256 再恒定时间比较，不泄露长度 */
export async function verifyPassword(input: string, env: Env): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Hex(input), sha256Hex(env.ADMIN_PASSWORD)]);
  return constantTimeEqual(a, b);
}

/** cookie 值 = `${exp}.${HMAC-SHA256(exp, SESSION_SECRET) hex}`，exp 为秒级时间戳 */
export async function createSession(env: Env): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SEC);
  return `${exp}.${await hmacHex(exp, env.SESSION_SECRET)}`;
}

export async function verifySession(value: string | undefined, env: Env): Promise<boolean> {
  if (!value || env.SESSION_SECRET === undefined || env.SESSION_SECRET.length < 32) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d{1,12}$/.test(exp)) return false;
  const expected = await hmacHex(exp, env.SESSION_SECRET);
  const sigOk = constantTimeEqual(sig, expected);
  const notExpired = Number(exp) > Math.floor(Date.now() / 1000);
  return sigOk && notExpired;
}

export function sessionCookie(value: string): string {
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SEC}`;
}

export function clearedCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function isAdmin(c: Context<AppEnv>): Promise<boolean> {
  return verifySession(getCookie(c, COOKIE_NAME), c.env);
}

/** API 用：未登录返回 401 JSON */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!(await isAdmin(c))) {
    return c.json(jsonError("unauthorized", "需要管理员登录"), 401);
  }
  await next();
};

/** 页面用：未登录 302 到 /login */
export const requireAdminPage: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!(await isAdmin(c))) return c.redirect("/login", 302);
  await next();
};

export function clientIp(c: Context<AppEnv>): string {
  return c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
}

/** 登录限流：连续失败 5 次后锁定 15 分钟。返回剩余锁定秒数，0 表示未锁定 */
export async function lockRemainingSec(db: D1Database, ip: string): Promise<number> {
  const row = await getLoginGuard(db, ip);
  const now = Date.now();
  if (row && row.fails >= MAX_LOGIN_FAILS && row.reset_at > now) {
    return Math.ceil((row.reset_at - now) / 1000);
  }
  return 0;
}

export async function registerLoginFail(db: D1Database, ip: string): Promise<void> {
  await recordLoginFail(db, ip, Date.now(), LOCK_MS);
}

export async function registerLoginSuccess(db: D1Database, ip: string): Promise<void> {
  await clearLoginFails(db, ip);
}

import type { Context } from "hono";
import { Hono } from "hono";
import {
  clearedCookie,
  clientIp,
  configProblem,
  createSession,
  lockRemainingSec,
  registerLoginFail,
  registerLoginSuccess,
  requireAdmin,
  sessionCookie,
  verifyPassword,
} from "../auth";
import {
  deleteFile,
  getFile,
  idExists,
  insertFile,
  listFiles,
  stats,
  tagCounts,
  toItem,
  updateFileMeta,
} from "../db";
import type { AppEnv } from "../types";
import {
  autoTag,
  formatSize,
  generateId,
  inferMime,
  jsonError,
  maxUploadBytes,
  normalizeNote,
  normalizeTags,
  sanitizeFilename,
} from "../util";

export const adminApi = new Hono<AppEnv>();

async function readJson(c: Context<AppEnv>): Promise<Record<string, unknown> | null> {
  try {
    const v: unknown = await c.req.json();
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* ---------------- 登录 / 退出 ---------------- */

adminApi.post("/api/login", async (c) => {
  const problem = configProblem(c.env);
  if (problem) return c.json(jsonError("server_misconfigured", problem), 500);

  const ip = clientIp(c);
  const remaining = await lockRemainingSec(c.env.DB, ip);
  if (remaining > 0) {
    return c.json(
      jsonError("too_many_attempts", `失败次数过多，请 ${Math.ceil(remaining / 60)} 分钟后重试（剩余 ${remaining} 秒）`),
      429,
      { "Retry-After": String(remaining) },
    );
  }

  const body = await readJson(c);
  const password = body?.password;
  if (typeof password !== "string" || password === "" || password.length > 1024) {
    return c.json(jsonError("bad_request", "请提供 password"), 400);
  }

  if (!(await verifyPassword(password, c.env))) {
    await registerLoginFail(c.env.DB, ip);
    return c.json(jsonError("invalid_credentials", "口令错误"), 401);
  }
  await registerLoginSuccess(c.env.DB, ip);
  c.header("Set-Cookie", sessionCookie(await createSession(c.env)));
  return c.json({ ok: true });
});

adminApi.post("/api/logout", (c) => {
  c.header("Set-Cookie", clearedCookie());
  return c.json({ ok: true });
});

/* ---------------- 上传：裸二进制 PUT，流式转发到 R2 ---------------- */

adminApi.put("/api/upload", requireAdmin, async (c) => {
  const max = maxUploadBytes(c.env);
  const maxLabel = formatSize(max);

  // 先用 Content-Length 校验，超了在读取 body 之前就拒绝
  const lenHeader = c.req.header("Content-Length");
  if (lenHeader === undefined || !/^\d+$/.test(lenHeader)) {
    return c.json(jsonError("length_required", "上传请求必须带 Content-Length"), 411);
  }
  const declared = Number(lenHeader);
  if (declared > max) {
    return c.json(
      jsonError("payload_too_large", `文件大小 ${formatSize(declared)} 超过上限 ${maxLabel}（Workers 请求体硬上限 100MB）`),
      413,
    );
  }
  if (declared === 0) return c.json(jsonError("bad_request", "不能上传空文件"), 400);

  const rawName = c.req.query("name");
  if (rawName === undefined || rawName.trim() === "") {
    return c.json(jsonError("bad_request", "缺少 name 参数"), 400);
  }
  const name = sanitizeFilename(rawName);
  const mime = inferMime(name, c.req.header("Content-Type"));
  const tags = autoTag(name, mime); // 按扩展名自动归类，认不出就落到「其他」
  const note = "";

  const body = c.req.raw.body;
  if (body === null) return c.json(jsonError("bad_request", "请求体为空"), 400);

  let id = generateId();
  for (let i = 0; i < 5 && (await idExists(c.env.DB, id)); i++) id = generateId();
  const key = `${id}/${name}`;

  // 流式直传：绝不调用 formData() / arrayBuffer()
  const obj = await c.env.BUCKET.put(key, body, { httpMetadata: { contentType: mime } });

  // 二次保险：以 R2 实际收到的字节数为准
  if (obj.size > max) {
    await c.env.BUCKET.delete(key);
    return c.json(jsonError("payload_too_large", `文件大小 ${formatSize(obj.size)} 超过上限 ${maxLabel}`), 413);
  }

  try {
    await insertFile(c.env.DB, { id, name, r2_key: key, size: obj.size, mime, tags, note, created_at: Date.now() });
  } catch (err) {
    await c.env.BUCKET.delete(key); // 元数据写失败，不留孤儿对象
    throw err;
  }
  const row = await getFile(c.env.DB, id);
  return c.json({ id, url: `/d/${id}`, item: row ? toItem(row) : null });
});

/* ---------------- 编辑 / 删除 ---------------- */

adminApi.patch("/api/files/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await readJson(c);
  if (!body) return c.json(jsonError("bad_request", "请求体必须是 JSON 对象"), 400);

  const patch: { name?: string; tags?: string; note?: string } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return c.json(jsonError("bad_request", "name 必须是非空字符串"), 400);
    }
    patch.name = sanitizeFilename(body.name);
  }
  if (body.tags !== undefined) {
    if (typeof body.tags !== "string" && !Array.isArray(body.tags)) {
      return c.json(jsonError("bad_request", "tags 必须是字符串或数组"), 400);
    }
    patch.tags = normalizeTags(body.tags);
  }
  if (body.note !== undefined) {
    if (typeof body.note !== "string") return c.json(jsonError("bad_request", "note 必须是字符串"), 400);
    patch.note = normalizeNote(body.note);
  }
  if (Object.keys(patch).length === 0) {
    return c.json(jsonError("bad_request", "没有可更新的字段（name / tags / note）"), 400);
  }

  const row = await getFile(c.env.DB, id);
  if (!row) return c.json(jsonError("not_found", "文件不存在"), 404);
  await updateFileMeta(c.env.DB, id, patch);
  const updated = await getFile(c.env.DB, id);
  return c.json({ item: updated ? toItem(updated) : null });
});

adminApi.delete("/api/files/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const row = await getFile(c.env.DB, id);
  if (!row || row.deleted_at !== null) return c.json(jsonError("not_found", "文件不存在"), 404);
  await c.env.BUCKET.delete(row.r2_key); // 先删对象；失败则抛 500，元数据保持不变
  await deleteFile(c.env.DB, id); // 记录一起删掉，列表里不会残留
  return c.json({ ok: true });
});

adminApi.post("/api/files/bulk-delete", requireAdmin, async (c) => {
  const body = await readJson(c);
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
    return c.json(jsonError("bad_request", "ids 必须是 1~200 个文件 id"), 400);
  }
  if (!ids.every((v): v is string => typeof v === "string")) {
    return c.json(jsonError("bad_request", "ids 必须全是字符串"), 400);
  }
  let deleted = 0;
  for (const id of ids) {
    const row = await getFile(c.env.DB, id);
    if (!row || row.deleted_at !== null) continue;
    await c.env.BUCKET.delete(row.r2_key);
    await deleteFile(c.env.DB, id);
    deleted++;
  }
  return c.json({ ok: true, deleted });
});

adminApi.get("/api/admin/files", requireAdmin, async (c) => {
  const page = Math.max(1, Number.parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = 10;
  const tag = (c.req.query("tag") ?? "").trim().slice(0, 32);
  const [{ items, total }, s, tags] = await Promise.all([
    listFiles(c.env.DB, { q: "", tag, page, limit }),
    stats(c.env.DB),
    tagCounts(c.env.DB),
  ]);
  return c.json({ items: items.map(toItem), total, page, limit, stats: s, tags });
});

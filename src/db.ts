import type { FileItem, FileRow, LoginGuardRow, TagCount } from "./types";
import { splitTags } from "./util";

/** 把一行数据转成前端可见的结构（去掉 r2_key，tags 拆成数组） */
export function toItem(r: FileRow): FileItem {
  return {
    id: r.id,
    name: r.name,
    size: r.size,
    mime: r.mime,
    tags: splitTags(r.tags),
    note: r.note,
    downloads: r.downloads,
    created_at: r.created_at,
    deleted_at: r.deleted_at,
  };
}

/** LIKE 通配符转义，配合 ESCAPE '\' 使用 */
function likeEscape(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/* ---------------- files ---------------- */

export async function getFile(db: D1Database, id: string): Promise<FileRow | null> {
  return db.prepare("SELECT * FROM files WHERE id = ?").bind(id).first<FileRow>();
}

export async function getLiveFile(db: D1Database, id: string): Promise<FileRow | null> {
  return db.prepare("SELECT * FROM files WHERE id = ? AND deleted_at IS NULL").bind(id).first<FileRow>();
}

export interface ListQuery {
  q: string;
  tag: string;
  page: number;
  limit: number;
}

export async function listFiles(
  db: D1Database,
  { q, tag, page, limit }: ListQuery,
): Promise<{ items: FileRow[]; total: number }> {
  const where: string[] = ["deleted_at IS NULL"];
  const params: (string | number)[] = [];
  if (q !== "") {
    where.push("name LIKE ? ESCAPE '\\'");
    params.push(`%${likeEscape(q)}%`);
  }
  if (tag !== "") {
    where.push("(',' || tags || ',') LIKE ? ESCAPE '\\'");
    params.push(`%,${likeEscape(tag)},%`);
  }
  const w = where.join(" AND ");
  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM files WHERE ${w}`)
    .bind(...params)
    .first<{ n: number }>();
  const { results } = await db
    .prepare(`SELECT * FROM files WHERE ${w} ORDER BY created_at DESC, id LIMIT ? OFFSET ?`)
    .bind(...params, limit, (page - 1) * limit)
    .all<FileRow>();
  return { items: results, total: totalRow?.n ?? 0 };
}

export async function tagCounts(db: D1Database): Promise<TagCount[]> {
  const { results } = await db
    .prepare("SELECT tags FROM files WHERE deleted_at IS NULL AND tags != ''")
    .all<{ tags: string }>();
  const counts = new Map<string, number>();
  for (const r of results) {
    for (const t of splitTags(r.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export async function stats(
  db: D1Database,
): Promise<{ files: number; totalSize: number; totalDownloads: number }> {
  const r = await db
    .prepare(
      "SELECT COUNT(*) AS files, COALESCE(SUM(size), 0) AS totalSize, COALESCE(SUM(downloads), 0) AS totalDownloads FROM files WHERE deleted_at IS NULL",
    )
    .first<{ files: number; totalSize: number; totalDownloads: number }>();
  return r ?? { files: 0, totalSize: 0, totalDownloads: 0 };
}

export async function idExists(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare("SELECT 1 AS x FROM files WHERE id = ?").bind(id).first();
  return r !== null;
}

export async function insertFile(db: D1Database, f: Omit<FileRow, "downloads" | "deleted_at">): Promise<void> {
  await db
    .prepare(
      "INSERT INTO files (id, name, r2_key, size, mime, tags, note, downloads, created_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)",
    )
    .bind(f.id, f.name, f.r2_key, f.size, f.mime, f.tags, f.note, f.created_at)
    .run();
}

export async function updateFileMeta(
  db: D1Database,
  id: string,
  patch: { name?: string; tags?: string; note?: string },
): Promise<void> {
  const sets: string[] = [];
  const params: string[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    params.push(patch.name);
  }
  if (patch.tags !== undefined) {
    sets.push("tags = ?");
    params.push(patch.tags);
  }
  if (patch.note !== undefined) {
    sets.push("note = ?");
    params.push(patch.note);
  }
  if (sets.length === 0) return;
  await db
    .prepare(`UPDATE files SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params, id)
    .run();
}

/** 彻底删除记录（R2 对象已在路由里删除），删除后不会残留在任何列表里 */
export async function deleteFile(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM files WHERE id = ?").bind(id).run();
}

export async function incrementDownloads(db: D1Database, id: string): Promise<void> {
  await db.prepare("UPDATE files SET downloads = downloads + 1 WHERE id = ?").bind(id).run();
}

/* ---------------- login_guard ---------------- */

export async function getLoginGuard(db: D1Database, ip: string): Promise<LoginGuardRow | null> {
  return db.prepare("SELECT * FROM login_guard WHERE ip = ?").bind(ip).first<LoginGuardRow>();
}

/** 原子 upsert：窗口过期则从 1 重新计数，否则 +1；每次失败都把解锁时间推到 now + lockMs */
export async function recordLoginFail(db: D1Database, ip: string, now: number, lockMs: number): Promise<void> {
  await db
    .prepare(
      `INSERT INTO login_guard (ip, fails, reset_at) VALUES (?1, 1, ?2)
       ON CONFLICT(ip) DO UPDATE SET
         fails = CASE WHEN reset_at <= ?3 THEN 1 ELSE fails + 1 END,
         reset_at = ?2`,
    )
    .bind(ip, now + lockMs, now)
    .run();
}

export async function clearLoginFails(db: D1Database, ip: string): Promise<void> {
  await db.prepare("DELETE FROM login_guard WHERE ip = ?").bind(ip).run();
}

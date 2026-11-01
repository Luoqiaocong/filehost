/** Worker 绑定与环境变量 */
export interface Env {
  BUCKET: R2Bucket;
  DB: D1Database;
  /** 静态资源（public/ 目录，见 wrangler.toml 的 [assets]） */
  ASSETS: Fetcher;
  /** Secret：管理员口令 */
  ADMIN_PASSWORD: string;
  /** Secret：会话签名密钥，32 位以上 */
  SESSION_SECRET: string;
  /** 普通变量 */
  SITE_NAME?: string;
  MAX_UPLOAD_MB?: string;
}

export type AppEnv = { Bindings: Env };

/** files 表的一行（与 D1 列一一对应） */
export interface FileRow {
  id: string;
  name: string;
  r2_key: string;
  size: number;
  mime: string;
  tags: string;
  note: string;
  downloads: number;
  created_at: number;
  deleted_at: number | null;
}

/** 返回给前端的文件（不暴露 r2_key） */
export interface FileItem {
  id: string;
  name: string;
  size: number;
  mime: string;
  tags: string[];
  note: string;
  downloads: number;
  created_at: number;
  deleted_at: number | null;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface LoginGuardRow {
  ip: string;
  fails: number;
  reset_at: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

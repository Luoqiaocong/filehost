-- 文件元数据
CREATE TABLE IF NOT EXISTS files (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  r2_key     TEXT NOT NULL,
  size       INTEGER NOT NULL,
  mime       TEXT NOT NULL,
  tags       TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  downloads  INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files (deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_tags       ON files (tags);

-- 登录防暴力破解
CREATE TABLE IF NOT EXISTS login_guard (
  ip       TEXT PRIMARY KEY,
  fails    INTEGER NOT NULL DEFAULT 0,
  reset_at INTEGER NOT NULL
);

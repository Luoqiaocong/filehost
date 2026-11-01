#!/usr/bin/env node
// 一次性初始化：创建 R2 桶 + D1 库，并把真实的 database_id 回填进 wrangler.toml。
// 需要先 `npx wrangler login`。如果本脚本跑不通，按 README「手动部署」里的三条命令做即可。
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tomlPath = join(root, "wrangler.toml");
let toml = readFileSync(tomlPath, "utf8");

const bucketName = /bucket_name\s*=\s*"([^"]+)"/.exec(toml)?.[1];
const dbName = /database_name\s*=\s*"([^"]+)"/.exec(toml)?.[1];
if (!bucketName || !dbName) fail("无法从 wrangler.toml 读取 bucket_name / database_name");

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function wrangler(args) {
  const r = spawnSync("npx", ["wrangler", ...args], { cwd: root, encoding: "utf8", shell: true });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

function fail(msg) {
  console.error(`\n✘ ${msg}`);
  console.error("  退化方案：手动执行 README 中「手动部署」的三条命令，并把 database_id 填进 wrangler.toml。");
  process.exit(1);
}

// 1) R2 桶
console.log(`→ 创建 R2 桶 ${bucketName} …`);
const r2 = wrangler(["r2", "bucket", "create", bucketName]);
if (r2.ok) console.log("  ✔ 已创建");
else if (/already exists|10004/i.test(r2.out)) console.log("  ✔ 已存在，跳过");
else fail(`创建 R2 桶失败：\n${r2.out}`);

// 2) D1 库
console.log(`→ 创建 D1 数据库 ${dbName} …`);
let dbId = null;
const d1 = wrangler(["d1", "create", dbName]);
if (d1.ok) dbId = UUID.exec(d1.out)?.[0] ?? null;
if (!dbId) {
  // 可能已存在：从列表里按名字找
  const list = wrangler(["d1", "list", "--json"]);
  if (list.ok) {
    try {
      const start = list.out.indexOf("[");
      const rows = JSON.parse(list.out.slice(start, list.out.lastIndexOf("]") + 1));
      dbId = rows.find((x) => x.name === dbName)?.uuid ?? null;
    } catch {
      /* 解析失败，走下面的 fail */
    }
  }
}
if (!dbId) fail(`没能拿到 database_id。wrangler 输出：\n${d1.out}`);
console.log(`  ✔ database_id = ${dbId}`);

// 3) 回填 wrangler.toml
toml = toml.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${dbId}"`);
writeFileSync(tomlPath, toml);
console.log("→ 已写入 wrangler.toml");

console.log(`
下一步：
  npm run db:remote                        # 建表
  npx wrangler secret put ADMIN_PASSWORD   # 管理员口令
  npx wrangler secret put SESSION_SECRET   # 32 位以上随机字符
  npm run deploy
`);

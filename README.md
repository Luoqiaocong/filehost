# filehost · 私有文件托管

跑在 Cloudflare Workers 上的私有文件托管：**只有管理员能上传、编辑、删除，访客无需登录即可浏览、预览和下载**。

文件实体存 R2，元数据存 D1，前端是 Worker 直接返回的 HTML + 原生 CSS/JS——**没有构建步骤、没有前端框架、没有 CDN 依赖**，改完代码 `wrangler deploy` 即生效。

## 功能

**访客端**

- 浏览文件列表，支持关键词搜索、按标签筛选、分页（每页 24 个）
- 上传后按扩展名**自动归类**：图片 / 视频 / 音频 / 文档 / 代码 / 压缩包 / 安装包 / 其他
- **在线预览**：图片、PDF、纯文本（含 markdown、csv、json、代码等），其余格式点击直接下载
- 每个文件都有常驻下载按钮，下载走 Worker 代理，支持 `Range` 断点续传

**管理端**（`/admin`，口令登录）

- 拖拽或选择文件后**自动开始上传**，支持多选批量上传，队列显示进度
- 按标签筛选（含「全部」及各分类数量），分页每页 10 个
- 表格多选 + 批量删除，也可单个编辑文件名 / 标签 / 备注、预览、下载
- **删除即彻底消失**：同时清掉 R2 对象和 D1 记录，不留回收站，列表里不会残留

**界面**

- 苹果设计语言：系统字体栈、`#007AFF` 主色、克制的阴影与圆角、毛玻璃对话框
- 完整适配浅色 / 深色模式（跟随系统）和移动端
- 站点图标与页面 logo 使用 `public/` 下的静态资源

## 技术栈

Cloudflare Workers · Hono（TypeScript strict）· R2 · D1 · wrangler

## 快速部署

前置：Node.js 18+、一个 Cloudflare 账号（R2 需在控制台开通一次）。

```bash
git clone https://github.com/Luoqiaocong/filehost.git && cd filehost
npm install
npx wrangler login

npm run setup                            # 创建 R2 桶 + D1 库，并把 database_id 回填进 wrangler.toml
npm run db:remote                        # 建表
npx wrangler secret put ADMIN_PASSWORD   # 管理员口令
npx wrangler secret put SESSION_SECRET   # 会话签名密钥，至少 32 个字符
npm run deploy
```

生成 `SESSION_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 手动部署

`npm run setup` 跑不通时，逐步来：

```bash
npx wrangler r2 bucket create filehost-bucket
npx wrangler d1 create filehost-db        # 把输出里的 database_id 填进 wrangler.toml
npx wrangler d1 migrations apply filehost-db --remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npm run deploy
```

### 绑定自定义域名

在 Cloudflare 控制台进入 Workers → 该项目 → **Settings → Domains & Routes → Add → Custom Domain**，填入已托管在 Cloudflare 的域名即可，证书自动签发。

## 本地开发

```bash
cp .dev.vars.example .dev.vars   # 编辑里面的管理员口令
npm run db:local                 # 本地 D1 建表
npm run dev                      # http://127.0.0.1:8787
```

> Windows 注意：项目路径含中文等非 ASCII 字符时，`wrangler dev` 可能因 workerd 创建目录失败而启动不了，把项目放到纯英文路径下即可。

类型检查：`npm run typecheck`。

## 配置

| 名称 | 类型 | 说明 |
|---|---|---|
| `ADMIN_PASSWORD` | Secret | 管理员口令，唯一登录凭据 |
| `SESSION_SECRET` | Secret | 会话签名密钥，**至少 32 个字符** |
| `SITE_NAME` | `[vars]` | 站点名称，默认 `文件托管` |
| `MAX_UPLOAD_MB` | `[vars]` | 上传上限，默认 `100`。Workers 请求体硬上限是 100MB，代码里会把更大的值截断为 100 |
| `BUCKET` | R2 binding | 存放文件实体，默认桶名 `filehost-bucket` |
| `DB` | D1 binding | 存放元数据，默认库名 `filehost-db` |
| `ASSETS` | Assets binding | `public/` 下的静态资源（站点图标） |

## 接口

公开：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/` | 文件列表页 |
| GET | `/login` | 登录页（已登录则 302 到 `/admin`） |
| GET | `/api/files?q=&tag=&page=1&limit=24` | 列表，返回 `{ items, total, page, limit, tags }` |
| GET | `/api/stats` | `{ files, totalSize, totalDownloads }` |
| GET | `/d/:id` | 下载，支持 `Range`（206 / 416），`downloads + 1` |
| GET | `/preview/:id` | 预览，支持图片 / PDF / 纯文本，其余返回 415 |

管理（需登录，cookie 会话）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin` | 管理页（未登录 302 到 `/login`） |
| POST | `/api/login` · `/api/logout` | 登录 · 退出 |
| PUT | `/api/upload?name=<encodeURIComponent(文件名)>` | 裸二进制上传，body 就是文件本身 |
| GET | `/api/admin/files?tag=&page=1` | 管理列表，每页 10 条，返回 `{ items, total, page, limit, stats, tags }` |
| PATCH | `/api/files/:id` | `{ name?, tags?, note? }` |
| DELETE | `/api/files/:id` | 彻底删除（R2 对象 + D1 记录） |
| POST | `/api/files/bulk-delete` | `{ "ids": ["...", ...] }`，一次 1~200 个 |

错误统一为 `{ "error": { "code": "...", "message": "..." } }`。

命令行上传示例：

```bash
curl -c jar.txt -X POST https://your.site/api/login \
  -H 'Content-Type: application/json' -d '{"password":"..."}'

curl -b jar.txt -X PUT "https://your.site/api/upload?name=setup.exe" \
  -H 'Content-Type: application/octet-stream' --data-binary @setup.exe
```

标签由服务端按扩展名自动判定，上传时**不需要**传 `tags`；备注默认为空，可在管理端编辑。

## 预览支持范围

| 类型 | 扩展名 | 渲染方式 |
|---|---|---|
| 图片 | png jpg jpeg gif webp bmp avif | 弹窗内 `<img>` 直接显示 |
| PDF | pdf | 弹窗内 `<iframe>`，交给浏览器内置阅读器（支持翻页 / 缩放 / Range 分段加载） |
| 纯文本 | txt md log csv json xml yml yaml 及各类代码文件 | 等宽字体展示，可选中复制 |

其余格式（zip、exe、msi、mp4、docx、svg、heic……）不提供在线预览，点击直接下载。

- 文本预览限制 **2 MB**，超出提示下载
- **SVG 与 HTML 永不 inline**（可执行脚本），只能下载
- 文本类一律以 `text/plain; charset=utf-8` 下发，前端用 `textContent` 渲染，把 `<script>` 存成 `.txt` 也只会显示成文字

## 设计要点与限制

- **下载**：`GET /d/:id` → `BUCKET.get(key, { range })` → 直接把 `ReadableStream` 返回。没有预签名 URL，所以不需要 S3 密钥，下载一定经过 Worker 计数。只有「没带 Range」或「Range 从 0 开始」的请求才计一次，断点续传的后续分段不重复计数。
- **上传大小**：Workers 请求体硬上限 100MB。先用 `Content-Length` 校验（缺失 411、超限 413），上传完成后再用 R2 实际字节数复核。更大的文件需要分片上传，本项目刻意不做。
- **自动标签**：`autoTag(name, mime)` 按扩展名映射到固定分类；扩展名认不出时再按 MIME 判断，仍认不出就统一落到「其他」，保证标签集合不会发散。
- **安全**：
  - 下载响应统一 `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` + `Content-Security-Policy: default-src 'none'; sandbox`；html / svg / xml / js 类型的 `Content-Type` 一律降级为 `application/octet-stream`。
  - 预览按**扩展名**判类型，不信任客户端自报 MIME，避免伪造 `Content-Type` 绕过白名单。
  - 页面 CSP 使用逐请求 nonce，只允许带 nonce 的内联脚本执行；`frame-src 'self'` 仅放行同源 iframe（PDF 预览用）。
  - 文件名：去路径分隔符、控制字符、开头的点，限 200 字符；R2 key 为 `${id}/${safeName}`，id 是 8 位 base62 随机串（拒绝采样，避免取模偏差）。
  - 会话：自实现 HMAC-SHA256 cookie（`HttpOnly; Secure; SameSite=Lax`），恒定时间比较口令哈希。
  - 登录限流：同一 IP 连续失败 5 次后锁定 15 分钟（第 6 次起返回 429 和剩余秒数），IP 取自 `CF-Connecting-IP`。
- **没有**：多用户 / 权限系统 / ORM / 分片上传 / 回收站 / 测试框架 / Dockerfile。

## 目录结构

```
├─ wrangler.toml             Worker、R2、D1、静态资源绑定
├─ migrations/0001_init.sql  files + login_guard 两张表
├─ public/                   站点图标：favicon.ico · icon-32.png · icon-180.png
├─ scripts/setup.mjs         创建 R2 桶 + D1 库并回填 database_id
├─ scripts/backfill.sql      历史文件按扩展名补齐标签
└─ src/
   ├─ index.ts               Hono 入口、页面路由、CSP、静态资源转发
   ├─ types.ts · util.ts     类型 · id / 文件名 / MIME / 自动标签等工具
   ├─ auth.ts                口令校验、HMAC 会话、登录限流
   ├─ db.ts                  D1 查询封装（无 ORM）
   ├─ api/public.ts          列表、统计、下载、预览
   ├─ api/admin.ts           登录、上传、编辑、删除、批量删除、管理列表
   └─ ui/                    layout（外壳 + CSS）· home · login · admin
```

## 许可

MIT

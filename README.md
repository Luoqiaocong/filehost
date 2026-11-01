# filehost

跑在 Cloudflare Workers 上的私有文件托管：**只有管理员能上传和管理，访客免登录浏览、预览、下载**。

文件存 R2，元数据存 D1，页面由 Worker 直接返回 HTML + 原生 CSS/JS。没有构建步骤，改完 `wrangler deploy` 即生效。

## 功能

- 访客端：搜索、按标签筛选、分页；图片 / PDF / 纯文本在线预览，其余格式点击直接下载
- 管理端：拖拽或选择后自动上传（支持多选）、批量删除、编辑名称与备注、删除即彻底清除
- 上传时按扩展名自动打标签（图片 / 视频 / 音频 / 文档 / 代码 / 压缩包 / 安装包 / 其他）
- 下载走 Worker 代理，支持 `Range` 断点续传并计数
- 苹果设计语言界面，适配深色模式与移动端

## 部署

需要 Node.js 18+ 和 Cloudflare 账号（R2 先在控制台开通一次）。

```bash
git clone https://github.com/Luoqiaocong/filehost.git && cd filehost
npm install && npx wrangler login

npm run setup                            # 创建 R2 桶与 D1 库，回填 database_id
npm run db:remote                        # 建表
npx wrangler secret put ADMIN_PASSWORD   # 管理员口令
npx wrangler secret put SESSION_SECRET   # 会话密钥，≥32 字符
npm run deploy
```

`SESSION_SECRET` 可以用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成。

`npm run setup` 失败时可以参考 `scripts/setup.mjs` 里的 `wrangler` 命令手动执行。自定义域名在控制台 **Workers → Settings → Domains & Routes → Add → Custom Domain** 绑定。

## 本地开发

```bash
cp .dev.vars.example .dev.vars   # 填管理员口令
npm run db:local && npm run dev  # http://127.0.0.1:8787
```

## 配置

| 名称 | 类型 | 说明 |
|---|---|---|
| `ADMIN_PASSWORD` | Secret | 管理员口令，唯一登录凭据 |
| `SESSION_SECRET` | Secret | 会话签名密钥，≥32 字符 |
| `SITE_NAME` | var | 站点名称，默认 `文件托管` |
| `MAX_UPLOAD_MB` | var | 上传上限，默认 `100`（Workers 请求体硬上限） |
| `BUCKET` / `DB` / `ASSETS` | binding | R2 桶 / D1 库 / `public/` 静态资源 |

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/files?q=&tag=&page=` | 公开列表 |
| GET | `/api/stats` | 文件数、总大小、总下载次数 |
| GET | `/d/:id` · `/preview/:id` | 下载 · 预览（不支持的类型返回 415） |
| POST | `/api/login` · `/api/logout` | 登录 · 退出 |
| PUT | `/api/upload?name=<文件名>` | 裸二进制上传，body 即文件 |
| PATCH | `/api/files/:id` | 改名称 / 标签 / 备注 |
| DELETE | `/api/files/:id` · `POST /api/files/bulk-delete` | 单个 / 批量删除 |

错误统一返回 `{ "error": { "code", "message" } }`。

## 说明

- 上传大小以 `Content-Length` 预检并用 R2 实际字节数复核；更大的文件需分片上传，本项目不做
- 下载与预览一律按扩展名判类型，不信任客户端 MIME；SVG / HTML 只下载不内联
- 会话为自实现 HMAC-SHA256 cookie，同一 IP 连续失败 5 次锁定 15 分钟
- 没有多用户、权限系统、ORM、回收站、测试

## 许可

MIT

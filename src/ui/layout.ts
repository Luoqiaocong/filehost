/** HTML 外壳 + 全部 CSS（Apple 设计语言；无外部资源，离线自持） */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 品牌 Logo：苹果蓝渐变圆角方块 + 云朵 */
/** 站点图标：使用用户提供的原图（public/icon-*.png）。
 *  large=true 时用 180px 高清版（登录页 60px 展示，避免模糊）。 */
export function logoMarkup(large = false): string {
  const src = large ? "/icon-180.png" : "/icon-32.png";
  return `<img class="logo" src="${src}" width="26" height="26" alt="" decoding="async">`;
}
export const LOGO = logoMarkup(false);

export const CSS = String.raw`
/* ===================== 设计令牌 ===================== */
:root{
  color-scheme:light dark;
  --bg:#f5f5f7;
  --surface:#ffffff;
  --surface-2:#fafafc;
  --surface-3:#f2f2f5;
  --text:#1d1d1f;
  --text-2:#6e6e73;
  --text-3:#8e8e93;
  --line:rgba(60,60,67,.11);
  --line-2:rgba(60,60,67,.2);
  --fill:rgba(120,120,128,.1);
  --fill-2:rgba(120,120,128,.16);
  --fill-3:rgba(120,120,128,.24);
  --blue:#007aff;
  --blue-h:#0069e6;
  --blue-soft:rgba(0,122,255,.12);
  --red:#e8332a;
  --red-soft:rgba(255,59,48,.1);
  --green:#248a3d;
  --green-soft:rgba(52,199,89,.16);
  --glass:rgba(255,255,255,.78);
  --hl:rgba(255,255,255,.8);
  --shadow-1:0 .5px 1px rgba(0,0,0,.03),0 1px 3px rgba(0,0,0,.032),0 0 0 .5px rgba(0,0,0,.038);
  --shadow-2:0 1px 2px rgba(0,0,0,.03),0 9px 22px -10px rgba(0,0,0,.16),0 0 0 .5px rgba(0,0,0,.05);
  --shadow-modal:0 1px 2px rgba(0,0,0,.04),0 14px 34px -12px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.05);
  --r-sm:8px;--r-md:10px;--r-lg:12px;--r-xl:14px;--r-2xl:20px;
  --dur:.22s;
  --ease:cubic-bezier(.2,.8,.2,1);
  --font:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",Roboto,Helvetica,Arial,sans-serif;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#000;
    --surface:#1c1c1e;
    --surface-2:#232325;
    --surface-3:#2c2c2e;
    --text:#f5f5f7;
    --text-2:#a1a1a6;
    --text-3:#8e8e93;
    --line:rgba(255,255,255,.09);
    --line-2:rgba(255,255,255,.17);
    --fill:rgba(120,120,128,.2);
    --fill-2:rgba(120,120,128,.28);
    --fill-3:rgba(120,120,128,.38);
    --blue:#0a84ff;
    --blue-h:#409cff;
    --blue-soft:rgba(10,132,255,.2);
    --red:#ff453a;
    --red-soft:rgba(255,69,58,.16);
    --green:#30d158;
    --green-soft:rgba(48,209,88,.18);
    --glass:rgba(28,28,30,.76);
    --hl:rgba(255,255,255,.12);
    --shadow-1:0 0 0 .5px rgba(255,255,255,.08);
    --shadow-2:0 9px 24px -10px rgba(0,0,0,.8),0 0 0 .5px rgba(255,255,255,.1);
    --shadow-modal:0 16px 40px -14px rgba(0,0,0,.85),0 0 0 .5px rgba(255,255,255,.11);
  }
  body{background-image:radial-gradient(72% 42% at 50% -8%,rgba(10,132,255,.14),rgba(10,132,255,0) 60%)}
  .search{background:linear-gradient(180deg,#2c2c2e,#1c1c1e);border-color:rgba(255,255,255,.12)}
  .search:focus-within{border-color:rgba(10,132,255,.6)}
}

/* ===================== 基础 ===================== */
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
body{margin:0;background-color:var(--bg);background-image:radial-gradient(72% 42% at 50% -8%,rgba(0,122,255,.07),rgba(0,122,255,0) 62%);background-repeat:no-repeat;background-attachment:fixed;color:var(--text);font:15px/1.5 var(--font);letter-spacing:-.011em;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden}
[hidden]{display:none!important}
a{color:var(--blue);text-decoration:none}
button,input,textarea,select{font:inherit;color:inherit;letter-spacing:inherit}
button{-webkit-appearance:none;appearance:none}
svg{display:block}
img{max-width:100%}
::selection{background:var(--blue-soft)}
@supports (scrollbar-width:thin){*{scrollbar-width:thin;scrollbar-color:rgba(120,120,128,.45) transparent}}

/* 布局工具类（与 Tailwind 同名，保持标记干净） */
.flex{display:flex}
.items-center{align-items:center}
.justify-between{justify-content:space-between}
.gap-2{gap:8px}
.gap-3{gap:12px}
.grow{flex:1;min-width:0}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.w-full{width:100%}
.muted{color:var(--text-2)}
.small{font-size:13px}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px}

/* ===================== 导航 ===================== */
.nav{position:sticky;top:0;z-index:30;background:var(--glass);-webkit-backdrop-filter:saturate(180%) blur(24px);backdrop-filter:saturate(180%) blur(24px);border-bottom:.5px solid var(--line)}
.nav-in{display:flex;align-items:center;gap:10px;min-height:52px;padding-top:6px;padding-bottom:6px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:9px;font-weight:600;font-size:16px;letter-spacing:-.02em;min-width:0}
.brand span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.logo{width:26px;height:26px;flex:none;border-radius:7px;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,122,255,.28))}
.nav-act{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.spacer{flex:1}

/* ===================== 按钮 ===================== */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:32px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--fill);color:var(--text);font-size:13.5px;font-weight:500;cursor:pointer;white-space:nowrap;text-decoration:none;
  transition:background var(--dur) ease,transform .16s var(--ease),box-shadow var(--dur) var(--ease),color var(--dur) ease,opacity var(--dur) ease}
.btn:hover{background:var(--fill-2)}
.btn:active{transform:scale(.97)}
.btn:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.btn.primary{background:var(--blue);color:#fff;box-shadow:0 1px 2px rgba(0,90,200,.22)}
.btn.primary:hover{background:var(--blue-h)}
.btn.cta{background:linear-gradient(180deg,#2e94ff 0%,#007aff 100%);box-shadow:0 1px 2px rgba(0,90,200,.3),0 8px 20px -10px rgba(0,122,255,.75),inset 0 .5px 0 rgba(255,255,255,.3)}
.btn.cta:hover{background:linear-gradient(180deg,#1f8aff 0%,#0069e6 100%)}
.btn.outline{background:transparent;box-shadow:inset 0 0 0 1px var(--line-2)}
.btn.outline:hover{background:var(--fill);box-shadow:inset 0 0 0 1px var(--line-2)}
.btn.ghost{background:transparent;color:var(--text-2)}
.btn.ghost:hover{background:var(--fill);color:var(--text)}
.btn.tint{background:var(--blue-soft);color:var(--blue)}
.btn.tint:hover{background:var(--blue-soft);filter:brightness(.97)}
.btn.danger{background:var(--red-soft);color:var(--red)}
.btn.danger:hover{background:var(--red-soft);filter:brightness(.95)}
.btn.danger.solid{background:#e8332a;color:#fff;box-shadow:0 1px 2px rgba(190,20,10,.24)}
.btn.danger.solid:hover{background:#d02a22}
.btn.sm{height:28px;padding:0 11px;font-size:12.5px;border-radius:var(--r-sm);gap:4px}
.btn.sm svg{width:13px;height:13px}
.btn.lg{height:44px;font-size:15px;border-radius:var(--r-lg);padding:0 20px}
.btn.block{width:100%}

/* ===================== 表单 ===================== */
.field{display:block;width:100%;height:44px;padding:0 14px;border:0;border-radius:12px;background:var(--surface-2);outline:none;font-size:14px;
  box-shadow:inset 0 0 0 .5px var(--line-2),inset 0 1px 2px rgba(0,0,0,.032);transition:background var(--dur) ease,box-shadow var(--dur) var(--ease)}
.field::placeholder{color:var(--text-3)}
.field:hover{box-shadow:inset 0 0 0 .5px var(--line-2),inset 0 1px 2px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.02)}
.field:focus,.field:focus-visible{background:var(--surface);box-shadow:0 0 0 4px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
textarea.field{height:auto;min-height:84px;padding:11px 13px;resize:vertical;line-height:1.45}
.fl{display:block;font-size:11.5px;font-weight:600;color:var(--text-2);margin:0 0 7px 3px;letter-spacing:.01em}

/* ===================== 访客页 Hero ===================== */
.hero{padding-top:44px;padding-bottom:16px}
.large-title{margin:0;font-size:38px;line-height:1.1;font-weight:700;letter-spacing:-.026em;overflow-wrap:anywhere}
.hero .sub{margin:8px 0 0;color:var(--text-2);font-size:14.5px;min-height:22px;letter-spacing:0}

/* 苹果搜索栏（居中） */
.search{position:relative;display:flex;align-items:center;gap:10px;height:44px;width:100%;max-width:520px;margin:22px auto 0;padding:0 12px;border-radius:14px;background:linear-gradient(180deg,var(--surface),#fbfbfd);border:1px solid rgba(0,0,0,.06);
  box-shadow:0 .5px 1px rgba(0,0,0,.01),0 1px 3px rgba(0,0,0,.02),inset 0 1px 0 var(--hl);transition:background var(--dur) ease,box-shadow var(--dur) var(--ease),border-color var(--dur) ease}
.search:hover{box-shadow:0 1px 3px rgba(0,0,0,.025),0 0 0 .5px rgba(0,0,0,.05)}
.search:focus-within{background:var(--surface);border-color:rgba(0,122,255,.4);box-shadow:0 0 0 4px var(--blue-soft),0 0 0 1px var(--blue)}
.search>svg{width:16px;height:16px;flex:none;color:var(--text-3);fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
.search input{flex:1;min-width:0;height:100%;border:0;background:transparent;outline:none;font-size:15px;letter-spacing:-.01em}
.search input::-webkit-search-cancel-button,.search input::-webkit-search-decoration{-webkit-appearance:none;appearance:none}
.search .sclear{flex:none;display:flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:0;border-radius:50%;background:var(--text-3);color:var(--surface);cursor:pointer;opacity:.6;transition:opacity var(--dur) ease,transform .16s var(--ease)}
.search .sclear svg{width:10px;height:10px;stroke-width:2.4;stroke:currentColor;fill:none;stroke-linecap:round}
.search .sclear:hover{opacity:1}
.search .sclear:active{transform:scale(.88)}
.search .kbd{flex:none;display:none;padding:0 6px;border-radius:6px;background:rgba(120,120,128,.12);color:var(--text-3);font-size:11px;line-height:19px;letter-spacing:0;box-shadow:inset 0 0 0 .5px var(--line)}
@media (min-width:761px){.search .kbd{display:inline-block}}

main.wrap{padding-top:18px;padding-bottom:96px}

/* ===================== 标签胶囊 ===================== */
.tagbar{display:flex;flex-wrap:wrap;gap:7px;margin:2px 0 22px}
.chip{display:inline-flex;align-items:center;height:30px;padding:0 12px;border:0;border-radius:15px;background:var(--surface);box-shadow:var(--shadow-1);color:var(--text);font-size:13px;font-weight:500;cursor:pointer;
  transition:transform .18s var(--ease),background var(--dur) ease,color var(--dur) ease,box-shadow var(--dur) var(--ease)}
.chip:hover{transform:translateY(-1px);box-shadow:var(--shadow-2)}
.chip:active{transform:scale(.96)}
.chip:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
.chip.on{background:var(--blue);color:#fff;box-shadow:0 1px 3px rgba(0,90,200,.28)}
.chip i{font-style:normal;margin-left:6px;font-weight:400;opacity:.5;font-size:11.5px}
.chip.on i{opacity:.75}
.pill{display:inline-block;padding:0 8px;border-radius:6px;background:var(--fill);color:var(--text-2);font-size:11.5px;line-height:19px;font-weight:500;white-space:nowrap}
.pills{display:flex;flex-wrap:wrap;gap:5px}

/* ===================== 文件类型图标 ===================== */
.ico{position:relative;width:56px;height:56px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:linear-gradient(155deg,var(--i1),var(--i2));
  box-shadow:inset 0 .5px 0 var(--hl),inset 0 0 0 .5px rgba(0,0,0,.045),0 1px 2px rgba(0,0,0,.055)}
.ico>svg{width:54%;height:54%;fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.ico.lg{width:64px;height:64px;border-radius:16px}
.ico.sm{width:34px;height:34px;border-radius:9px}
.ico.sm>svg{width:58%;height:58%;stroke-width:1.75}
.ico.xl{width:88px;height:88px;border-radius:22px}
.ico img.thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:var(--surface-3)}
.k-doc{--i1:#eaf1ff;--i2:#dbe7ff;--ink:#3b7cf6}
.k-archive{--i1:#fff4e4;--i2:#ffe9cc;--ink:#dd8600}
.k-image{--i1:#e9fbef;--i2:#d7f7e3;--ink:#1ba356}
.k-app{--i1:#f4ecff;--i2:#eadfff;--ink:#8a4fe0}
.k-video{--i1:#ffedf1;--i2:#ffdee7;--ink:#e13a5e}
.k-audio{--i1:#e7faf8;--i2:#d5f4f0;--ink:#0e9aa8}
.k-code{--i1:#eff2f8;--i2:#e2e8f1;--ink:#5a6b85}
.k-other{--i1:#f3f4f6;--i2:#e8eaee;--ink:#7d838f}
@media (prefers-color-scheme:dark){
  .ico{--hl:rgba(255,255,255,.09);box-shadow:inset 0 .5px 0 var(--hl),inset 0 0 0 .5px rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.4)}
  .k-doc{--i1:#1b2f52;--i2:#16263f;--ink:#79b0ff}
  .k-archive{--i1:#3a2a12;--i2:#2e2110;--ink:#ffb340}
  .k-image{--i1:#14301f;--i2:#102617;--ink:#5ee08a}
  .k-app{--i1:#2b1d40;--i2:#231733;--ink:#c08bff}
  .k-video{--i1:#3a1a24;--i2:#2e141c;--ink:#ff7d96}
  .k-audio{--i1:#0f2e2e;--i2:#0c2323;--ink:#4fd6cf}
  .k-code{--i1:#262b33;--i2:#1e2229;--ink:#a3b3c9}
  .k-other{--i1:#2a2b2e;--i2:#222325;--ink:#a5a9b2}
}

/* ===================== 文件卡片 ===================== */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(318px,1fr));gap:14px}
.card{display:flex;flex-direction:column;gap:0;padding:15px;background:var(--surface);border-radius:var(--r-xl);box-shadow:var(--shadow-1);color:inherit;min-width:0;text-decoration:none;
  transition:transform .2s var(--ease),box-shadow var(--dur) var(--ease),background var(--dur) ease;
  animation:rise .4s var(--ease) both}
.card:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.card:active{transform:translateY(-1px) scale(.994);transition-duration:.12s}
.card:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),var(--shadow-2)}
.card-top{display:flex;gap:12px;align-items:flex-start;min-width:0}
.card-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:5px;padding-top:2px}
.fname{font-weight:600;font-size:14.5px;line-height:1.35;letter-spacing:-.012em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}
.note{font-size:12.5px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:0}
.card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding-top:11px;border-top:.5px solid var(--line)}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;color:var(--text-3);font-size:12px;letter-spacing:0;min-width:0}
.meta span{white-space:nowrap}
.meta .dot{width:2.5px;height:2.5px;border-radius:50%;background:currentColor;opacity:.5}
.get{flex:none;display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 13px;border-radius:var(--r-sm);background:var(--blue);color:#fff;font-size:12.5px;font-weight:600;letter-spacing:0;
  box-shadow:0 1px 2px rgba(0,90,200,.22);transition:background var(--dur) ease,transform .16s var(--ease)}
.get svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.card:hover .get{background:var(--blue-h)}
.card:active .get{transform:scale(.95)}
/* 卡片内的常驻下载按钮：点击不冒泡到卡片的预览 */
a.get.dl-btn{text-decoration:none;cursor:pointer;position:relative;z-index:1}
a.get.dl-btn:hover{background:var(--blue-h)}
a.get.dl-btn:active{transform:scale(.95)}
@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}

/* ===================== 空状态 / 分页 ===================== */
.empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:92px 0 76px;color:var(--text-2);text-align:center}
.empty .ico{margin-bottom:18px;filter:saturate(.6);opacity:.85}
.empty b{font-size:19px;color:var(--text);font-weight:600;letter-spacing:-.018em}
.empty .small{font-size:13px}
.pager{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px;margin-top:34px}
.pager button{min-width:32px;height:32px;padding:0 10px;border:0;border-radius:var(--r-sm);background:var(--surface);box-shadow:var(--shadow-1);color:var(--text);cursor:pointer;font-size:13.5px;font-weight:500;
  transition:transform .16s var(--ease),background var(--dur) ease,box-shadow var(--dur) var(--ease)}
.pager button:hover:not(:disabled){background:var(--surface-3)}
.pager button:active:not(:disabled){transform:scale(.95)}
.pager button:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
.pager button.on{background:var(--blue);color:#fff;box-shadow:0 1px 3px rgba(0,90,200,.26)}
.pager button:disabled{opacity:.38;cursor:not-allowed}
.pager .gap{color:var(--text-3);padding:0 2px;font-size:13px}

/* 浮动管理入口 */
.admin-link{position:fixed;right:20px;bottom:20px;z-index:20;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 15px;border-radius:18px;background:var(--glass);
  -webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);box-shadow:var(--shadow-2);color:var(--text-2);font-size:12.5px;font-weight:500;letter-spacing:0;
  transition:transform .18s var(--ease),color var(--dur) ease}
.admin-link:hover{color:var(--blue);transform:translateY(-1px)}
.admin-link:active{transform:scale(.96)}
.admin-link svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* ===================== 登录页 ===================== */
.auth{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:28px 20px}
.auth-card{width:100%;max-width:372px;padding:36px 30px 26px;background:var(--surface);border-radius:var(--r-2xl);box-shadow:var(--shadow-modal);text-align:center;animation:rise .45s var(--ease) both}
.auth-card .logo{width:60px;height:60px;border-radius:15px;margin:0 auto 18px;filter:drop-shadow(0 4px 10px rgba(0,122,255,.26))}
.auth-card h1{margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-.024em}
.auth-sub{margin:0 0 24px;color:var(--text-2);font-size:13.5px;letter-spacing:0}
.auth-card .field{height:44px;padding:0 14px;text-align:left;font-size:15px;border-radius:var(--r-lg)}
.auth-card .btn{margin-top:10px}
.auth-err{color:var(--red);font-size:12.5px;min-height:16px;margin-top:7px;letter-spacing:0}
.auth-back{margin:18px 0 0;font-size:12.5px}
.auth-back a{color:var(--text-2);transition:color var(--dur) ease}
.auth-back a:hover{color:var(--blue)}

/* ===================== 管理页 ===================== */
.page{position:relative;padding-top:32px;padding-bottom:88px}
.page-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:20px}
.page-title{margin:0;font-size:31px;font-weight:700;letter-spacing:-.028em;line-height:1.14}
.page-sub{margin:7px 0 0;color:var(--text-2);font-size:13.5px;letter-spacing:0}
.panel{position:relative;background:var(--surface);border-radius:16px;
  box-shadow:inset 0 .5px 0 var(--hl),0 0 0 .5px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.04),0 14px 30px -20px rgba(0,0,0,.28)}
.sec{padding:17px 18px 16px}
.panel-hd{display:flex;align-items:center;justify-content:space-between;gap:8px 12px;flex-wrap:wrap;margin:0 1px 14px}
.panel-hd h2{margin:0;display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;letter-spacing:-.018em}
.panel-hd h2::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 3px var(--blue-soft)}

/* 拖拽上传区 */
.drop{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:224px;padding:30px 22px 26px;border-radius:16px;text-align:center;cursor:pointer;overflow:hidden;
  background:radial-gradient(120% 130% at 50% -10%,rgba(0,122,255,.085),rgba(0,122,255,0) 60%),linear-gradient(180deg,var(--surface-2),var(--surface));
  border:1.5px dashed rgba(0,122,255,.24);
  transition:border-color var(--dur) ease,background var(--dur) ease,box-shadow var(--dur) var(--ease),transform .18s var(--ease)}
.drop:hover{border-color:rgba(0,122,255,.45);box-shadow:0 6px 18px -14px rgba(0,122,255,.45)}
.drop:focus-visible{outline:none;border-color:var(--blue);box-shadow:0 0 0 4px var(--blue-soft)}
.drop.over{border-color:var(--blue);border-style:solid;background:radial-gradient(120% 130% at 50% -10%,rgba(0,122,255,.16),rgba(0,122,255,.04) 70%);transform:scale(1.006);box-shadow:0 0 0 4px var(--blue-soft),0 10px 26px -18px rgba(0,122,255,.7)}
.drop .dicon{position:relative;display:flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:22px;margin-bottom:14px;color:#fff;
  background:linear-gradient(180deg,#4ea5ff,#007aff);
  box-shadow:0 10px 24px -10px rgba(0,122,255,.75),0 0 0 12px rgba(0,122,255,.05),inset 0 .5px 0 rgba(255,255,255,.55),inset 0 -1px 2px rgba(0,60,150,.2);
  transition:transform .22s var(--ease),box-shadow var(--dur) var(--ease)}
.drop:hover .dicon{transform:translateY(-2px) scale(1.03)}
.drop.over .dicon{transform:translateY(-3px) scale(1.08);box-shadow:0 14px 30px -8px rgba(0,122,255,.85),0 0 0 16px rgba(0,122,255,.08),inset 0 .5px 0 rgba(255,255,255,.6)}
.drop .dicon svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.drop b{font-size:17px;font-weight:600;letter-spacing:-.018em}
.drop .drop-sub{font-size:13px;color:var(--text-2);letter-spacing:0}
.drop .drop-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:14px}
.drop .dchip{display:inline-flex;align-items:center;height:24px;padding:0 11px;border-radius:999px;background:var(--fill);color:var(--text-2);font-size:11.5px;font-weight:500;letter-spacing:.01em;box-shadow:inset 0 0 0 .5px var(--line)}
.drop .only-over{display:none}
.drop.over .only-idle{display:none}
.drop.over .only-over{display:block}

/* 上传队列 */
.queue{margin-top:14px;display:flex;flex-direction:column;gap:7px}
.queue:empty{display:none}
.qrow{display:grid;grid-template-columns:minmax(0,1fr) 132px 126px 22px;gap:12px;align-items:center;padding:10px 13px;border-radius:11px;background:var(--surface-2);box-shadow:inset 0 0 0 .5px var(--line);animation:rise .28s var(--ease) both}
.qname{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px;font-weight:500;letter-spacing:-.006em}
.bar{height:5px;border-radius:3px;background:var(--fill-2);overflow:hidden;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.05)}
.bar>span{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#5eaaff,var(--blue));transition:width .15s linear,background var(--dur) ease}
.qrow.ok .bar>span{background:linear-gradient(90deg,#6fdd8b,var(--green))}
.qrow.fail .bar>span{background:linear-gradient(90deg,#ff7a70,var(--red))}
.qstat{font-size:12px;color:var(--text-2);overflow-wrap:anywhere;letter-spacing:0}
.qrow.ok .qstat{color:var(--green)}
.qrow.fail .qstat{color:var(--red)}
.xbtn{border:0;background:none;color:var(--text-3);font-size:18px;cursor:pointer;line-height:1;padding:0;border-radius:6px;transition:color var(--dur) ease,transform .16s var(--ease)}
.xbtn:hover{color:var(--red)}
.xbtn:active{transform:scale(.85)}
.qact{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:16px;padding-top:15px;border-top:.5px solid var(--line)}
.qact .btn.lg{height:40px;padding:0 22px;border-radius:12px;font-size:14px}
.qhint{margin-left:auto;font-size:12px;color:var(--text-3);letter-spacing:0}

.section-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:34px 2px 12px}
.section-h h2{margin:0;font-size:18px;font-weight:600;letter-spacing:-.022em}
.section-h .small{font-size:12.5px}

/* 统计小卡 */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.stat{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;
  background:linear-gradient(180deg,var(--surface),var(--surface-2));
  box-shadow:inset 0 .5px 0 var(--hl),0 0 0 .5px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.035),0 10px 24px -18px rgba(0,0,0,.26);
  transition:transform .2s var(--ease),box-shadow var(--dur) var(--ease)}
.stat:hover{transform:translateY(-1px);box-shadow:inset 0 .5px 0 var(--hl),0 0 0 .5px rgba(0,0,0,.055),0 2px 6px rgba(0,0,0,.05),0 16px 32px -20px rgba(0,0,0,.32)}
.stat-ico{width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.03)}
.stat-ico svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
.si-1{background:rgba(0,122,255,.1);color:var(--blue)}
.si-2{background:rgba(52,199,89,.13);color:var(--green)}
.si-3{background:rgba(255,149,0,.14);color:#c9791b}
.stat-tx{min-width:0}
.stat-tx b{display:block;font-size:22px;font-weight:600;letter-spacing:-.032em;line-height:1.18;font-variant-numeric:tabular-nums}
.stat-tx span{display:block;margin-top:2px;font-size:11.5px;font-weight:500;color:var(--text-3);letter-spacing:.01em}

/* 表格 */
.tbl{overflow:hidden}
.tbl-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px 13px;border-bottom:.5px solid var(--line)}
.tbl-hd-l{display:flex;align-items:center;gap:9px;min-width:0}
.tbl-hd h2{margin:0;font-size:15px;font-weight:600;letter-spacing:-.018em}
.iconbtn{width:28px;padding:0;flex:none}
.cnt{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:var(--fill);color:var(--text-2);font-size:11.5px;font-weight:600;letter-spacing:.01em;font-variant-numeric:tabular-nums}
table.list{width:100%;border-collapse:collapse}
.list th,.list td{padding:11px 16px;text-align:left;vertical-align:middle}
.list thead{background:var(--surface-2)}
.list th{font-size:11.5px;color:var(--text-3);font-weight:600;padding-top:10px;padding-bottom:9px;letter-spacing:.02em;white-space:nowrap}
.list td{border-top:.5px solid var(--line);font-size:13.5px;letter-spacing:0}
.list td.num{color:var(--text-2);font-variant-numeric:tabular-nums}
.list tbody tr{transition:background .16s ease}
.list tbody tr:hover{background:var(--surface-2)}
.list td.nm{max-width:390px}
.nmwrap{display:flex;gap:11px;align-items:center;min-width:0}
.nmtx{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}
.nmtx .t{font-weight:600;font-size:14px;letter-spacing:-.012em;line-height:1.35}
.nmtx .note-line{font-size:12px;color:var(--text-3);letter-spacing:0;max-width:330px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tbl-empty{padding:0!important}
.empty-in{display:flex;flex-direction:column;align-items:center;gap:5px;padding:42px 0 44px;color:var(--text-2)}
.empty-in .ei{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:var(--surface-2);box-shadow:inset 0 0 0 .5px var(--line);color:var(--text-3);margin-bottom:6px}
.empty-in .ei svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.empty-in b{font-size:14.5px;font-weight:600;color:var(--text);letter-spacing:-.012em}
.empty-in span{font-size:12.5px}
.acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.foot{margin:12px 3px 0;color:var(--text-3);font-size:12px;text-align:right;letter-spacing:0}

/* 标签筛选 / 多选 / 分页 */
.filters{display:flex;flex-wrap:wrap;gap:6px;padding:12px 17px;border-bottom:.5px solid var(--line);background:var(--surface)}
.fchip{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border:0;border-radius:999px;background:var(--fill);color:var(--text-2);font-size:12.5px;font-weight:500;cursor:pointer;letter-spacing:0;
  box-shadow:inset 0 0 0 .5px var(--line);transition:background var(--dur) ease,color var(--dur) ease,box-shadow var(--dur) var(--ease),transform .16s var(--ease)}
.fchip i{font-style:normal;font-size:11px;opacity:.55;font-variant-numeric:tabular-nums}
.fchip:hover{background:var(--fill-2);color:var(--text)}
.fchip:active{transform:scale(.97)}
.fchip:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
.fchip.on{background:var(--blue);color:#fff;box-shadow:0 1px 2px rgba(0,90,200,.26),0 4px 12px -8px rgba(0,122,255,.6)}
.fchip.on i{opacity:.8}
.tbl-hd-r{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.selinfo{font-size:12px;color:var(--text-2);letter-spacing:0;white-space:nowrap}
.selinfo b{color:var(--text);font-variant-numeric:tabular-nums}
.ck{-webkit-appearance:none;appearance:none;width:18px;height:18px;margin:0;border:0;border-radius:6px;background:var(--fill);box-shadow:inset 0 0 0 1.5px var(--line-2);cursor:pointer;position:relative;flex:none;
  transition:background var(--dur) ease,box-shadow var(--dur) ease,transform .14s var(--ease)}
.ck:hover{background:var(--fill-2)}
.ck:active{transform:scale(.92)}
.ck:checked,.ck:indeterminate{background:var(--blue);box-shadow:0 1px 2px rgba(0,90,200,.3)}
.ck:checked::after{content:"";position:absolute;left:6px;top:2.5px;width:4.5px;height:8.5px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(42deg)}
.ck:indeterminate::after{content:"";position:absolute;left:4px;top:8px;width:10px;height:2px;border-radius:1px;background:#fff}
.ck:focus-visible{outline:none;box-shadow:0 0 0 3.5px var(--blue-soft),inset 0 0 0 1.5px var(--blue)}
.list th.sel,.list td.sel{width:44px;text-align:center;padding-right:0}
.list td.sel{vertical-align:middle}
.tbl-ft{padding:11px 16px 13px;border-top:.5px solid var(--line)}
.tbl-ft .pager{margin-top:0}
.tbl-ft .pager button{background:var(--surface-2);box-shadow:inset 0 0 0 .5px var(--line)}
.tbl-ft .pager button:hover:not(:disabled){background:var(--fill)}
.tbl-ft .pager button.on{background:var(--blue);color:#fff;box-shadow:0 1px 3px rgba(0,90,200,.26)}
.dlg-p{margin:0 2px;color:var(--text-2);font-size:13.5px;overflow-wrap:anywhere;letter-spacing:0;line-height:1.55}

/* 对话框 */
dialog{border:0;border-radius:var(--r-2xl);padding:22px;width:min(420px,calc(100vw - 32px));background:var(--glass);-webkit-backdrop-filter:saturate(180%) blur(30px);backdrop-filter:saturate(180%) blur(30px);
  color:var(--text);box-shadow:var(--shadow-modal)}
dialog[open]{animation:pop .24s var(--ease)}
dialog::backdrop{background:rgba(0,0,0,.3);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:fade .22s ease}
dialog h3{margin:0 0 12px;font-size:17px;font-weight:600;letter-spacing:-.02em}
dialog .fl{margin-top:12px}
dialog .fl:first-of-type{margin-top:0}
.dlg-act{display:flex;gap:8px;margin-top:18px}
.dlg-act .btn{flex:1;height:38px;border-radius:var(--r-md);font-size:14px}
.err{color:var(--red);font-size:12.5px;min-height:18px;margin-top:8px;letter-spacing:0}
@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}

/* 预览弹窗 */
#pvDlg{width:min(1080px,calc(100vw - 32px));height:min(88vh,900px);padding:0;overflow:hidden;display:none;flex-direction:column}
#pvDlg[open]{display:flex}
#pvDlg h3{margin:0}
.pv-hd{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:.5px solid var(--line);flex:none;min-width:0}
.pv-tt{min-width:0;flex:1}
.pv-name{font-size:14.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-meta{font-size:12px;color:var(--text-3);margin-top:2px;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-x{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--fill);color:var(--text-2);border:0;cursor:pointer}
.pv-x:hover{background:var(--fill-2);color:var(--text)}
.pv-x svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round}
.pv-body{flex:1;min-height:0;position:relative;background:var(--surface-2);display:flex;align-items:center;justify-content:center;overflow:auto}
.pv-img{max-width:100%;max-height:100%;display:block;object-fit:contain}
.pv-frame{width:100%;height:100%;border:0;background:var(--surface-2)}
.pv-pre{margin:0;width:100%;height:100%;overflow:auto;padding:18px 20px;font:12.5px/1.65 ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere;tab-size:4;background:var(--surface);text-align:left;-webkit-user-select:text;user-select:text}
.pv-none{display:flex;flex-direction:column;align-items:center;gap:9px;padding:44px 24px;text-align:center;color:var(--text-3);font-size:13.5px;letter-spacing:0}
.pv-none b{color:var(--text);font-size:14.5px;font-weight:600}
.pv-none .ico{margin-bottom:2px}
.pv-ft{flex:none;display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:.5px solid var(--line);background:var(--glass)}
.pv-ft .spacer{flex:1}
.pv-load{padding:40px;color:var(--text-3);font-size:13.5px;letter-spacing:0}

/* Toast */
.toast{position:fixed;left:50%;bottom:28px;z-index:60;transform:translateX(-50%);background:rgba(28,28,30,.9);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);color:#fff;padding:9px 18px;border-radius:var(--r-lg);
  font-size:13.5px;max-width:calc(100vw - 32px);box-shadow:0 8px 24px rgba(0,0,0,.24);animation:toastin .26s var(--ease) both;letter-spacing:0}
@keyframes toastin{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}

/* ===================== 手机端 ===================== */
@media (max-width:640px){
  body{font-size:14px}
  .wrap{padding:0 16px}
  .hero{padding-top:26px}
  .large-title{font-size:30px}
  .search{height:42px;max-width:92%}
  .grid{grid-template-columns:1fr;gap:10px}
  .card{padding:14px;border-radius:var(--r-lg)}
  .ico.lg{width:56px;height:56px;border-radius:14px}
  .nav-in{min-height:50px}
  /* 手机上浮动按钮会压住卡片，改为页面末尾的普通胶囊 */
  .admin-link{position:static;display:flex;width:fit-content;margin:26px auto 0;box-shadow:var(--shadow-1);background:var(--surface)}
  .page{padding-top:20px}
  .page-hd{margin-bottom:16px}
  .page-title{font-size:26px}
  .sec{padding:15px}
  .filters{flex-wrap:nowrap;overflow-x:auto;padding:10px 14px;gap:5px;-webkit-overflow-scrolling:touch}
  .fchip{flex:none}
  .tbl-hd{flex-wrap:wrap;padding:13px 14px 11px}
  .tbl-hd-r{margin-left:auto}
  .tbl-ft{padding:11px 14px 13px}
  .list tr{position:relative}
  .list td.sel{position:absolute;top:12px;right:14px;width:auto;padding:0;border:0}
  .list td.sel::before{content:none!important}
  .list td.nm{padding-right:32px}
  .stats{grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
  .stat{flex-direction:column;align-items:flex-start;gap:0;padding:11px 12px;border-radius:12px}
  .stat-ico{display:none}
  .stat-tx b{font-size:17px}
  .stat-tx span{font-size:11px;margin-top:2px}
  .drop{min-height:196px;padding:24px 16px 20px}
  .drop .dicon{width:58px;height:58px;border-radius:18px;margin-bottom:11px}
  .drop .dicon svg{width:26px;height:26px}
  .drop b{font-size:15.5px}
  .qhint{order:3;width:100%;margin:0;text-align:center;font-size:11.5px}
  .list td.nm{max-width:none}
  .nmwrap{align-items:flex-start}
  .list .ico.sm{width:30px;height:30px;border-radius:8px}
  .nmtx .note-line{max-width:none}
  .acts{justify-content:flex-start;gap:5px}
  .nav-act{width:100%;gap:6px}
  .nav-act .btn{flex:1}
  .qrow{grid-template-columns:minmax(0,1fr) 22px;gap:6px 10px;padding:9px 11px}
  .qrow .bar{grid-column:1 / 2;grid-row:2}
  .qrow .qstat{grid-column:1 / 2;grid-row:3}
  .qrow .xbtn{grid-column:2;grid-row:1}
  .list thead{display:none}
  .list,.list tbody,.list tr,.list td{display:block;width:100%}
  .list tr{padding:13px 14px;border-top:.5px solid var(--line)}
  .list tr:first-child{border-top:0}
  .list td{border:0;padding:2px 0;max-width:none!important;font-size:13px}
  .list td[data-l]::before{content:attr(data-l) "：";color:var(--text-3);font-size:12px}
  .list td.nm{font-weight:600;padding-bottom:6px}
  .list td.nm .small{font-weight:400}
  .list td.nm::before{content:none!important}
  .list td:last-child{padding-top:10px}
  .foot{text-align:left}
  .section-h{margin-top:26px}
  .section-h h2{font-size:17px}
  .toast{bottom:calc(20px + env(safe-area-inset-bottom))}
  .auth-card{padding:30px 22px 22px;border-radius:18px}
}
`;

/** 前端公共小工具（各页内联；不含模板字符串，避免转义问题） */
export const COMMON_JS = String.raw`
function fmtSize(n){
  if(n<1024)return n+' B';
  var u=['KB','MB','GB','TB'],v=n/1024,i=0;
  while(v>=1024&&i<u.length-1){v/=1024;i++}
  return (v>=100?v.toFixed(0):v.toFixed(1))+' '+u[i];
}
function relTime(ts){
  var s=Math.max(0,Math.floor((Date.now()-ts)/1000));
  if(s<60)return '刚刚';
  var m=Math.floor(s/60);if(m<60)return m+' 分钟前';
  var h=Math.floor(m/60);if(h<24)return h+' 小时前';
  var d=Math.floor(h/24);if(d<30)return d+' 天前';
  var mo=Math.floor(d/30);if(mo<12)return mo+' 个月前';
  return Math.floor(d/365)+' 年前';
}
function pad2(n){return n<10?'0'+n:''+n}
function fmtDate(ts){
  var d=new Date(ts);
  return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+pad2(d.getHours())+':'+pad2(d.getMinutes());
}
function el(tag,cls,text){
  var e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  return e;
}
/* 线性图标符号（静态常量，不含用户数据） */
var GLYPH={
  doc:'<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9.5 13h5M9.5 16.5h5"/>',
  archive:'<rect x="4.5" y="3.5" width="15" height="17" rx="3"/><path d="M12 3.5v3M12 3.5v0M12 9v1.5M12 13v1.5"/><rect x="10" y="15" width="4" height="3.5" rx="1"/>',
  image:'<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 17l4.5-4 4 3 3.5-3 3 3.5"/>',
  app:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  video:'<rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/>',
  audio:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  code:'<path d="M9 8l-5 4 5 4M15 8l5 4-5 4M13.5 6l-3 12"/>',
  other:'<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>'
};
var KIND_EXT={
  doc:['pdf','doc','docx','rtf','odt','xls','xlsx','csv','ods','ppt','pptx','odp','pages','numbers','key','epub','txt','md','log'],
  archive:['zip','rar','7z','tar','gz','bz2','xz','tgz','zst'],
  image:['png','jpg','jpeg','gif','webp','svg','bmp','ico','heic','avif','tiff'],
  app:['exe','msi','apk','dmg','deb','rpm','iso','appimage','pkg','ipa','appx'],
  video:['mp4','mkv','mov','avi','webm','flv','wmv','m4v','ts'],
  audio:['mp3','wav','flac','aac','ogg','m4a','opus','ape'],
  code:['json','xml','html','htm','js','ts','jsx','tsx','py','java','c','cpp','h','go','rs','sh','yml','yaml','css','sql','toml']
};
function fileKind(name){
  var i=name.lastIndexOf('.');
  var ext=i>0?name.slice(i+1).toLowerCase():'';
  for(var k in KIND_EXT){if(KIND_EXT[k].indexOf(ext)>=0)return k}
  return 'other';
}
function fileExt(name){
  var i=name.lastIndexOf('.');
  return i>0?name.slice(i+1).toUpperCase().slice(0,5):'';
}
function canThumb(f){
  return /^image\/(png|jpeg|gif|webp)$/.test((f&&f.mime)||'');
}
/* f 为文件对象 {id,name,mime}；size 可选 'sm' | 'lg' */
function makeIcon(f,size){
  var name=typeof f==='string'?f:(f&&f.name)||'';
  var k=fileKind(name);
  var d=el('div','ico k-'+k+(size?' '+size:''));
  d.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+GLYPH[k]+'</svg>';
  if(f&&f.id&&canThumb(f)){
    var img=new Image();
    img.className='thumb';img.alt='';img.loading='lazy';img.decoding='async';
    img.onerror=function(){img.remove()};
    img.src='/preview/'+encodeURIComponent(f.id);
    d.appendChild(img);
  }
  return d;
}
function toast(msg){
  var t=el('div','toast',msg);
  document.body.appendChild(t);
  setTimeout(function(){t.remove()},3200);
}
async function api(method,url,body){
  var opt={method:method,headers:{}};
  if(body!==undefined){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  var r=await fetch(url,opt);
  var data=null;
  try{data=await r.json()}catch(e){}
  if(r.status===401&&url!=='/api/login'){location.href='/login';throw new Error('未登录')}
  if(!r.ok){throw new Error((data&&data.error&&data.error.message)||('请求失败 ('+r.status+')'))}
  return data;
}

/* ---------------- 预览弹窗（图片 / PDF / 纯文本） ---------------- */
/* 与后端 previewMime 的白名单保持一致；判断一律看扩展名，不看 mime */
var PV_TEXT_EXT=['txt','md','markdown','log','csv','tsv','json','xml','yml','yaml','toml','ini','conf',
  'js','mjs','cjs','ts','jsx','tsx','css','scss','less','html','htm','sql','sh','bash','bat','ps1',
  'py','rb','php','go','rs','java','kt','swift','c','h','cpp','hpp','cs','lua','vue','svelte',
  'properties','gradle'];
function pvExt(name){
  var i=name.lastIndexOf('.');
  return i>0?name.slice(i+1).toLowerCase():'';
}
/* 返回 'image' | 'pdf' | 'text' | null（null = 只能下载） */
function previewKind(f){
  var ext=pvExt(f.name);
  if(ext==='svg')return null;
  if(/^image\/(png|jpeg|gif|webp|bmp|avif)$/.test(f.mime||''))return 'image';
  if(ext==='pdf')return 'pdf';
  if(PV_TEXT_EXT.indexOf(ext)>=0)return 'text';
  return null;
}
function canPreview(f){return previewKind(f)!==null}

var PV=(function(){
  var dlg=null,f=null,token=0;
  function build(){
    dlg=document.createElement('dialog');
    dlg.id='pvDlg';
    dlg.innerHTML=
      '<div class="pv-hd">'+
        '<div class="pv-tt"><div class="pv-name" id="pvName"></div><div class="pv-meta" id="pvMeta"></div></div>'+
        '<button class="pv-x" id="pvX" type="button" aria-label="关闭"><svg viewBox="0 0 16 16"><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2"/></svg></button>'+
      '</div>'+
      '<div class="pv-body" id="pvBody"></div>'+
      '<div class="pv-ft">'+
        '<a class="btn sm outline" id="pvDl" download>下载</a>'+
        '<div class="spacer"></div>'+
        '<button class="btn sm outline" id="pvClose" type="button">关闭</button>'+
      '</div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#pvX').onclick=function(){dlg.close()};
    dlg.querySelector('#pvClose').onclick=function(){dlg.close()};
    dlg.addEventListener('close',function(){
      var b=dlg.querySelector('#pvBody');
      if(b){b.textContent='';}
      f=null;
    });
    return dlg;
  }
  function noPreview(msg){
    var box=el('div','pv-none');
    box.appendChild(makeIcon(f,'lg'));
    box.appendChild(el('b',undefined,'该格式不支持预览'));
    box.appendChild(el('span',undefined,msg||'下载后即可查看'));
    return box;
  }
  function download(f){
    var a=document.createElement('a');
    a.href='/d/'+encodeURIComponent(f.id);
    a.setAttribute('download',f.name||'');
    document.body.appendChild(a);a.click();a.remove();
  }
  function open(file){
    /* 不能预览的格式：不做弹窗，直接下载 */
    if(!canPreview(file)){download(file);return}
    if(!dlg)build();
    f=file;
    var my=++token;
    dlg.querySelector('#pvName').textContent=f.name;
    dlg.querySelector('#pvName').title=f.name;
    var meta=fmtSize(f.size);
    if(f.created_at)meta+=' · '+fmtDate(f.created_at);
    dlg.querySelector('#pvMeta').textContent=meta;
    var dl=dlg.querySelector('#pvDl');
    dl.href='/d/'+encodeURIComponent(f.id);
    dl.setAttribute('download',f.name);

    var body=dlg.querySelector('#pvBody');
    body.textContent='';
    var kind=previewKind(f);
    var src='/preview/'+encodeURIComponent(f.id);

    if(kind==='image'){
      var img=new Image();
      img.className='pv-img';img.alt=f.name;
      img.onerror=function(){if(my!==token)return;body.textContent='';body.appendChild(noPreview('图片加载失败'))};
      img.src=src;
      body.appendChild(img);
    }else if(kind==='pdf'){
      var fr=document.createElement('iframe');
      fr.className='pv-frame';fr.title=f.name;fr.src=src;
      body.appendChild(fr);
    }else if(kind==='text'){
      var ld=el('div','pv-load','正在加载…');
      body.appendChild(ld);
      fetch(src,{credentials:'same-origin'}).then(function(r){
        if(!r.ok){
          return r.json().catch(function(){return null}).then(function(j){
            throw new Error((j&&j.error&&j.error.message)||'无法预览');
          });
        }
        return r.text();
      }).then(function(txt){
        if(my!==token)return;
        body.textContent='';
        var pre=el('pre','pv-pre',txt===''?'（空文件）':txt);
        body.appendChild(pre);
      }).catch(function(e){
        if(my!==token)return;
        body.textContent='';
        body.appendChild(noPreview(e&&e.message?e.message:'无法预览，请下载查看'));
      });
    }else{
      body.appendChild(noPreview());
    }
    if(!dlg.open)dlg.showModal();
  }
  return {open:open,download:download};
})();
`;

export interface PageOptions {
  title: string;
  nonce: string;
  body: string;
  script: string;
  /** 附加到 <body> 的属性，例如 data-max */
  bodyAttrs?: string;
  /** 附加到 <body> 的 class */
  bodyClass?: string;
}

export function renderPage({ title, nonce, body, script, bodyAttrs = "", bodyClass = "" }: PageOptions): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/icon-180.png">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body ${bodyAttrs}${bodyClass ? ` class="${bodyClass}"` : ""}>
${body}
<script nonce="${nonce}">
${COMMON_JS}
${script}
</script>
</body>
</html>`;
}

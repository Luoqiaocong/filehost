import { escapeHtml, logoMarkup, renderPage } from "./layout";

const SCRIPT = String.raw`
(function(){
  var $pw=document.getElementById('pw'),$btn=document.getElementById('go'),$err=document.getElementById('err');
  async function submit(){
    $err.textContent='';
    var v=$pw.value.trim();
    if(!v){$err.textContent='请输入管理员口令';$pw.focus();return}
    $btn.disabled=true;$btn.textContent='登录中…';
    try{
      await api('POST','/api/login',{password:v});
      location.href='/admin';
    }catch(e){
      $err.textContent=e.message;
      $btn.disabled=false;$btn.textContent='登录';
      $pw.value='';$pw.focus();
    }
  }
  $btn.addEventListener('click',submit);
  $pw.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();submit()}});
  $pw.addEventListener('input',function(){$err.textContent=''});
  setTimeout(function(){$pw.focus()},180);
})();
`;

export function loginPage(siteName: string, nonce: string): string {
  const body = `
<div class="auth">
  <div class="auth-card">
    ${logoMarkup(true)}
    <h1>管理后台</h1>
    <p class="auth-sub">${escapeHtml(siteName)}</p>
    <label class="fl" for="pw" style="text-align:left">管理员口令</label>
    <input id="pw" class="field" type="password" placeholder="输入口令" autocomplete="current-password" spellcheck="false" autocapitalize="off">
    <div id="err" class="auth-err" role="alert"></div>
    <button id="go" class="btn primary lg block" type="button">登录</button>
    <p class="auth-back"><a href="/">← 返回文件列表</a></p>
  </div>
</div>`;
  return renderPage({ title: `登录 · ${siteName}`, nonce, body, script: SCRIPT });
}

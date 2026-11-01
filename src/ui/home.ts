import { escapeHtml, LOGO, renderPage } from "./layout";

const SCRIPT = String.raw`
(function(){
  var state={q:'',tag:'',page:1,limit:24};
  var $q=document.getElementById('q'),$clear=document.getElementById('clear'),
      $kbd=document.getElementById('kbd'),
      $tags=document.getElementById('tags'),$grid=document.getElementById('grid'),
      $empty=document.getElementById('empty'),$emptyT=document.getElementById('emptyT'),
      $emptySub=document.getElementById('emptySub'),
      $sub=document.getElementById('sub'),$pager=document.getElementById('pager');
  var timer=null, seq=0;

  (function readUrl(){
    var p=new URLSearchParams(location.search);
    state.q=p.get('q')||'';state.tag=p.get('tag')||'';
    state.page=Math.max(1,parseInt(p.get('page')||'1',10)||1);
    $q.value=state.q;
    if(state.q)$clear.hidden=false;
  })();

  function syncUrl(){
    var p=new URLSearchParams();
    if(state.q)p.set('q',state.q);
    if(state.tag)p.set('tag',state.tag);
    if(state.page>1)p.set('page',String(state.page));
    var s=p.toString();
    history.replaceState(null,'',s?('?'+s):location.pathname);
  }

  function renderTags(tags){
    $tags.textContent='';
    if(tags.length===0&&!state.tag){$tags.hidden=true;return}
    $tags.hidden=false;
    function chip(label,count,value){
      var b=el('button','chip'+(state.tag===value?' on':''));
      b.type='button';
      b.appendChild(document.createTextNode(label));
      if(count!==null)b.appendChild(el('i','',String(count)));
      b.onclick=function(){state.tag=value;state.page=1;load()};
      $tags.appendChild(b);
    }
    chip('全部',null,'');
    tags.forEach(function(t){chip(t.name,t.count,t.name)});
  }

  function card(f){
    var a=el('a','card');a.href='/d/'+encodeURIComponent(f.id);
    var top=el('div','card-top');
    top.appendChild(makeIcon(f,'lg'));
    var main=el('div','card-main');
    var name=el('div','fname',f.name);name.title=f.name;
    main.appendChild(name);
    if(f.note){var no=el('div','note',f.note);no.title=f.note;main.appendChild(no)}
    else if(f.tags.length){
      var pills=el('div','pills');
      f.tags.slice(0,3).forEach(function(x){pills.appendChild(el('span','pill',x))});
      main.appendChild(pills);
    }
    top.appendChild(main);a.appendChild(top);

    var foot=el('div','card-foot');
    var meta=el('div','meta');
    function add(text,title){
      if(meta.childNodes.length)meta.appendChild(el('span','dot'));
      var s=el('span','',text);
      if(title)s.title=title;
      meta.appendChild(s);
    }
    add(fmtSize(f.size));
    add(relTime(f.created_at),fmtDate(f.created_at));
    add('下载 '+f.downloads+' 次');
    foot.appendChild(meta);

    /* 下载按钮常驻：独立链接，点击不触发整张卡片的预览 */
    var dl=el('a','get dl-btn');
    dl.href='/d/'+encodeURIComponent(f.id);
    dl.setAttribute('download','');
    dl.setAttribute('aria-label','下载 '+f.name);
    dl.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v7.5m0 0l-3-3m3 3l3-3M3.2 10.5v2.3a1.2 1.2 0 0 0 1.2 1.2h7.2a1.2 1.2 0 0 0 1.2-1.2v-2.3"/></svg>下载';
    dl.onclick=function(e){e.stopPropagation()};
    foot.appendChild(dl);
    a.appendChild(foot);

    /* 整张卡片：可预览的打开预览弹窗，不能预览的直接下载 */
    if(canPreview(f)){
      a.href='#';a.setAttribute('role','button');
      a.onclick=function(e){e.preventDefault();PV.open(f)};
    }
    return a;
  }

  function pageButtons(page,pages){
    $pager.textContent='';
    if(pages<=1)return;
    function btn(label,p,opts){
      var b=el('button',opts&&opts.on?'on':'',label);
      b.type='button';
      if(opts&&opts.disabled)b.disabled=true;
      else b.onclick=function(){
        state.page=p;load();
        window.scrollTo({top:Math.max(0,document.querySelector('.hero').getBoundingClientRect().bottom+window.scrollY-70),behavior:'smooth'});
      };
      $pager.appendChild(b);
    }
    btn('上一页',page-1,{disabled:page<=1});
    var list=[],i;
    for(i=1;i<=pages;i++){
      if(i===1||i===pages||Math.abs(i-page)<=2)list.push(i);
      else if(list[list.length-1]!==0)list.push(0);
    }
    list.forEach(function(p){
      if(p===0){$pager.appendChild(el('span','gap','…'))}
      else btn(String(p),p,{on:p===page});
    });
    btn('下一页',page+1,{disabled:page>=pages});
  }

  async function load(){
    var my=++seq;
    syncUrl();
    var qs=new URLSearchParams({q:state.q,tag:state.tag,page:String(state.page),limit:String(state.limit)});
    var data;
    try{
      var r=await fetch('/api/files?'+qs.toString());
      data=await r.json();
      if(!r.ok)throw new Error((data.error&&data.error.message)||'加载失败');
    }catch(e){
      if(my!==seq)return;
      $grid.textContent='';$pager.textContent='';
      $empty.hidden=false;$sub.textContent='';
      $emptyT.textContent='加载失败';
      $emptySub.textContent=e.message;
      return;
    }
    if(my!==seq)return;
    var pages=Math.max(1,Math.ceil(data.total/data.limit));
    if(state.page>pages&&data.total>0){state.page=pages;return load()}
    renderTags(data.tags);
    $grid.textContent='';
    data.items.forEach(function(f){$grid.appendChild(card(f))});
    var filtered=Boolean(state.q||state.tag);
    if(data.items.length===0){
      $empty.hidden=false;
      $emptyT.textContent=filtered?'没有找到匹配的文件':'还没有文件';
      $emptySub.textContent=filtered?'尝试换个关键词，或清除筛选条件':'上传的文件会显示在这里';
    }else{$empty.hidden=true}
    $sub.textContent=data.total>0?('共 '+data.total+' 个文件'):(filtered?'没有匹配结果':'');
    pageButtons(data.page,pages);
  }

  $q.addEventListener('input',function(){
    $clear.hidden=$q.value==='';
    clearTimeout(timer);
    timer=setTimeout(function(){state.q=$q.value.trim();state.page=1;load()},280);
  });
  $clear.onclick=function(){$q.value='';$clear.hidden=true;state.q='';state.page=1;load();$q.focus()};
  $q.addEventListener('focus',function(){$kbd.hidden=true});
  $q.addEventListener('blur',function(){$kbd.hidden=$q.value!==''});
  document.addEventListener('keydown',function(e){
    if((e.key==='/'||((e.metaKey||e.ctrlKey)&&e.key==='k'))&&document.activeElement!==$q){
      e.preventDefault();$q.focus();$q.select();
    }
  });
  load();
})();
`;

export function homePage(siteName: string, nonce: string): string {
  const name = escapeHtml(siteName);
  const body = `
<nav class="nav">
  <div class="wrap nav-in">
    <div class="brand">${LOGO}<span>${name}</span></div>
    <div class="spacer"></div>
  </div>
</nav>
<header class="wrap hero">
  <h1 class="large-title">文件</h1>
  <p class="sub" id="sub">浏览并下载共享的文件</p>
  <div class="search">
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4L14 14"/></svg>
    <input id="q" type="search" placeholder="搜索文件名" aria-label="搜索文件" autocomplete="off" autocorrect="off" spellcheck="false">
    <kbd id="kbd" class="kbd" aria-hidden="true">/</kbd>
    <button id="clear" class="sclear" type="button" aria-label="清除搜索" hidden><svg viewBox="0 0 16 16"><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2"/></svg></button>
  </div>
</header>
<main class="wrap">
  <div id="tags" class="tagbar" hidden></div>
  <div id="grid" class="grid"></div>
  <div id="empty" class="empty" hidden>
    <div class="ico xl k-other"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg></div>
    <b id="emptyT">还没有文件</b>
    <span class="small" id="emptySub">上传的文件会显示在这里</span>
  </div>
  <nav id="pager" class="pager" aria-label="分页"></nav>
</main>
<a class="admin-link" href="/admin">
  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.8" r="2.9"/><path d="M3.4 13.4c1.5-3 7.7-3 9.2 0"/></svg>
  管理后台
</a>`;
  return renderPage({ title: siteName, nonce, body, script: SCRIPT });
}

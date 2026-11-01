import { escapeHtml, LOGO, renderPage } from "./layout";

const SCRIPT = String.raw`
(function(){
  var MAX=Number(document.body.getAttribute('data-max'))||104857600;
  var $drop=document.getElementById('drop'),$file=document.getElementById('file'),
      $queue=document.getElementById('queue'),$clear=document.getElementById('clearDone'),
      $qhint=document.getElementById('qhint'),$qact=document.getElementById('qact'),$filters=document.getElementById('filters'),
      $tbody=document.getElementById('tbody'),
      $count=document.getElementById('tblCount'),$pager=document.getElementById('pager'),
      $tblFt=document.getElementById('tblFt'),$selAll=document.getElementById('selAll'),
      $selInfo=document.getElementById('selInfo'),$selN=document.getElementById('selN'),
      $bulkDel=document.getElementById('bulkDel'),
      $edit=document.getElementById('editDlg'),$confirm=document.getElementById('delDlg'),
      $delLead=document.getElementById('delLead');
  var queue=[], running=false, files=[], cur=null, delIds=null;
  var state={page:1,limit:10,tag:'',total:0,tags:[],stats:null,sel:{}};

  /* ---------- 上传（选择后自动开始） ---------- */
  function setStatus(it,cls,text,pct){
    it.row.className='qrow'+(cls?' '+cls:'');
    it.stat.textContent=text;
    if(pct!==undefined)it.fill.style.width=pct+'%';
  }
  function addFiles(list){
    for(var i=0;i<list.length;i++){
      var f=list[i];
      var row=el('div','qrow');
      var wrap=el('div');wrap.style.minWidth='0';
      var nm=el('div','qname',f.name);nm.title=f.name;
      var sz=el('div','small muted',fmtSize(f.size));
      wrap.appendChild(nm);wrap.appendChild(sz);
      var bar=el('div','bar'),fill=el('span');bar.appendChild(fill);
      var stat=el('div','qstat');
      var x=el('button','xbtn','×');x.type='button';x.title='移除';
      row.appendChild(wrap);row.appendChild(bar);row.appendChild(stat);row.appendChild(x);
      var it={file:f,row:row,fill:fill,stat:stat,state:'wait'};
      (function(it){x.onclick=function(){
        if(it.state==='uploading')return;
        queue=queue.filter(function(q){return q!==it});
        it.row.remove();refreshBtn();
      }})(it);
      setStatus(it,'','等待',0);queue.push(it);$queue.appendChild(row);
    }
    refreshBtn();
    if(!running)startAll();
  }
  function refreshBtn(){
    var waiting=queue.filter(function(q){return q.state==='wait'}).length;
    var done=queue.filter(function(q){return q.state==='ok'||q.state==='fail'}).length;
    $clear.hidden=done===0;
    $qact.hidden=queue.length===0;
    if(running)$qhint.textContent='正在上传 · 请保持页面打开';
    else if(!queue.length)$qhint.textContent='';
    else $qhint.textContent=(waiting?waiting+' 个排队中':'全部处理完')+(done?' · 已完成 '+done:'');
  }
  function errMsg(xhr,file){
    var m='';
    try{m=JSON.parse(xhr.responseText).error.message}catch(e){}
    if(xhr.status===413)return m||('文件 '+fmtSize(file.size)+' 超过上限 '+fmtSize(MAX));
    return m||('上传失败 ('+xhr.status+')');
  }
  function uploadOne(it){
    return new Promise(function(resolve){
      var f=it.file;
      it.state='uploading';refreshBtn();
      function fail(msg){it.state='fail';setStatus(it,'fail','失败 · '+msg);resolve()}
      if(f.size===0)return fail('空文件');
      if(f.size>MAX)return fail('超过 '+fmtSize(MAX));
      setStatus(it,'','上传中 · 0%',0);
      var xhr=new XMLHttpRequest();
      xhr.open('PUT','/api/upload?name='+encodeURIComponent(f.name));
      if(f.type)xhr.setRequestHeader('Content-Type',f.type);
      xhr.upload.onprogress=function(e){if(e.lengthComputable){var p=Math.round(e.loaded/e.total*100);setStatus(it,'','上传中 · '+p+'%',p)}};
      xhr.onload=function(){
        if(xhr.status>=200&&xhr.status<300){it.state='ok';setStatus(it,'ok','已完成',100);resolve()}
        else if(xhr.status===401){location.href='/login'}
        else fail(errMsg(xhr,f));
      };
      xhr.onerror=function(){fail('网络错误')};xhr.onabort=function(){fail('已取消')};xhr.send(f);
    });
  }
  async function startAll(){
    if(running)return;
    running=true;refreshBtn();
    var anyOk=false;
    for(var i=0;i<queue.length;i++){
      if(queue[i].state!=='wait')continue;
      await uploadOne(queue[i]);
      if(queue[i].state==='ok')anyOk=true;
    }
    running=false;refreshBtn();
    if(anyOk){state.page=1;loadList()}
  }
  $clear.onclick=function(){
    queue=queue.filter(function(q){
      if(q.state==='ok'||q.state==='fail'){q.row.remove();return false}
      return true;
    });refreshBtn();
  };
  $drop.onclick=function(){$file.click()};
  $drop.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$file.click()}};
  $file.onchange=function(){addFiles($file.files);$file.value=''};
  ['dragenter','dragover'].forEach(function(t){$drop.addEventListener(t,function(e){e.preventDefault();e.stopPropagation();$drop.classList.add('over')})});
  ['dragleave','drop'].forEach(function(t){$drop.addEventListener(t,function(e){e.preventDefault();e.stopPropagation();$drop.classList.remove('over')})});
  $drop.addEventListener('drop',function(e){if(e.dataTransfer&&e.dataTransfer.files)addFiles(e.dataTransfer.files)});
  window.addEventListener('dragover',function(e){e.preventDefault()});
  window.addEventListener('drop',function(e){e.preventDefault()});

  /* ---------- 列表 / 筛选 / 多选 / 分页 ---------- */
  function td(label,cls){var c=el('td',cls||'');if(label)c.setAttribute('data-l',label);return c}
  function stat(box,value){document.getElementById(box).textContent=value}

  function selectedIds(){
    return Object.keys(state.sel).filter(function(k){return state.sel[k]});
  }
  function syncSel(){
    var ids=selectedIds();
    $selInfo.hidden=$bulkDel.hidden=ids.length===0;
    $selN.textContent=String(ids.length);
    var all=files.length>0&&ids.length===files.length;
    $selAll.checked=all;
    $selAll.indeterminate=ids.length>0&&!all;
  }
  function setAll(on){
    state.sel={};
    if(on)files.forEach(function(f){state.sel[f.id]=true});
    var boxes=$tbody.querySelectorAll('.rowck');
    for(var i=0;i<boxes.length;i++)boxes[i].checked=on;
    syncSel();
  }
  $selAll.onchange=function(){setAll($selAll.checked)};

  function renderFilters(){
    $filters.textContent='';
    var mk=function(label,count,on){
      var b=el('button','fchip'+(on?' on':''));b.type='button';
      b.appendChild(el('span',undefined,label));
      if(count!==undefined){var i=el('i',undefined,String(count));b.appendChild(i)}
      b.onclick=function(){
        if(on)return;
        state.tag=label==='全部'?'':label;
        state.page=1;loadList();
      };
      $filters.appendChild(b);
    };
    mk('全部',state.stats?state.stats.files:undefined,state.tag==='');
    state.tags.forEach(function(t){mk(t.name,t.count,t.name===state.tag)});
  }

  function renderPager(){
    var pages=Math.max(1,Math.ceil(state.total/state.limit));
    $tblFt.hidden=pages<=1;
    if(pages<=1)return;
    $pager.textContent='';
    var mk=function(label,p,on,dis){
      var b=el('button',on?'on':undefined,label);
      b.type='button';b.disabled=!!dis;
      if(!on&&!dis)b.onclick=function(){state.page=p;loadList()};
      $pager.appendChild(b);
    };
    mk('‹',state.page-1,false,state.page<=1);
    var list=[];
    if(pages<=7){for(var i=1;i<=pages;i++)list.push(i)}
    else{
      list.push(1);
      var s=Math.max(2,state.page-1),e=Math.min(pages-1,state.page+1);
      if(s>2)list.push('...');
      for(var j=s;j<=e;j++)list.push(j);
      if(e<pages-1)list.push('...');
      list.push(pages);
    }
    list.forEach(function(p){
      if(p==='...'){$pager.appendChild(el('span','gap','…'));return}
      mk(String(p),p,p===state.page,false);
    });
    mk('›',state.page+1,false,state.page>=pages);
  }

  function render(d){
    files=d.items;
    state.page=d.page;state.limit=d.limit;state.total=d.total;
    state.tags=d.tags||[];state.stats=d.stats;state.sel={};
    $tbody.textContent='';
    $count.textContent=d.total+' 个文件';
    if(!d.items.length){
      var tr0=el('tr'),c0=el('td','tbl-empty');
      c0.colSpan=6;
      var box=el('div','empty-in');
      var ic=el('div','ei');
      ic.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.2a2.2 2.2 0 0 1 2.2-2.2h3l1.9 2.3h6.7a2.2 2.2 0 0 1 2.2 2.2v7.1a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2z"/></svg>';
      box.appendChild(ic);
      box.appendChild(el('b',undefined,state.tag?'这个分类下还没有文件':'还没有文件'));
      box.appendChild(el('span',undefined,state.tag?'换个分类看看，或上传一个新文件':'把文件拖进上方卡片，或点击选择即可'));
      c0.appendChild(box);tr0.appendChild(c0);$tbody.appendChild(tr0);
    }
    d.items.forEach(function(f){
      var tr=el('tr');
      var sel=td('','sel');
      var ck=document.createElement('input');
      ck.type='checkbox';ck.className='ck rowck';ck.setAttribute('aria-label','选择 '+f.name);
      ck.onchange=function(){state.sel[f.id]=ck.checked;syncSel()};
      sel.appendChild(ck);tr.appendChild(sel);

      var n=td('','nm');
      var wrap=el('div','nmwrap');
      wrap.appendChild(makeIcon(f,'sm'));
      var tx=el('div','nmtx');
      tx.appendChild(el('div','t',f.name));
      if(f.tags.length){
        var ps=el('div','pills');
        f.tags.forEach(function(x){ps.appendChild(el('span','pill',x))});
        tx.appendChild(ps);
      }
      if(f.note)tx.appendChild(el('div','note-line',f.note));
      wrap.appendChild(tx);n.appendChild(wrap);
      tr.appendChild(n);
      tr.appendChild(td('大小','num')).textContent=fmtSize(f.size);
      tr.appendChild(td('下载','num')).textContent=String(f.downloads);
      tr.appendChild(td('上传时间')).textContent=fmtDate(f.created_at);
      var ac=td('','');var box=el('div','acts');
      /* 预览按钮常驻；不支持预览的格式，点击直接下载（PV.open 内部处理） */
      var pv=el('button','btn sm outline','预览');pv.type='button';
      pv.onclick=function(){PV.open(f)};
      box.appendChild(pv);
      var dl=el('a','btn sm outline','下载');dl.href='/d/'+encodeURIComponent(f.id);dl.setAttribute('download','');box.appendChild(dl);
      var eb=el('button','btn sm outline','编辑');eb.type='button';eb.onclick=function(){openEdit(f)};box.appendChild(eb);
      var db=el('button','btn sm danger','删除');db.type='button';db.onclick=function(){openDelete(f)};box.appendChild(db);
      ac.appendChild(box);tr.appendChild(ac);
      $tbody.appendChild(tr);
    });
    stat('stFiles',String(d.stats.files));
    stat('stSize',fmtSize(d.stats.totalSize));
    stat('stDl',String(d.stats.totalDownloads));
    renderFilters();renderPager();syncSel();
  }

  async function loadList(retry){
    var q='?page='+state.page+(state.tag?'&tag='+encodeURIComponent(state.tag):'');
    try{
      var d=await api('GET','/api/admin/files'+q);
      var pages=Math.max(1,Math.ceil(d.total/d.limit));
      if(d.page>pages&&!retry){state.page=pages;return loadList(true)}
      render(d);
    }catch(e){toast('加载失败：'+e.message)}
  }
  document.getElementById('refresh').onclick=function(){loadList()};

  /* ---------- 编辑 / 删除（支持批量） ---------- */
  function openEdit(f){
    cur=f;
    document.getElementById('eName').value=f.name;
    document.getElementById('eTags').value=f.tags.join(', ');
    document.getElementById('eNote').value=f.note;
    document.getElementById('eErr').textContent='';
    $edit.showModal();
  }
  document.getElementById('eCancel').onclick=function(){$edit.close()};
  document.getElementById('eSave').onclick=async function(){
    var err=document.getElementById('eErr');err.textContent='';
    try{
      await api('PATCH','/api/files/'+cur.id,{
        name:document.getElementById('eName').value,
        tags:document.getElementById('eTags').value,
        note:document.getElementById('eNote').value
      });
      $edit.close();toast('已保存');loadList();
    }catch(e){err.textContent=e.message}
  };
  function showDelete(ids,lead){
    delIds=ids;
    $delLead.textContent=lead;
    document.getElementById('delErr').textContent='';
    $confirm.showModal();
  }
  function openDelete(f){
    showDelete([f.id],'将删除「'+f.name+'」。文件数据会从 R2 中清除，此操作无法撤销。');
  }
  $bulkDel.onclick=function(){
    var ids=selectedIds();
    if(!ids.length)return;
    showDelete(ids,'将删除选中的 '+ids.length+' 个文件。文件数据会从 R2 中清除，此操作无法撤销。');
  };
  document.getElementById('delCancel').onclick=function(){$confirm.close()};
  document.getElementById('delOk').onclick=async function(){
    if(!delIds||!delIds.length)return;
    try{
      if(delIds.length===1){await api('DELETE','/api/files/'+delIds[0]);toast('已删除')}
      else{
        var r=await api('POST','/api/files/bulk-delete',{ids:delIds});
        toast('已删除 '+(r&&r.deleted!==undefined?r.deleted:delIds.length)+' 个文件');
      }
      $confirm.close();loadList();
    }catch(e){document.getElementById('delErr').textContent=e.message}
  };

  /* ---------- 退出 ---------- */
  document.getElementById('logout').onclick=async function(){
    try{await api('POST','/api/logout')}catch(e){}
    location.href='/login';
  };

  refreshBtn();loadList();
})();
`;

const ICONS = {
  files: `<path d="M4.5 7.2A2.2 2.2 0 0 1 6.7 5h3l1.8 2.2h5.8a2.2 2.2 0 0 1 2.2 2.2v7.4a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2z"/>`,
  size: `<ellipse cx="12" cy="6.4" rx="6.6" ry="2.6"/><path d="M5.4 6.4v5.6c0 1.44 2.95 2.6 6.6 2.6s6.6-1.16 6.6-2.6V6.4"/><path d="M5.4 12v5.6c0 1.44 2.95 2.6 6.6 2.6s6.6-1.16 6.6-2.6V12"/>`,
  dl: `<path d="M12 4.4v9.8m0 0-3.5-3.5M12 14.2l3.5-3.5"/><path d="M5 16.6v1.6A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8v-1.6"/>`,
  up: `<path d="M12 15.4V4.8m0 0L7.9 8.9M12 4.8l4.1 4.1"/><path d="M5 14.4v3.8A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8v-3.8"/>`,
};

export function adminPage(siteName: string, nonce: string, maxBytes: number): string {
  const name = escapeHtml(siteName);
  const mb = Math.floor(maxBytes / 1048576);
  const body = `
<nav class="nav">
  <div class="wrap nav-in">
    <div class="brand">${LOGO}<span>${name} · 管理</span></div>
    <div class="spacer"></div>
    <div class="nav-act">
      <a class="btn sm outline" href="/">访客视图</a>
      <button id="logout" class="btn sm outline" type="button">退出</button>
    </div>
  </div>
</nav>
<main class="wrap page">
  <header class="page-hd">
    <div>
      <h1 class="page-title">管理后台</h1>
    </div>
  </header>

  <div class="stats">
    <div class="stat">
      <span class="stat-ico si-1"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.files}</svg></span>
      <div class="stat-tx"><b id="stFiles">—</b><span>文件数</span></div>
    </div>
    <div class="stat">
      <span class="stat-ico si-2"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.size}</svg></span>
      <div class="stat-tx"><b id="stSize">—</b><span>占用空间</span></div>
    </div>
    <div class="stat">
      <span class="stat-ico si-3"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.dl}</svg></span>
      <div class="stat-tx"><b id="stDl">—</b><span>累计下载</span></div>
    </div>
  </div>

  <div class="panel sec">
    <div class="panel-hd">
      <h2>上传文件</h2>
      <span class="small muted">选择或拖入后立即开始上传</span>
    </div>
    <div id="drop" class="drop" tabindex="0" role="button" aria-label="拖拽或点击选择文件">
      <div class="dicon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.up}</svg></div>
      <b class="only-idle">把文件拖到这里</b>
      <b class="only-over">松开鼠标即可添加</b>
      <div class="drop-meta">
        <span class="dchip">支持多选</span>
        <span class="dchip">单文件 ≤ ${mb} MB</span>
        <span class="dchip">自动识别文件格式</span>
      </div>
    </div>
    <input id="file" type="file" multiple hidden>
    <div id="queue" class="queue"></div>
    <div class="qact" id="qact" hidden>
      <button id="clearDone" class="btn outline" type="button" hidden>清除已完成</button>
      <span id="qhint" class="qhint">选择文件后会自动开始上传</span>
    </div>
  </div>

  <div class="panel tbl" style="margin-top:18px">
    <div class="tbl-hd">
      <div class="tbl-hd-l"><h2>全部文件</h2><span class="cnt" id="tblCount">—</span></div>
      <div class="tbl-hd-r">
        <span class="selinfo" id="selInfo" hidden>已选 <b id="selN">0</b> 项</span>
        <button id="bulkDel" class="btn sm danger" type="button" hidden>删除</button>
        <button id="refresh" class="btn sm ghost iconbtn" type="button" title="刷新列表" aria-label="刷新列表"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.4"/><path d="M19.9 4.6v4.1h-4.1"/></svg></button>
      </div>
    </div>
    <div class="filters" id="filters" aria-label="按标签筛选"></div>
    <table class="list">
      <thead><tr>
        <th class="sel"><input id="selAll" class="ck" type="checkbox" aria-label="全选本页"></th>
        <th>文件</th><th>大小</th><th>下载</th><th>上传时间</th><th style="text-align:right">操作</th>
      </tr></thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="tbl-ft" id="tblFt" hidden><div id="pager" class="pager"></div></div>
  </div>
</main>

<dialog id="editDlg">
  <h3>编辑文件</h3>
  <label class="fl" for="eName">文件名</label>
  <input id="eName" class="field" type="text" maxlength="200">
  <label class="fl" for="eTags">标签（逗号分隔）</label>
  <input id="eTags" class="field" type="text" maxlength="200">
  <label class="fl" for="eNote">备注</label>
  <textarea id="eNote" class="field" maxlength="500"></textarea>
  <div id="eErr" class="err"></div>
  <div class="dlg-act">
    <button id="eCancel" class="btn outline" type="button">取消</button>
    <button id="eSave" class="btn primary" type="button">保存</button>
  </div>
</dialog>

<dialog id="delDlg">
  <h3>确认删除？</h3>
  <p class="dlg-p" id="delLead"></p>
  <div id="delErr" class="err"></div>
  <div class="dlg-act">
    <button id="delCancel" class="btn outline" type="button">取消</button>
    <button id="delOk" class="btn danger solid" type="button">删除</button>
  </div>
</dialog>`;
  return renderPage({
    title: `管理 · ${siteName}`,
    nonce,
    body,
    script: SCRIPT,
    bodyAttrs: `data-max="${maxBytes}"`,
  });
}

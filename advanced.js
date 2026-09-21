/* زدکړیال V12 Advanced feature layer */
(function(){
  const $=s=>document.querySelector(s);
  const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function box(title,body){return `<div class="panel advancedPanel"><div class="advTitle"><h3>${title}</h3></div>${body}</div>`}
  function mount(id,html){const el=$(id);if(!el)return;let old=el.querySelector('.advancedCenter');if(old)old.remove();const d=document.createElement('div');d.className='advancedCenter';d.innerHTML=html;el.appendChild(d);}
  async function student(){
    try{
      const [me,wish,noti,orders]=await Promise.all([api('/api/me'),api('/api/wishlist'),api('/api/notifications'),api('/api/my-purchases')]);
      const u=me.user;
      mount('#studentDash',`<div class="advGrid">
        ${box('⚙️ شخصي تنظیمات',`<form id="profileForm" class="form"><div class="two"><input name="name" value="${esc(u.name)}" placeholder="نوم"><input name="email" value="${esc(u.email||'')}" type="email" placeholder="Email"></div><button class="primary">پروفایل تازه کړه</button></form>`)}
        ${box('⭐ زما خوښ شوي کورسونه',`<div id="wishList">${(wish.items||[]).map(x=>`<div class="miniRow"><b>${esc(x.title)}</b><button onclick="removeWish('${x.courseId}')">حذف</button></div>`).join('')||'<p class="muted">تر اوسه کورس نه دی خوښ شوی.</p>'}</div>`)}
      </div><div class="advGrid">
        ${box('🔔 Notifications',`<div id="notifList">${(noti.notifications||[]).slice(0,12).map(x=>`<div class="miniRow"><span><b>${esc(x.title)}</b><small>${esc(x.message)}</small></span>${!x.read?`<button onclick="readNotif('${x.id}')">لوستل شوی</button>`:''}</div>`).join('')||'<p class="muted">Notification نشته.</p>'}</div>`)}
        ${box('🏆 زده کړه او Certificate',`<p>کله چې د کورس اړوند درسونه بشپړ کړئ، سیستم کولی شي د بشپړولو سند ثبت کړي.</p><button class="primary" onclick="loadCertificates()">زما Certificates وګوره</button><div id="certList"></div>`)}
      </div><div class="advGrid">${box('🧾 د Payment بانک رسید',`${(orders.orders||[]).filter(o=>o.status!=='paid').map(o=>`<form class="receiptForm form" data-order="${esc(o.id)}"><p><b>Order:</b> ${esc(o.id)} — ${esc(o.amount)} AFN</p><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required><button class="primary">رسید Upload کړه</button></form>`).join('')||'<p class="muted">اوس مهال د رسید لپاره Pending Order نشته.</p>'}`)}${box('📞 Help Center',`<p>د حساب، Payment، Verification یا محتوا ستونزه لرئ؟ له Dashboard څخه Support Ticket واستوئ.</p><span class="tag ok">24/7 Ticket workflow</span>`)}</div>
      </div>`);
      $('#profileForm').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/profile',{method:'PATCH',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});meUser=r.user;toast('پروفایل تازه شو')}catch(x){toast(x.message)}};
      document.querySelectorAll('.receiptForm').forEach(f=>f.onsubmit=async e=>{e.preventDefault();try{const fd=new FormData(f);fd.append('orderId',f.dataset.order);const r=await fetch('/api/payment/receipt',{method:'POST',headers:{Authorization:'Bearer '+tok},body:fd});const j=await r.json();if(!r.ok)throw Error(j.error||'Upload ناکام شو');toast(j.message);f.reset()}catch(x){toast(x.message)}});
    }catch(e){/* dashboard remains usable if an optional feature is unavailable */}
  }
  async function teacher(){
    try{
      mount('#teacherDash',`<div class="advGrid">
        ${box('🧑‍🏫 Teacher Workspace',`<form id="teacherCourse" class="form"><input name="title" placeholder="د نوي کورس عنوان" required><textarea name="description" placeholder="لنډه پېژندنه"></textarea><input name="price" type="number" min="0" placeholder="بیه AFN (۰ = وړیا)"><button class="primary">کورس د Approval لپاره واستوه</button></form>`)}
        ${box('📤 Content Approval',`<p class="muted">استاد کولای شي محتوا Submit کړي؛ تر Admin Review وروسته Publish کېږي.</p><div class="tag warn">Draft → Review → Approved → Published</div>`)}
      </div><div class="advGrid">
        ${box('🧪 Quiz & Assessment',`<p>د کورس لپاره Quiz، پوښتنې، نمرې او د بریا معیار د راتلونکي Content workflow برخه ده.</p><button class="primary" onclick="toast('Quiz workspace د راتلونکي کورس له جوړولو سره فعالېږي')">Quiz Workspace</button>`)}
        ${box('💰 Teacher Earnings',`<p>د هر Paid Course د خرڅلاو او استاد د عاید راپور دلته ښودل کېدای شي.</p><button class="primary" onclick="loadTeacherEarnings()">عاید وګوره</button><div id="earningsBox"></div>`)}
      </div>`);
      $('#teacherCourse').onsubmit=async e=>{e.preventDefault();try{await api('/api/teacher/courses',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('کورس د Admin Approval لپاره واستول شو');e.target.reset()}catch(x){toast(x.message)}};
    }catch(e){}
  }
  async function admin(){
    try{
      mount('#adminDash',`<div class="advGrid">
        ${box('📊 Analytics & Reports',`<button class="primary" onclick="loadAnalytics()">راپورونه تازه کړه</button><div id="analyticsBox"></div>`)}
        ${box('🛡️ Audit Log',`<button class="primary" onclick="loadAudit()">وروستي فعالیتونه</button><div id="auditBox"></div>`)}
      </div><div class="advGrid">
        ${box('🧾 د بانک رسیدونه',`<p class="muted">محصل کولای شي د تادیې رسید پورته کړي؛ Admin یې د Order سره یوځای Review کوي.</p><div id="receiptInfo" class="tag">Receipt workflow فعال</div>`)}
        ${box('🔔 System Notifications',`<form id="notifyForm" class="form"><input name="userId" placeholder="User ID" required><input name="title" placeholder="عنوان" required><textarea name="message" placeholder="پیغام" required></textarea><button class="primary">Notification واستوه</button></form>`)}
      </div>`);
      $('#notifyForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/notify',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Notification واستول شو');e.target.reset()}catch(x){toast(x.message)}};
    }catch(e){}
  }
  async function superadmin(){
    try{
      mount('#superDash',`<div class="advGrid">
        ${box('💾 Backup & System Health',`<button class="primary" onclick="downloadBackup()">Database Backup</button><button onclick="loadHealth()">System Health</button><div id="healthBox"></div>`)}
        ${box('🌐 Platform Settings',`<form id="settingsForm" class="form"><div class="two"><input name="platformName" value="زدکړیال" placeholder="Platform name"><select name="defaultLanguage"><option value="ps">پښتو</option><option value="fa">دري</option><option value="en">English</option></select></div><label><input name="maintenance" type="checkbox"> Maintenance mode</label><button class="primary">Settings Save</button></form>`)}
      </div><div class="advGrid">
        ${box('🗃️ Curriculum Management',`<p>د هر پوهنتون لپاره جلا Faculty/Department/Semester/Subject جوړښت وساتئ؛ یو ثابت ۱۱ سمستر حد نه کارول کېږي.</p><span class="tag ok">University-aware catalog</span>`)}
        ${box('🔐 Security Center',`<p>Session، permissions، protected files، upload limits او audit trail باید په Server کې enforce شي.</p><span class="tag ok">Server-side authorization</span>`)}
      </div>`);
      $('#settingsForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/superadmin/settings',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Settings ثبت شول')}catch(x){toast(x.message)}};
    }catch(e){}
  }
  window.removeWish=async function(id){try{await api('/api/wishlist/'+id,{method:'DELETE'});toast('له خوښو لرې شو');student()}catch(e){toast(e.message)}};
  window.readNotif=async function(id){try{await api('/api/notifications/'+id+'/read',{method:'POST'});student()}catch(e){toast(e.message)}};
  window.loadCertificates=async function(){try{const d=await api('/api/my-certificates');$('#certList').innerHTML=(d.certificates||[]).map(x=>`<div class="miniRow"><b>${esc(x.title)}</b><span class="tag ok">${esc(x.code)}</span></div>`).join('')||'<p class="muted">تر اوسه Certificate نشته.</p>'}catch(e){toast(e.message)}};
  window.loadTeacherEarnings=async function(){try{const d=await api('/api/teacher/earnings');$('#earningsBox').innerHTML=`<p><b>${esc(d.total||0)} AFN</b> ثبت شوی عاید</p>`}catch(e){toast(e.message)}};
  window.loadAnalytics=async function(){try{const d=await api('/api/admin/analytics');$('#analyticsBox').innerHTML=`<div class="miniStats"><span>Users: <b>${d.users}</b></span><span>Courses: <b>${d.courses}</b></span><span>Videos: <b>${d.videos}</b></span><span>Books: <b>${d.books}</b></span><span>Revenue: <b>${d.revenue} AFN</b></span></div>`}catch(e){toast(e.message)}};
  window.loadAudit=async function(){try{const d=await api('/api/admin/audit');$('#auditBox').innerHTML=(d.logs||[]).slice(0,15).map(x=>`<div class="miniRow"><span>${esc(x.action)}<small>${esc(x.userName||x.userId||'')}</small></span><small>${new Date(x.createdAt).toLocaleString()}</small></div>`).join('')||'<p class="muted">Audit log نشته.</p>'}catch(e){toast(e.message)}};
  window.downloadBackup=function(){window.open('/api/superadmin/backup','_blank')};
  window.loadHealth=async function(){try{const d=await api('/api/superadmin/health');$('#healthBox').innerHTML=`<p>Node: ${esc(d.node)} • Database: ${esc(d.database)} • Uploads: ${esc(d.uploads)}</p>`}catch(e){toast(e.message)}};
  const oldS=window.studentDashboard,oldT=window.teacherDashboard,oldA=window.adminDashboard;
  window.studentDashboard=async()=>{await oldS();await student()};
  window.teacherDashboard=async()=>{await oldT();await teacher()};
  window.adminDashboard=async()=>{await oldA();await admin()};
  window.superDashboard=async()=>{try{const m=await api('/api/me');meUser=m.user;setAuthUI();$('#superDash').innerHTML='';await superadmin()}catch(e){toast(e.message)}};
  window.addEventListener('online',()=>toast('Internet connection بېرته فعاله شوه'));
  window.addEventListener('offline',()=>toast('Internet connection قطع شوه'));
})();

const $=s=>document.querySelector(s);let tok=localStorage.getItem('zd')||localStorage.getItem('zd_token')||'',meUser=null,academic={universities:[],academicGroups:[],faculties:[],departments:[],academicYears:[],semesters:[],subjects:[]};
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.style.display='none',3500)}
async function api(url,opt={}){opt.headers={...(opt.headers||{}),...(opt.body?{'Content-Type':'application/json'}:{}),...(tok?{Authorization:'Bearer '+tok}:{})};const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||'د سرور ستونزه رامنځته شوه');return d}
function show(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#'+id)?.classList.add('active');if(id==='home')loadHome();if(id==='courses')loadCourses();if(id==='books')loadBooks();if(id==='live')loadLive();if(id==='semesters')loadUniversityGroups();if(id==='account')studentDashboard();if(id==='teacher')teacherDashboard();if(id==='admin'){loadAcademic().then(()=>adminDashboard())}if(id==='superadmin'){loadAcademic().then(async()=>{meUser=(await api('/api/me')).user;setAuthUI();await renderSuperControls()}).catch(e=>toast(e.message))}scrollTo({top:0,behavior:'smooth'})}
function fill(id,arr,placeholder='انتخاب کړئ'){const e=$('#'+id);if(!e)return;e.innerHTML='<option value="">'+placeholder+'</option>'+(arr||[]).map(x=>'<option value="'+esc(typeof x==='string'?x:x.name)+'">'+esc(typeof x==='string'?x:x.name)+'</option>').join('')}
function departmentsFor(f){return academic.departments.filter(x=>x.faculty===f).map(x=>x.name)}
function semestersFor(f){const n=Number(academic.facultySemesters?.[f]||0);return n>0?Array.from({length:n},(_,i)=>String(i+1)):[]}
async function loadAcademic(){try{const d=await api("/api/academic/catalog");academic={universities:d.universities||[],academicGroups:d.academicGroups||[],faculties:d.faculties||[],departments:d.departments||[],academicYears:d.academicYears||[],semesters:d.semesters||[],facultySemesters:d.facultySemesters||{},subjects:d.subjects||[],programs:d.programs||[],terms:d.terms||[],gradingScales:d.gradingScales||[],policies:d.policies||[]};fill("runiv",academic.universities,"خپل پوهنتون انتخاب کړئ");fill("rfac",academic.faculties,"پوهنځی انتخاب کړئ");fill("rsem",semestersFor($("#rfac")?.value),"سمستر انتخاب کړئ");fill("ray",academic.academicYears,"تحصیلي کال انتخاب کړئ");fill("cfac",academic.faculties,"ټول پوهنځي");fill("csem",academic.semesters,"ټول سمسترونه");fill("bfilt",academic.faculties,"ټول پوهنځي");fill("bsem",academic.semesters,"ټول سمسترونه");fill("semesterFaculty",academic.faculties,"پوهنځی انتخاب کړئ");const sf=$("#semesterFaculty"),ss=$("#semesterNumber");if(sf&&!sf.dataset.bound){sf.dataset.bound="1";sf.onchange=()=>{fill("semesterNumber",semestersFor(sf.value),"سمستر انتخاب کړئ");ss.disabled=!sf.value;$("#semesterInfo").innerHTML=sf.value?'<h3>📚 '+esc(sf.value)+'</h3><p class="muted">اوس سمستر انتخاب کړئ.</p>':'<h3>📚 د سمستر زده کړې</h3><p class="muted">له پورته څخه پوهنځی او سمستر انتخاب کړئ.</p>';$("#semesterCourses").innerHTML=""}}if(ss&&!ss.dataset.bound){ss.dataset.bound="1";ss.onchange=()=>loadSemesters()} }catch(e){toast(e.message)}}

async function loadUniversityGroups(){
  const box=$("#academicGroups");
  if(!box)return;

  try{
    if(!academic.academicGroups?.length) await loadAcademic();

    const icons=["🩺","🏗️","💻","📊","⚖️","🎓","🌾","🔬","🌍","🎨","📚"];

    box.innerHTML=academic.academicGroups.map((g,i)=>{
      const count=(g.faculties||[]).length;
      const features=g.features||[];

      return '<article class="featureCard" onclick="openAcademicGroup(\''+
        esc(g.id)+
        '\')" style="cursor:pointer">'+
        '<div class="icon">'+(icons[i%icons.length])+'</div>'+
        '<h3>'+esc(g.name)+'</h3>'+
        '<p class="muted">'+count+' اړوندې برخې</p>'+
        (features.includes("qbank")?
          '<span class="tag">🧠 QBank</span>':"")+
        (features.includes("clinicalCases")?
          '<span class="tag">🩺 Clinical Cases</span>':"")+
        '</article>';
    }).join("");

  }catch(e){
    toast(e.message);
  }
}

function openAcademicGroup(id){
  const g=(academic.academicGroups||[]).find(x=>x.id===id);
  if(!g)return;

  const area=$("#universityArea");
  const title=$("#universityTitle");
  const box=$("#universityFaculties");

  if(!area||!title||!box)return;

  area.style.display="block";

  title.innerHTML=
    '<h2>🎓 '+esc(g.name)+'</h2>'+
    '<p class="muted">د دې تخصص اړوند پوهنځي او تعلیمي برخې انتخاب کړئ.</p>'+
    (g.features?.includes("qbank")?
      '<button class="outline" onclick="show(&quot;qbank&quot;)">🧠 QBank</button>':"")+
    (g.features?.includes("clinicalCases")?
      '<button class="outline" onclick="show(&quot;clinicalCases&quot;)">🩺 Clinical Cases</button>':"");

  box.innerHTML=(g.faculties||[]).map((f,i)=>
    '<article class="featureCard" onclick="openAcademicFaculty(\''+
    esc(f)+
    '\')" style="cursor:pointer">'+
    '<div class="icon">'+facultyIcon(i)+'</div>'+
    '<h3>'+esc(f)+'</h3>'+
    '<p class="muted">پوهنځی / تخصص</p>'+
    '<span class="tag">سمسترونه وګورئ</span>'+
    '</article>'
  ).join("");

  area.scrollIntoView({behavior:"smooth",block:"start"});
}

function openAcademicFaculty(faculty){
  const semesters=semestersFor(faculty);

  const box=$("#universityFaculties");
  if(!box)return;

  box.innerHTML=
    '<div class="panel" style="grid-column:1/-1">'+
    '<h3>📚 '+esc(faculty)+'</h3>'+
    '<p class="muted">د دې برخې لپاره موجود سمسترونه</p>'+
    '<div class="grid" style="margin-top:16px">'+
    semesters.map(s=>
      '<article class="featureCard" onclick="openAcademicSemester(\''+
      esc(faculty)+'\',\''+esc(s)+
      '\')" style="cursor:pointer">'+
      '<div class="icon">📖</div>'+
      '<h3>سمستر '+esc(s)+'</h3>'+
      '<p class="muted">کورسونه او کتابونه</p>'+
      '</article>'
    ).join("")+
    '</div></div>';
}

async function openAcademicSemester(faculty,semester){
  const box=$("#universityFaculties");
  if(!box)return;

  try{
    const [cr,br]=await Promise.all([
      api("/api/courses?faculty="+encodeURIComponent(faculty)),
      api("/api/books?faculty="+encodeURIComponent(faculty))
    ]);

    const courses=(cr.courses||[]).filter(x=>String(x.semester)===String(semester));
    const books=(br.books||[]).filter(x=>String(x.semester)===String(semester));

    box.innerHTML=
      '<div class="panel" style="grid-column:1/-1">'+
      '<h3>📚 '+esc(faculty)+' — سمستر '+esc(semester)+'</h3>'+
      '<p class="muted">اړوند کورسونه او کتابونه</p>'+
      '</div>'+
      (courses.length?
        '<h3 style="grid-column:1/-1">🎥 کورسونه</h3>'+
        courses.map(courseCard).join(""):"")+
      (books.length?
        '<h3 style="grid-column:1/-1">📚 کتابونه</h3>'+
        books.map(b=>
          '<article class="bookCard">'+
          '<div class="bookIcon">📚</div>'+
          '<h3>'+esc(b.title)+'</h3>'+
          '<p class="muted">لیکوال: '+esc(b.author||"—")+'</p>'+
          '<button class="primary" onclick="openBook(\''+
          esc(b.id)+'\')">کتاب پرانیزه</button>'+
          '</article>'
        ).join(""):"")+
      ((!courses.length&&!books.length)?
        '<div class="empty" style="grid-column:1/-1">د دې سمستر لپاره تر اوسه محتوا نشته.</div>':"");

  }catch(e){
    toast(e.message);
  }
}

async function loadSemesters(){
  const faculty=$("#semesterFaculty")?.value||"";
  const semester=$("#semesterNumber")?.value||"";
  if(!faculty)return;
  if(!semester){
    $("#semesterInfo").innerHTML='<h3>📚 '+esc(faculty)+'</h3><p class="muted">سمستر انتخاب کړئ.</p>';
    $("#semesterCourses").innerHTML="";
    return;
  }
  try{
    const [cr,br]=await Promise.all([
      api("/api/courses?faculty="+encodeURIComponent(faculty)),
      api("/api/books?faculty="+encodeURIComponent(faculty))
    ]);
    const courses=(cr.courses||[]).filter(x=>String(x.semester)===String(semester));
    const books=(br.books||[]).filter(x=>String(x.semester)===String(semester));
    $("#semesterInfo").innerHTML='<h3>📚 '+esc(faculty)+' — سمستر '+esc(semester)+'</h3><p class="muted">اړوند کورسونه او کتابونه</p>';
    $("#semesterCourses").innerHTML=
      (courses.length?'<h3 style="grid-column:1/-1">🎥 کورسونه</h3>'+courses.map(courseCard).join(""):"")+
      (books.length?'<h3 style="grid-column:1/-1">📚 کتابونه</h3>'+books.map(b=>'<article class="bookCard"><div class="bookIcon">📚</div><h3>'+esc(b.title)+'</h3><p class="muted">لیکوال: '+esc(b.author||"—")+'</p><div class="meta"><span class="tag">'+esc(b.faculty||"عمومي")+'</span><span class="tag">سمستر '+esc(b.semester||"—")+'</span></div><p>'+esc(b.description||"")+'</p><button class="primary" onclick="openBook(\''+b.id+'\')">کتاب پرانیزه</button></article>').join(""):"")+
      ((!courses.length&&!books.length)?'<div class="empty" style="grid-column:1/-1">د دې پوهنځي او سمستر لپاره تر اوسه محتوا نشته.</div>':"");
  }catch(e){toast(e.message)}
}
function setAuthUI(){const a=$('#actions');if(!a)return;if(!tok){a.innerHTML='<button onclick="show(\'login\')">Login</button><button class="primary" onclick="show(\'register\')">ثبت نام</button>';return}const label=meUser?.role==='student'?'حساب':meUser?.role==='teacher'?'استاد':meUser?.role==='superadmin'?'Super Admin':'Admin';a.innerHTML='<button onclick="show(\''+(meUser?.role==='student'?'account':meUser?.role==='teacher'?'teacher':meUser?.role==='superadmin'?'superadmin':'admin')+'\')">'+label+'</button><button onclick="logout()">وتل</button>'}
function facultyIcon(i){return ['🩺','💊','💻','⚙️','⚖️','📊','🧪','🌱'][i%8]}
async function loadHome(){try{const [s,c,a]=await Promise.all([api('/api/site'),api('/api/courses'),api('/api/ads')]);$('#heroPhoto').src=s.site.heroImage||'/hero-banner.png?v=12';$('#heroInfo').innerHTML=meUser?'<b>'+esc(meUser.name)+'</b><span>'+esc(meUser.faculty||'محصل')+' • '+esc(meUser.department||'')+'</span>':'<b>د زده کړې پیل</b><span>خپل حساب جوړ کړئ</span>';$('#adStrip').innerHTML=a.ads?.length?'<div class="ad"><span>📢 <b>'+esc(a.ads[0].title)+'</b></span>'+(a.ads[0].link?'<a href="'+esc(a.ads[0].link)+'" target="_blank">نور معلومات →</a>':'')+'</div>':'';$('#facultyGrid').innerHTML=academic.faculties.slice(0,12).map((f,i)=>'<div class="faculty" onclick="filterFaculty(\''+esc(f).replace(/'/g,"['university',true,'پوهنتون']'")+'\')"><span class="facultyIcon">'+facultyIcon(i)+'</span><b>'+esc(f)+'</b><span>اکاډمیک محتوا او کورسونه</span></div>').join('');renderCourses('#popular',c.courses.slice(0,6))}catch(e){toast(e.message)}}
function filterFaculty(f){show('courses');$('#cfac').value=f;loadCourses()}
function courseCard(c){const paid=Number(c.price||0)>0;const count=(c.videos||[]).length;return '<article class="courseCard"><div class="cover"><div><span class="tag">'+esc(c.faculty||'عمومي')+'</span><h3>'+esc(c.title)+'</h3></div></div><div class="courseBody"><p class="muted">👨‍🏫 '+esc(c.teacher||'استاد ټاکل شوی نه دی')+'</p><div class="meta"><span class="tag">سمستر '+esc(c.semester||'—')+'</span><span class="tag">🎥 '+count+' ویډیو</span><span class="tag">'+(paid?'💰 Paid':'🆓 وړیا')+'</span></div><p class="muted">'+esc(c.description||'د منظم اکاډمیک کورس محتوا.')+'</p><div class="cardActions"><button onclick="openCourse(\''+c.id+'\')">کتل</button><button onclick="addWish(\''+c.id+'\')">⭐</button>'+(paid?'<button class="primary" onclick="buyCourse(\''+c.id+'\')">'+Number(c.price).toLocaleString()+' AFN</button>':'<button class="primary" onclick="openCourse(\''+c.id+'\')">شروع</button>')+'</div></div></article>'}
async function addWish(id){if(!tok){show('login');return}try{await api('/api/wishlist/'+id,{method:'POST'});toast('کورس خوښ شو ⭐')}catch(e){toast(e.message)}}
function renderCourses(sel,list){$(sel).innerHTML=list?.length?list.map(courseCard).join(''):'<div class="empty">اوس مهال محتوا نشته.</div>'}
async function loadCourses(){try{const q=encodeURIComponent($('#search')?.value||''),f=encodeURIComponent($('#cfac')?.value||'');const d=await api('/api/courses?q='+q+'&faculty='+f);let cs=d.courses;if($('#csem')?.value)cs=cs.filter(c=>String(c.semester)===String($('#csem').value));if($('#ctype')?.value)cs=cs.filter(c=>($('#ctype').value==='paid')=== (Number(c.price||0)>0));renderCourses('#coursesBox',cs)}catch(e){toast(e.message)}}
async function loadBooks(){try{const d=await api('/api/books'+($('#bfilt')?.value?'?faculty='+encodeURIComponent($('#bfilt').value):''));let bs=d.books;if($('#bsem')?.value)bs=bs.filter(b=>String(b.semester)===String($('#bsem').value));const q=($('#bookSearch')?.value||'').toLowerCase();if(q)bs=bs.filter(b=>JSON.stringify(b).toLowerCase().includes(q));$('#booksBox').innerHTML=bs.length?bs.map(b=>'<article class="bookCard"><div class="bookIcon">📚</div><h3>'+esc(b.title)+'</h3><p class="muted">لیکوال: '+esc(b.author||'—')+'</p><div class="meta"><span class="tag">'+esc(b.faculty||'عمومي')+'</span><span class="tag">سمستر '+esc(b.semester||'—')+'</span></div><p>'+esc(b.description||'')+'</p><button class="primary" onclick="openBook(\''+b.id+'\')">کتاب پرانیزه</button></article>').join(''):'<div class="empty">کتاب پیدا نه شو.</div>'}catch(e){toast(e.message)}}
async function loadLive(){try{const d=await api('/api/live-classes');$('#liveBox').innerHTML=d.liveClasses.length?d.liveClasses.map(x=>'<article class="liveCard"><span class="tag ok">● Live / Scheduled</span><h3>'+esc(x.title)+'</h3><p>👨‍🏫 '+esc(x.teacher)+'</p><p>🎓 '+esc(x.faculty)+' • سمستر '+esc(x.semester)+'</p><p>📅 '+esc(x.date||'—')+' | ⏰ '+esc(x.time||'—')+'</p>'+(x.url?'<a class="primary" href="'+esc(x.url)+'" target="_blank">ټولګي ته داخل شه</a>':'<span class="muted">د ګډون لینک وروسته اعلانېږي.</span>')+'</article>').join(''):'<div class="empty">تر اوسه ژوندۍ ټولګي نه دي ثبت شوي.</div>'}catch(e){toast(e.message)}}
async function openCourse(id){try{const d=await api('/api/courses/'+id);const c=d.course;$('#playerBox').innerHTML='<div class="panel"><span class="tag">'+esc(c.faculty||'')+' • سمستر '+esc(c.semester||'')+'</span><h2>'+esc(c.title)+'</h2><p class="muted">'+esc(c.description||'')+'</p><div class="courseGrid">'+(c.videos||[]).map(v=>'<div class="panel"><h3>🎥 '+esc(v.title)+'</h3><p class="muted">'+(Number(v.price||0)?Number(v.price).toLocaleString()+' AFN':'وړیا')+'</p><button class="primary" onclick="playVideo(\''+c.id+'\',\''+v.id+'\')">ویډیو وګوره</button></div>').join('')+'</div></div>';show('player')}catch(e){toast(e.message)}}
async function playVideo(cid,vid){if(!tok){show('login');return}try{const d=await api('/api/video/'+cid+'/'+vid+'/access');$('#playerBox').innerHTML='<div class="panel"><h2>🎥 ویډیو</h2><video id="videoEl" controls controlsList="nodownload" playsinline style="width:100%;max-height:620px;background:#000;border-radius:14px" src="'+d.url+'"></video><p class="muted">'+(d.mode==='preview'?'Preview — بشپړ درس د Purchase وروسته فعالېږي.':'✓ ستاسې د کورس لاسرسی فعال دی. مستقیم Download اختیار نشته.')+'</p></div>';const v=$('#videoEl');v.addEventListener('contextmenu',e=>e.preventDefault());v.addEventListener('timeupdate',()=>{if(d.mode==='preview'&&v.currentTime>=d.durationSeconds)v.pause();});}catch(e){toast(e.message)}}
async function buyCourse(id){if(!tok){show('login');return}try{const d=await api('/api/purchase/course/'+id,{method:'POST'});toast(d.message||'Purchase ثبت شو')}catch(e){toast(e.message)}}
async function openBook(id){if(!tok){toast('د کتاب د پرانیستلو لپاره Login وکړئ');show('login');return}try{const r=await fetch('/api/book/'+id+'/file',{headers:{Authorization:'Bearer '+tok}});if(!r.ok)throw Error((await r.json().catch(()=>({}))).error||'کتاب ته اجازه نشته');const blob=await r.blob(),url=URL.createObjectURL(blob);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),120000)}catch(e){toast(e.message)}}
async function deleteHeroPhoto(){if(!tok){show('login');return}try{await api('/api/profile/photo',{method:'DELETE'});$('#heroPhoto').src='/hero-banner.png?v=12';meUser.photo='';toast('عکس حذف شو')}catch(e){toast(e.message)}}
async function uploadHeroPhoto(input){if(!input.files[0])return;if(!tok){toast('د عکس بدلولو لپاره Login وکړئ');show('login');return}const fd=new FormData();fd.append('photo',input.files[0]);try{const d=await fetch('/api/profile/photo',{method:'POST',headers:{Authorization:'Bearer '+tok},body:fd});const j=await d.json();if(!d.ok)throw Error(j.error||'Upload ناکام شو');meUser=j.user;$('#heroPhoto').src=j.url+'?t='+Date.now();toast('عکس په بریالیتوب بدل شو')}catch(e){toast(e.message)}}
async function renderStudentSubjects(subjects){
 const el=document.querySelector('#studentSubjects');
 if(!el)return;
 el.innerHTML=subjects.length?subjects.map(x=>'<div class="subjectItem"><b>'+esc(x.name)+'</b><br><small>Code: '+esc(x.code||'—')+' • Credits: '+esc(x.credits||0)+' • سمستر: '+esc(x.semester)+'</small></div>').join(''):'<p class="muted">تر اوسه ستاسې د رشته او سمستر لپاره مضمونونه ثبت شوي نه دي.</p>';
}
async function sendAIQuestion(e){
  e.preventDefault();

  const input=$('#aiInput');
  const box=$('#aiMessages');
  if(!input||!box)return;

  const message=input.value.trim();
  if(!message)return;

  box.insertAdjacentHTML('beforeend',
    '<div class="aiMsg user">'+esc(message)+'</div>'
  );

  input.value='';
  input.disabled=true;

  const loading=document.createElement('div');
  loading.className='aiMsg assistant';
  loading.textContent='⏳ AI ځواب تیاروي...';
  box.appendChild(loading);
  box.scrollTop=box.scrollHeight;

  try{
    const history=[...box.querySelectorAll('.aiMsg')]
      .filter(x=>x!==loading)
      .slice(-10)
      .map(x=>({
        role:x.classList.contains('user')?'user':'assistant',
        content:x.textContent
      }));

    const d=await api('/api/ai/chat',{
      method:'POST',
      body:JSON.stringify({
        message,
        messages:history
      })
    });

    loading.textContent=d.answer||'AI ځواب ترلاسه نه شو.';
  }catch(err){
    loading.textContent='❌ '+err.message;
  }finally{
    input.disabled=false;
    input.focus();
    box.scrollTop=box.scrollHeight;
  }
}

async function studentDashboard(){if(!tok)return show('login');try{const [m,p,n,pr,sp]=await Promise.all([api('/api/me'),api('/api/my-purchases'),api('/api/notifications'),api('/api/my-progress'),api('/api/student/subjects')]);meUser=m.user;setAuthUI();const subjects=sp.subjects||[];$('#studentDash').innerHTML='<div class="dashCards"><div class="dashCard">👤<span class="statNumber">'+esc(meUser.name)+'</span><small>Student ID: '+esc(meUser.studentCode||'—')+'</small></div><div class="dashCard">🎓<span class="statNumber">'+esc(meUser.faculty||'—')+'</span><small>'+esc(meUser.department||'')+' • سمستر '+esc(meUser.semester||'—')+'</small></div><div class="dashCard">💳<span class="statNumber">'+p.orders.length+'</span><small>Purchase/Orders</small></div><div class="dashCard">🔔<span class="statNumber">'+n.notifications.filter(x=>!x.read).length+'</span><small>نوي Notifications</small></div></div><div class="adminGrid"><div class="panel"><h3>🎓 زما اکاډمیک پروفایل</h3><p>پوهنتون: <b>'+esc(meUser.university)+'</b></p><p>پوهنځی: <b>'+esc(meUser.faculty)+'</b></p><p>رشته: <b>'+esc(meUser.department)+'</b></p><p>سمستر: <b>'+esc(meUser.semester)+'</b> | تحصیلي کال: <b>'+esc(meUser.academicYear)+'</b></p><p>Status: <span class="tag ok">'+esc(meUser.status)+'</span></p></div><div class="panel"><h3>📈 زده کړه او Progress</h3>'+((pr.progress||[]).map(x=>'<p><b>'+esc(x.title)+'</b> <span class="muted">'+Object.values(x.progress||{})[0]+'%</span></p><div class="progress"><i style="width:'+(Object.values(x.progress||{})[0]||0)+'%"></i></div>').join('')||'<p class="muted">Progress لا نه دی ثبت شوی.</p>')+'</div></div><div class="panel"><h3>💳 زما Purchases</h3>'+(p.orders.map(o=>'<p>📦 '+esc(o.type)+' — '+esc(o.amount)+' AFN — <span class="tag">'+esc(o.status)+'</span></p>').join('')||'<p class="muted">Purchase نشته.</p>')+'</div><div class="panel"><h3>🔔 Notifications</h3>'+(n.notifications.map(x=>'<p>'+esc(x.title)+' — '+esc(x.message)+'</p>').join('')||'<p class="muted">Notification نشته.</p>')+'</div><div class="adminGrid"><div class="panel"><h3>📨 ملاتړ</h3><form id="supportForm" class="form"><input name="subject" placeholder="موضوع" required><textarea name="message" placeholder="خپل پیغام ولیکئ" required></textarea><button class="primary">Support Ticket واستوه</button></form></div><div class="panel"><h3>🔐 Password</h3><form id="pwf" class="form"><input name="currentPassword" type="password" placeholder="اوسنی Password" required><input name="newPassword" type="password" placeholder="نوی Password" required><button class="primary">بدل کړه</button></form></div></div>';$('#studentDash').insertAdjacentHTML('beforeend','<div class="panel"><h3>📚 زما مضمونونه</h3><div id="studentSubjects">'+(subjects.length?subjects.map(x=>'<p>📘 <b>'+esc(x.name)+'</b> — سمستر '+esc(x.semester)+' | Credits: '+esc(x.credits||0)+'</p>').join(''):'<p class="muted">تر اوسه ستاسې د رشته او سمستر لپاره مضمونونه ثبت شوي نه دي.</p>')+'</div></div>');$('#pwf').onsubmit=changePassword;$('#supportForm').onsubmit=async e=>{e.preventDefault();try{toast((await api('/api/support',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))})).message)}catch(x){toast(x.message)}};$('#studentDash').insertAdjacentHTML('beforeend',`<div class="panel aiPanel"><h3>🤖 د زدکړیال AI تعلیمي مرستیال</h3><p class="muted">خپله پوښتنه په پښتو، دري یا English ولیکئ.</p><div id="aiMessages" class="aiMessages"><div class="aiMsg assistant">سلام! زه د «زدکړیال» AI تعلیمي مرستیال یم. څه شی درسره زده کړم؟</div></div><form id="aiForm" class="form"><textarea id="aiInput" placeholder="خپله پوښتنه ولیکئ..." required maxlength="8000"></textarea><button class="primary" type="submit">🤖 پوښتنه واستوه</button></form></div>`);$('#aiForm').onsubmit=sendAIQuestion}catch(e){toast(e.message)}}
async function teacherDashboard(){
 if(!tok)return show('login');
 try{
  const u=(await api('/api/me')).user;
  meUser=u;
  setAuthUI();
  $('#teacherDash').innerHTML=
   '<div class="dashCards">'+
   '<div class="dashCard">👨‍🏫<span class="statNumber">'+esc(u.name)+'</span><small>Teacher ID: '+esc(u.teacherCode||u.id)+'</small></div>'+
   '<div class="dashCard">🎓<span class="statNumber">'+esc(u.faculty||'—')+'</span><small>'+esc(u.department||'')+'</small></div>'+
   '<div class="dashCard">📚<span class="statNumber">'+esc(u.semester||'—')+'</span><small>د تدریس سمستر</small></div>'+
   '<div class="dashCard">🔐<span class="statNumber">'+esc(u.status)+'</span><small>Verification</small></div>'+
   '</div>'+
   '<div class="adminGrid">'+
   '<div class="panel"><h3>📋 مسلکي پروفایل</h3>'+
   '<p>اسناد: '+esc(u.credentials||'—')+'</p>'+
   '<p>پوهنځی: '+esc(u.faculty||'—')+'</p>'+
   '<p>رشته: '+esc(u.department||'—')+'</p>'+
   '<p>د استاد حساب د Admin approval له مخې کار کوي.</p></div>'+
   '<div class="panel"><h3>➕ نوی کورس جوړ کړه</h3>'+
   '<form id="teacherCourseForm" class="form">'+
   '<input name="title" placeholder="د کورس عنوان" required>'+
   '<textarea name="description" placeholder="د کورس تشریح" rows="5"></textarea>'+
   '<p class="muted">پوهنځی، رشته او سمستر د استاد له تایید شوي پروفایل څخه اخیستل کېږي.</p>'+
   '<p class="muted">💰 قیمت د استاد له خوا نه ټاکل کېږي؛ Admin به وروسته قیمت وټاکي.</p>'+
   '<button class="primary" type="submit">📤 د Review لپاره Submit کړه</button>'+
   '</form></div></div>';

  const f=document.querySelector('#teacherCourseForm');
  if(f)f.onsubmit=async e=>{
   e.preventDefault();
   try{
    const fd=new FormData(f);
    await api('/api/teacher/courses',{
     method:'POST',
     body:JSON.stringify({
      title:fd.get('title'),
      description:fd.get('description')
     })
    });
    toast('کورس د Admin Review لپاره Submit شو');
    f.reset();
   }catch(err){toast(err.message)}
  };
 }catch(e){toast(e.message)}
}
function stat(label,n,icon){return '<div class="dashCard">'+icon+'<span class="statNumber">'+esc(n)+'</span><small>'+esc(label)+'</small></div>'}
function subjectAdminForm(){
 const box=document.createElement('div');
 box.className='panel';
 box.innerHTML='<h3>📚 نوی مضمون اضافه کړئ</h3><form id="subjectAdminForm" class="form"><input name="name" placeholder="د مضمون نوم" required><input name="code" placeholder="Subject Code"><select name="faculty" id="saf" required><option value="">پوهنځی انتخاب کړئ</option></select><select name="department" id="sad" required><option value="">رشته انتخاب کړئ</option></select><select name="semester" id="sas" required><option value="">سمستر انتخاب کړئ</option></select><input name="credits" type="number" min="0" placeholder="Credits"><input name="hours" type="number" min="0" placeholder="د تدریس ساعتونه"><select name="type"><option value="core">اصلي مضمون</option><option value="elective">اختیاري مضمون</option><option value="practical">عملي مضمون</option></select><button class="primary">مضمون ثبت کړه</button></form>';
 const dash=document.querySelector('#adminDash');
 const target=document.querySelector('#subjectAdminBox');if(target)target.appendChild(box);else if(dash)dash.prepend(box);
 fill('saf',academic.faculties,'پوهنځی انتخاب کړئ');
 $('#saf').onchange=()=>{
  const f=$('#saf').value;
  fill('sad',departmentsFor(f),'رشته انتخاب کړئ');
  fill('sas',semestersFor(f),'سمستر انتخاب کړئ');
};
 $('#saf').onchange();
 $('#subjectAdminForm').onsubmit=async e=>{
  e.preventDefault();
  try{
   const x=Object.fromEntries(new FormData(e.target));
   const r=await api('/api/admin/academic/subjects',{method:'POST',body:JSON.stringify(x)});
   toast('مضمون ثبت شو: '+r.subject.name);
   e.target.reset();
  }catch(err){toast(err.message)}
 };
}
async function adminDashboard(){try{const [s,u,pc]=await Promise.all([api('/api/admin/dashboard'),api('/api/admin/users'),api('/api/admin/courses/pending')]);meUser=(await api('/api/me')).user;setAuthUI();const st=s.stats;$('#adminDash').innerHTML='<div class="panel"><h3>📋 د کورسونو Review</h3><div id="pendingCoursesBox"></div></div><div class="panel"><h3>📚 د مضمونونو مدیریت</h3><button class="primary" type="button" onclick="subjectAdminForm()">➕ نوی مضمون اضافه کړه</button><div id="subjectAdminBox"></div></div><div class="stats">'+stat('ټول Users',st.totalUsers,'👥')+stat('محصلان',st.students,'🎓')+stat('استادان',st.teachers,'👨‍🏫')+stat('Courses',st.courses,'📚')+stat('Videos',st.videos,'🎥')+stat('Books',st.books,'📖')+stat('Pending Orders',st.pendingOrders,'💳')+stat('Revenue',st.revenue+' AFN','💰')+'</div><div class="adminGrid"><div class="panel"><h3>👥 User Verification & Management</h3><div class="smartFilters" style="grid-template-columns:2fr 1fr 1fr"><input id="uq" placeholder="نوم، موبایل، رشته..." oninput="adminUsers()"><select id="ust" onchange="adminUsers()"><option value="">ټول Status</option><option>pending</option><option>verified</option><option>blocked</option></select><select id="urole" onchange="adminUsers()"><option value="">ټول Roles</option><option>student</option><option>teacher</option><option>admin</option></select></div><div id="userTable"></div></div><div class="panel"><h3>💳 Payments</h3><div id="orderTable">Loading...</div></div></div><div class="adminGrid"><div class="panel"><h3>➕ Course جوړول</h3><form id="courseForm" class="form"><input name="title" placeholder="Course نوم" required><input name="teacher" placeholder="استاد"><select name="faculty" id="afac" required></select><select name="department" id="adep"></select><select name="semester" id="asem"></select><select name="academicYear" id="acay"></select><input name="price" type="number" min="0" placeholder="Price AFN"><textarea name="description" placeholder="Description"></textarea><button class="primary">Course جوړ کړه</button></form></div><div class="panel"><h3>🎥 Video / PDF Upload</h3><form id="videoUploadForm" class="form" enctype="multipart/form-data"><input type="hidden" name="type" value="video"><input name="courseId" placeholder="Course ID" required><input name="title" placeholder="Video نوم" required><input name="price" type="number" min="0" placeholder="Price"><input name="durationSeconds" type="number" placeholder="Duration seconds" required><input name="file" type="file" accept="video/mp4,video/webm,video/quicktime" required><button class="primary">Video Upload</button></form><hr><form id="pdfUploadForm" class="form" enctype="multipart/form-data"><input type="hidden" name="type" value="pdf"><input name="title" placeholder="کتاب نوم" required><select name="faculty" id="pdfFac" required></select><select name="department" id="pdfDep" required><option value="">رشته</option></select><select name="semester" id="pdfSem" required><option value="">سمستر</option></select><select name="academicYear" id="pdfYear"><option value="">تحصیلي کال</option></select><input name="author" placeholder="لیکوال"><input name="file" type="file" accept="application/pdf" required><button class="primary">PDF Upload</button></form></div></div><div class="panel aiMcqAdmin"><h3>🤖 AI MCQ جوړوونکی</h3><p class="muted">PDF کتاب انتخاب کړئ، Page نمبر ورکړئ، د هماغې پاڼې متن واخلئ او AI ته یې د MCQ جوړولو لپاره واستوئ.</p><form id="mcqSourceForm" class="form"><select id="mcqBook" required><option value="">PDF کتاب انتخاب کړئ</option></select><div class="two"><input id="mcqPage" type="number" min="1" value="1" placeholder="Page نمبر" required><input id="mcqCount" type="number" min="1" max="20" value="5" placeholder="د سوالونو شمېر"></div><div class="two"><select id="mcqLanguage"><option value="ps">پښتو</option><option value="fa">دري</option><option value="en">English</option></select><select id="mcqDifficulty"><option value="medium">منځنۍ کچه</option><option value="easy">اسانه</option><option value="hard">سخته</option></select></div><button class="primary" type="submit">📄 د پاڼې متن واخله</button></form><div id="mcqPageInfo"></div><textarea id="mcqPageText" class="mcqSourceText" readonly placeholder="د ټاکلې پاڼې متن به دلته ښکاره شي..."></textarea><button id="mcqGenerateBtn" class="primary" type="button" disabled>🤖 له دې پاڼې MCQs جوړ کړه</button><div id="mcqResult"></div></div><div class="panel"><h3>📢 Advertisement Manager</h3><form id="adForm" class="form"><div class="two"><input name="title" placeholder="اعلان عنوان" required><input name="link" placeholder="Link (اختیاري)"></div><div class="two"><input name="imageUrl" placeholder="Banner image URL (اختیاري)"><select name="position"><option value="home">Homepage</option><option value="library">Library</option><option value="courses">Courses</option><option value="dashboard">Dashboard</option></select></div><div class="two"><input name="startAt" type="datetime-local"><input name="endAt" type="datetime-local"></div><button class="primary">اعلان اضافه کړه</button></form><div id="adsList"></div></div><div class="panel"><h3>🛡️ مهم امنیتي/اداري اصول</h3><p>Server-side permissions، د فایل Upload validation، protected video/PDF routes، Audit/Support او د محصل اکاډمیک لاسرسی د پوهنتون/پوهنځي/رشتې/سمستر له مخې.</p></div>';
renderPendingCourses(pc.courses||[]);
fill('afac',academic.faculties,'پوهنځی');fill('asem',[],'سمستر');fill('acay',academic.academicYears,'تحصیلي کال');fill('pdfFac',academic.faculties,'پوهنځی');fill('pdfSem',[],'سمستر');$('#afac').onchange=()=>{const f=$('#afac').value;fill('adep',departmentsFor(f),'رشته');fill('asem',semestersFor(f),'سمستر');};$('#pdfFac').onchange=()=>{const f=$('#pdfFac').value;fill('pdfDep',departmentsFor(f),'رشته');fill('pdfSem',semestersFor(f),'سمستر');};$('#courseForm').onsubmit=createCourse;$('#videoUploadForm').onsubmit=uploadFile;$('#pdfUploadForm').onsubmit=uploadFile;$('#adForm').onsubmit=createAd;await adminUsers();await adminOrders();await adminAds();if(meUser.role==='superadmin')await renderSuperControls()}catch(e){$('#adminDash').innerHTML='<div class="panel">'+esc(e.message)+'</div>'}}

async function renderPendingCourses(list){
 const el=$('#pendingCoursesBox');
 if(!el)return;
 if(!list.length){
  el.innerHTML='<p class="muted">اوس مهال د Review لپاره کوم Pending Course نشته.</p>';
  return;
 }
 el.innerHTML='<div class="tableWrap"><table class="dataTable"><tr><th>Course</th><th>استاد</th><th>پوهنځی</th><th>رشته</th><th>سمستر</th><th>Price (AFN)</th><th>عمل</th></tr>'+
 list.map(c=>'<tr><td>'+esc(c.title||'')+'</td><td>'+esc(c.teacherName||c.teacher||'')+'</td><td>'+esc(c.faculty||'')+'</td><td>'+esc(c.department||'')+'</td><td>'+esc(c.semester||'')+'</td><td><input id="coursePrice-'+c.id+'" type="number" min="0" step="1" value="'+Number(c.price||0)+'" style="width:110px;padding:7px" placeholder="AFN"></td><td><button class="primary" onclick="courseStatus(\''+c.id+'\',\'approved\')">Approve & Publish</button> <button class="danger" onclick="courseStatus(\''+c.id+'\',\'rejected\')">Reject</button></td></tr>').join('')+
 '</table></div>';
}

async function courseStatus(id,status){
 try{
  const priceEl=document.querySelector('#coursePrice-'+id);
  const body={status};
  if(priceEl){
   const price=Number(priceEl.value);
   if(!Number.isFinite(price)||price<0){
    toast('د کورس قیمت سم داخل کړئ');
    return;
   }
   body.price=price;
  }
  await api('/api/admin/courses/'+id+'/status',{
   method:'POST',
   body:JSON.stringify(body)
  });
  toast(status==='approved'?'Course تایید او خپور شو':'Course رد شو');
  const d=await api('/api/admin/courses/pending');
  renderPendingCourses(d.courses||[]);
 }catch(e){toast(e.message)}
}

async function renderSuperControls(){
 const box=document.createElement('div');box.className='panel';
 box.innerHTML=`<h3>👑 Super Admin Control Center</h3><p class="muted">د ټول سیستم جوړښت: Admins، Teachers، Academic Catalog او Live Classes.</p>
 <div class="adminGrid"><div><h4>➕ نوی Admin</h4><form id="superAdminForm" class="form"><input name="name" placeholder="نوم" required><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button class="primary">Admin جوړ کړه</button></form></div>
 <div><h4>➕ نوی Teacher</h4><form id="superTeacherForm" class="form"><input name="name" placeholder="د استاد نوم" required><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><input name="credentials" placeholder="اسناد/مسلکي معلومات"><button class="primary">Teacher جوړ کړه</button></form></div></div>
 <hr><h4>🏫 Academic Catalog</h4><form id="catalogForm" class="form"><div class="two"><select name="type"><option value="universities">پوهنتون</option><option value="faculties">پوهنځی</option><option value="departments">رشته</option><option value="academicYears">تحصیلي کال</option><option value="semesters">سمستر</option><option value="subjects">مضمون</option></select><input name="name" placeholder="نوم" required></div><div class="two"><input name="faculty" placeholder="پوهنځی (که اړتیا وي)"><input name="department" placeholder="رشته (که اړتیا وي)"></div><input name="semester" placeholder="سمستر (که اړتیا وي)"><button class="primary">Catalog اضافه کړه</button></form>
 <hr><h4>📡 Live Class جوړول</h4><form id="liveForm" class="form"><div class="two"><input name="title" placeholder="عنوان" required><input name="teacherName" placeholder="استاد" required></div><div class="two"><select name="faculty" required><option value="">پوهنځی</option>${academic.faculties.map(x=>'<option>'+esc(x)+'</option>').join('')}</select><input name="semester" placeholder="سمستر" required></div><div class="two"><input name="date" type="date"><input name="time" type="time"></div><input name="url" placeholder="Live meeting link"><button class="primary">Live Class خپور کړه</button></form>`;
 box.innerHTML+=`<hr><h4>📋 Registration Requests</h4><div id="pendingRequests">Loading...</div><hr><h4>🔔 Notifications</h4><div id="adminNotifications"><p class="muted">Notifications panel</p></div>`;$('#superAdminDash').innerHTML='';$('#superAdminDash').appendChild(box);loadPendingRequests();loadAdminNotifications();
 $('#superAdminForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/superadmin/admins',{method:'POST',body:JSON.stringify({...Object.fromEntries(new FormData(e.target)),permissions:['users','courses','content','payments','ads']})});toast('Admin جوړ شو');e.target.reset()}catch(x){toast(x.message)}};
 $('#superTeacherForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/superadmin/teachers',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Teacher جوړ شو');e.target.reset()}catch(x){toast(x.message)}};
 $('#catalogForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/superadmin/catalog',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Catalog اضافه شو');await loadAcademic()}catch(x){toast(x.message)}};
 $('#liveForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/superadmin/live-classes',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Live Class جوړ شو');e.target.reset()}catch(x){toast(x.message)}};
}
async function loadAdminNotifications(){try{const d=await api("/api/notifications");const el=$("#adminNotifications");if(!el)return;if(!d.notifications||!d.notifications.length){el.innerHTML="<p class=\"muted\">Notification نشته.</p>";return}el.innerHTML=d.notifications.map(n=>"<div class=\"panel\" style=\"margin:8px 0\"><b>"+esc(n.title)+"</b><p>"+esc(n.message)+"</p><small class=\"muted\">"+esc(n.createdAt||"")+"</small></div>").join("")}catch(e){toast(e.message)}} async function loadPendingRequests(){try{const d=await api("/api/admin/users?status=pending");const el=$("#pendingRequests");if(!el)return;if(!d.users||!d.users.length){el.innerHTML="<p class=\"muted\">اوس مهال Pending Registration Request نشته.</p>";return}el.innerHTML="<div class=\"tableWrap\"><table class=\"dataTable\"><tr><th>نوم</th><th>Role</th><th>پوهنتون</th><th>پوهنځی</th><th>رشته</th><th>سمستر</th><th>عمل</th></tr>"+d.users.map(u=>"<tr><td>"+esc(u.name)+"</td><td>"+esc(u.role)+"</td><td>"+esc(u.university)+"</td><td>"+esc(u.faculty)+"</td><td>"+esc(u.department)+"</td><td>"+esc(u.semester)+"</td><td><button onclick=\"requestStatus(\\\""+u.id+"\\\",\\\"verified\\\")\">Approve</button> <button class=\"danger\" onclick=\"requestStatus(\\\""+u.id+"\\\",\\\"blocked\\\")\">Reject</button></td></tr>").join("")+"</table></div>"}catch(e){toast(e.message)}} async function requestStatus(id,status){try{await api("/api/admin/users/"+id+"/status",{method:"POST",body:JSON.stringify({status})});toast(status==="verified"?"Registration Approved":"Registration Rejected");await loadPendingRequests();await adminUsers()}catch(e){toast(e.message)}} async function adminUsers(){try{const q=encodeURIComponent($('#uq')?.value||''),st=encodeURIComponent($('#ust')?.value||''),r=encodeURIComponent($('#urole')?.value||'');const d=await api('/api/admin/users?q='+q+'&status='+st+'&role='+r);$('#userTable').innerHTML='<div class="tableWrap"><table class="dataTable"><tr><th>نوم</th><th>Role</th><th>پوهنتون</th><th>پوهنځی</th><th>رشته</th><th>سمستر</th><th>Status</th><th>عمل</th></tr>'+d.users.map(u=>'<tr><td>'+esc(u.name)+'</td><td>'+esc(u.role)+'</td><td>'+esc(u.university)+'</td><td>'+esc(u.faculty)+'</td><td>'+esc(u.department)+'</td><td>'+esc(u.semester)+'</td><td>'+esc(u.status)+'</td><td>'+(u.status==='pending'?'<button onclick="userStatus(\''+u.id+'\',\'verified\')">Approve</button> ':'')+(u.status!=='blocked'?'<button class="danger" onclick="userStatus(\''+u.id+'\',\'blocked\')">Block</button>':'')+'</td></tr>').join('')+'</table></div>'}catch(e){toast(e.message)}}
async function userStatus(id,status){try{await api('/api/admin/users/'+id+'/status',{method:'POST',body:JSON.stringify({status})});toast('Status بدل شو');adminUsers()}catch(e){toast(e.message)}}
async function adminOrders(){try{const d=await api('/api/admin/orders');$('#orderTable').innerHTML=d.orders.length?d.orders.slice(0,30).map(o=>'<p>👤 '+esc(o.userName)+' — '+esc(o.amount)+' AFN — <span class="tag">'+esc(o.status)+'</span> '+(o.status==='pending'?'<button onclick="orderStatus(\''+o.id+'\',\'paid\')">Paid تایید</button>':'')+'</p>').join(''):'<p class="muted">Order نشته.</p>'}catch(e){toast(e.message)}}
async function orderStatus(id,status){try{await api('/api/admin/orders/'+id+'/status',{method:'POST',body:JSON.stringify({status})});toast('Payment تایید شو');adminOrders()}catch(e){toast(e.message)}}
async function createCourse(e){e.preventDefault();try{await api('/api/admin/courses',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast('Course جوړ شو');e.target.reset()}catch(x){toast(x.message)}}
async function uploadFile(e){e.preventDefault();try{const r=await fetch('/api/admin/upload',{method:'POST',headers:{Authorization:'Bearer '+tok},body:new FormData(e.target)});const d=await r.json();if(!r.ok)throw Error(d.error);toast('Upload بریالی شو');e.target.reset()}catch(x){toast(x.message)}}
async function createAd(e){e.preventDefault();try{await api('/api/admin/ads',{method:'POST',body:JSON.stringify({...Object.fromEntries(new FormData(e.target)),active:true})});toast('اعلان اضافه شو');e.target.reset();adminAds()}catch(x){toast(x.message)}}
async function adminAds(){try{const d=await api('/api/admin/ads');$('#adsList').innerHTML=(d.ads||[]).map(a=>'<div class="panel"><b>'+esc(a.title)+'</b><span class="tag">'+esc(a.position)+'</span><button onclick="deleteAd(\''+a.id+'\')">حذف</button></div>').join('')}catch(e){}}
async function deleteAd(id){try{await api('/api/admin/ads/'+id,{method:'DELETE'});adminAds()}catch(e){toast(e.message)}}
async function changePassword(e){e.preventDefault();try{toast((await api('/api/change-password',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))})).message);logout()}catch(x){toast(x.message)}}
function togglePass(id,b){const x=$('#'+id);x.type=x.type==='password'?'text':'password';b.textContent=x.type==='password'?'👁':'🙈'}
function regCheck(){const f=$('#reg');if(!f)return[];const d=Object.fromEntries(new FormData(f));const phone=String(d.phone||'').replace(/\D/g,'');const checks=[['name',!!String(d.name||'').trim(),'بشپړ نوم'],['phone',/^07[0-9]{8}$/.test(phone),'معتبر موبایل'],['faculty',!!d.faculty,'پوهنځی'],['department',!!d.department,'رشته'],['semester',!!d.semester,'سمستر'],['academicYear',!!d.academicYear,'تحصیلي کال'],['password',String(d.password||'').length>=6,'Password لږ تر لږه ۶ حروف'],['passwordConfirm',d.password===d.passwordConfirm&&!!d.password,'Password تکرار'],['acceptTerms',d.acceptTerms==='true','شرایط']];$('#regChecklist').innerHTML=checks.map(x=>'<div class="check '+(x[1]?'done':'bad')+'">'+(x[1]?'✓':'!')+' '+x[2]+'</div>').join('');return checks}
['input','change'].forEach(ev=>$('#reg')?.addEventListener(ev,regCheck));$('#rfac').onchange=()=>{fill('rdep',departmentsFor($('#rfac').value),'رشته انتخاب کړئ');fill('rsem',semestersFor($('#rfac').value),'سمستر انتخاب کړئ');regCheck()};
$('#reg').onsubmit=async e=>{e.preventDefault();const bad=regCheck().find(x=>!x[1]);if(bad)return toast('لا پوره شوی شرط: '+bad[2]);try{const d=await api('/api/register',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});$('#regResult').innerHTML='<div class="panel successBox">✓ حساب مو په بریالیتوب جوړ شو.<br>Student Code: <b>'+esc(d.studentCode)+'</b><br><b>ستاسې حساب د Admin/Super Admin د تایید په انتظار کې دی.</b></div>';$('#otpBox')?.classList.add('hide');$('#otpForm')?.reset()}catch(x){toast(x.message)}};
$('#otpForm')?.addEventListener('submit',e=>{e.preventDefault();return false;});
async function resendOtp(){toast('Registration OTP اوس بند دی؛ حساب یوازې د Admin/Super Admin تایید ته اړتیا لري')}
$('#log').onsubmit=async e=>{e.preventDefault();try{const o=Object.fromEntries(new FormData(e.target)); o.email=o.identifier || o.email || '';o.deviceId=(crypto.randomUUID?crypto.randomUUID():String(Date.now()));const d=await api('/api/login',{method:'POST',body:JSON.stringify(o)});tok=d.token;localStorage.setItem('zd',tok);localStorage.setItem('zd_token',tok);localStorage.setItem('zd_user',JSON.stringify(d.user));meUser=d.user;setAuthUI();show(d.user.role==='student'?'account':d.user.role==='teacher'?'teacher':d.user.role==='superadmin'?'superadmin':'admin')}catch(x){$('#loginNotice').classList.remove('hide');$('#loginNotice').textContent='⚠️ '+x.message}}
$('#forgotRequest').onsubmit=async e=>{e.preventDefault();try{toast((await api('/api/student/forgot-password/request',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))})).message);$('#forgotPhone').value=new FormData(e.target).get('phone');$('#forgotReset').classList.remove('hide')}catch(x){toast(x.message)}};
$('#forgotReset').onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target)); o.email=o.identifier || o.email || '';if(o.newPassword!==o.newPassword2)return toast('دواړه Passwordونه برابر نه دي');try{toast((await api('/api/student/forgot-password/reset',{method:'POST',body:JSON.stringify(o)})).message);show('login')}catch(x){toast(x.message)}};
async function logout(){try{if(tok)await api('/api/logout',{method:'POST'})}catch{}tok='';localStorage.removeItem('zd');localStorage.removeItem('zd_token');localStorage.removeItem('zd_user');meUser=null;setAuthUI();show('home')}
async function boot(){try{await loadAcademic();if(tok){try{meUser=(await api('/api/me')).user}catch{tok='';localStorage.removeItem('zd')}}setAuthUI();await loadHome()}catch(e){toast(e.message)}}
boot();

let zdBackBusy=false; const zdOldShow=show; show=function(id){if(!zdBackBusy && location.hash!=="#"+id)history.pushState({zdScreen:id},"","#"+id); zdOldShow(id);}; if(!history.state||!history.state.zdScreen)history.replaceState({zdScreen:"home"},"","#home"); window.addEventListener("popstate",function(e){zdBackBusy=true; show((e.state&&e.state.zdScreen)||"home"); zdBackBusy=false;});

async function initAdminMCQ(){
  const bookSelect=$('#mcqBook');
  const sourceForm=$('#mcqSourceForm');
  const pageInput=$('#mcqPage');
  const textBox=$('#mcqPageText');
  const info=$('#mcqPageInfo');
  const generateBtn=$('#mcqGenerateBtn');

  if(!bookSelect||!sourceForm||!pageInput||!textBox||!generateBtn)return;

  try{
    const d=await api('/api/admin/mcq/books');
    bookSelect.innerHTML='<option value="">PDF کتاب انتخاب کړئ</option>'+
      (d.books||[]).map(b=>'<option value="'+esc(b.id)+'">'+esc(b.title)+'</option>').join('');
  }catch(e){
    info.textContent='❌ '+e.message;
  }

  sourceForm.onsubmit=async function(e){
    e.preventDefault();

    const bookId=bookSelect.value;
    const page=Number(pageInput.value);

    if(!bookId){
      info.textContent='❌ لومړی PDF کتاب انتخاب کړئ';
      return;
    }

    if(!Number.isInteger(page)||page<1){
      info.textContent='❌ د Page نمبر سم ولیکئ';
      return;
    }

    textBox.value='';
    generateBtn.disabled=true;
    info.textContent='⏳ د پاڼې متن اخیستل کېږي...';

    try{
      const d=await api('/api/admin/mcq/page-text/'+encodeURIComponent(bookId)+'?page='+page);
      textBox.value=d.text||'';
      info.textContent='✅ Page '+d.page+' / '+d.pageCount+' — متن ترلاسه شو.';
      generateBtn.disabled=!(d.text&&d.text.trim());
    }catch(e){
      info.textContent='❌ '+e.message;
    }
  };

}

const oldAdminDashboard=adminDashboard;
adminDashboard=async function(){
  try{ await oldAdminDashboard(); }
  finally{ await initAdminMCQ(); }
};

async function generateMCQsFromPage(){
  const bookId=$('#mcqBook')?.value;
  const page=Number($('#mcqPage')?.value||0);
  const count=Number($('#mcqCount')?.value||5);
  const language=$('#mcqLanguage')?.value||'ps';
  const difficulty=$('#mcqDifficulty')?.value||'medium';
  const result=$('#mcqResult');
  const btn=$('#mcqGenerateBtn');

  if(!bookId){
    toast('❌ لومړی PDF کتاب انتخاب کړئ');
    return;
  }

  if(!page||page<1){
    toast('❌ د Page نمبر سم ولیکئ');
    return;
  }

  const text=$('#mcqPageText')?.value?.trim();
  if(!text){
    toast('❌ لومړی د Page متن واخلئ');
    return;
  }

  btn.disabled=true;
  btn.textContent='⏳ AI MCQs جوړوي...';
  result.innerHTML='<div class="panel">⏳ AI د ټاکلې پاڼې څخه MCQs جوړوي...</div>';

  try{
    const d=await api('/api/admin/mcq/generate',{
      method:'POST',
      body:JSON.stringify({
        bookId,
        page,
        count,
        language,
        difficulty
      })
    });

    window.generatedMCQs=d.questions||[];

    result.innerHTML='<div class="panel"><h3>✅ '+window.generatedMCQs.length+' MCQs جوړ شول</h3>'+
      '<p class="muted">کتاب: '+esc(d.bookTitle)+' | Page: '+esc(d.page)+'</p>'+
      window.generatedMCQs.map((q,i)=>
        '<div class="mcqGenerated" style="border:1px solid #ddd;border-radius:12px;padding:14px;margin:12px 0">'+
        '<h4>سوال '+(i+1)+'</h4>'+
        '<textarea class="mcqQuestion" data-index="'+i+'" style="width:100%;min-height:70px">'+esc(q.question)+'</textarea>'+
        '<div class="mcqOptions">'+
        q.options.map((o,j)=>
          '<div style="display:flex;gap:8px;margin:7px 0;align-items:center">'+
          '<input type="radio" name="mcqCorrect'+i+'" value="'+j+'" '+(j===q.correctIndex?'checked':'')+'>'+
          '<input class="mcqOption" data-q="'+i+'" data-option="'+j+'" value="'+esc(o)+'" style="flex:1">'+
          '</div>'
        ).join('')+
        '</div>'+
        '<textarea class="mcqExplanation" data-index="'+i+'" style="width:100%;min-height:60px;margin-top:8px" placeholder="تشریح">'+esc(q.explanation)+'</textarea>'+
        '</div>'
      ).join('')+
      '<button id="saveGeneratedMCQs" class="primary" type="button">💾 MCQs Save کړه</button>'+
      '</div>';

    $('#saveGeneratedMCQs').onclick=saveGeneratedMCQs;

  }catch(e){
    result.innerHTML='<div class="panel">❌ '+esc(e.message)+'</div>';
  }finally{
    btn.disabled=false;
    btn.textContent='🤖 له دې پاڼې MCQs جوړ کړه';
  }
}

async function saveGeneratedMCQs(){
  const qs=window.generatedMCQs||[];
  if(!qs.length){
    toast('❌ د Save لپاره MCQ نشته');
    return;
  }

  const bookId=$('#mcqBook').value;
  const page=Number($('#mcqPage').value);

  const questions=qs.map((q,i)=>({
    question:$('.mcqQuestion[data-index="'+i+'"]')?.value?.trim()||'',
    options:[0,1,2,3].map(j=>$('.mcqOption[data-q="'+i+'"][data-option="'+j+'"]')?.value?.trim()||''),
    correctIndex:Number(document.querySelector('input[name="mcqCorrect'+i+'"]:checked')?.value||0),
    explanation:$('.mcqExplanation[data-index="'+i+'"]')?.value?.trim()||''
  }));

  try{
    const d=await api('/api/admin/mcq/save',{
      method:'POST',
      body:JSON.stringify({bookId,page,questions})
    });
    toast('✅ '+(d.saved||questions.length)+' MCQs Save شول');
  }catch(e){
    toast('❌ '+e.message);
  }
}

const oldInitAdminMCQ=initAdminMCQ;
initAdminMCQ=async function(){
  await oldInitAdminMCQ();
  const generateBtn=$('#mcqGenerateBtn');
  if(generateBtn)generateBtn.onclick=generateMCQsFromPage;
};

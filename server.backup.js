const express=require('express');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const https=require('https');
const multer=require('multer');
async function dbHealth(){return {configured:false,connected:false,mode:'JSON'};}

const app=express();
const PORT=process.env.PORT||3000;
const DB=path.join(__dirname,'data.json');
const UPLOADS=path.join(__dirname,'uploads');
if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS,{recursive:true});
app.use(express.json({limit:'4mb'}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const upload=multer({storage:multer.diskStorage({destination:(r,f,cb)=>cb(null,UPLOADS),filename:(r,f,cb)=>cb(null,Date.now()+'-'+crypto.randomBytes(8).toString('hex')+path.extname(f.originalname))}),limits:{fileSize:700*1024*1024}});
const H=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const T=()=>crypto.randomBytes(24).toString('hex');
const now=()=>new Date().toISOString();
const SECRET=process.env.ZD_SECRET||'CHANGE_THIS_ZD_SECRET_IN_PRODUCTION';
const b64=x=>Buffer.from(x).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const ub64=x=>Buffer.from(String(x).replace(/-/g,'+').replace(/_/g,'/'),'base64').toString();
const sign=x=>crypto.createHmac('sha256',SECRET).update(x).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function makeToken(u,sid){const p=b64(JSON.stringify({uid:u.id,sid:sid||null,exp:Date.now()+30*864e5}));return p+'.'+sign(p)}
function parseToken(raw){try{const [a,b]=String(raw||'').split('.');if(!a||!b||!crypto.timingSafeEqual(Buffer.from(b),Buffer.from(sign(a))))return null;const p=JSON.parse(ub64(a));return p.exp>Date.now()?p:null}catch{return null}}
function clean(u){const x={...u};delete x.password;delete x.activeSession;delete x.phoneOtpHash;return x}
function normalizePhone(x){return String(x||'').trim().replace(/[\s()-]/g,'')}
function notify(d,id,title,message){const u=d.users.find(x=>x.id===id);if(u){u.notifications=u.notifications||[];u.notifications.unshift({id:'n-'+T(),title,message,read:false,createdAt:now()})}}
function hashOtp(){return H(String(Math.floor(100000+Math.random()*900000)))}
function makeOtp(){return String(Math.floor(100000+Math.random()*900000))}
function sendSMS(to,message){const url=process.env.SMS_API_URL;if(!url){console.log('[SMS TEST MODE]',to,message);return Promise.resolve()}return new Promise((resolve,reject)=>{try{const u=new URL(url),body=JSON.stringify({to,from:process.env.SMS_FROM||'ZDakrhyal',message});const q=https.request({hostname:u.hostname,port:u.port||443,path:u.pathname+(u.search||''),method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),...(process.env.SMS_API_TOKEN?{'Authorization':'Bearer '+process.env.SMS_API_TOKEN}:{})}},r=>{let s='';r.on('data',c=>s+=c);r.on('end',()=>r.statusCode>=200&&r.statusCode<300?resolve():reject(new Error('SMS provider '+r.statusCode)))});q.on('error',reject);q.write(body);q.end()}catch(e){reject(e)}})}

const seed={
 auditLogs:[],wishlists:[],certificates:[],settings:{platformName:'زدکړیال',defaultLanguage:'ps',maintenance:false},users:[{id:'superadmin',name:'Super Admin',email:'admin@zdakrhyal.local',phone:'',password:H('Admin123!'),role:'superadmin',status:'verified',university:'',faculty:'',department:'',semester:'',academicYear:'',studentCode:'',createdAt:now(),notifications:[],activeSession:null}],
 universities:['کابل پوهنتون','کابل طبي پوهنتون','هرات پوهنتون','ننګرهار پوهنتون','بلخ پوهنتون','کندهار پوهنتون','پوهنتون های خصوصی','نور'],
 faculties:['طب','ستوماتولوژي','فارمسي','نرسنګ','عامه روغتیا','انجنیري','کمپیوټر ساینس','اقتصاد','حقوق او سیاسي علوم','اداره او عامه پالیسي','ښوونه او روزنه','کرنه','وترنري علوم','ساینس','جیولوجي او کانونه','ژورنالیزم او رسنۍ','ژبې او ادبیات','شرعیات','ټولنیز علوم','چاپېریال او طبیعي سرچینې','هنرونه','بدني روزنه','کتابتون او معلوماتي علوم','مخابرات او معلوماتي ټکنالوژي','نور'],
 departments:[{faculty:'طب',name:'عمومي طب'},{faculty:'ستوماتولوژي',name:'ستوماتولوژي'},{faculty:'فارمسي',name:'فارمسي'},{faculty:'نرسنګ',name:'نرسنګ'},{faculty:'کمپیوټر ساینس',name:'Computer Science'},{faculty:'کمپیوټر ساینس',name:'Software Engineering'},{faculty:'کمپیوټر ساینس',name:'Information Technology'},{faculty:'انجنیري',name:'سیول انجنیري'},{faculty:'انجنیري',name:'برېښنا انجنیري'},{faculty:'حقوق او سیاسي علوم',name:'حقوق'}],
 academicYears:['1404','1405','1406'],
 semesters:['1','2','3','4','5','6','7','8','9','10','11'],
 facultySemesters:{'طب':11,'ستوماتولوژي':10,'فارمسي':10,'نرسنګ':8,'عامه روغتیا':8,'انجنیري':9,'کمپیوټر ساینس':8,'اقتصاد':8,'حقوق او سیاسي علوم':8,'اداره او عامه پالیسي':8,'ښوونه او روزنه':8,'کرنه':8,'وترنري علوم':10,'ساینس':8,'جیولوجي او کانونه':8,'ژورنالیزم او رسنۍ':8,'ژبې او ادبیات':8,'شرعیات':8,'ټولنیز علوم':8,'چاپېریال او طبیعي سرچینې':8,'هنرونه':8,'بدني روزنه او سپورت':8,'کتابتون او معلوماتي علوم':8,'مخابرات او معلوماتي ټکنالوژي':8,'نور':8},
 subjects:[],courses:[],books:[],orders:[],purchases:[],liveClasses:[],ads:[],supportTickets:[],site:{heroImage:'',gallery:[],posts:[]}
};
function db(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify(seed,null,2));const d=JSON.parse(fs.readFileSync(DB,'utf8'));for(const k of Object.keys(seed))if(d[k]===undefined)d[k]=seed[k];d.facultySemesters=d.facultySemesters||seed.facultySemesters;d.users.forEach(u=>{u.notifications=u.notifications||[];u.activeSession=u.activeSession||null;u.permissions=u.permissions||[];});if(!d.users.some(u=>u.role==='superadmin')){const first=d.users.find(u=>u.role==='admin');if(first)first.role='superadmin';else d.users.unshift({...seed.users[0],createdAt:now()});}d.courses.forEach(c=>{c.videos=c.videos||[];c.studentsCount=Number(c.studentsCount||0);});d.site.gallery=d.site.gallery||[];d.site.posts=d.site.posts||[];d.liveClasses=d.liveClasses||[];d.ads=d.ads||[];d.supportTickets=d.supportTickets||[];d.auditLogs=d.auditLogs||[];d.wishlists=d.wishlists||[];d.certificates=d.certificates||[];d.settings=d.settings||{platformName:'زدکړیال',defaultLanguage:'ps',maintenance:false};return d}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}

// Non-destructive schema migration for university-standard fields.
(function migrateSeed(){const d=db();let changed=false;const defs={programs:[],transcriptRecords:[],attendance:[],gradingScales:[{id:'afg-standard',name:'Afghanistan Standard',scale:[{grade:'A',min:90,max:100,point:4},{grade:'B',min:80,max:89.99,point:3},{grade:'C',min:70,max:79.99,point:2},{grade:'D',min:60,max:69.99,point:1},{grade:'F',min:0,max:59.99,point:0}]}],policies:[{id:'academic-integrity',title:'Academic Integrity',summary:'د امتحان، تکلیف او علمي کار اصول رعایت کړئ.'},{id:'privacy',title:'Privacy & Data Protection',summary:'د محصل شخصي معلومات باید د قانوني او تعلیمي اړتیا له مخې وکارول شي.'},{id:'accessibility',title:'Accessibility',summary:'د زده‌کړې محتوا باید د امکان تر حده د لاسرسي معیارونه مراعات کړي.'}]};Object.keys(defs).forEach(k=>{if(!Array.isArray(d[k])){d[k]=defs[k];changed=true}});if(changed)save(d)})()
function auth(req,res,next){const p=parseToken((req.headers.authorization||'').replace(/^Bearer\s+/,'')||req.cookies?.zd);if(!p)return res.status(401).json({error:'Login required'});const d=db(),u=d.users.find(x=>x.id===p.uid);if(!u)return res.status(401).json({error:'Account not found'});if(u.role!=='superadmin'){if(!p.sid||!u.activeSession||u.activeSession.id!==p.sid)return res.status(401).json({error:'دا حساب په بل ځای کې Login شوی؛ پخوانی Session ختم شوی'});if(Date.parse(u.activeSession.expiresAt)<Date.now())return res.status(401).json({error:'Session ختم شوی؛ بیا Login وکړئ'})}req.user=u;req.db=d;next()}
function admin(req,res,next){if(!['superadmin','admin'].includes(req.user.role))return res.status(403).json({error:'Admin only'});next()}
function superOnly(req,res,next){if(req.user.role!=='superadmin')return res.status(403).json({error:'یوازې Super Admin ته اجازه شته'});next()}
function academicAccess(u,c){if(u.status!=='verified')return 'Account لا نه دی تأیید شوی';if(c.faculty&&u.faculty!==c.faculty)return 'دا محتوا ستاسې د پوهنځي لپاره نه ده';if(c.department&&u.department!==c.department)return 'دا محتوا ستاسې د رشتې لپاره نه ده';if(c.semester&&Number(c.semester)>Number(u.semester))return 'د لوړو سمسترونو محتوا ته لا تراوسه اجازه نشته';return null}
function ownsCourse(d,u,id){return d.purchases.some(p=>p.userId===u.id&&p.courseId===id&&p.type==='course'&&p.status==='paid')}
function ownsVideo(d,u,cid,vid){return d.purchases.some(p=>p.userId===u.id&&p.courseId===cid&&p.videoId===vid&&p.type==='video'&&p.status==='paid')}
function canManage(req,perm){return req.user.role==='superadmin'||(req.user.role==='admin'&&((req.user.permissions||[]).includes(perm)||!(req.user.permissions)))}
function requirePerm(perm){return (req,res,next)=>{if(req.user.role==='superadmin'||(req.user.role==='admin'&&((req.user.permissions||[]).includes(perm))))return next();return res.status(403).json({error:'تاسې دې برخې ته اجازه نه لرئ'})}}

function validationErrors(x){
  const e=[];
  if(!String(x.name||'').trim())e.push('بشپړ نوم نه دی ورکړل شوی');
  if(!normalizePhone(x.phone))e.push('د موبایل شمېره ضروري ده');
  if(!x.university)e.push('پوهنتون انتخاب کړئ');
  if(!x.faculty)e.push('پوهنځی انتخاب کړئ');
  if(!x.department)e.push('رشته انتخاب کړئ');
  if(!x.semester)e.push('سمستر انتخاب کړئ');
  if(!x.academicYear)e.push('تحصیلي کال انتخاب کړئ');
  if(String(x.password||'').length<6)e.push('Password باید لږ تر لږه ۶ حروف ولري');
  if(x.password!==x.passwordConfirm)e.push('د Password او تکرار Password سره برابر نه دي');
  if(x.acceptTerms!=='true' && x.acceptTerms!==true)e.push('د شرایطو منل ضروري دي');
  return e;
}
app.post('/api/register',async(req,res)=>{
  const x=req.body,d=db(),phone=normalizePhone(x.phone),errors=validationErrors(x);
  if(x.faculty&&x.semester&&d.facultySemesters[x.faculty]&&Number(x.semester)>Number(d.facultySemesters[x.faculty]))errors.push('دا پوهنځی تر '+d.facultySemesters[x.faculty]+' سمستر پورې دی');
  if(errors.length)return res.status(400).json({error:errors[0],errors});
  if(d.users.some(u=>phone&&normalizePhone(u.phone)===phone))return res.status(409).json({error:'دا موبایل شمېره مخکې ثبت شوې ده'});
  if(x.email&&d.users.some(u=>u.email&&u.email===x.email))return res.status(409).json({error:'دا Email مخکې ثبت شوی دی'});
  const u={id:'u-'+T(),name:String(x.name).trim(),email:x.email||'',phone,password:H(x.password),role:'student',status:'pending',phoneVerified:false,
    university:x.university,faculty:x.faculty,department:x.department,semester:String(x.semester),academicYear:x.academicYear,studentCode:'ZD-'+Math.random().toString(36).slice(2,8).toUpperCase(),
    createdAt:now(),notifications:[],activeSession:null,termsAcceptedAt:now(),registrationComplete:false};
  const code=makeOtp();u.phoneOtpHash=H(code);u.phoneOtpExpiresAt=new Date(Date.now()+600000).toISOString();u.phoneOtpAttempts=0;u.phoneOtpLastSentAt=now();
  try{await sendSMS(phone,'ستاسې د زدکړیال Verification Code: '+code+' — ۱۰ دقیقې اعتبار لري.')}catch{return res.status(502).json({error:'SMS Verification Code ونه لېږل شو؛ مهرباني وکړئ وروسته بیا هڅه وکړئ'})}
  d.users.push(u);save(d);
  res.json({message:'لومړی د موبایل Verification Code ولیکئ. وروسته به ستاسې حساب د Super Admin/Admin تایید ته ولاړ شي.',studentCode:u.studentCode,phoneVerificationRequired:true});
});
app.post('/api/verify-phone',(req,res)=>{
  const phone=normalizePhone(req.body.phone),code=String(req.body.code||''),d=db(),u=d.users.find(x=>normalizePhone(x.phone)===phone&&x.role==='student');
  if(!u)return res.status(404).json({error:'محصل ونه موندل شو'});
  if(u.phoneVerified)return res.json({message:'موبایل مخکې Verify شوی'});
  if(!u.phoneOtpExpiresAt||Date.parse(u.phoneOtpExpiresAt)<Date.now())return res.status(400).json({error:'Verification Code ختم شوی؛ نوی Code وغواړئ'});
  u.phoneOtpAttempts=(u.phoneOtpAttempts||0)+1;if(u.phoneOtpAttempts>5){save(d);return res.status(429).json({error:'۵ ځله ناسم Code داخل شو؛ نوی Code وغواړئ'})}
  if(u.phoneOtpHash!==H(code)){save(d);return res.status(400).json({error:'Verification Code ناسم دی'});}
  u.phoneVerified=true;u.phoneOtpHash='';u.phoneOtpExpiresAt='';u.phoneOtpAttempts=0;u.registrationComplete=true;
  save(d);res.json({message:'موبایل Verify شو. اوس ستاسې معلومات د Super Admin/Admin د تایید لپاره ثبت دي.'});
});
app.post('/api/resend-phone-code',async(req,res)=>{
  const phone=normalizePhone(req.body.phone),d=db(),u=d.users.find(x=>normalizePhone(x.phone)===phone&&x.role==='student');if(!u)return res.status(404).json({error:'محصل ونه موندل شو'});
  const last=u.phoneOtpLastSentAt?Date.parse(u.phoneOtpLastSentAt):0;if(last&&Date.now()-last<60000)return res.status(429).json({error:'نوی Code ۶۰ ثانیې وروسته وغواړئ'});
  const code=makeOtp();u.phoneOtpHash=H(code);u.phoneOtpExpiresAt=new Date(Date.now()+600000).toISOString();u.phoneOtpAttempts=0;u.phoneOtpLastSentAt=now();
  try{await sendSMS(phone,'ستاسې د زدکړیال نوی Verification Code: '+code+' — ۱۰ دقیقې اعتبار لري.')}catch{return res.status(502).json({error:'SMS Code ونه لېږل شو'})}
  save(d);res.json({message:'نوی Verification Code موبایل ته ولېږل شو'});
});
app.post('/api/student/forgot-password/request',async(req,res)=>{
  const phone=normalizePhone(req.body.phone),d=db(),u=d.users.find(x=>normalizePhone(x.phone)===phone&&x.role==='student');
  if(!u)return res.status(404).json({error:'په دې موبایل محصل حساب ونه موندل شو'});
  const last=u.forgotOtpLastSentAt?Date.parse(u.forgotOtpLastSentAt):0;if(last&&Date.now()-last<60e3)return res.status(429).json({error:'نوی Code ۶۰ ثانیې وروسته وغواړئ'});
  const code=makeOtp();u.forgotOtpHash=H(code);u.forgotOtpExpiresAt=new Date(Date.now()+600000).toISOString();u.forgotOtpAttempts=0;u.forgotOtpLastSentAt=now();
  try{await sendSMS(phone,'ستاسې د زدکړیال د Password بدلولو Code: '+code+' — ۱۰ دقیقې اعتبار لري.')}catch{return res.status(502).json({error:'SMS Code ونه لېږل شو'})}
  save(d);res.json({message:'د Password بدلولو Code موبایل ته ولېږل شو'});
});
app.post('/api/student/forgot-password/reset',(req,res)=>{
  const phone=normalizePhone(req.body.phone),code=String(req.body.code||''),np=String(req.body.newPassword||''),d=db(),u=d.users.find(x=>normalizePhone(x.phone)===phone&&x.role==='student');
  if(!u)return res.status(404).json({error:'محصل ونه موندل شو'});
  if(np.length<6)return res.status(400).json({error:'نوی Password لږ تر لږه ۶ حروف ولري'});
  if(!u.forgotOtpExpiresAt||Date.parse(u.forgotOtpExpiresAt)<Date.now())return res.status(400).json({error:'Code ختم شوی'});
  u.forgotOtpAttempts=(u.forgotOtpAttempts||0)+1;if(u.forgotOtpAttempts>5){save(d);return res.status(429).json({error:'ډېرې ناسمې هڅې وشوې'})}
  if(u.forgotOtpHash!==H(code)){save(d);return res.status(400).json({error:'Code ناسم دی'})}
  u.password=H(np);u.forgotOtpHash='';u.forgotOtpExpiresAt='';u.forgotOtpAttempts=0;u.activeSession=null;save(d);res.json({message:'Password نوی شو. اوس Login وکړئ.'});
});
app.post('/api/login',(req,res)=>{const x=req.body,d=db(),u=d.users.find(u=>((u.email&&u.email===x.identifier)||normalizePhone(u.phone)===normalizePhone(x.identifier))&&u.password===H(x.password));if(!u)return res.status(401).json({error:'Login معلومات ناسم دي'});if(u.role==='student'&&!u.phoneVerified)return res.status(403).json({error:'لومړی خپل موبایل Verify کړئ'});if(u.status==='pending')return res.status(403).json({error:'ستاسې حساب لا د Admin/Super Admin د تایید په انتظار کې دی'});if(u.status==='rejected'||u.status==='suspended'||u.status==='blocked')return res.status(403).json({error:'ستاسې Account '+u.status+' دی'});let sid=null;if(u.role!=='superadmin'){sid=T();u.activeSession={id:sid,deviceId:x.deviceId||'',createdAt:now(),expiresAt:new Date(Date.now()+30*864e5).toISOString()}}save(d);res.json({token:makeToken(u,sid),user:clean(u),replacedOldSession:u.role!=='superadmin'})});
app.post('/api/logout',auth,(req,res)=>{if(req.user.role!=='superadmin'){req.user.activeSession=null;save(req.db)}res.json({message:'Logout بریالی شو'})});
app.get('/api/me',auth,(req,res)=>res.json({user:clean(req.user)}));
app.post('/api/change-password',auth,(req,res)=>{if(req.user.password!==H(req.body.currentPassword))return res.status(400).json({error:'اوسنی Password ناسم دی'});if(String(req.body.newPassword||'').length<6)return res.status(400).json({error:'نوی Password لږ تر لږه ۶ حروف'});req.user.password=H(req.body.newPassword);save(req.db);res.json({message:'Password بدل شو؛ بیا Login وکړئ'})});
app.get('/api/site',(req,res)=>res.json({site:db().site}));
app.get('/api/academic',(req,res)=>{const d=db();res.json({universities:d.universities,faculties:d.faculties,departments:d.departments,academicYears:d.academicYears,semesters:d.semesters,facultySemesters:d.facultySemesters,subjects:d.subjects})});
app.get('/api/courses',(req,res)=>{const d=db(),q=String(req.query.q||'').toLowerCase(),faculty=req.query.faculty||'';let courses=d.courses.filter(c=>(!faculty||c.faculty===faculty)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));if(req.headers.authorization){try{const p=parseToken(req.headers.authorization.replace(/^Bearer\s+/,'')),u=p&&d.users.find(x=>x.id===p.uid);if(u&&u.role==='student'&&u.status==='verified')courses=courses.filter(c=>!c.faculty||c.faculty===u.faculty).filter(c=>!c.department||c.department===u.department).filter(c=>!c.semester||String(c.semester)<=String(u.semester));}catch{}}res.json({courses})});
app.get('/api/courses/:id',(req,res)=>{const c=db().courses.find(x=>x.id===req.params.id);if(!c)return res.status(404).json({error:'Course not found'});res.json({course:c})});
app.get('/api/courses/:id/access',auth,(req,res)=>{const d=db(),c=d.courses.find(x=>x.id===req.params.id);if(!c)return res.status(404).json({error:'Course not found'});const err=academicAccess(req.user,c);res.json({allowed:!err,error:err,full:!err&&ownsCourse(d,req.user,c.id)})});
app.get('/api/books',(req,res)=>{const d=db();let books=d.books;if(req.query.faculty)books=books.filter(b=>b.faculty===req.query.faculty);if(req.headers.authorization){try{const p=parseToken(req.headers.authorization.replace(/^Bearer\s+/,'')),u=p&&d.users.find(x=>x.id===p.uid);if(u&&u.role==='student'&&u.status==='verified')books=books.filter(b=>(!b.faculty||b.faculty===u.faculty)&&(!b.department||b.department===u.department)&&(!b.semester||Number(b.semester)<=Number(u.semester)));}catch{}}res.json({books})});
app.get('/api/my-purchases',auth,(req,res)=>res.json({orders:req.db.orders.filter(o=>o.userId===req.user.id).slice(0,100),purchases:req.db.purchases.filter(p=>p.userId===req.user.id)}));
app.get('/api/notifications',auth,(req,res)=>res.json({notifications:(req.user.notifications||[]).slice(0,100)}));
app.post('/api/notifications/read',auth,(req,res)=>{(req.user.notifications||[]).forEach(n=>n.read=true);save(req.db);res.json({ok:true})});

app.post('/api/purchase/course/:id',auth,(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.id),err=c&&academicAccess(req.user,c);if(!c)return res.status(404).json({error:'Course not found'});if(err)return res.status(403).json({error:err});if(ownsCourse(d,req.user,c.id))return res.json({message:'کورس مخکې اخیستل شوی'});const o={id:'ord-'+T(),userId:req.user.id,type:'course',courseId:c.id,amount:Number(c.price||0),status:'pending',createdAt:now()};d.orders.unshift(o);notify(d,req.user.id,'Purchase Request','ستاسې د کورس د اخیستلو غوښتنه ثبت شوه.');save(d);res.json({message:'Purchase request ثبت شو؛ Admin به Payment تایید کړي.',order:o})});
app.post('/api/purchase/video/:courseId/:videoId',auth,(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId),err=c&&academicAccess(req.user,c);if(!c||!v)return res.status(404).json({error:'Video not found'});if(err)return res.status(403).json({error:err});if(ownsVideo(d,req.user,c.id,v.id))return res.json({message:'ویډیو مخکې اخیستل شوې'});const o={id:'ord-'+T(),userId:req.user.id,type:'video',courseId:c.id,videoId:v.id,amount:Number(v.price||0),status:'pending',createdAt:now()};d.orders.unshift(o);save(d);res.json({message:'Video purchase request ثبت شو.',order:o})});
app.get('/api/video/:courseId/:videoId/access',auth,(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).json({error:'Video not found'});const err=academicAccess(req.user,c);if(err)return res.status(403).json({error:err});const full=ownsCourse(d,req.user,c.id)||ownsVideo(d,req.user,c.id,v.id);if(full)return res.json({mode:'full',url:'/api/video/'+c.id+'/'+v.id+'/stream',durationSeconds:v.durationSeconds||0});if(!v.file&&!v.videoUrl)return res.status(404).json({error:'Video file not configured'});res.json({mode:'preview',url:'/api/video/'+c.id+'/'+v.id+'/stream',durationSeconds:Math.min(180,v.durationSeconds||180)})});
app.get('/api/video/:courseId/:videoId/stream',auth,(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).end();const err=academicAccess(req.user,c);if(err)return res.status(403).end();const full=ownsCourse(d,req.user,c.id)||ownsVideo(d,req.user,c.id,v.id);if(v.file){const f=path.join(UPLOADS,path.basename(v.file));if(!fs.existsSync(f))return res.status(404).end();const stat=fs.statSync(f),range=req.headers.range;if(!range)return res.status(200).sendFile(f);const m=/bytes=(\d+)-(\d*)/.exec(range);if(!m)return res.status(416).end();let start=Number(m[1]),end=m[2]?Number(m[2]):stat.size-1;if(!full&&v.durationSeconds>180)end=Math.min(end,Math.floor(stat.size*(180/v.durationSeconds)));if(start>end||start>=stat.size)return res.status(416).end();res.status(206).set({'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1,'Content-Type':v.mime||'video/mp4'}).sendFile(f,{headers:{}})}else if(v.videoUrl){if(!full)return res.status(403).json({error:'Preview د remote video لپاره د ۳ دقیقو server-side محدودیت ته اړتیا لري؛ local upload وکاروئ'});res.redirect(v.videoUrl)}else res.status(404).end()});
app.get('/api/video/:courseId/:videoId/social',auth,(req,res)=>{const c=req.db.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).json({error:'not found'});res.json({likes:v.likes||0,shares:v.shares||0,comments:v.comments||[]})});
app.post('/api/video/:courseId/:videoId/like',auth,(req,res)=>{const c=req.db.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).json({error:'not found'});v.likes=(v.likes||0)+1;save(req.db);res.json({likes:v.likes})});
app.post('/api/video/:courseId/:videoId/comment',auth,(req,res)=>{const c=req.db.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);const text=String(req.body.text||'').trim();if(!c||!v||!text)return res.status(400).json({error:'Comment ضروري دی'});v.comments=v.comments||[];v.comments.unshift({id:'cm-'+T(),userId:req.user.id,name:req.user.name,text:text.slice(0,1000),createdAt:now()});save(req.db);res.json({ok:true})});
app.post('/api/video/:courseId/:videoId/share',auth,(req,res)=>{const c=req.db.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).json({error:'not found'});v.shares=(v.shares||0)+1;save(req.db);res.json({shares:v.shares,url:'/course/'+c.id+'?video='+v.id})});

app.get('/api/admin/dashboard',auth,admin,(req,res)=>{const d=req.db,students=d.users.filter(u=>u.role==='student'),teachers=d.users.filter(u=>u.role==='teacher');const by=(field)=>{const m={};students.forEach(u=>{const k=u[field]||'—';m[k]=(m[k]||0)+1});return m};const matrix={};students.forEach(u=>{const k=[u.university||'—',u.faculty||'—',u.department||'—',u.semester||'—',u.academicYear||'—'].join(' | ');matrix[k]=(matrix[k]||0)+1});res.json({role:req.user.role,stats:{totalUsers:d.users.length,students:students.length,teachers:teachers.length,pending:students.filter(u=>u.status==='pending').length+teachers.filter(u=>u.status==='pending').length,verified:students.filter(u=>u.status==='verified').length,courses:d.courses.length,videos:d.courses.reduce((n,c)=>n+(c.videos||[]).length,0),books:d.books.length,orders:d.orders.length,pendingOrders:d.orders.filter(o=>o.status==='pending').length,revenue:d.orders.filter(o=>o.status==='paid').reduce((n,o)=>n+Number(o.amount||0),0)},byUniversity:by('university'),byFaculty:by('faculty'),byDepartment:by('department'),bySemester:by('semester'),byAcademicYear:by('academicYear'),academicMatrix:matrix})});
app.get('/api/admin/users',auth,admin,(req,res)=>{const d=req.db,q=String(req.query.q||'').toLowerCase(),faculty=req.query.faculty||'',department=req.query.department||'',semester=req.query.semester||'',status=req.query.status||'',role=req.query.role||'';let users=d.users.filter(u=>u.role!=='superadmin');users=users.filter(u=>(!q||JSON.stringify(u).toLowerCase().includes(q))&&(!faculty||u.faculty===faculty)&&(!department||u.department===department)&&(!semester||String(u.semester)===String(semester))&&(!status||u.status===status)&&(!role||u.role===role));res.json({users:users.map(clean)})});
app.post('/api/admin/users/:id/status',auth,requirePerm('users'),(req,res)=>{const d=req.db,u=d.users.find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:'User not found'});u.status=String(req.body.status||'pending');if(u.status==='verified')notify(d,u.id,'Account تأیید شو','ستاسې حساب د زدکړیال Admin له خوا تأیید شو.');save(d);res.json({user:clean(u)})});
app.get('/api/admin/orders',auth,admin,(req,res)=>res.json({orders:req.db.orders.map(o=>({...o,userName:req.db.users.find(u=>u.id===o.userId)?.name||''}))}));
app.post('/api/admin/orders/:id/status',auth,requirePerm('payments'),(req,res)=>{const d=req.db,o=d.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:'Order not found'});o.status=String(req.body.status||'pending');if(o.status==='paid'){d.purchases.push({id:'pur-'+T(),userId:o.userId,type:o.type,courseId:o.courseId,videoId:o.videoId,status:'paid',amount:o.amount,createdAt:now()});notify(d,o.userId,'Payment تایید شو','ستاسې Purchase تایید شو او محتوا فعال شوه.')}save(d);res.json({order:o})});

app.get('/api/live-classes',(req,res)=>{const d=db();res.json({liveClasses:d.liveClasses.filter(x=>x.status!=='deleted').map(x=>({...x,teacher:x.teacherName||x.teacher||''}))})});
app.post('/api/superadmin/live-classes',auth,superOnly,(req,res)=>{const d=req.db,x=req.body;if(!x.title||!x.teacherName||!x.faculty||!x.semester)return res.status(400).json({error:'عنوان، استاد، پوهنځی او سمستر ضروري دي'});const l={id:'live-'+T(),title:x.title,teacherName:x.teacherName,faculty:x.faculty,department:x.department||'',semester:String(x.semester),academicYear:x.academicYear||'',date:x.date||'',time:x.time||'',url:x.url||'',status:'scheduled',createdAt:now()};d.liveClasses.unshift(l);save(d);res.json({liveClass:l})});
app.post('/api/admin/courses',auth,requirePerm('courses'),(req,res)=>{const d=req.db,x=req.body,c={id:'c-'+T(),title:x.title,teacher:x.teacher||'',faculty:x.faculty,department:x.department||'',semester:x.semester||'',academicYear:x.academicYear||'',price:Number(x.price||0),description:x.description||'',downloadable:!!x.downloadable,videos:[],createdAt:now()};d.courses.unshift(c);save(d);res.json({course:c})});
app.post('/api/admin/courses/:id/videos',auth,requirePerm('courses'),(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.id);if(!c)return res.status(404).json({error:'Course not found'});const v={id:'v-'+T(),title:req.body.title,price:Number(req.body.price||0),durationSeconds:Number(req.body.durationSeconds||0),videoUrl:req.body.videoUrl||'',file:'',mime:'video/mp4',createdAt:now(),likes:0,shares:0,comments:[]};c.videos.push(v);save(d);res.json({video:v})});
app.delete('/api/admin/courses/:id',auth,requirePerm('courses'),(req,res)=>{const d=req.db,i=d.courses.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({error:'not found'});d.courses.splice(i,1);save(d);res.json({ok:true})});
app.post('/api/admin/upload',auth,requirePerm('content'),(req,res)=>{upload.single('file')(req,res,err=>{if(err)return res.status(400).json({error:err.message||'Upload failed'});if(!req.file)return res.status(400).json({error:'فایل ټاکل شوی نه دی'});const type=req.body.type||'image',url='/uploads/'+req.file.filename,d=req.db;if(type==='image'){if(!/^image\//.test(req.file.mimetype))return res.status(400).json({error:'یوازې عکس'});d.site.gallery.unshift({id:'img-'+T(),url,name:req.file.originalname,createdAt:now()});save(d);return res.json({file:url,type})}if(type==='video'){if(!/^video\//.test(req.file.mimetype))return res.status(400).json({error:'یوازې ویډیو'});const c=d.courses.find(x=>x.id===req.body.courseId);if(!c)return res.status(400).json({error:'Course ID ناسم دی'});const v={id:'v-'+T(),title:req.body.title||req.file.originalname,price:Number(req.body.price||0),durationSeconds:Number(req.body.durationSeconds||0),file:req.file.filename,mime:req.file.mimetype,videoUrl:'',createdAt:now(),likes:0,shares:0,comments:[]};c.videos.push(v);save(d);return res.json({file:url,type,video:v})}if(type==='pdf'){if(req.file.mimetype!=='application/pdf')return res.status(400).json({error:'یوازې PDF'});const b={id:'b-'+T(),title:req.body.title||req.file.originalname,faculty:req.body.faculty||'',department:req.body.department||'',semester:req.body.semester||'',academicYear:req.body.academicYear||'',author:req.body.author||'',description:req.body.description||'',pdfFile:req.file.filename,createdAt:now()};d.books.unshift(b);save(d);return res.json({file:url,type,book:b})}res.status(400).json({error:'Upload type ناسم دی'})})});

app.get('/api/ads',(req,res)=>{const d=db(),nowMs=Date.now();res.json({ads:d.ads.filter(a=>a.active!==false&&(!a.startAt||Date.parse(a.startAt)<=nowMs)&&(!a.endAt||Date.parse(a.endAt)>=nowMs))})});
app.get('/api/admin/ads',auth,requirePerm('ads'),(req,res)=>res.json({ads:req.db.ads||[]}));
app.post('/api/admin/ads',auth,requirePerm('ads'),(req,res)=>{const d=req.db,x=req.body;if(!x.title)return res.status(400).json({error:'د اعلان عنوان ضروري دی'});const a={id:'ad-'+T(),title:String(x.title).slice(0,160),link:String(x.link||''),position:x.position||'home',imageUrl:String(x.imageUrl||''),startAt:x.startAt||'',endAt:x.endAt||'',active:x.active!==false,createdAt:now()};d.ads.unshift(a);save(d);res.json({ad:a})});
app.patch('/api/admin/ads/:id',auth,requirePerm('ads'),(req,res)=>{const d=req.db,a=d.ads.find(x=>x.id===req.params.id);if(!a)return res.status(404).json({error:'Ad not found'});Object.assign(a,{...req.body,id:a.id});save(d);res.json({ad:a})});
app.delete('/api/admin/ads/:id',auth,requirePerm('ads'),(req,res)=>{const d=req.db,i=d.ads.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({error:'Ad not found'});d.ads.splice(i,1);save(d);res.json({ok:true})});
app.post('/api/profile/photo',auth,upload.single('photo'),(req,res)=>{if(!req.file)return res.status(400).json({error:'عکس انتخاب کړئ'});if(!/^image\/(jpeg|png|webp)$/.test(req.file.mimetype))return res.status(400).json({error:'یوازې JPG, PNG یا WebP عکس'});req.user.photo='/uploads/'+req.file.filename;save(req.db);res.json({url:req.user.photo,user:clean(req.user)})});
app.delete('/api/profile/photo',auth,(req,res)=>{req.user.photo='';save(req.db);res.json({ok:true})});
app.post('/api/support',auth,(req,res)=>{const d=req.db,x=req.body;if(!String(x.subject||'').trim()||!String(x.message||'').trim())return res.status(400).json({error:'موضوع او پیغام ضروري دي'});const t={id:'sup-'+T(),userId:req.user.id,subject:String(x.subject).slice(0,160),message:String(x.message).slice(0,3000),status:'open',createdAt:now()};d.supportTickets.unshift(t);save(d);res.json({ticket:t,message:'ستاسې د ملاتړ غوښتنه ثبت شوه'});});
app.get('/api/admin/support',auth,requirePerm('users'),(req,res)=>{const d=req.db;res.json({tickets:(d.supportTickets||[]).map(t=>({...t,userName:d.users.find(u=>u.id===t.userId)?.name||''}))})});
app.patch('/api/admin/support/:id',auth,requirePerm('users'),(req,res)=>{const d=req.db,t=(d.supportTickets||[]).find(x=>x.id===req.params.id);if(!t)return res.status(404).json({error:'Ticket not found'});t.status=req.body.status||t.status;save(d);res.json({ticket:t})});
app.post('/api/progress/:courseId/:videoId',auth,(req,res)=>{const d=req.db,c=d.courses.find(x=>x.id===req.params.courseId),v=c&&c.videos.find(x=>x.id===req.params.videoId);if(!c||!v)return res.status(404).json({error:'Video not found'});const err=academicAccess(req.user,c);if(err)return res.status(403).json({error:err});const full=ownsCourse(d,req.user,c.id)||ownsVideo(d,req.user,c.id,v.id);if(!full)return res.status(403).json({error:'لومړی کورس/ویډیو واخلئ'});c.progress=c.progress||{};c.progress[req.user.id]=c.progress[req.user.id]||{};c.progress[req.user.id][v.id]=Math.max(0,Math.min(Number(req.body.percent||0),100));save(d);res.json({percent:c.progress[req.user.id][v.id]})});
app.get('/api/my-progress',auth,(req,res)=>{const d=req.db,out=[];d.courses.forEach(c=>{const p=c.progress&&c.progress[req.user.id];if(p)out.push({courseId:c.id,title:c.title,progress:p})});res.json({progress:out})});

app.get('/api/admin/site-images',auth,admin,(req,res)=>res.json({site:req.db.site}));
app.post('/api/admin/hero-image',auth,requirePerm('content'),(req,res)=>{req.db.site.heroImage=String(req.body.url||'');save(req.db);res.json({url:req.db.site.heroImage})});
app.post('/api/admin/books',auth,requirePerm('content'),(req,res)=>{const d=req.db,b={id:'b-'+T(),...req.body,createdAt:now()};d.books.unshift(b);save(d);res.json({book:b})});
app.delete('/api/admin/books/:id',auth,requirePerm('content'),(req,res)=>{const d=req.db,i=d.books.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({error:'not found'});d.books.splice(i,1);save(d);res.json({ok:true})});

app.post('/api/superadmin/teachers',auth,superOnly,(req,res)=>{const d=req.db,x=req.body;if(!x.name||!x.email||!x.password)return res.status(400).json({error:'د استاد نوم، Email او Password ضروري دي'});if(d.users.some(u=>u.email===x.email))return res.status(409).json({error:'Email مخکې استعمال شوی'});const t={id:'t-'+T(),teacherCode:'TCH-'+Math.random().toString(36).slice(2,8).toUpperCase(),name:x.name,email:x.email,phone:x.phone||'',password:H(x.password),role:'teacher',status:'verified',permissions:[],university:x.university||'',faculty:x.faculty||'',department:x.department||'',semester:'',academicYear:'',credentials:x.credentials||'',createdAt:now(),notifications:[],activeSession:null};d.users.push(t);save(d);res.json({teacher:clean(t)});});
app.get('/api/superadmin/teachers',auth,superOnly,(req,res)=>res.json({teachers:req.db.users.filter(u=>u.role==='teacher').map(clean)}));
app.post('/api/superadmin/teachers/:id/status',auth,superOnly,(req,res)=>{const t=req.db.users.find(u=>u.id===req.params.id&&u.role==='teacher');if(!t)return res.status(404).json({error:'Teacher not found'});t.status=String(req.body.status||'verified');save(req.db);res.json({teacher:clean(t)});});
app.post('/api/superadmin/admins',auth,superOnly,(req,res)=>{const d=req.db,x=req.body;if(!x.name||!x.email||!x.password)return res.status(400).json({error:'Name, email, password ضروري دي'});if(d.users.some(u=>u.email===x.email))return res.status(409).json({error:'Email مخکې استعمال شوی'});const a={id:'a-'+T(),adminCode:'ADM-'+Math.random().toString(36).slice(2,8).toUpperCase(),name:x.name,email:x.email,phone:x.phone||'',password:H(x.password),role:'admin',status:'verified',permissions:Array.isArray(x.permissions)?x.permissions:[],university:'',faculty:'',department:'',semester:'',createdAt:now(),notifications:[],activeSession:null};d.users.push(a);save(d);res.json({admin:clean(a)})});
app.get('/api/superadmin/admins',auth,superOnly,(req,res)=>res.json({admins:req.db.users.filter(u=>u.role==='admin').map(clean)}));
app.post('/api/superadmin/admins/:id/permissions',auth,superOnly,(req,res)=>{const a=req.db.users.find(u=>u.id===req.params.id&&u.role==='admin');if(!a)return res.status(404).json({error:'Admin not found'});a.permissions=Array.isArray(req.body.permissions)?req.body.permissions:[];save(req.db);res.json({admin:clean(a)})});
app.post('/api/superadmin/admins/:id/status',auth,superOnly,(req,res)=>{const a=req.db.users.find(u=>u.id===req.params.id&&u.role==='admin');if(!a)return res.status(404).json({error:'Admin not found'});a.status=String(req.body.status||'verified');save(req.db);res.json({admin:clean(a)})});
app.post('/api/superadmin/catalog',auth,superOnly,(req,res)=>{const d=req.db,x=req.body;const field=x.type;if(!['universities','faculties','departments','academicYears','semesters','subjects'].includes(field))return res.status(400).json({error:'Catalog type ناسم دی'});if(field==='departments')d.departments.push({faculty:x.faculty,name:x.name});else d[field].push(field==='subjects'?{faculty:x.faculty,department:x.department,semester:x.semester,name:x.name}:String(x.name||''));save(d);res.json({academic:{universities:d.universities,faculties:d.faculties,departments:d.departments,academicYears:d.academicYears,semesters:d.semesters,subjects:d.subjects}})});
app.get('/api/superadmin/server',auth,superOnly,(req,res)=>res.json({node:process.version,port:PORT,uploadLimit:'700MB',database:'data.json demo database',storage:UPLOADS,secretConfigured:process.env.ZD_SECRET?'yes':'no',smsConfigured:process.env.SMS_API_URL?'yes':'test mode',message:'اصلي Server Code د Super Admin Dashboard له لارې نه بدلېږي؛ server.js/source کې د مالک/Developer له خوا بدلېږي.'}));


// ---- V12 Advanced platform features ----
function audit(d,req,action,details){d.auditLogs=d.auditLogs||[];d.auditLogs.unshift({id:'audit-'+T(),userId:req.user?.id||'system',userName:req.user?.name||'system',action,details:String(details||''),createdAt:now()});if(d.auditLogs.length>1000)d.auditLogs=d.auditLogs.slice(0,1000)}
app.patch('/api/profile',auth,(req,res)=>{const d=req.db,x=req.body;const name=String(x.name||'').trim();const email=String(x.email||'').trim();if(!name)return res.status(400).json({error:'نوم ضروري دی'});if(email&&d.users.some(u=>u.id!==req.user.id&&u.email===email))return res.status(409).json({error:'Email مخکې استعمال شوی'});req.user.name=name;req.user.email=email;save(d);audit(d,req,'profile.update','Profile updated');save(d);res.json({user:clean(req.user)})});
app.get('/api/wishlist',auth,(req,res)=>{const d=req.db;d.wishlists=d.wishlists||[];const ids=d.wishlists.filter(x=>x.userId===req.user.id).map(x=>x.courseId);const items=ids.map(id=>d.courses.find(c=>c.id===id)).filter(Boolean).map(c=>({courseId:c.id,title:c.title}));res.json({items})});
app.post('/api/wishlist/:courseId',auth,(req,res)=>{const d=req.db;d.wishlists=d.wishlists||[];if(!d.courses.some(c=>c.id===req.params.courseId))return res.status(404).json({error:'Course نه شته'});if(!d.wishlists.some(x=>x.userId===req.user.id&&x.courseId===req.params.courseId))d.wishlists.push({userId:req.user.id,courseId:req.params.courseId,createdAt:now()});save(d);res.json({ok:true})});
app.delete('/api/wishlist/:courseId',auth,(req,res)=>{const d=req.db;d.wishlists=(d.wishlists||[]).filter(x=>!(x.userId===req.user.id&&x.courseId===req.params.courseId));save(d);res.json({ok:true})});
app.post('/api/notifications/:id/read',auth,(req,res)=>{const n=(req.user.notifications||[]).find(x=>x.id===req.params.id);if(!n)return res.status(404).json({error:'Notification نه شته'});n.read=true;save(req.db);res.json({ok:true})});
app.post('/api/payment/receipt',auth,upload.single('receipt'),(req,res)=>{if(!req.file)return res.status(400).json({error:'د بانک رسید فایل وټاکئ'});if(req.file.mimetype!=='application/pdf'&&!/^image\/(jpeg|png|webp)$/.test(req.file.mimetype))return res.status(400).json({error:'رسید باید JPG, PNG, WebP یا PDF وي'});const d=req.db,o=d.orders.find(x=>x.id===req.body.orderId&&x.userId===req.user.id);if(!o)return res.status(404).json({error:'Order ونه موندل شو'});o.receiptFile=req.file.filename;o.receiptOriginalName=req.file.originalname;o.receiptUploadedAt=now();o.status='pending_review';audit(d,req,'payment.receipt','order '+o.id);save(d);notify(d,'superadmin','نوی Payment Receipt','محصل د Order '+o.id+' لپاره رسید پورته کړ.');res.json({message:'رسید ثبت شو؛ Admin به یې Review کړي.'})});
app.get('/api/my-certificates',auth,(req,res)=>{const d=req.db;const certs=(d.certificates||[]).filter(x=>x.userId===req.user.id);res.json({certificates:certs})});
app.post('/api/teacher/courses',auth,(req,res)=>{if(req.user.role!=='teacher')return res.status(403).json({error:'یوازې استاد'});const d=req.db,x=req.body;if(!String(x.title||'').trim())return res.status(400).json({error:'د کورس عنوان ضروري دی'});const c={id:'c-'+T(),title:String(x.title).trim(),description:String(x.description||''),price:Number(x.price||0),teacher:req.user.name,teacherId:req.user.id,university:req.user.university||'',faculty:req.user.faculty||'',department:req.user.department||'',semester:req.user.semester||'',academicYear:req.user.academicYear||'',status:'review',approvalStatus:'pending',videos:[],createdAt:now(),studentsCount:0,progress:{}};d.courses.unshift(c);audit(d,req,'course.submit',c.title);save(d);notify(d,'superadmin','نوی کورس د Review لپاره','استاد '+req.user.name+' نوی کورس Submit کړ: '+c.title);res.json({course:c})});
app.get('/api/teacher/earnings',auth,(req,res)=>{if(!['teacher','admin','superadmin'].includes(req.user.role))return res.status(403).json({error:'اجازه نشته'});const d=req.db;const total=(d.purchases||[]).filter(p=>p.status==='paid').reduce((sum,p)=>{const c=d.courses.find(c=>c.id===p.courseId&&c.teacherId===req.user.id);return sum+(c?Number(p.amount||0):0)},0);res.json({total})});
app.post('/api/admin/notify',auth,requirePerm('users'),(req,res)=>{const d=req.db,u=d.users.find(x=>x.id===req.body.userId);if(!u)return res.status(404).json({error:'User نه شته'});notify(d,u.id,String(req.body.title||'Notification'),String(req.body.message||''));audit(d,req,'notification.send','to '+u.id);save(d);res.json({ok:true})});
app.get('/api/admin/analytics',auth,admin,(req,res)=>{const d=req.db;const videos=d.courses.reduce((n,c)=>n+(c.videos||[]).length,0);const revenue=(d.purchases||[]).filter(p=>p.status==='paid').reduce((n,p)=>n+Number(p.amount||0),0);res.json({users:d.users.length,students:d.users.filter(u=>u.role==='student').length,teachers:d.users.filter(u=>u.role==='teacher').length,courses:d.courses.length,videos,books:d.books.length,revenue})});
app.get('/api/admin/audit',auth,requirePerm('users'),(req,res)=>res.json({logs:(req.db.auditLogs||[]).slice(0,100)}));
app.get('/api/superadmin/backup',auth,superOnly,(req,res)=>{const d=req.db;audit(d,req,'backup.export','database backup');save(d);res.setHeader('Content-Disposition','attachment; filename="zdakrhyal-backup.json"');res.type('application/json').send(JSON.stringify(d,null,2))});
app.get('/api/superadmin/health',auth,superOnly,(req,res)=>res.json({node:process.version,database:fs.existsSync(DB)?'online':'missing',uploads:fs.existsSync(UPLOADS)?'online':'missing',time:now()}));
app.get('/api/superadmin/supabase-health',auth,superOnly,async(req,res)=>{try{res.json(await dbHealth())}catch(e){res.status(500).json({configured:true,connected:false,error:e.message})}});
app.post('/api/superadmin/settings',auth,superOnly,(req,res)=>{const d=req.db;d.settings=d.settings||{};Object.assign(d.settings,{platformName:String(req.body.platformName||'زدکړیال'),defaultLanguage:String(req.body.defaultLanguage||'ps'),maintenance:req.body.maintenance==='on'||req.body.maintenance===true});audit(d,req,'settings.update','platform settings');save(d);res.json({settings:d.settings})});

// PDF downloads are protected by academic access.
app.get('/api/book/:id/file',auth,(req,res)=>{const d=req.db,b=d.books.find(x=>x.id===req.params.id);if(!b)return res.status(404).end();const err=academicAccess(req.user,b);if(err)return res.status(403).json({error:err});if(!b.pdfFile)return res.status(404).end();const f=path.join(UPLOADS,path.basename(b.pdfFile));if(!fs.existsSync(f))return res.status(404).end();res.sendFile(f)});
app.use('/uploads',express.static(UPLOADS,{index:false,setHeaders:(res,p)=>{if(/\.(mp4|webm|mov|pdf)$/i.test(p))res.statusCode=404}}));

/* =========================================================
   UNIVERSITY STANDARD / ACADEMIC GOVERNANCE FOUNDATION
   These endpoints are intentionally server-side. They are the
   first foundation for accreditation-ready academic workflows.
========================================================= */
function arr(d,k){d[k]=Array.isArray(d[k])?d[k]:[];return d[k]}
function academicMatch(item,u){
  if(!item)return false;
  if(item.university && u.university && item.university!==u.university)return false;
  if(item.faculty && u.faculty && item.faculty!==u.faculty)return false;
  if(item.department && u.department && item.department!==u.department)return false;
  if(item.program && u.program && item.program!==u.program)return false;
  if(item.semester && u.semester && Number(item.semester)>Number(u.semester))return false;
  return true;
}
function requireVerifiedStudent(req,res,next){
  if(req.user.role!=='student')return res.status(403).json({error:'یوازې محصل ته اجازه شته'});
  if(req.user.status!=='verified')return res.status(403).json({error:'د محصل حساب لا د پوهنتون/Admin له خوا تایید شوی نه دی'});
  next();
}

app.get('/api/academic/catalog', (req,res)=>{
  const d=db();
  res.json({
    universities:d.universities,
    faculties:d.faculties,
    departments:d.departments,
    programs:d.programs||[],
    academicYears:d.academicYears,
    terms:d.terms||d.semesters||[],
    semesters:d.semesters,
    facultySemesters:d.facultySemesters,
    subjects:d.subjects,
    gradingScales:d.gradingScales||[],
    policies:d.policies||[]
  });
});

app.get('/api/academic/departments',(req,res)=>{
  const d=db(); let x=arr(d,'departments');
  if(req.query.faculty)x=x.filter(v=>v.faculty===req.query.faculty);
  res.json({departments:x});
});
app.get('/api/academic/programs',(req,res)=>{
  const d=db(); let x=arr(d,'programs');
  if(req.query.faculty)x=x.filter(v=>v.faculty===req.query.faculty);
  if(req.query.department)x=x.filter(v=>v.department===req.query.department);
  res.json({programs:x});
});
app.get('/api/academic/semesters',(req,res)=>{
  const d=db(); const faculty=String(req.query.faculty||'');
  const max=Number((d.facultySemesters||{})[faculty]||0);
  const list=Array.from({length:max||11},(_,i)=>String(i+1));
  res.json({faculty,maximum:max||11,semesters:list});
});
app.get('/api/academic/subjects',(req,res)=>{
  const d=db(); let x=arr(d,'subjects');
  if(req.query.faculty)x=x.filter(v=>v.faculty===req.query.faculty);
  if(req.query.department)x=x.filter(v=>v.department===req.query.department);
  if(req.query.program)x=x.filter(v=>v.program===req.query.program);
  if(req.query.semester)x=x.filter(v=>String(v.semester)===String(req.query.semester));
  res.json({subjects:x});
});

app.get('/api/student/academic-profile',auth,requireVerifiedStudent,(req,res)=>{
  const u=req.user,d=req.db;
  res.json({student:{id:u.id,name:u.name,studentCode:u.studentCode,university:u.university,faculty:u.faculty,department:u.department,program:u.program||'',semester:u.semester,academicYear:u.academicYear,academicStanding:u.academicStanding||'good'},maximumSemester:Number((d.facultySemesters||{})[u.faculty]||11)});
});

app.get('/api/student/subjects',auth,requireVerifiedStudent,(req,res)=>{
  const u=req.user,d=req.db; let x=arr(d,'subjects').filter(s=>academicMatch(s,u));
  if(req.query.semester)x=x.filter(s=>Number(s.semester)===Number(req.query.semester));
  res.json({subjects:x});
});

app.get('/api/student/transcript',auth,requireVerifiedStudent,(req,res)=>{
  const d=req.db;
  const rows=arr(d,'transcriptRecords').filter(x=>x.userId===req.user.id);
  const credits=rows.reduce((n,x)=>n+Number(x.credits||0),0);
  const quality=rows.reduce((n,x)=>n+(Number(x.credits||0)*Number(x.gradePoint||0)),0);
  res.json({records:rows,totalCredits:credits,gpa:credits?Number((quality/credits).toFixed(2)):0});
});

app.get('/api/student/attendance',auth,requireVerifiedStudent,(req,res)=>{
  const rows=arr(req.db,'attendance').filter(x=>x.userId===req.user.id);
  const grouped={};
  rows.forEach(x=>{const k=x.subjectId||x.subject||'unknown';grouped[k]=grouped[k]||{subjectId:k,total:0,present:0,absent:0,late:0};grouped[k].total++;if(x.status==='present')grouped[k].present++;else if(x.status==='late')grouped[k].late++;else grouped[k].absent++});
  Object.values(grouped).forEach(x=>x.percent=x.total?Number(((x.present+x.late*.5)/x.total*100).toFixed(1)):0);
  res.json({attendance:Object.values(grouped)});
});

app.get('/api/courses/:id/prerequisites',(req,res)=>{
  const d=db(),c=d.courses.find(x=>x.id===req.params.id);
  if(!c)return res.status(404).json({error:'Course not found'});
  const ids=Array.isArray(c.prerequisites)?c.prerequisites:[];
  res.json({prerequisites:ids.map(id=>d.courses.find(x=>x.id===id)).filter(Boolean).map(x=>({id:x.id,title:x.title,semester:x.semester}))});
});

app.get('/api/policies',(req,res)=>res.json({policies:arr(db(),'policies')}));

app.post('/api/admin/academic/programs',auth,admin,(req,res)=>{
  const d=req.db,x=req.body;
  if(!x.name||!x.faculty||!x.department)return res.status(400).json({error:'Program نوم، Faculty او Department ضروري دي'});
  const p={id:'prog-'+T(),name:String(x.name).trim(),code:String(x.code||'').trim(),faculty:String(x.faculty),department:String(x.department),degreeLevel:String(x.degreeLevel||'bachelor'),durationYears:Number(x.durationYears||4),totalCredits:Number(x.totalCredits||0),active:x.active!==false,createdAt:now()};
  arr(d,'programs').push(p);audit(d,req,'academic.program.create',p.name);save(d);res.json({program:p});
});

app.post('/api/admin/academic/subjects',auth,admin,(req,res)=>{
  const d=req.db,x=req.body;
  if(!x.name||!x.faculty||!x.department||!x.semester)return res.status(400).json({error:'Subject لپاره Name, Faculty, Department او Semester ضروري دي'});
  const s={id:'sub-'+T(),code:String(x.code||'').trim(),name:String(x.name).trim(),faculty:x.faculty,department:x.department,program:x.program||'',semester:String(x.semester),credits:Number(x.credits||0),hours:Number(x.hours||0),type:String(x.type||'core'),prerequisites:Array.isArray(x.prerequisites)?x.prerequisites:[],learningOutcomes:Array.isArray(x.learningOutcomes)?x.learningOutcomes:[],active:true,createdAt:now()};
  arr(d,'subjects').push(s);audit(d,req,'academic.subject.create',s.name);save(d);res.json({subject:s});
});

app.post('/api/admin/academic/attendance',auth,admin,(req,res)=>{
  const d=req.db,x=req.body;
  if(!x.userId||!x.subjectId||!x.status)return res.status(400).json({error:'Student، Subject او Attendance status ضروري دي'});
  if(!['present','absent','late','excused'].includes(x.status))return res.status(400).json({error:'Attendance status ناسم دی'});
  const row={id:'att-'+T(),userId:x.userId,subjectId:x.subjectId,date:x.date||now().slice(0,10),status:x.status,recordedBy:req.user.id,createdAt:now()};
  arr(d,'attendance').push(row);audit(d,req,'attendance.record',x.userId+'/'+x.subjectId);save(d);res.json({attendance:row});
});

app.post('/api/admin/academic/grade',auth,admin,(req,res)=>{
  const d=req.db,x=req.body;
  if(!x.userId||!x.subjectId||x.grade===undefined)return res.status(400).json({error:'Student، Subject او Grade ضروري دي'});
  const row={id:'tr-'+T(),userId:x.userId,subjectId:x.subjectId,semester:String(x.semester||''),academicYear:String(x.academicYear||''),grade:String(x.grade),gradePoint:Number(x.gradePoint||0),credits:Number(x.credits||0),status:String(x.status||'completed'),recordedBy:req.user.id,createdAt:now()};
  arr(d,'transcriptRecords').push(row);audit(d,req,'academic.grade.record',x.userId+'/'+x.subjectId);save(d);res.json({record:row});
});

app.get('/api/admin/students/pending',auth,admin,(req,res)=>res.json({students:req.db.users.filter(u=>u.role==='student'&&u.status==='pending').map(clean)}));


app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('زدکړیال server on '+PORT));

زدکړیال V12 — پرمختللې نسخه

دا نسخه د V11 پر بنسټ جوړه شوې او د پوهنتوني/نړیوال e-learning سیستم لپاره پراخه شوې ده.

اصلي برخې:
- Student / Teacher / Admin / Super Admin رولونه
- د محصل موبایل Verification او Admin تایید
- University → Faculty → Department → Semester → Subject جوړښت
- محصل ته د خپلې رشتې اوسني او ښکته سمسترونو لاسرسی
- Course catalog، کتابتون، ویډیو او Live Classes
- Paid Course/Purchase/Payment approval
- خوندي Video/PDF server routes
- د محصل عکس له خپل موبایل/کمپیوټر څخه Upload/Change
- Advertisement Manager
- Support Tickets
- Learning Progress
- Super Admin: Admin/Teacher/Catalog/Live Class مدیریت
- Responsive professional UI

مهمه یادونه:
دا لا هم د Node + JSON database د چټک deployment نسخه ده. د بشپړ نړیوال production deployment لپاره Supabase/PostgreSQL، private object storage، CDN، real SMS provider، payment gateway، backups، monitoring او automated tests باید د production چاپېریال سره ونښلول شي.

چلول:
1) npm install
2) ZD_SECRET یو قوي secret وټاکئ
3) npm start
4) http://localhost:3000

Seed Super Admin:
Email: admin@zdakrhyal.local
Password: Admin123!
په production کې سمدستي Password بدل کړئ.


V12.1 Advanced امکانات:
- Student profile settings, wishlist او notification read
- د بانک/PDF/عکس Payment receipt upload workflow
- Teacher course submission د Admin Review لپاره
- Teacher earnings summary
- Admin analytics او Audit Log
- System notifications
- Super Admin backup او system health
- Platform language/maintenance settings
- Hero photo direct device upload + delete
- Course wishlist
- د انټرنېټ online/offline notification

یادونه: حقیقي SMS provider، Supabase/PostgreSQL، بانک/payment gateway، CDN او production email د deployment environment/API credentials ته اړتیا لري.

--- د پوهنځیو سمسترونه ---
V12.2 کې د پوهنځیو لپاره جلا semester catalog اضافه شوی. د طب 11، ستوماتولوژي/فارمسي 10، نرسنګ/عامه روغتیا 8، انجنیري 9، او د ډېرو څلور کلنو لیسانس پروګرامونو لپاره 8 سمسترونه د seed په توګه تنظیم شوي دي. د انجنیري لپاره د وزارت په خپاره شوي نصاب کې 9 سمسترونه او 6 میاشتې عملي دوره ذکر شوې ده.
یادونه: د افغانستان رسمي کریکولم د رشتې/دیپارتمنت له مخې خپرېږي او ټول پروګرامونه یو شان نه دي؛ له همدې امله Super Admin کولی شي د هر پوهنتون/پوهنځي/رشتې سمسترونه تعدیل کړي. د وزارت رسمي نصابونه د ماخذ په توګه وکارول شي.

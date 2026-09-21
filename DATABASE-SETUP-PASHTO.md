# د «زدکړیال» حقیقي Database د فعالولو لارښود

دا نسخه د `v12.2` پروژه پر بنسټ ده. د Database اصلي جوړښت په `supabase_schema.sql` کې دی.

## 1) Supabase پروژه جوړه کړه
1. Supabase ته لاړ شه او نوی Project جوړ کړه.
2. Dashboard → SQL Editor → New query.
3. ټول `supabase_schema.sql` کاپي کړه او Run یې کړه.
4. وروسته `supabase_seed.sql` Run کړه.

## 2) Environment variables
په Bonto/Render/بل Node hosting کې دا variables جوړ کړه:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ZD_SECRET`
- `PORT` (که hosting خپله PORT ورکوي، هماغه پرېږده)

`SUPABASE_SERVICE_ROLE_KEY` یوازې Server کې وساته. په Frontend کې یې مه لیکه.

## 3) مهم امنیت
- Service Role key هېڅکله په `public/` کې مه ږده.
- Production کې `ZD_SECRET` بدل کړه.
- د Super Admin default password `Admin123!` د Production مخکې بدل کړه.
- Supabase Storage کې videos/books private buckets وساته.

## 4) د سمستر قانون
Database کې `study_start_date` ساتل کېږي او د ۶ میاشتو له حسابه `calculated_semester_no` محاسبه کېدای شي.
خو د رسمي سمستر د پیل لپاره `official_semesters` جدول او د Super Admin `Start New Semester` عمل authoritative دی. یعنې یوازې د تقویم په بدلولو سره رسمي سمستر نه بدلېږي.

## 5) د زده کوونکي Access
Access باید په دې ترتیب محدود وي:
University → Faculty → Department → Semester → Subject → Content

زده کوونکی یوازې verified حساب سره خپل پوهنتون/پوهنځی/رشته او خپل current + lower semesters ویني. Higher semester او بل Faculty ته لاسرسی نه لري.

## 6) د Live Class حاضري
Enrollment سره attendance record جوړېږي. Join/leave وخت، duration، present/absent/late او percentage په Database کې ثبتېږي.

## 7) د Payment
بانکي رسید/Payment request د `orders` او `payment_receipts` له لارې ساتل کېږي. Admin/Super Admin یې Review او approve/reject کولی شي.

## 8) Online deployment
Project د Node.js server دی. د hosting Start command:

`npm start`

که hosting د environment variable له لارې PORT ورکوي، server هماغه PORT کاروي.

> یادونه: دا SQL د Production Database بنسټ بشپړوي؛ د موجود `data.json` endpoint code لا هم demo/fallback دی. د حقیقي Supabase operation لپاره د `server-supabase.js`/DB adapter مرحله باید فعال شي او `data.json` د production source په توګه بند شي.

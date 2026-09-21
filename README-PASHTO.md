# زدکړیال — Professional University Foundation v1

دا نسخه د اصلي «زدکړیال» پروژې د مسلکي جوړښت لومړنی coding foundation دی.

## مهمې برخې
- د نوي Homepage ډیزاین د ورکړل شوي Reference سره نږدې
- د کتابخانې/استادانو اصلي عکس د Hero برخه کې
- Student / Teacher / Admin / Super Admin رولونه
- Phone OTP، Login، Password Reset
- University → Faculty → Department → Program → Semester → Subject جوړښت
- د پوهنځي له مخې Dynamic semester limits
- Course prerequisites، credit hours، learning outcomes
- Grading، attendance، transcript او academic standing لپاره API foundation
- Course access د Student academic profile له مخې server-side
- QBank / Clinical Case / Flashcard / AI Tutor لپاره API foundation
- Local payment + receipt review workflow
- Audit log، notifications، backup او health endpoints

## اجرا
```bash
npm install
npm start
```
بیا: http://localhost:3000

## Production
JSON database یوازې د development لپاره ده. Production ته د Supabase/PostgreSQL migration، private object storage، CDN، DRM، HTTPS، backups، monitoring او CI/CD باید د راتلونکو phases کې بشپړ شي.

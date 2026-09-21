# Supabase Migration Notes — زدکړیال

## Existing demo
`server.js` اوسنی V12.2 demo data د `data.json` له لارې اداره کوي.

## Production target
Production source of truth باید Supabase/PostgreSQL وي:
- profiles/users
- universities/faculties/departments
- study start date + calculated semester
- official semester lifecycle
- subjects/content
- courses/videos/books
- enrollments/purchases/orders
- attendance
- notifications
- ads/footer/site settings
- admin permissions/audit logs

## Migration order
1. Run `supabase_schema.sql`.
2. Run `supabase_seed.sql`.
3. Create private Storage buckets.
4. Configure `.env` from `.env.example`.
5. Migrate existing `data.json` records with the migration script/adapter.
6. Switch API reads/writes from JSON to Supabase.
7. Disable direct public access to uploaded MP4/PDF files.
8. Test RLS and role permissions with student/teacher/admin/superadmin accounts.

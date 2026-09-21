-- زدکړیال initial academic seed
insert into public.universities(name) values
('کابل پوهنتون'),('کابل طبي پوهنتون'),('هرات پوهنتون'),('ننګرهار پوهنتون'),('بلخ پوهنتون'),('کندهار پوهنتون')
on conflict (name) do nothing;

insert into public.academic_years(name) values ('1404'),('1405'),('1406')
on conflict (name) do nothing;

-- Default maximum semester map. Super Admin should adjust these per real program/department.
insert into public.program_semester_limits(department_id,max_semesters)
select d.id, x.max_semesters
from public.departments d
join (values
  ('عمومي طب',11),('ستوماتولوژي',10),('فارمسي',10),('نرسنګ',8),
  ('Computer Science',8),('Software Engineering',8),('Information Technology',8),
  ('سیول انجنیري',9),('برېښنا انجنیري',9),('حقوق',8)
) as x(name,max_semesters) on x.name=d.name
on conflict (department_id) do update set max_semesters=excluded.max_semesters;

# زدکړیال — MASTER SYSTEM v1

## 1. Academic hierarchy
University → Faculty → Department → Semester → Subject → Course → Module → Lesson
Semester count must be dynamic per faculty/department.

## 2. Student verification and access
Registration fields: name, phone, email, university, faculty, department, current semester, academic year, password.
Workflow: Registration → Pending Verification → University/Admin Verification → Approved → Learning Access.

Access rules:
- Current semester: allowed.
- Lower semesters: allowed.
- Higher semesters: blocked.
- Own faculty/department: primary access.
- Other-faculty videos may be viewable, but protected downloads are blocked.
- Premium content requires approved purchase/access.
- Enforce rules server-side, not only in frontend.

## 3. Course and lesson system
Course hierarchy: Faculty → Department → Semester → Subject → Course → Module → Lesson.
Lesson types/features: video, reading, PDF/book, flashcards, quiz, assignment, discussion, related lessons, notes, bookmarks, progress.

## 4. Video player and protection
Player: play/pause, speed 0.5x–2x, fullscreen, subtitles, quality, continue watching, completion, notes, bookmarks, related questions.
Protected media should not be ordinary downloadable MP4 files. Strong protection requires native Android/iOS app, encrypted offline media, Keystore/Keychain, Widevine/FairPlay DRM, device/app attestation, short-lived licenses, secure playback and capture restrictions. Screen filming by an external camera cannot be technically prevented.

## 5. QBank and adaptive learning
MCQ, True/False and Clinical Case questions. Metadata includes explanation, reference, difficulty, academic classification and related lessons.
Track correct/incorrect answers, weak topics and recommendations. Adaptive difficulty: Easy → Medium → Hard.

## 6. Study plans and flashcards
Plans can schedule video, reading, questions, review and mock exams and adapt to progress.
Spaced repetition: Today → 1 day → 3 days → 7 days → 14 days → 30 days.

## 7. Clinical cases
Patient → History → Examination → Investigation → Differential Diagnosis → Diagnosis → Treatment, with hints, explanations, references and related content.

## 8. AI Tutor
Simple/advanced explanations, related lessons/books, practice questions and flashcards. Medical answers should rely on verified educational references and signal uncertainty rather than inventing facts.

## 9. Library and offline learning
Library categories: Medical, Engineering, Computer Science, Law, Economics and others. Filters: Faculty, Department, Semester, Subject, Language, Book Type.
Offline access requires permission checks, course/purchase checks and secure access generation. Premium video offline should use encrypted packages and DRM/license controls, not ordinary file export.

## 10. Live classes and teachers
Live class: date, time, faculty, department, semester, subject, paid/free and access rules.
Teacher registration: name, phone, email, qualification, experience, documents, teaching fields. Admin verifies teacher before publishing.
Teacher tools: courses, video, PDF/book, quizzes, QBank, assignments, live classes, answers, grading, earnings.

## 11. Afghan local payment
Course → Buy → Payment Instructions → Local Bank/Payment → Payment Proof → Admin Review → Approve/Reject → Access.
Admin sees student, phone, course, amount, proof and date.

## 12. Teacher earnings
Configurable split. Example: 500 AFN course → teacher 70%, platform 30%. Admin can change percentages.

## 13. Dashboard and certificates
Student dashboard: learning, progress, completed lessons, quiz scores, study time, weak areas, recommendations, streak.
Achievements: First Course, 100 Lessons, 1000 Questions, 7-Day Streak, Semester Completed, Top Student.
Certificate: student, course, teacher, completion date, certificate ID and QR verification URL.

## 14. Search and admin
Global search across videos, books, reading, questions, cases, courses and teachers.
Admin modules: users, students, teachers, admins, university, faculty, department, semester, subject, courses, modules, lessons, videos, books, tutorials, questions, cases, live classes, verifications, payments, purchases, earnings, notifications, analytics, security and device reset.

## 15. Analytics and notifications
Admin analytics: students, active users, teachers, courses, books, videos, purchases, revenue, popular content, teacher activity, difficult subjects, success rates.
Teacher analytics: students, views, completion, quiz average, revenue.
Notifications: approval, new lesson, payment approval, live reminder, assignment, teacher answer and course update.

## 16. Discussion
Student question → Teacher answer → Helpful vote, with moderation/report/hide/admin controls.

## 17. Languages
Primary Pashto, then Dari and English. Use translation keys rather than hardcoded UI text. Medical terminology can display bilingual/trilingual terms.

## 18. Homepage
Navigation: زدکړیال / کور / کورسونه / کتابتون / حساب / ثبت نام / Login / Admin
Tagline: تعلیم • کتاب • ویډیو • استادان
Hero: هره ورځ زده کړه، خپل راتلونکی جوړ کړه!
Sections: مشهورې برخې (طب، کمپیوټر ساینس، انجنیري، حقوق), ویډیو کورسونه, کتابتون, زما حساب, نوی حساب, Login, admin verification. Footer © 2026 زدکړیال.

## 19. Current backend note
The included backend is the current foundation for authentication, academic access, course access, payments/purchases, video streaming, device/session binding and admin device reset. True DRM/native offline protection remains a separate implementation stage.

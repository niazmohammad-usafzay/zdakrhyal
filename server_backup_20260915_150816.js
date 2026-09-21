const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "data.json");

const defaultDB = {
  users: [
    {
      id: "superadmin-1",
      name: "Super Admin",
      email: "admin@zdakrhyal.local",
      password: "Admin123!",
      role: "superadmin",
      status: "approved",
      university: "",
      faculty: "",
      department: "",
      semester: 1
    }
  ],
  courses: [
    {
      id: "course-1",
      title: "د طب مقدماتي کورس",
      faculty: "طب",
      semester: 1,
      teacher: "زدکړیال",
      price: 0,
      description: "د طب د بنسټیزو موضوعاتو مقدماتي کورس.",
      videos: []
    }
  ],
  books: [],
  ads: [],
  notifications: [],
  purchases: [],
  wishlist: [],
  sessions: []
};

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
      return JSON.parse(JSON.stringify(defaultDB));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    console.error("DB load error:", e);
    return JSON.parse(JSON.stringify(defaultDB));
  }
}

let db = loadDB();

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function id() {
  return crypto.randomUUID();
}

function token() {
  return crypto.randomBytes(32).toString("hex");
}

function cleanUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (!t) {
    return res.status(401).json({ error: "Login required" });
  }

  const session = db.sessions.find(s => s.token === t);

  if (!session) {
    return res.status(401).json({ error: "Session expired" });
  }

  const user = db.users.find(u => u.id === session.userId);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = user;
  req.token = t;
  next();
}

function adminOnly(req, res, next) {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/* =========================
   SITE
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "zdakrhyal",
    backend: true
  });
});

app.get("/api/site", (req, res) => {
  res.json({
    site: {
      name: "زدکړیال",
      heroImage: "/hero-banner.png?v=12",
      tagline: "تعلیم • کتاب • ویډیو • استادان"
    }
  });
});

/* =========================
   REGISTER
========================= */

app.post("/api/register", (req, res) => {
  const {
    name,
    email,
    password,
    role = "student",
    university = "",
    faculty = "",
    department = "",
    semester = 1,
    studyStartDate = ""
  } = req.body || {};

  if (!name || !password) {
    return res.status(400).json({
      error: "نوم، ایمیل او Password ضروري دي"
    });
  }

  const exists = db.users.find(
    u => u.email.toLowerCase() === String(loginId).toLowerCase() || String(u.phone || "") === String(loginId)
  );

  if (exists) {
    return res.status(409).json({
      error: "دا ایمیل مخکې ثبت شوی دی"
    });
  }

  const safeRole =
    ["student", "teacher"].includes(role) ? role : "student";

  const user = {
    id: id(),
    name: String(name),
    email: String(email).toLowerCase(),
    password: String(password),
    role: safeRole,
    status: safeRole === "teacher" ? "pending" : "pending",
    university,
    faculty,
    department,
    semester: Number(semester) || 1,
    studyStartDate,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDB();

  res.json({
    ok: true,
    message: "ثبت نام بریالی شو. حساب د تایید لپاره انتظار کوي.",
    user: cleanUser(user)
  });
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {
  const { identifier, email, password, deviceId = "" } = req.body || {}; const loginId = identifier || email || "";

  if (!loginId || !password) {
    return res.status(400).json({
      error: "ایمیل او Password ولیکئ"
    });
  }

  const user = db.users.find(
    u => u.email.toLowerCase() === String(loginId).toLowerCase() || String(u.phone || "") === String(loginId)
  );

  if (!user || user.password !== String(password)) {
    return res.status(401).json({
      error: "ایمیل یا Password ناسم دی"
    });
  }

  if (user.status === "blocked") {
    return res.status(403).json({
      error: "ستاسو حساب بند شوی دی"
    });
  }

  if (user.status === "pending" && user.role === "student") {
    return res.status(403).json({
      error: "ستاسو حساب لا تر اوسه د پوهنتون/ادمن له خوا تایید شوی نه دی"
    });
  }

  const t = token();

  db.sessions = db.sessions.filter(s => s.userId !== user.id);

  db.sessions.push({
    token: t,
    userId: user.id,
    deviceId,
    createdAt: new Date().toISOString()
  });

  saveDB();

  res.json({
    ok: true,
    token: t,
    user: cleanUser(user)
  });
});

/* =========================
   LOGOUT
========================= */

app.post("/api/logout", auth, (req, res) => {
  db.sessions = db.sessions.filter(s => s.token !== req.token);
  saveDB();

  res.json({ ok: true });
});

/* =========================
   CURRENT USER
========================= */

app.get("/api/me", auth, (req, res) => {
  res.json({
    user: cleanUser(req.user)
  });
});

/* =========================
   COURSES
========================= */

app.get("/api/courses", (req, res) => {
  let courses = [...db.courses];

  const q = String(req.query.q || "").toLowerCase();
  const faculty = String(req.query.faculty || "");

  if (q) {
    courses = courses.filter(c =>
      JSON.stringify(c).toLowerCase().includes(q)
    );
  }

  if (faculty) {
    courses = courses.filter(c => c.faculty === faculty);
  }

  res.json({ courses });
});

/* =========================
   LIVE CLASSES
========================= */

app.get("/api/live-classes", (req, res) => {
  const liveClasses = Array.isArray(db.liveClasses) ? db.liveClasses : [];
  res.json({ liveClasses });
});

/* =========================
   BOOKS
========================= */

app.get("/api/books", (req, res) => {
  let books = [...db.books];

  const faculty = String(req.query.faculty || "");

  if (faculty) {
    books = books.filter(b => b.faculty === faculty);
  }

  res.json({ books });
});

/* =========================
   ADS
========================= */

app.get("/api/ads", (req, res) => {
  res.json({
    ads: db.ads.filter(a => a.active !== false)
  });
});

/* =========================
   WISHLIST
========================= */

app.post("/api/wishlist/:id", auth, (req, res) => {
  const exists = db.wishlist.find(
    w => w.userId === req.user.id && w.courseId === req.params.id
  );

  if (!exists) {
    db.wishlist.push({
      id: id(),
      userId: req.user.id,
      courseId: req.params.id,
      createdAt: new Date().toISOString()
    });
    saveDB();
  }

  res.json({ ok: true });
});

/* =========================
   NOTIFICATIONS
========================= */

app.get("/api/notifications", auth, (req, res) => {
  const notifications = db.notifications.filter(
    n => n.userId === req.user.id
  );

  res.json({ notifications });
});

/* =========================
   ADMIN USERS
========================= */

app.get("/api/admin/users", auth, adminOnly, (req, res) => {
  res.json({
    users: db.users.map(cleanUser)
  });
});

app.post("/api/admin/users/:id/approve", auth, adminOnly, (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  user.status = "approved";

  db.notifications.push({
    id: id(),
    userId: user.id,
    title: "حساب تایید شو",
    message: "ستاسو حساب تایید شو او اوس Login کولی شئ.",
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDB();

  res.json({
    ok: true,
    user: cleanUser(user)
  });
});

app.post("/api/admin/users/:id/block", auth, adminOnly, (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  user.status = "blocked";
  saveDB();

  res.json({
    ok: true,
    user: cleanUser(user)
  });
});

/* =========================
   ADMIN COURSE ADD
========================= */

app.post("/api/admin/courses", auth, adminOnly, (req, res) => {
  const course = {
    id: id(),
    title: req.body.title || "نوی کورس",
    faculty: req.body.faculty || "",
    semester: Number(req.body.semester) || 1,
    teacher: req.body.teacher || "",
    price: Number(req.body.price) || 0,
    description: req.body.description || "",
    videos: [],
    createdAt: new Date().toISOString()
  };

  db.courses.push(course);
  saveDB();

  res.json({
    ok: true,
    course
  });
});

/* =========================
   ADMIN BOOK ADD
========================= */

app.post("/api/admin/books", auth, adminOnly, (req, res) => {
  const book = {
    id: id(),
    title: req.body.title || "نوی کتاب",
    author: req.body.author || "",
    faculty: req.body.faculty || "",
    semester: Number(req.body.semester) || 1,
    description: req.body.description || "",
    createdAt: new Date().toISOString()
  };

  db.books.push(book);
  saveDB();

  res.json({
    ok: true,
    book
  });
});

/* =========================
   ADMIN ADS
========================= */

app.post("/api/admin/ads", auth, adminOnly, (req, res) => {
  const ad = {
    id: id(),
    title: req.body.title || "",
    link: req.body.link || "",
    image: req.body.image || "",
    active: req.body.active !== false,
    createdAt: new Date().toISOString()
  };

  db.ads.push(ad);
  saveDB();

  res.json({
    ok: true,
    ad
  });
});

/* =========================
   404 API
========================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path
  });
});

/* =========================
   SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zdakrhyal backend running on port ${PORT}`);
});

const express = require("express");
const Database = require("better-sqlite3");
const session = require("express-session");
const path = require("path");

const app = express();
const db = new Database("data.db");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "healthcare-secret",
    resave: false,
    saveUninitialized: false
  })
);

/* ---------- DATABASE ---------- */

db.prepare(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    disease TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor TEXT NOT NULL,
    date TEXT NOT NULL,
    reason TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )
`).run();

/* ---------- AUTH ---------- */

app.post("/login", (req, res) => {
  const { userId, password } = req.body;

  if (userId === "Kaustubh" && password === "Hina") {
    req.session.loggedIn = true;
    res.redirect("/");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

function auth(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect("/login.html");
}

app.get("/", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ---------- PATIENT APIs ---------- */

app.get("/patients", auth, (req, res) => {
  const q = req.query.q || "";
  const patients = db
    .prepare("SELECT * FROM patients WHERE name LIKE ? OR id LIKE ?")
    .all(`%${q}%`, `%${q}%`);
  res.json(patients);
});

app.post("/patients", auth, (req, res) => {
  const { name, age, disease } = req.body;

  if (!name || !age || !disease) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.prepare(
    "INSERT INTO patients (name, age, disease) VALUES (?, ?, ?)"
  ).run(name, age, disease);

  res.json({ message: "Patient added" });
});

app.put("/patients/:id", auth, (req, res) => {
  const { name, age, disease } = req.body;

  db.prepare(
    "UPDATE patients SET name=?, age=?, disease=? WHERE id=?"
  ).run(name, age, disease, req.params.id);

  res.json({ message: "Patient updated" });
});

app.delete("/patients/:id", auth, (req, res) => {
  db.prepare("DELETE FROM patients WHERE id=?").run(req.params.id);
  res.json({ message: "Patient deleted" });
});

/* ---------- APPOINTMENTS ---------- */

app.get("/appointments", auth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, p.name AS patient, a.doctor, a.date, a.reason
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
  `).all();

  res.json(rows);
});

app.post("/appointments", auth, (req, res) => {
  const { patient_id, doctor, date, reason } = req.body;

  if (!patient_id || !doctor || !date) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.prepare(
    "INSERT INTO appointments (patient_id, doctor, date, reason) VALUES (?, ?, ?, ?)"
  ).run(patient_id, doctor, date, reason);

  res.json({ message: "Appointment added" });
});

app.put("/appointments/:id", auth, (req, res) => {
  const { doctor, date, reason } = req.body;

  db.prepare(
    "UPDATE appointments SET doctor=?, date=?, reason=? WHERE id=?"
  ).run(doctor, date, reason, req.params.id);

  res.json({ message: "Appointment updated" });
});

app.delete("/appointments/:id", auth, (req, res) => {
  db.prepare("DELETE FROM appointments WHERE id=?").run(req.params.id);
  res.json({ message: "Appointment deleted" });
});

/* ---------- START ---------- */

app.listen(3000, () => {
  console.log("✅ Healthcare Portal running at http://localhost:3000");
});

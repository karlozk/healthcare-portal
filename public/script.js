let patientsVisible = false;
let appointmentsVisible = false;

/* ---------------- HELPERS ---------------- */

async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.redirected) {
    window.location.href = "/login.html";
    return null;
  }
  return res;
}

/* ---------------- TOGGLES ---------------- */

function togglePatients() {
  patientsVisible = !patientsVisible;
  const list = document.getElementById("patients");
  list.style.display = patientsVisible ? "block" : "none";
  if (patientsVisible) loadPatients();
}

function toggleAppointments() {
  appointmentsVisible = !appointmentsVisible;
  const list = document.getElementById("appointments");
  list.style.display = appointmentsVisible ? "block" : "none";
  if (appointmentsVisible) loadAppointments();
}

/* ---------------- PATIENTS ---------------- */

async function loadPatients() {
  const res = await safeFetch("/patients");
  if (!res) return;

  const data = await res.json();

  const list = document.getElementById("patients");
  const select = document.getElementById("patientSelect");

  list.innerHTML = "";
  select.innerHTML = `<option value="">Select Patient</option>`;

  data.forEach(p => {
    list.innerHTML += `
      <li>
        <b>ID:</b> ${p.id} | ${p.name} (${p.age}) - ${p.disease}
        <button onclick="deletePatient(${p.id})">🗑</button>
      </li>`;
    select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
  });
}

async function addPatient() {
  const name = document.getElementById("p_name").value.trim();
  const age = document.getElementById("p_age").value.trim();
  const disease = document.getElementById("p_disease").value.trim();

  if (!name || !age || !disease) {
    alert("All fields required");
    return;
  }

  const res = await safeFetch("/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age, disease })
  });

  if (!res) return;

  document.getElementById("p_name").value = "";
  document.getElementById("p_age").value = "";
  document.getElementById("p_disease").value = "";

  if (patientsVisible) loadPatients();
}

function deletePatient(id) {
  if (!confirm("Delete patient?")) return;
  safeFetch(`/patients/${id}`, { method: "DELETE" })
    .then(() => loadPatients());
}

/* ---------------- APPOINTMENTS ---------------- */

async function loadAppointments() {
  const res = await safeFetch("/appointments");
  if (!res) return;

  const data = await res.json();
  const list = document.getElementById("appointments");
  list.innerHTML = "";

  data.forEach(a => {
    list.innerHTML += `
      <li>
        ${a.patient} | Dr. ${a.doctor} | ${a.date}
        <button onclick="deleteAppointment(${a.id})">🗑</button>
      </li>`;
  });
}

function addAppointment() {
  const patient_id = document.getElementById("patientSelect").value;
  const doctor = document.getElementById("doctor").value;
  const date = document.getElementById("date").value;
  const reason = document.getElementById("reason").value;

  if (!patient_id || !doctor || !date) {
    alert("All fields required");
    return;
  }

  safeFetch("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id, doctor, date, reason })
  }).then(() => {
    document.getElementById("patientSelect").selectedIndex = 0;
    document.getElementById("doctor").selectedIndex = 0;
    document.getElementById("date").value = "";
    document.getElementById("reason").value = "";
    if (appointmentsVisible) loadAppointments();
  });
}

function deleteAppointment(id) {
  if (!confirm("Delete appointment?")) return;
  safeFetch(`/appointments/${id}`, { method: "DELETE" })
    .then(() => loadAppointments());
}

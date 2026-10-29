const $ = (s) => document.querySelector(s),
  money = (n) => `₦${Number(n || 0).toLocaleString()}`,
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
const tabs = [
  ["home", "⌂", "Home"],
  ["academics", "▣", "Academics"],
  ["finance", "◉", "Finance"],
  ["hostel", "⌂", "Hostel"],
  ["hustle", "⚡", "Hustle"],
  ["relationship", "♡", "Relationship"],
  ["sports", "◉", "Sports"],
  ["privacy", "⚙", "Privacy"],
  ["about", "ⓘ", "About"],
];
let active = "home",
  sliderTimers = [];
function toast(t) {
  const x = $("#toast");
  x.textContent = t;
  x.classList.add("show");
  setTimeout(() => x.classList.remove("show"), 2200);
}
function save() {
  Store.save();
  render();
}
function populateSchools() {
  const o = UNIVERSITIES.map((x) => `<option>${esc(x)}</option>`).join("");
  $("#university").innerHTML = o;
  $("#setUniversity").innerHTML = o;
}
function openModal(html) {
  $("#modalBody").innerHTML = html;
  $("#modal").hidden = false;
}
function receipt(e) {
  openModal(
    `<div class="receipt"><img src="img/kobosense-logo.png" width="80" alt=""><h2>KoboSense Digital Receipt</h2><p>Reference: <b>${e.id}</b></p><p>Description: <b>${esc(e.desc)}</b></p><p>Amount: <b>${money(e.amount)}</b></p><p>Date: <b>${esc(e.date)}</b></p><button class="primary" onclick="window.print()">Print receipt</button></div>`,
  );
}
function showTab(id) {
  active = id;
  document.querySelectorAll(".page").forEach((x) => (x.hidden = x.id !== id));
  document
    .querySelectorAll("#nav button")
    .forEach((x) => x.classList.toggle("active", x.dataset.tab === id));
  renderDynamic();
  scrollTo({ top: 0, behavior: "smooth" });
}
function renderHeader() {
  const m = mode();
  $("#profileName").textContent = state.profile.name;
  $("#profileInfo").textContent =
    `${state.profile.level} • ${state.profile.university}`;
  $("#avatar").textContent =
    state.profile.name
      .split(/\s+/)
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "KS";
  $("#modeName").textContent = `● ${m[0].toUpperCase()}`;
  $("#modeText").textContent =
    `${Math.max(0, Math.min(100, m[2])).toFixed(0)}% • ${m[1]}`;
  $("#health").style.color = m[3];
  $("#healthFill").style.width = `${Math.max(0, Math.min(100, m[2]))}%`;
}
function renderHome() {
  const recent = state.expenses.slice(-4).reverse();
  $("#home").innerHTML =
    `<div class="page-title"><div><small>GOOD TO SEE YOU</small><h1>${esc(state.profile.name)}, keep moving smart.</h1><p>${esc(state.profile.university)}</p></div></div><div class="metric-grid"><div class="metric">CURRENT BALANCE<b>${money(state.profile.balance)}</b></div><div class="metric">MONTHLY ALLOWANCE<b>${money(state.profile.allowance)}</b></div><div class="metric">TOTAL SPENT<b>${money(totalSpent())}</b></div></div><div class="two-col"><div><div class="section"><div class="split"><h2>Recent spendings</h2><button class="primary" onclick="showTab('finance')">+ Log expense</button></div>${recent.length ? recent.map((e) => `<div class="item"><span><b>${esc(e.desc)}</b><small>${esc(e.date)}</small></span><span class="item-actions"><b>${money(e.amount)}</b><button class="ghost" onclick="receiptById('${e.id}')">Receipt</button><button class="mini-edit" onclick="editExpense(${e.id})">Edit</button><button class="mini-danger" onclick="deleteExpense(${e.id})">Delete</button></span></div>`).join("") : `<p>No spending yet. Log your first expense in Finance.</p>`}</div><div class="section"><h2>Smart pockets</h2><div class="chips">${pockets()
      .map((p) => `<span class="chip">${p.name} • ${money(p.amount)}</span>`)
      .join(
        "",
      )}</div></div></div><aside class="section"><h2>Notifications</h2>${
      (window.cloudAnnouncements || []).length || state.notifications.length
        ? [
            ...(window.cloudAnnouncements || []).map(
              (n) =>
                `<div class="item"><span><b>${esc(n.title)}</b><small>${esc(n.body)}</small></span></div>`,
            ),
            ...state.notifications
              .slice(-5)
              .reverse()
              .map((n) => `<div class="item">${esc(n)}</div>`),
          ].join("")
        : `<p>KoboSense is ready. Your alerts will appear here.</p>`
    }</aside></div>`;
}
window.receiptById = (id) => {
  const e = state.expenses.find((x) => String(x.id) === String(id));
  if (e) receipt(e);
};
function renderAcademics() {
  $("#cgpa").textContent = `CGPA ${cgpa()}`;
  $("#courseList").innerHTML = state.courses.length
    ? state.courses
        .map(
          (c) =>
            `<div class="item"><span><b>${esc(c.code)}</b><small>${c.unit} units • CA ${c.ca}/30 • Attendance ${c.att}%</small></span><span>Grade ${["F", "E", "D", "C", "B", "A"][c.grade]} <button class="ghost" onclick="removeCourse(${c.id})">Remove</button></span></div>`,
        )
        .join("")
    : `<p>No courses yet.</p>`;
  $("#riskPin").style.left = `calc(${Math.min(98, riskScore())}% - 2px)`;
  $("#timetableList").innerHTML = renderTimetableGroups();
}
window.removeCourse = (id) => {
  state.courses = state.courses.filter((x) => x.id !== id);
  save();
};
function renderFinance() {
  const low = mode()[2] < 50;
  $("#finance").innerHTML =
    `<div class="page-title"><div><small>FINANCE CONTROL</small><h1>Your money, arranged properly.</h1><p>Smart pockets, spendings, receipts and emergency deductions.</p></div></div>${low ? `<div class="alert"><b>Sapa alert</b><div>Your balance is below 50% of your monthly allowance. Protect feeding, academics and essentials.</div></div>` : ""}<div class="metric-grid"><div class="metric">AVAILABLE<b>${money(state.profile.balance)}</b></div><div class="metric">ALLOWANCE<b>${money(state.profile.allowance)}</b></div><div class="metric">SPENT<b>${money(totalSpent())}</b></div></div><div class="two-col"><div><div class="section"><h2>Smart pocket allocation</h2><div class="pocket-grid">${pockets()
      .map(
        (p) =>
          `<div class="pocket"><div class="split"><b>${p.name}</b><span>${money(p.amount)}</span></div><i style="width:${p.pct}%"></i><small>${p.pct}% allocation</small></div>`,
      )
      .join("")}</div></div><div class="section"><h2>Spending history</h2>${
      state.expenses.length
        ? state.expenses
            .slice()
            .reverse()
            .map(
              (e) =>
                `<div class="item"><span><b>${esc(e.desc)}</b><small>${esc(e.date)}</small></span><span class="item-actions"><b>${money(e.amount)}</b><button class="ghost" onclick="receiptById('${e.id}')">Receipt</button><button class="mini-edit" onclick="editExpense(${e.id})">Edit</button><button class="mini-danger" onclick="deleteExpense(${e.id})">Delete</button></span></div>`,
            )
            .join("")
        : "<p>No spending yet.</p>"
    }</div></div><aside><div class="section"><h2>Log expense</h2><form id="expenseForm" class="stack"><input id="expenseDesc" placeholder="What did you spend on?" required><input id="expenseAmount" type="number" min="0.01" placeholder="Amount ₦" required><button class="primary">Log spending</button></form></div><div class="section"><h2>Emergency deduction</h2><form id="emergencyForm" class="stack"><input id="emergencyDesc" placeholder="Reason" required><input id="emergencyAmount" type="number" min="0.01" placeholder="Amount ₦" required><button class="danger">Process emergency</button></form></div></aside></div>`;
  $("#expenseForm").onsubmit = (e) => addExpense(e, false);
  $("#emergencyForm").onsubmit = (e) => addExpense(e, true);
}
function addExpense(e, em) {
  e.preventDefault();
  const d = $(em ? "#emergencyDesc" : "#expenseDesc").value.trim(),
    a = Number($(em ? "#emergencyAmount" : "#expenseAmount").value);
  if (a <= 0 || a > state.profile.balance)
    return toast("Check the amount and available balance.");
  const x = {
    id: Date.now(),
    desc: em ? `Emergency: ${d}` : d,
    amount: a,
    date: new Date().toLocaleString(),
    emergency: em,
  };
  state.profile.balance -= a;
  state.expenses.push(x);
  state.notifications.push(`${x.desc}: ${money(a)} recorded.`);
  Store.save();
  render();
  receipt(x);
}
function renderHostel() {
  $("#roommateList").innerHTML = ["You", ...state.roommates]
    .map((n, i) =>
      i === 0
        ? `<span class="chip">You</span>`
        : `<span class="chip">${esc(n)} <button class="mini-danger" onclick="removeRoommate(${i - 1})">×</button></span>`,
    )
    .join("");
  $("#utilityResult").innerHTML = state.utility
    ? `<div class="item"><b>${esc(state.utility.summary)}</b></div>`
    : "<p>No agreement calculated yet.</p>";
  $("#dutyList").innerHTML = duties()
    .map(
      (x) =>
        `<div class="item"><b>${x.duty}</b><span>${esc(x.name)}</span></div>`,
    )
    .join("");
}
function renderHustle() {
  const ideas = [
    "Assignment typing",
    "Device support",
    "Design & flyers",
    "Tutoring",
    "Social media help",
    "Campus delivery",
  ];
  const total = hustleTotal(),
    pct = state.hustle.target
      ? Math.min(100, (total / state.hustle.target) * 100)
      : 0;
  $("#hustle").innerHTML =
    `<div class="page-title"><div><small>SIDE-HUSTLE LAB</small><h1>Turn a skill into extra campus cash.</h1><p>Hustle income stays separate from allowance.</p></div></div><div class="two-col"><div><div class="section"><h2>Pick a hustle</h2><div class="idea-grid">${ideas.map((x) => `<button class="idea" onclick="pickHustle('${x}')"><b>${x}</b><small>${state.hustle.selected === x ? "Selected" : "Tap to select"}</small></button>`).join("")}</div></div><div class="section"><h2>Record earnings</h2><form id="earningForm" class="form-row"><input id="earningJob" placeholder="Job / client" required><input id="earningAmount" type="number" min="0.01" placeholder="Amount ₦" required><button class="primary">Record</button></form>${state.hustle.earnings.map((e, i) => `<div class="item"><b>${esc(e.job)}</b><span class="item-actions">${money(e.amount)} <button class="mini-edit" onclick="editEarning(${i})">Edit</button><button class="mini-danger" onclick="removeEarning(${i})">Delete</button></span></div>`).join("") || "<p>No earnings yet.</p>"}</div></div><aside><div class="section"><h2>Hustle goal</h2><div class="risk" style="background:#1b1b1b"><i style="left:0;width:${pct}%;height:100%;top:0;background:var(--gold)"></i></div><p>${money(total)} of ${money(state.hustle.target)}</p><form id="goalForm" class="stack"><input id="goalAmount" type="number" min="0" placeholder="Target ₦"><button class="ghost">Set target</button></form></div><div class="section"><h2>Quick planner</h2><form id="planForm" class="stack"><textarea id="hustlePlan" placeholder="How will this fit around lectures?">${esc(state.hustle.plan)}</textarea><button class="primary">Save plan</button></form></div><div class="section"><h2>Trek-to-Save</h2><form id="trekForm" class="form-row"><input id="trekKm" type="number" min="0" placeholder="Distance km"><button class="ghost">Calculate</button></form></div></aside></div>`;
  $("#earningForm").onsubmit = (e) => {
    e.preventDefault();
    state.hustle.earnings.push({
      job: $("#earningJob").value,
      amount: Number($("#earningAmount").value),
    });
    save();
  };
  $("#goalForm").onsubmit = (e) => {
    e.preventDefault();
    state.hustle.target = Number($("#goalAmount").value);
    save();
  };
  $("#planForm").onsubmit = (e) => {
    e.preventDefault();
    state.hustle.plan = $("#hustlePlan").value;
    save();
  };
  $("#trekForm").onsubmit = (e) => {
    e.preventDefault();
    toast(
      `Estimated transport saving: ${money(Number($("#trekKm").value) * 200)}`,
    );
  };
}
window.pickHustle = (x) => {
  state.hustle.selected = x;
  save();
};
function renderRelationship() {
  const topics = [
    ["Communication", "Talk clearly without insults or threats."],
    ["Money boundaries", "Care without destroying feeding or school money."],
    ["Consent & respect", "Respect decisions and personal boundaries."],
    ["Balance", "Protect school, sleep, safety and wellbeing."],
  ];
  $("#relationship").innerHTML =
    `<div class="page-title"><div><small>RELATIONSHIP & WELLBEING</small><h1>Love life without losing yourself.</h1><p>Communication, boundaries, respect and health guidance.</p></div></div><div class="two-col"><div><div class="section"><h2>Ask for guidance</h2><form id="relationshipForm" class="stack"><textarea id="relationshipText" placeholder="What is happening?" required></textarea><label><input id="relationshipUrgent" type="checkbox"> Urgent guidance</label><button class="primary">Submit privately</button></form></div><div class="section"><h2>Quick guidance topics</h2><div class="topic-grid">${topics.map((t) => `<button class="topic" onclick="openModal('<h2>${t[0]}</h2><p>${t[1]}</p>')"><b>${t[0]}</b><small>${t[1]}</small></button>`).join("")}</div></div><div class="section"><h2>STI Knowledge Centre</h2><p>Detailed educational guidance on testing, prevention and care.</p><button class="primary" onclick="openModal(STI_GUIDE)">Read comprehensive STI guide</button></div></div><aside class="section"><h2>Guidance thread</h2>${state.relationship.map((x) => `<div class="item"><span><b>${esc(x.text)}</b><small>${esc(x.response)}</small></span></div>`).join("") || "<p>No question yet.</p>"}</aside></div>`;
  $("#relationshipForm").onsubmit = (e) => {
    e.preventDefault();
    const u = $("#relationshipUrgent").checked;
    state.relationship.push({
      text: $("#relationshipText").value,
      response: u
        ? "Protect your safety, wellbeing and essentials first. Contact a trusted person or appropriate professional support if needed."
        : "Communicate clearly, protect your boundaries and avoid decisions that damage your studies, safety or finances.",
    });
    save();
  };
}
function renderSports() {
  const interests = [
    "Football",
    "Basketball",
    "Athletics",
    "Tennis",
    "Volleyball",
    "Swimming",
    "Cricket",
  ];
  $("#sports").innerHTML =
    `<div class="page-title"><div><small>SPORTS & FITNESS HUB</small><h1>Follow the game. Move your body.</h1><p>Sports interests, fitness guidance, club selection and gallery.</p></div></div><div class="two-col"><div><div class="section"><h2>Your sports</h2><div class="chips">${interests.map((x) => `<button class="chip" onclick="toggleSport('${x}')">${state.sports.interests.includes(x) ? "✓ " : ""}${x}</button>`).join("")}</div></div><div class="section"><h2>World club finder</h2><input id="clubSearch" placeholder="Search club or enter any club name"><div id="clubResults"></div><p>Selected club: <b>${esc(state.sports.club || "None")}</b></p></div><div class="section"><div class="slider" data-slider="sports"></div></div></div><aside><div class="section"><h2>Why exercise matters</h2><p>Regular movement supports physical and mental wellbeing, brain health, sleep and long-term health. Walking, cycling, sports and active recreation all count.</p></div><div class="section"><h2>Campus activity planner</h2><div class="activity-grid">${["Walk / run", "Football", "Workout", "Stretch"].map((x) => `<button class="activity" onclick="addActivity('${x}')">${x}</button>`).join("")}</div></div></aside></div>`;
  const s = $("#clubSearch");
  s.oninput = () => {
    const q = s.value.trim().toLowerCase(),
      r = CLUBS.filter((x) => x.toLowerCase().includes(q)).slice(0, 8);
    $("#clubResults").innerHTML = (r.length ? r : [s.value])
      .filter(Boolean)
      .map(
        (x) =>
          `<button class="ghost" onclick="selectClub('${esc(x)}')">${esc(x)}</button>`,
      )
      .join("");
  };
}
window.toggleSport = (x) => {
  state.sports.interests.includes(x)
    ? (state.sports.interests = state.sports.interests.filter((y) => y !== x))
    : state.sports.interests.push(x);
  save();
};
window.selectClub = (x) => {
  state.sports.club = x;
  save();
};
function renderStatic() {
  $("#privacy").innerHTML =
    `<div class="page-title"><div><small>PRIVACY, SAFETY & LEGAL</small><h1>Privacy Policy & Safety Standards</h1></div></div><h2>Purpose</h2><p>KoboSense is a student advisory and planning tool. It is not a bank, medical provider, emergency service or gambling product.</p><h2>Information handled</h2><p>KoboSense stores the information you enter for profile, budgeting, academics, hostel, hustle, relationship and sports features in your browser on this device. No payment-card information is requested.</p><h2>Finance</h2><p>Balances, pockets and receipts are planning records created from user entries. They are not bank balances or bank-issued proof of payment.</p><h2>Health and relationships</h2><p>Health and STI content is educational and does not diagnose or replace professional care. Relationship guidance promotes consent, dignity, safety and non-violence.</p><h2>Safety</h2><p>Do not use KoboSense for fraud, impersonation, harassment, threats, exploitation, violence or unauthorized access.</p><h2>Your control</h2><p>You can edit profile values in Settings and reset all saved local data from the same page.</p><h2>Security and future services</h2><p>If cloud accounts, analytics, payments, advertising, AI or third-party services are added later, this policy must be updated to accurately explain real data flows, retention, rights and service providers.</p>`;
  $("#about").innerHTML =
    `<div class="page-title"><div><small>ABOUT KOBOSENSE • TEAM BLAZE</small><h1>Student life is already hard. Your tools shouldn't make it harder.</h1></div></div><img src="img/kobosense-logo.png" alt="KoboSense" style="width:min(280px,100%);border-radius:24px"><h2>Why KoboSense exists</h2><p>KoboSense brings money decisions, academics, hostel life, side hustles, relationships, wellbeing and sports into one practical student experience.</p><h2>Engineered by Team Blaze</h2><p>Team Blaze focuses on useful digital experiences that feel modern, clear and practical.</p><h2>Keep going</h2><p>Do not give up because your beginning looks small. Keep learning, protect your health, correct mistakes and continue building. Your pace is not your final destination.</p><button class="primary" onclick="toast('One solid step at a time. Keep going 🔥')">Give me motivation</button>`;
}
function sliders() {
  sliderTimers.forEach(clearInterval);
  sliderTimers = [];
  document.querySelectorAll("[data-slider]").forEach((el) => {
    const type = el.dataset.slider,
      n = type === "academics" ? 3 : 10;
    let i = 1;
    el.innerHTML = "";
    const draw = () => {
      const name = type === "academics" ? "academic" : "sport",
        src = `img/${name}-${i}.jpg`,
        img = new Image();
      img.onload = () => {
        el.classList.remove("image-missing");
        el.style.backgroundImage = `url('${src}')`;
      };
      img.onerror = () => {
        el.classList.add("image-missing");
        el.style.backgroundImage = "none";
      };
      img.src = src;
    };
    draw();
    sliderTimers.push(
      setInterval(() => {
        i = (i % n) + 1;
        draw();
      }, 4000),
    );
  });
}
window.deleteExpense = (id) => {
  const e = state.expenses.find((x) => x.id === id);
  if (
    !e ||
    !confirm("Delete this expense and restore the amount to your balance?")
  )
    return;
  state.profile.balance += Number(e.amount);
  state.expenses = state.expenses.filter((x) => x.id !== id);
  state.notifications.push(`Deleted expense: ${e.desc}. Balance restored.`);
  save();
};
window.editExpense = (id) => {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return;
  const d = prompt("Expense description", e.desc);
  if (d === null) return;
  const a = Number(prompt("Expense amount", e.amount));
  if (!(a > 0)) return toast("Enter a valid amount.");
  const available = state.profile.balance + Number(e.amount);
  if (a > available) return toast("Amount exceeds available balance.");
  state.profile.balance = available - a;
  e.desc = d.trim() || e.desc;
  e.amount = a;
  save();
};
window.removeRoommate = (i) => {
  state.roommates.splice(i, 1);
  state.utility = null;
  save();
};
window.removeEarning = (i) => {
  state.hustle.earnings.splice(i, 1);
  save();
};
window.editEarning = (i) => {
  const e = state.hustle.earnings[i],
    a = Number(prompt("Earning amount", e.amount));
  if (!(a >= 0)) return;
  e.amount = a;
  const j = prompt("Job / client", e.job);
  if (j !== null) e.job = j.trim() || e.job;
  save();
};
window.removeTimetable = (id) => {
  state.timetable = state.timetable.filter((x) => x.id !== id);
  save();
};
function renderTimetableGroups() {
  if (!state.timetable.length)
    return "<p>No study blocks yet. Add courses and generate a smart plan.</p>";
  const order = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    groups = {};
  state.timetable.forEach((t) => (groups[t.day] ??= []).push(t));
  return Object.keys(groups)
    .sort((a, b) => {
      const ai = order.indexOf(a),
        bi = order.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b);
    })
    .map(
      (day) =>
        `<div class="schedule-day"><h3>${esc(day)}</h3>${groups[day]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(
            (t) =>
              `<div class="item"><span><b>${esc(t.course)}</b><small>${esc(t.time)} • ${t.length || 60} minutes${t.generated ? " • Smart plan" : " • Personal block"}</small></span><button class="mini-danger" onclick="removeTimetable(${t.id})">Remove</button></div>`,
          )
          .join("")}</div>`,
    )
    .join("");
}
function showCustomContributionForm(bill) {
  const people = ["You", ...state.roommates];
  $("#utilityResult").innerHTML =
    `<div class="custom-grid"><p>Enter each agreed contribution. The total must equal ${money(bill)}.</p>${people.map((n, i) => `<label class="custom-person"><span>${esc(n)}</span><input class="customAmount" data-name="${esc(n)}" type="number" min="0" step="0.01" placeholder="Amount ₦"></label>`).join("")}<div id="customBalance" class="validation"></div><button class="primary" type="button" onclick="confirmCustomUtility(${bill})">Confirm custom agreement</button></div>`;
}
window.confirmCustomUtility = (bill) => {
  const values = [...document.querySelectorAll(".customAmount")].map((x) => ({
      name: x.dataset.name,
      amount: Number(x.value || 0),
    })),
    total = values.reduce((a, x) => a + x.amount, 0),
    remaining = bill - total;
  $("#customBalance").textContent =
    `Total: ${money(total)} • Remaining: ${money(remaining)}`;
  if (Math.abs(remaining) > 0.009)
    return toast("Contributions must equal the bill exactly.");
  state.utility = {
    bill,
    method: "custom",
    contributions: values,
    summary: `Custom split: ${values.map((x) => `${x.name} ${money(x.amount)}`).join(", ")}`,
  };
  save();
};
window.addActivity = (x) => {
  state.sports.activities ??= [];
  state.sports.activities.push({
    id: Date.now(),
    name: x,
    date: new Date().toLocaleDateString(),
  });
  toast(`${x} saved to your activity plan.`);
  Store.save();
};
function settings() {
  $("#setName").value = state.profile.name;
  $("#setLevel").value = state.profile.level;
  $("#setUniversity").value = state.profile.university;
  $("#setBalance").value = state.profile.balance;
  $("#setAllowance").value = state.profile.allowance;
}
function renderDynamic() {
  if ($("#app").hidden) return;
  renderHeader();
  renderHome();
  renderAcademics();
  renderFinance();
  renderHostel();
  renderHustle();
  renderRelationship();
  renderSports();
  settings();
  sliders();
}
function render() {
  const ready = !!state.profile.name;
  $("#onboarding").hidden = ready;
  $("#app").hidden = !ready;
  if (ready) {
    $("#nav").innerHTML = tabs
      .map(
        (t) =>
          `<button data-tab="${t[0]}" class="${active === t[0] ? "active" : ""}">${t[1]} ${t[2]}</button>`,
      )
      .join("");
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
    renderStatic();
    showTab(active);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  populateSchools();
  state = Object.assign(structuredClone(DEFAULT_STATE), Store.load() || {});
  state.profile = Object.assign({}, DEFAULT_STATE.profile, state.profile || {});
  state.hustle = Object.assign({}, DEFAULT_STATE.hustle, state.hustle || {});
  state.sports = Object.assign({}, DEFAULT_STATE.sports, state.sports || {});
  state.expenses = (state.expenses || []).map((x, i) => ({
    ...x,
    id: x.id || Date.now() + i,
  }));
  state.timetable = (state.timetable || []).map((x, i) => ({
    ...x,
    id: x.id || Date.now() + 100 + i,
    length: x.length || 60,
  }));
  state.hustle.earnings = (state.hustle.earnings || []).map((x, i) => ({
    ...x,
    id: x.id || Date.now() + 200 + i,
  }));
  render();
  $("#onboardingForm").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#fullName").value.trim(),
      balance = Number($("#balance").value),
      allowance = Number($("#allowance").value);
    if (!name || balance < 0 || allowance <= 0)
      return toast("Check your name, balance and monthly allowance.");
    state.profile = {
      name,
      level: $("#schoolLevel").value,
      university: $("#university").value,
      balance,
      allowance,
    };
    save();
  };
  $("#courseForm").onsubmit = (e) => {
    e.preventDefault();
    const code = $("#courseCode").value.trim().toUpperCase(),
      unit = Number($("#courseUnit").value),
      grade = Number($("#courseGrade").value),
      ca = Number($("#courseCA").value),
      att = Number($("#courseAtt").value);
    if (
      !code ||
      unit < 1 ||
      unit > 12 ||
      ca < 0 ||
      ca > 30 ||
      att < 0 ||
      att > 100
    )
      return toast("Check course code, units, CA and attendance.");
    state.courses.push({ id: Date.now(), code, unit, grade, ca, att });
    e.target.reset();
    save();
  };
  $("#resetSemester").onclick = () => {
    if (confirm("Reset courses and timetable?")) {
      state.courses = [];
      state.timetable = [];
      save();
    }
  };
  $("#generateTimetable").onclick = () => {
    if (!state.courses.length) return toast("Add at least one course first.");
    if (
      state.timetable.length &&
      !confirm("Replace the current timetable with a new smart plan?")
    )
      return;
    state.timetable = generateStudyPlan(
      $("#studyStart").value,
      Number($("#sessionLength").value),
      Number($("#studyDays").value),
    );
    state.notifications.push("A new smart study timetable was generated.");
    save();
  };
  $("#timetableForm").onsubmit = (e) => {
    e.preventDefault();
    state.timetable.push({
      id: Date.now(),
      course: $("#studyCourse").value.trim(),
      day: $("#studyDay").value,
      time: $("#studyTime").value,
      length: 60,
      generated: false,
    });
    e.target.reset();
    save();
  };
  $("#roommateForm").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#roommateName").value.trim();
    if (!name) return toast("Enter a roommate name.");
    if (state.roommates.some((x) => x.toLowerCase() === name.toLowerCase()))
      return toast("That roommate is already listed.");
    state.roommates.push(name);
    e.target.reset();
    save();
  };
  $("#utilityForm").onsubmit = (e) => {
    e.preventDefault();
    const b = Number($("#utilityBill").value),
      people = state.roommates.length + 1,
      method = $("#utilityMethod").value;
    if (!(b > 0)) return toast("Enter a valid utility bill.");
    if (method === "equal") {
      state.utility = {
        bill: b,
        method,
        summary: `${money(b)} split among ${people} people = ${money(b / people)} each`,
        contributions: [],
      };
      save();
    } else {
      showCustomContributionForm(b);
    }
  };
  $("#copyUtility").onclick = async () => {
    if (!state.utility) return toast("Calculate an agreement first.");
    try {
      await navigator.clipboard.writeText(state.utility.summary);
      toast("Agreement copied.");
    } catch {
      openModal(`<p>${esc(state.utility.summary)}</p>`);
    }
  };
  $("#rotateDuties").onclick = () => {
    state.dutyOffset++;
    save();
  };
  $("#settingsForm").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#setName").value.trim(),
      balance = Number($("#setBalance").value),
      allowance = Number($("#setAllowance").value);
    if (!name || balance < 0 || allowance <= 0)
      return toast("Check name, balance and allowance.");
    state.profile = {
      name,
      level: $("#setLevel").value,
      university: $("#setUniversity").value,
      balance,
      allowance,
    };
    save();
    toast("Settings saved.");
  };
  $("#resetApp").onclick = () => {
    if (confirm("Delete all locally saved KoboSense data?")) Store.reset();
  };
  $("#closeModal").onclick = () => ($("#modal").hidden = true);
});

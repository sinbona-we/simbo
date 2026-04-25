const STORAGE_KEY = "simbastudy_v1";

const defaultState = {
  profile: { name: "Student", level: "high-school" },
  schedule: [],
  planner: [],
  notes: [],
  flashcards: [],
  habits: [],
  journal: [],
  visions: [],
  topicModules: [],
  quizStats: { taken: 0, correct: 0 },
  focus: { sessions: 0, seconds: 0 },
  streak: { days: 0, lastMarked: "" }
};

let state = loadState();
let timer = null;
let timeLeft = 25 * 60;
let quizCurrent = null;

const quotes = [
  "Small steps every day create unstoppable academic momentum.",
  "Discipline is your bridge between goals and grades.",
  "Every focused session is a vote for your future self.",
  "Consistency beats intensity when exams arrive.",
  "Mastery begins when you stop postponing your potential."
];

const questionBank = [
  { q: "What is active recall?", o: ["Passive rereading", "Testing memory retrieval", "Skipping difficult topics"], a: 1, e: "Active recall is retrieving information without looking." },
  { q: "Pomodoro standard focus duration?", o: ["10 mins", "25 mins", "60 mins"], a: 1, e: "Classic Pomodoro uses 25-minute focus blocks." },
  { q: "Best way to improve retention?", o: ["Cram once", "Spaced repetition", "Avoid testing"], a: 1, e: "Spacing repeats over time improves long-term memory." }
];

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function byId(id) {
  return document.getElementById(id);
}

function setSection(sectionId) {
  document.querySelectorAll(".section").forEach((el) => el.classList.toggle("active", el.id === sectionId));
  document.querySelectorAll(".nav-link").forEach((btn) => btn.classList.toggle("active", btn.dataset.section === sectionId));
}

function renderSchedule() {
  const list = byId("todayScheduleList");
  list.innerHTML = "";
  const items = [...state.schedule].sort((a, b) => a.time.localeCompare(b.time));
  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.time} - ${item.title}</span>`;
    const btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.textContent = "Done";
    btn.onclick = () => {
      state.schedule = state.schedule.filter((x) => x.id !== item.id);
      saveState();
    };
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderTasks() {
  const planner = byId("plannerList");
  const quickList = byId("taskList");
  planner.innerHTML = "";
  quickList.innerHTML = "";

  for (const task of state.planner) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${task.title} (${task.due})</span><span class="chip ${task.priority.toLowerCase()}">${task.priority}</span>`;
    const done = document.createElement("input");
    done.type = "checkbox";
    done.checked = task.done;
    done.onchange = () => {
      task.done = done.checked;
      saveState();
    };
    li.appendChild(done);
    planner.appendChild(li);

    if (!task.done) {
      const p = document.createElement("li");
      p.textContent = task.title;
      quickList.appendChild(p);
    }
  }
}

function renderStreak() {
  byId("streakCount").textContent = state.streak.days;
  byId("streakMessage").textContent =
    state.streak.days > 0 ? "You are building an elite consistency streak." : "Start your first streak today.";
}

function renderFlashcards() {
  const deck = byId("flashcardDeck");
  deck.innerHTML = "";
  state.flashcards.forEach((card) => {
    const el = document.createElement("div");
    el.className = "flashcard";
    el.dataset.side = "question";
    el.innerHTML = `<small>Tap to flip</small><h4>${card.question}</h4>`;
    el.onclick = () => {
      const showingQ = el.dataset.side === "question";
      el.dataset.side = showingQ ? "answer" : "question";
      el.innerHTML = showingQ
        ? `<small>Answer</small><h4>${card.answer}</h4>`
        : `<small>Tap to flip</small><h4>${card.question}</h4>`;
    };
    deck.appendChild(el);
  });
}

function renderNotes() {
  const list = byId("noteList");
  const query = byId("vaultSearch").value.trim().toLowerCase();
  list.innerHTML = "";

  state.notes
    .filter((n) => !query || n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query))
    .forEach((note) => {
      const li = document.createElement("li");
      li.innerHTML = `<span><strong>${note.title}</strong> - ${note.body.slice(0, 80)}...</span>`;
      const del = document.createElement("button");
      del.className = "btn ghost";
      del.textContent = "Delete";
      del.onclick = () => {
        state.notes = state.notes.filter((x) => x.id !== note.id);
        saveState();
      };
      li.appendChild(del);
      list.appendChild(li);
    });
}

function renderHabits() {
  const list = byId("habitList");
  list.innerHTML = "";
  for (const habit of state.habits) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${habit.name}</span><span class="chip low">${habit.done ? "Done Today" : "Pending"}</span>`;
    const btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.textContent = habit.done ? "Undo" : "Mark";
    btn.onclick = () => {
      habit.done = !habit.done;
      saveState();
    };
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderJournalAndVision() {
  const j = byId("journalList");
  j.innerHTML = "";
  for (const entry of state.journal.slice().reverse()) {
    const li = document.createElement("li");
    li.textContent = `${new Date(entry.date).toLocaleDateString()}: ${entry.text}`;
    j.appendChild(li);
  }

  const v = byId("visionList");
  v.innerHTML = "";
  for (const goal of state.visions) {
    const li = document.createElement("li");
    li.textContent = goal;
    v.appendChild(li);
  }
}

function renderTopicModules() {
  const list = byId("topicModules");
  list.innerHTML = "";
  for (const module of state.topicModules) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${module.title}</span><span class="chip medium">${module.time}</span>`;
    list.appendChild(li);
  }
}

function renderAnalytics() {
  const totalFocusHours = (state.focus.seconds / 3600).toFixed(1);
  byId("studyHours").textContent = `${totalFocusHours}h`;

  const accuracy = state.quizStats.taken
    ? Math.round((state.quizStats.correct / state.quizStats.taken) * 100)
    : 0;
  byId("quizAccuracy").textContent = `${accuracy}%`;

  const completion = state.planner.length
    ? Math.round((state.planner.filter((t) => t.done).length / state.planner.length) * 100)
    : 0;
  byId("taskCompletion").textContent = `${completion}%`;

  byId("sessionCount").textContent = state.focus.sessions;
  drawChart([totalFocusHours, accuracy, completion]);
}

function drawChart(values) {
  const canvas = byId("progressChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const labels = ["Study Hours", "Quiz Accuracy", "Task Completion"];
  const max = Math.max(100, ...values.map((x) => Number(x)));
  const barW = 200;
  const gap = 90;
  const startX = 90;

  values.forEach((v, i) => {
    const h = (Number(v) / max) * 170;
    const x = startX + i * (barW + gap);
    const y = 220 - h;
    ctx.fillStyle = ["#4da3ff", "#f6c35d", "#56d398"][i];
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = "#d9e6ff";
    ctx.font = "600 14px Inter";
    ctx.fillText(labels[i], x, 244);
    ctx.fillText(String(v), x + 88, y - 8);
  });
}

function renderProfile() {
  byId("profileName").textContent = state.profile.name || "Student";
  byId("profileInitial").textContent = (state.profile.name || "S").charAt(0).toUpperCase();
}

function renderQuote() {
  byId("motivationalMessage").textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

function renderAll() {
  renderSchedule();
  renderTasks();
  renderStreak();
  renderFlashcards();
  renderNotes();
  renderHabits();
  renderJournalAndVision();
  renderTopicModules();
  renderAnalytics();
  renderProfile();
}

function generateAssistantReply(prompt) {
  const level = state.profile.level;
  const tone = {
    "high-school": "simple and clear",
    university: "academic but concise",
    "self-learner": "friendly and practical"
  }[level] || "clear";
  return `Study Coach (${tone}): Focus on core definitions first, then solve 3 examples, then teach the concept aloud in your own words. Prompt analyzed: "${prompt}".`;
}

function makeTopicBreakdown(topic) {
  return [
    { title: `${topic}: Foundations`, time: "35 min" },
    { title: `${topic}: Core Rules`, time: "45 min" },
    { title: `${topic}: Practice Drills`, time: "50 min" },
    { title: `${topic}: Mixed Review`, time: "30 min" }
  ];
}

function buildQuiz(topic) {
  const area = byId("quizArea");
  const q = questionBank[Math.floor(Math.random() * questionBank.length)];
  quizCurrent = q;
  area.innerHTML = `
    <div class="output">
      <strong>${topic} Quiz:</strong>
      <p>${q.q}</p>
      ${q.o.map((opt, i) => `<label><input type="radio" name="quizOpt" value="${i}" /> ${opt}</label><br/>`).join("")}
      <button id="submitQuiz" class="btn primary" style="margin-top:8px;">Submit Answer</button>
      <p id="quizFeedback" class="muted"></p>
    </div>
  `;

  byId("submitQuiz").onclick = () => {
    const selected = document.querySelector('input[name="quizOpt"]:checked');
    if (!selected) return;
    const pick = Number(selected.value);
    const ok = pick === q.a;
    state.quizStats.taken += 1;
    if (ok) state.quizStats.correct += 1;
    byId("quizFeedback").textContent = `${ok ? "Correct." : "Not quite."} ${q.e}`;
    saveState();
  };
}

function bindEvents() {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.onclick = () => setSection(btn.dataset.section);
  });

  document.querySelectorAll(".jump").forEach((btn) => {
    btn.onclick = () => setSection(btn.dataset.jump);
  });

  byId("newQuoteBtn").onclick = renderQuote;

  byId("scheduleForm").onsubmit = (e) => {
    e.preventDefault();
    state.schedule.push({
      id: crypto.randomUUID(),
      title: byId("scheduleTitle").value.trim(),
      time: byId("scheduleTime").value
    });
    e.target.reset();
    saveState();
  };

  byId("plannerForm").onsubmit = (e) => {
    e.preventDefault();
    state.planner.push({
      id: crypto.randomUUID(),
      title: byId("plannerTask").value.trim(),
      due: byId("plannerDue").value,
      priority: byId("plannerPriority").value,
      done: false
    });
    e.target.reset();
    saveState();
  };

  byId("quickAddTaskBtn").onclick = () => setSection("productivity");

  byId("markTodayStudied").onclick = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (state.streak.lastMarked !== today) {
      state.streak.days += 1;
      state.streak.lastMarked = today;
      saveState();
    }
  };

  byId("assistantForm").onsubmit = (e) => {
    e.preventDefault();
    byId("assistantOutput").textContent = generateAssistantReply(byId("assistantInput").value.trim());
  };

  byId("topicForm").onsubmit = (e) => {
    e.preventDefault();
    state.topicModules = makeTopicBreakdown(byId("topicInput").value.trim());
    saveState();
  };

  byId("flashcardForm").onsubmit = (e) => {
    e.preventDefault();
    state.flashcards.push({
      question: byId("flashQuestion").value.trim(),
      answer: byId("flashAnswer").value.trim()
    });
    e.target.reset();
    saveState();
  };

  byId("quizForm").onsubmit = (e) => {
    e.preventDefault();
    buildQuiz(byId("quizTopic").value.trim());
  };

  byId("habitForm").onsubmit = (e) => {
    e.preventDefault();
    state.habits.push({ name: byId("habitName").value.trim(), done: false });
    e.target.reset();
    saveState();
  };

  byId("optimizeBtn").onclick = () => {
    const list = byId("optimizerOutput");
    const pending = state.planner.filter((t) => !t.done).slice(0, 3);
    list.innerHTML = "";
    if (!pending.length) {
      const li = document.createElement("li");
      li.textContent = "No pending tasks. Perfect time for revision or rest.";
      list.appendChild(li);
      return;
    }
    pending.forEach((task, i) => {
      const li = document.createElement("li");
      li.textContent = `${9 + i * 2}:00 - ${task.title} (${task.priority})`;
      list.appendChild(li);
    });
  };

  byId("noteForm").onsubmit = (e) => {
    e.preventDefault();
    state.notes.push({
      id: crypto.randomUUID(),
      title: byId("noteTitle").value.trim(),
      body: byId("noteBody").value.trim()
    });
    e.target.reset();
    saveState();
  };

  byId("vaultSearch").oninput = renderNotes;

  byId("journalForm").onsubmit = (e) => {
    e.preventDefault();
    state.journal.push({ text: byId("journalText").value.trim(), date: new Date().toISOString() });
    e.target.reset();
    saveState();
  };

  byId("visionForm").onsubmit = (e) => {
    e.preventDefault();
    state.visions.push(byId("visionGoal").value.trim());
    e.target.reset();
    saveState();
  };

  byId("settingsForm").onsubmit = (e) => {
    e.preventDefault();
    state.profile.name = byId("studentName").value.trim() || "Student";
    state.profile.level = byId("studentLevel").value;
    saveState();
  };

  byId("startTimer").onclick = () => {
    if (timer) return;
    const mins = Number(byId("focusMinutes").value) || 25;
    if (timeLeft <= 0 || timeLeft === 25 * 60) timeLeft = mins * 60;
    timer = setInterval(() => {
      timeLeft -= 1;
      byId("timerDisplay").textContent = formatTime(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        state.focus.sessions += 1;
        state.focus.seconds += mins * 60;
        timeLeft = mins * 60;
        byId("timerDisplay").textContent = formatTime(timeLeft);
        saveState();
      }
    }, 1000);
  };

  byId("pauseTimer").onclick = () => {
    clearInterval(timer);
    timer = null;
  };

  byId("resetTimer").onclick = () => {
    clearInterval(timer);
    timer = null;
    const mins = Number(byId("focusMinutes").value) || 25;
    timeLeft = mins * 60;
    byId("timerDisplay").textContent = formatTime(timeLeft);
  };

  byId("globalSearch").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) return;
    const hasTask = state.planner.some((t) => t.title.toLowerCase().includes(q));
    const hasNote = state.notes.some((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    if (hasTask) setSection("productivity");
    else if (hasNote) setSection("vault");
  };
}

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function init() {
  byId("studentName").value = state.profile.name;
  byId("studentLevel").value = state.profile.level;
  byId("timerDisplay").textContent = formatTime(timeLeft);
  bindEvents();
  renderQuote();
  renderAll();
}

init();

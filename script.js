const storageKey = "simboStudyOS.v1";
const defaults = {
  tasks: [],
  notes: [],
  decks: [],
  sessions: 0,
  streak: 0,
  focusMinutes: 25,
  breakMinutes: 5,
  pomodoroCount: 0,
  quizItems: [],
  weeklyMinutes: [30, 45, 60, 35, 75, 90, 50],
  activeDeckId: null,
  profile: {
    name: "Scholar",
    goal: "Stay consistent with daily deep work",
    bio: ""
  },
  simbaChat: []
};

const state = loadState();
let currentSection = "dashboard";
let timer = {
  mode: "focus",
  remainingSeconds: state.focusMinutes * 60,
  running: false,
  intervalId: null
};
let quizRun = null;
let flashcardIndex = 0;
let toastTimerId = null;
let simbaThinkingId = null;

const els = {
  sectionTitle: document.getElementById("sectionTitle"),
  userNameDisplay: document.getElementById("userNameDisplay"),
  userGoalDisplay: document.getElementById("userGoalDisplay"),
  navMenu: document.getElementById("navMenu"),
  sections: document.querySelectorAll(".section"),
  navBtns: document.querySelectorAll(".nav-btn"),
  quickSectionButtons: document.querySelectorAll("[data-section-target]"),
  focusModeToggle: document.getElementById("focusModeToggle"),
  globalSearch: document.getElementById("globalSearch"),
  openProfileBtn: document.getElementById("openProfileBtn"),
  quickAddTask: document.getElementById("quickAddTask"),
  profileModal: document.getElementById("profileModal"),
  closeProfileBtn: document.getElementById("closeProfileBtn"),
  profileForm: document.getElementById("profileForm"),
  profileName: document.getElementById("profileName"),
  profileGoal: document.getElementById("profileGoal"),
  profileBio: document.getElementById("profileBio"),
  profileAvatarPreview: document.getElementById("profileAvatarPreview"),
  toast: document.getElementById("toast"),
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskDeadline: document.getElementById("taskDeadline"),
  taskFilter: document.getElementById("taskFilter"),
  taskList: document.getElementById("taskList"),
  todayAgenda: document.getElementById("todayAgenda"),
  kpiStreak: document.getElementById("kpiStreak"),
  kpiSessions: document.getElementById("kpiSessions"),
  kpiHours: document.getElementById("kpiHours"),
  kpiGoals: document.getElementById("kpiGoals"),
  timerDisplay: document.getElementById("timerDisplay"),
  timerModeLabel: document.getElementById("timerModeLabel"),
  timerStartPause: document.getElementById("timerStartPause"),
  timerReset: document.getElementById("timerReset"),
  timerSwitch: document.getElementById("timerSwitch"),
  focusMinutes: document.getElementById("focusMinutes"),
  breakMinutes: document.getElementById("breakMinutes"),
  saveTimerSettings: document.getElementById("saveTimerSettings"),
  pomodoroCount: document.getElementById("pomodoroCount"),
  deckForm: document.getElementById("deckForm"),
  deckName: document.getElementById("deckName"),
  deckList: document.getElementById("deckList"),
  activeDeckTitle: document.getElementById("activeDeckTitle"),
  cardForm: document.getElementById("cardForm"),
  cardFront: document.getElementById("cardFront"),
  cardBack: document.getElementById("cardBack"),
  flashcard: document.getElementById("flashcard"),
  prevCard: document.getElementById("prevCard"),
  nextCard: document.getElementById("nextCard"),
  cardCounter: document.getElementById("cardCounter"),
  noteForm: document.getElementById("noteForm"),
  noteTitle: document.getElementById("noteTitle"),
  noteBody: document.getElementById("noteBody"),
  noteSearch: document.getElementById("noteSearch"),
  notesGrid: document.getElementById("notesGrid"),
  quizForm: document.getElementById("quizForm"),
  quizTopic: document.getElementById("quizTopic"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizAnswer: document.getElementById("quizAnswer"),
  startQuiz: document.getElementById("startQuiz"),
  quizStatus: document.getElementById("quizStatus"),
  quizPanel: document.getElementById("quizPanel"),
  weeklyChart: document.getElementById("weeklyChart"),
  completionChart: document.getElementById("completionChart"),
  simbaFab: document.getElementById("simbaFab"),
  simbaPanel: document.getElementById("simbaPanel"),
  simbaForm: document.getElementById("simbaForm"),
  simbaInput: document.getElementById("simbaInput"),
  simbaMessages: document.getElementById("simbaMessages"),
  simbaTyping: document.getElementById("simbaTyping"),
  simbaClose: document.getElementById("simbaClose"),
  simbaClear: document.getElementById("simbaClear")
};

bootstrap();

function bootstrap() {
  bindNavigation();
  bindPlanner();
  bindTimer();
  bindFlashcards();
  bindNotes();
  bindQuiz();
  bindProfile();
  bindSimba();
  bindGlobalControls();
  bindMicroInteractions();
  renderAll();
  requestAnimationFrame(() => {
    document.body.classList.add("ready");
  });
}

function bindNavigation() {
  els.navMenu.addEventListener("click", (event) => {
    const btn = event.target.closest(".nav-btn");
    if (!btn) {
      return;
    }
    openSection(btn.dataset.section);
  });

  els.quickSectionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openSection(btn.dataset.sectionTarget);
    });
  });
}

function bindPlanner() {
  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    if (!title) {
      return;
    }
    const task = {
      id: crypto.randomUUID(),
      title,
      deadline: els.taskDeadline.value || null,
      done: false,
      createdAt: Date.now()
    };
    state.tasks.unshift(task);
    els.taskForm.reset();
    persist();
    renderPlanner();
    renderDashboard();
    renderAnalytics();
    showToast("Task added");
  });

  els.taskFilter.addEventListener("change", renderPlanner);
  els.taskList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-task-id]");
    if (!item) {
      return;
    }
    const taskId = item.dataset.taskId;
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return;
    }
    if (event.target.matches("[data-action='toggle']")) {
      task.done = !task.done;
      persist();
      renderPlanner();
      renderDashboard();
      renderAnalytics();
      return;
    }
    if (event.target.matches("[data-action='delete']")) {
      state.tasks = state.tasks.filter((entry) => entry.id !== taskId);
      persist();
      renderPlanner();
      renderDashboard();
      renderAnalytics();
      showToast("Task removed");
    }
  });
}

function bindTimer() {
  els.focusMinutes.value = state.focusMinutes;
  els.breakMinutes.value = state.breakMinutes;
  updateTimerDisplay();
  els.pomodoroCount.textContent = String(state.pomodoroCount);

  els.timerStartPause.addEventListener("click", () => {
    timer.running = !timer.running;
    els.timerStartPause.textContent = timer.running ? "Pause" : "Start";
    if (timer.running) {
      timer.intervalId = window.setInterval(tickTimer, 1000);
      state.sessions += 1;
      persist();
      renderDashboard();
    } else {
      clearTimerInterval();
    }
  });

  els.timerReset.addEventListener("click", () => {
    clearTimerInterval();
    timer.running = false;
    els.timerStartPause.textContent = "Start";
    timer.remainingSeconds = activeDurationMinutes() * 60;
    updateTimerDisplay();
  });

  els.timerSwitch.addEventListener("click", () => {
    clearTimerInterval();
    timer.running = false;
    els.timerStartPause.textContent = "Start";
    timer.mode = timer.mode === "focus" ? "break" : "focus";
    timer.remainingSeconds = activeDurationMinutes() * 60;
    updateTimerDisplay();
  });

  els.saveTimerSettings.addEventListener("click", () => {
    const focus = Number(els.focusMinutes.value);
    const brk = Number(els.breakMinutes.value);
    if (!Number.isFinite(focus) || !Number.isFinite(brk) || focus < 1 || brk < 1) {
      showToast("Enter valid timer values");
      return;
    }
    state.focusMinutes = focus;
    state.breakMinutes = brk;
    if (!timer.running) {
      timer.remainingSeconds = activeDurationMinutes() * 60;
      updateTimerDisplay();
    }
    persist();
    showToast("Timer settings saved");
  });
}

function bindFlashcards() {
  els.deckForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.deckName.value.trim();
    if (!name) {
      return;
    }
    const deck = {
      id: crypto.randomUUID(),
      name,
      cards: []
    };
    state.decks.push(deck);
    state.activeDeckId = deck.id;
    els.deckForm.reset();
    flashcardIndex = 0;
    persist();
    renderFlashcards();
    showToast("Deck created");
  });

  els.deckList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-deck-id]");
    if (!row) {
      return;
    }
    const deckId = row.dataset.deckId;
    if (event.target.matches("[data-action='open']")) {
      state.activeDeckId = deckId;
      flashcardIndex = 0;
      persist();
      renderFlashcards();
      return;
    }
    if (event.target.matches("[data-action='delete']")) {
      state.decks = state.decks.filter((deck) => deck.id !== deckId);
      if (state.activeDeckId === deckId) {
        state.activeDeckId = state.decks[0]?.id || null;
        flashcardIndex = 0;
      }
      persist();
      renderFlashcards();
      showToast("Deck deleted");
    }
  });

  els.cardForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const activeDeck = getActiveDeck();
    if (!activeDeck) {
      showToast("Create or select a deck first");
      return;
    }
    const front = els.cardFront.value.trim();
    const back = els.cardBack.value.trim();
    if (!front || !back) {
      return;
    }
    activeDeck.cards.push({
      id: crypto.randomUUID(),
      front,
      back
    });
    els.cardForm.reset();
    flashcardIndex = Math.max(0, activeDeck.cards.length - 1);
    persist();
    renderFlashcards();
    showToast("Card added");
  });

  els.prevCard.addEventListener("click", () => {
    const activeDeck = getActiveDeck();
    if (!activeDeck || activeDeck.cards.length === 0) {
      return;
    }
    flashcardIndex = (flashcardIndex - 1 + activeDeck.cards.length) % activeDeck.cards.length;
    renderFlashcardFace();
  });

  els.nextCard.addEventListener("click", () => {
    const activeDeck = getActiveDeck();
    if (!activeDeck || activeDeck.cards.length === 0) {
      return;
    }
    flashcardIndex = (flashcardIndex + 1) % activeDeck.cards.length;
    renderFlashcardFace();
  });

  els.flashcard.addEventListener("click", () => {
    els.flashcard.classList.toggle("flipped");
  });

  els.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.flashcard.classList.toggle("flipped");
    }
  });
}

function bindNotes() {
  els.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.noteTitle.value.trim();
    const body = els.noteBody.value.trim();
    if (!title) {
      return;
    }
    const note = {
      id: crypto.randomUUID(),
      title,
      body,
      createdAt: Date.now()
    };
    state.notes.unshift(note);
    els.noteForm.reset();
    persist();
    renderNotes();
    showToast("Note saved");
  });

  els.noteSearch.addEventListener("input", renderNotes);
  els.notesGrid.addEventListener("click", (event) => {
    const row = event.target.closest("[data-note-id]");
    if (!row) {
      return;
    }
    if (!event.target.matches("[data-action='delete']")) {
      return;
    }
    const id = row.dataset.noteId;
    state.notes = state.notes.filter((note) => note.id !== id);
    persist();
    renderNotes();
    showToast("Note removed");
  });
}

function bindQuiz() {
  els.quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const topic = els.quizTopic.value.trim();
    const question = els.quizQuestion.value.trim();
    const answer = els.quizAnswer.value.trim();
    if (!topic || !question || !answer) {
      return;
    }
    state.quizItems.push({
      id: crypto.randomUUID(),
      topic,
      question,
      answer
    });
    els.quizForm.reset();
    persist();
    renderQuiz();
    showToast("Quiz item added");
  });

  els.startQuiz.addEventListener("click", () => {
    if (state.quizItems.length === 0) {
      showToast("Add quiz items first");
      return;
    }
    const shuffled = [...state.quizItems].sort(() => Math.random() - 0.5).slice(0, 5);
    quizRun = {
      index: 0,
      score: 0,
      items: shuffled
    };
    renderQuizRun();
  });

  els.quizPanel.addEventListener("click", (event) => {
    if (!quizRun) {
      return;
    }
    const btn = event.target.closest("[data-answer]");
    if (!btn) {
      return;
    }
    const current = quizRun.items[quizRun.index];
    const answer = btn.dataset.answer;
    if (answer === current.answer) {
      quizRun.score += 1;
    }
    quizRun.index += 1;
    if (quizRun.index >= quizRun.items.length) {
      const result = quizRun;
      quizRun = null;
      els.quizStatus.textContent = `Score ${result.score}/${result.items.length}`;
      els.quizPanel.innerHTML = `<p>Done. You scored <strong>${result.score}/${result.items.length}</strong>.</p>`;
      return;
    }
    renderQuizRun();
  });
}

function bindGlobalControls() {
  els.quickAddTask.addEventListener("click", () => {
    openSection("planner");
    els.taskTitle.focus();
  });

  els.focusModeToggle.addEventListener("click", () => {
    const active = document.body.classList.toggle("focus-mode");
    els.focusModeToggle.textContent = active ? "Exit Focus Mode" : "Enter Focus Mode";
    els.focusModeToggle.setAttribute("aria-pressed", active ? "true" : "false");
  });

  els.globalSearch.addEventListener("input", () => {
    const query = els.globalSearch.value.trim().toLowerCase();
    if (!query) {
      return;
    }
    if (state.tasks.some((task) => task.title.toLowerCase().includes(query))) {
      openSection("planner");
      return;
    }
    if (state.notes.some((note) => `${note.title} ${note.body}`.toLowerCase().includes(query))) {
      openSection("notes");
      return;
    }
    if (state.decks.some((deck) => deck.name.toLowerCase().includes(query))) {
      openSection("flashcards");
      return;
    }
  });
}

function bindProfile() {
  els.openProfileBtn.addEventListener("click", openProfileModal);
  els.closeProfileBtn.addEventListener("click", closeProfileModal);
  els.profileModal.addEventListener("click", (event) => {
    if (event.target === els.profileModal) {
      closeProfileModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProfileModal();
      closeSimbaPanel();
    }
  });
  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.profileName.value.trim() || "Scholar";
    const goal = els.profileGoal.value.trim() || "Stay consistent with daily deep work";
    const bio = els.profileBio.value.trim();
    state.profile = { name, goal, bio };
    persist();
    renderProfile();
    closeProfileModal();
    showToast("Profile saved");
  });
}

function bindSimba() {
  els.simbaFab.addEventListener("click", () => {
    const willOpen = !els.simbaPanel.classList.contains("open");
    if (willOpen) {
      openSimbaPanel();
    } else {
      closeSimbaPanel();
    }
  });
  els.simbaClose.addEventListener("click", closeSimbaPanel);
  els.simbaClear.addEventListener("click", () => {
    state.simbaChat = [];
    persist();
    renderSimbaMessages();
    addAssistantMessage("Chat cleared. I am ready to help you study with a focused strategy.");
  });
  els.simbaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = els.simbaInput.value.trim();
    if (!text) {
      return;
    }
    addUserMessage(text);
    els.simbaInput.value = "";
    showSimbaTyping(true);
    simbaThinkingId = window.setTimeout(() => {
      showSimbaTyping(false);
      addAssistantMessage(generateSimbaResponse(text));
    }, 650);
  });
}

function bindMicroInteractions() {
  const cards = document.querySelectorAll(".card-elevated, .metric-card, .hero");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${px}`);
      card.style.setProperty("--my", `${py}`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
  });
}

function renderAll() {
  renderProfile();
  renderDashboard();
  renderPlanner();
  renderTimer();
  renderFlashcards();
  renderNotes();
  renderQuiz();
  renderAnalytics();
  renderSimbaMessages();
}

function renderDashboard() {
  els.kpiStreak.textContent = `${state.streak} days`;
  els.kpiSessions.textContent = String(state.sessions);
  const hours = (state.weeklyMinutes.reduce((sum, min) => sum + min, 0) / 60).toFixed(1);
  els.kpiHours.textContent = `${hours}h`;
  els.kpiGoals.textContent = String(state.tasks.filter((task) => !task.done).length);

  const agendaItems = state.tasks
    .filter((task) => !task.done)
    .sort((a, b) => Number(new Date(a.deadline || "2999-12-31")) - Number(new Date(b.deadline || "2999-12-31")))
    .slice(0, 5);

  els.todayAgenda.innerHTML = agendaItems.length
    ? agendaItems
        .map((task) => {
          const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline";
          return `<li class="list-item"><span>${escapeHtml(task.title)}</span><small>${deadline}</small></li>`;
        })
        .join("")
    : '<li class="list-item"><span>No tasks yet. Add one in Planner.</span></li>';
}

function renderPlanner() {
  const filter = els.taskFilter.value;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const visibleTasks = state.tasks.filter((task) => {
    if (filter === "todo") {
      return !task.done;
    }
    if (filter === "done") {
      return task.done;
    }
    if (filter === "overdue") {
      if (!task.deadline || task.done) {
        return false;
      }
      return new Date(task.deadline) < now;
    }
    return true;
  });

  els.taskList.innerHTML = visibleTasks.length
    ? visibleTasks
        .map((task) => {
          const isOverdue = Boolean(task.deadline && !task.done && new Date(task.deadline) < now);
          const due = task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline";
          const badge = task.done ? "success" : isOverdue ? "danger" : "warn";
          const label = task.done ? "Done" : isOverdue ? "Overdue" : "Active";
          return `
            <li class="list-item" data-task-id="${task.id}">
              <div>
                <strong>${escapeHtml(task.title)}</strong>
                <div class="task-meta">
                  <small>${due}</small>
                  <span class="badge ${badge}">${label}</span>
                </div>
              </div>
              <div class="inline-controls">
                <button class="btn small ghost" data-action="toggle">${task.done ? "Undo" : "Done"}</button>
                <button class="btn small ghost" data-action="delete">Delete</button>
              </div>
            </li>`;
        })
        .join("")
    : '<li class="list-item"><span>No tasks in this view.</span></li>';
}

function renderTimer() {
  updateTimerDisplay();
  els.timerModeLabel.textContent = timer.mode === "focus" ? "Focus mode" : "Break mode";
  els.pomodoroCount.textContent = String(state.pomodoroCount);
}

function renderFlashcards() {
  const activeDeck = getActiveDeck();
  els.deckList.innerHTML = state.decks.length
    ? state.decks
        .map((deck) => {
          const selected = deck.id === state.activeDeckId ? " (active)" : "";
          return `
            <li class="list-item" data-deck-id="${deck.id}">
              <div>
                <strong>${escapeHtml(deck.name)}${selected}</strong>
                <small>${deck.cards.length} cards</small>
              </div>
              <div class="inline-controls">
                <button class="btn small ghost" data-action="open">Open</button>
                <button class="btn small ghost" data-action="delete">Delete</button>
              </div>
            </li>`;
        })
        .join("")
    : '<li class="list-item"><span>No decks yet.</span></li>';

  els.activeDeckTitle.textContent = activeDeck ? `Card Studio - ${activeDeck.name}` : "Card Studio";
  if (activeDeck && flashcardIndex >= activeDeck.cards.length) {
    flashcardIndex = Math.max(0, activeDeck.cards.length - 1);
  }
  renderFlashcardFace();
}

function renderFlashcardFace() {
  const activeDeck = getActiveDeck();
  const frontEl = els.flashcard.querySelector(".flashcard-front");
  const backEl = els.flashcard.querySelector(".flashcard-back");
  els.flashcard.classList.remove("flipped");
  if (!activeDeck || activeDeck.cards.length === 0) {
    frontEl.textContent = activeDeck ? "Add cards to begin" : "Select a deck";
    backEl.textContent = "Create your first flashcard";
    els.cardCounter.textContent = "0 / 0";
    return;
  }
  const card = activeDeck.cards[flashcardIndex];
  frontEl.textContent = card.front;
  backEl.textContent = card.back;
  els.cardCounter.textContent = `${flashcardIndex + 1} / ${activeDeck.cards.length}`;
}

function renderNotes() {
  const query = els.noteSearch.value.trim().toLowerCase();
  const filtered = state.notes.filter((note) => {
    if (!query) {
      return true;
    }
    return `${note.title} ${note.body}`.toLowerCase().includes(query);
  });
  els.notesGrid.innerHTML = filtered.length
    ? filtered
        .map((note) => {
          return `
            <article class="note-card" data-note-id="${note.id}">
              <h4>${escapeHtml(note.title)}</h4>
              <p>${escapeHtml(note.body || "No content")}</p>
              <div class="inline-controls" style="margin-top: 8px;">
                <button class="btn small ghost" data-action="delete">Delete</button>
              </div>
            </article>`;
        })
        .join("")
    : '<p class="subtle">No notes found.</p>';
}

function renderQuiz() {
  els.quizStatus.textContent = state.quizItems.length ? `${state.quizItems.length} questions ready` : "No active quiz";
  if (!quizRun) {
    els.quizPanel.innerHTML = state.quizItems.length
      ? "<p>Select <strong>Start Quiz</strong> to begin.</p>"
      : "<p>Add at least one question to run a quiz.</p>";
  }
}

function renderQuizRun() {
  if (!quizRun) {
    return;
  }
  const current = quizRun.items[quizRun.index];
  const options = buildQuizOptions(current.answer);
  els.quizStatus.textContent = `Question ${quizRun.index + 1}/${quizRun.items.length}`;
  els.quizPanel.innerHTML = `
    <p><strong>${escapeHtml(current.topic)}</strong></p>
    <p>${escapeHtml(current.question)}</p>
    <div class="quiz-options">
      ${options.map((option) => `<button class="btn ghost" data-answer="${escapeHtmlAttr(option)}">${escapeHtml(option)}</button>`).join("")}
    </div>
  `;
}

function renderAnalytics() {
  const completed = state.tasks.filter((task) => task.done).length;
  const total = state.tasks.length;
  const pending = Math.max(total - completed, 0);
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  destroyChart(els.weeklyChart);
  destroyChart(els.completionChart);

  if (typeof Chart !== "undefined") {
    new Chart(els.weeklyChart, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Minutes",
            data: state.weeklyMinutes,
            borderColor: "#7aa0ff",
            backgroundColor: "rgba(122, 160, 255, 0.2)",
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        plugins: {
          legend: { labels: { color: "#d9e4ff" } }
        },
        scales: {
          x: { ticks: { color: "#a9bcf7" }, grid: { color: "rgba(151, 173, 255, 0.08)" } },
          y: { ticks: { color: "#a9bcf7" }, grid: { color: "rgba(151, 173, 255, 0.08)" } }
        }
      }
    });

    new Chart(els.completionChart, {
      type: "doughnut",
      data: {
        labels: [`Done ${completionRate}%`, "Pending"],
        datasets: [
          {
            data: [completed, pending || 1],
            backgroundColor: ["#49d88a", "#2f3f75"]
          }
        ]
      },
      options: {
        plugins: {
          legend: { labels: { color: "#d9e4ff" } }
        }
      }
    });
  }
}

function openSection(id) {
  currentSection = id;
  els.sections.forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });
  els.navBtns.forEach((btn) => {
    const active = btn.dataset.section === id;
    btn.classList.toggle("active", active);
  });
  const selectedBtn = [...els.navBtns].find((btn) => btn.dataset.section === id);
  els.sectionTitle.textContent = selectedBtn ? selectedBtn.textContent : "Dashboard";
  const activeSection = document.getElementById(id);
  if (activeSection) {
    activeSection.animate(
      [
        { opacity: 0.65, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 260, easing: "ease-out" }
    );
  }
}

function tickTimer() {
  timer.remainingSeconds -= 1;
  if (timer.remainingSeconds <= 0) {
    if (timer.mode === "focus") {
      state.pomodoroCount += 1;
      state.streak = Math.max(1, state.streak + 1);
      state.weeklyMinutes[(new Date().getDay() + 6) % 7] += state.focusMinutes;
      showToast("Focus session complete");
    } else {
      showToast("Break complete");
    }
    timer.mode = timer.mode === "focus" ? "break" : "focus";
    timer.remainingSeconds = activeDurationMinutes() * 60;
    persist();
    renderDashboard();
    renderAnalytics();
  }
  updateTimerDisplay();
}

function activeDurationMinutes() {
  return timer.mode === "focus" ? state.focusMinutes : state.breakMinutes;
}

function updateTimerDisplay() {
  const mins = Math.floor(timer.remainingSeconds / 60);
  const secs = timer.remainingSeconds % 60;
  els.timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  els.timerModeLabel.textContent = timer.mode === "focus" ? "Focus mode" : "Break mode";
  els.pomodoroCount.textContent = String(state.pomodoroCount);
}

function clearTimerInterval() {
  if (timer.intervalId !== null) {
    window.clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
}

function getActiveDeck() {
  return state.decks.find((deck) => deck.id === state.activeDeckId) || null;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  if (toastTimerId) {
    clearTimeout(toastTimerId);
  }
  toastTimerId = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

function renderProfile() {
  const profile = sanitizeProfile(state.profile);
  state.profile = profile;
  els.userNameDisplay.textContent = profile.name;
  els.userGoalDisplay.textContent = profile.goal;
  els.profileName.value = profile.name;
  els.profileGoal.value = profile.goal;
  els.profileBio.value = profile.bio;
  els.profileAvatarPreview.textContent = profile.name.charAt(0).toUpperCase();
}

function openProfileModal() {
  renderProfile();
  els.profileModal.classList.add("open");
  els.profileModal.setAttribute("aria-hidden", "false");
  els.profileName.focus();
}

function closeProfileModal() {
  els.profileModal.classList.remove("open");
  els.profileModal.setAttribute("aria-hidden", "true");
}

function openSimbaPanel() {
  els.simbaPanel.classList.add("open");
  els.simbaPanel.setAttribute("aria-hidden", "false");
  els.simbaInput.focus();
  ensureSimbaStarter();
  scrollSimbaToBottom();
}

function closeSimbaPanel() {
  els.simbaPanel.classList.remove("open");
  els.simbaPanel.setAttribute("aria-hidden", "true");
  showSimbaTyping(false);
}

function ensureSimbaStarter() {
  if (state.simbaChat.length > 0) {
    return;
  }
  addAssistantMessage(`Hi ${sanitizeProfile(state.profile).name}, I am Simba. Ask me for study plans, Pomodoro guidance, or motivation.`);
}

function addUserMessage(text) {
  state.simbaChat.push({ role: "user", text, ts: Date.now() });
  trimSimbaHistory();
  persist();
  renderSimbaMessages();
}

function addAssistantMessage(text) {
  state.simbaChat.push({ role: "assistant", text, ts: Date.now() });
  trimSimbaHistory();
  persist();
  renderSimbaMessages();
}

function trimSimbaHistory() {
  if (state.simbaChat.length > 120) {
    state.simbaChat = state.simbaChat.slice(-120);
  }
}

function renderSimbaMessages() {
  if (!Array.isArray(state.simbaChat) || state.simbaChat.length === 0) {
    els.simbaMessages.innerHTML = '<p class="subtle">Start a conversation with Simba.</p>';
    return;
  }
  els.simbaMessages.innerHTML = state.simbaChat
    .map((item) => `<div class="simba-bubble ${item.role}">${escapeHtml(item.text)}</div>`)
    .join("");
  scrollSimbaToBottom();
}

function showSimbaTyping(isVisible) {
  if (!isVisible && simbaThinkingId) {
    window.clearTimeout(simbaThinkingId);
    simbaThinkingId = null;
  }
  els.simbaTyping.classList.toggle("show", isVisible);
}

function scrollSimbaToBottom() {
  els.simbaMessages.scrollTop = els.simbaMessages.scrollHeight;
}

function sanitizeProfile(profile) {
  const safe = profile && typeof profile === "object" ? profile : {};
  return {
    name: typeof safe.name === "string" && safe.name.trim() ? safe.name.trim().slice(0, 40) : "Scholar",
    goal: typeof safe.goal === "string" && safe.goal.trim() ? safe.goal.trim().slice(0, 100) : "Stay consistent with daily deep work",
    bio: typeof safe.bio === "string" ? safe.bio.trim().slice(0, 180) : ""
  };
}

function generateSimbaResponse(input) {
  const text = input.toLowerCase();
  const profile = sanitizeProfile(state.profile);
  if (/(^|\b)(hello|hi|hey|yo)(\b|$)/.test(text)) {
    return `Hello ${profile.name}. I am Simba. I can help you organize study blocks, protect focus, and stay consistent daily.`;
  }
  if (text.includes("help me study") || text.includes("study plan")) {
    return "Here is a practical plan:\n1) Pick one priority subject for deep work.\n2) Run 3 Pomodoro focus sessions.\n3) Review flashcards for 20 minutes.\n4) Capture key notes and one takeaway.\n5) End with a 5-minute recap and tomorrow's first task.";
  }
  if (text.includes("what is pomodoro") || text.includes("pomodoro")) {
    return "Pomodoro is a timeboxing method: focus for a fixed interval (usually 25 minutes), then take a short break (5 minutes). After a few rounds, take a longer break. It protects focus and prevents burnout.";
  }
  if (text.includes("motivate me") || text.includes("motivation")) {
    return "You do not need perfect energy. You need one clean start. Finish the next focused session and let momentum carry the rest.";
  }
  if (text.includes("i am tired") || text.includes("im tired") || text.includes("exhausted")) {
    return "That is okay. Reduce intensity, not consistency. Do one short session, hydrate, then continue with a lighter review block.";
  }
  return "I can help with study plans, focus strategy, Pomodoro guidance, and motivation. Try asking: 'help me study', 'what is pomodoro', or 'motivate me'.";
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return structuredClone(defaults);
    }
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...parsed
    };
  } catch {
    return structuredClone(defaults);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function buildQuizOptions(correctAnswer) {
  const distractors = state.quizItems
    .map((entry) => entry.answer)
    .filter((answer) => answer !== correctAnswer)
    .slice(0, 3);
  const options = [correctAnswer, ...distractors];
  while (options.length < 4) {
    options.push(`Option ${options.length + 1}`);
  }
  return options.sort(() => Math.random() - 0.5);
}

function destroyChart(canvasEl) {
  const chart = Chart.getChart(canvasEl);
  if (chart) {
    chart.destroy();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}


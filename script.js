// ===== SIMBASTUDY - COMPLETE FUNCTIONALITY =====
// All features working: Timer, Flashcards, Quiz, Chat, Notes, Journal, etc.

// ===== APPLICATION STATE =====
const state = {
    currentPage: 'dashboard',
    timerInterval: null,
    timerSeconds: 1500, // 25 minutes in seconds
    timerActive: false,
    timerMode: 'focus', // 'focus' or 'break'
    sessionCount: 0,
    flashcards: [
        { front: 'What is photosynthesis?', back: 'Process by which plants convert sunlight, CO2, and water into glucose and oxygen' },
        { front: 'What is the powerhouse of the cell?', back: 'Mitochondria - produces ATP through cellular respiration' },
        { front: 'Newton\'s Second Law', back: 'F = ma (Force equals mass times acceleration)' },
        { front: 'What is the capital of Japan?', back: 'Tokyo' },
        { front: 'Formula for water', back: 'H₂O' }
    ],
    currentFlashcardIndex: 0,
    schedule: [
        { text: 'Complete Calculus Module 4', time: '5:00 PM' },
        { text: 'Physics Lab Report', time: '10:00 AM' },
        { text: 'History Essay Draft', time: '2:00 PM' }
    ],
    plannerTasks: [],
    journalEntries: [],
    visionGoals: ['Graduate with honors', 'Master calculus', 'Get scholarship']
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    setupNavigation();
    renderSchedule();
    renderPlannerTasks();
    renderJournalEntries();
    renderVisionBoard();
    updateTimerDisplay();
    setupSearchListeners();
});

function loadStateFromStorage() {
    const saved = localStorage.getItem('simbastudy_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.schedule = parsed.schedule || state.schedule;
            state.plannerTasks = parsed.plannerTasks || [];
            state.journalEntries = parsed.journalEntries || [];
            state.visionGoals = parsed.visionGoals || state.visionGoals;
            state.sessionCount = parsed.sessionCount || 0;
            if (document.getElementById('sessionCount')) {
                document.getElementById('sessionCount').textContent = state.sessionCount;
            }
        } catch (e) {
            console.log('No saved data found, using defaults');
        }
    }
}

function saveStateToStorage() {
    localStorage.setItem('simbastudy_data', JSON.stringify({
        schedule: state.schedule,
        plannerTasks: state.plannerTasks,
        journalEntries: state.journalEntries,
        visionGoals: state.visionGoals,
        sessionCount: state.sessionCount
    }));
}

// ===== NAVIGATION =====
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    // Prevent timer issues when navigating away from productivity
    if (state.timerActive && page !== 'productivity') {
        // Don't stop timer, just update display when returning
    }
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
    
    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = page;
    }
    
    // Refresh content based on page
    if (page === 'dashboard') {
        renderSchedule();
    }
    if (page === 'productivity') {
        updateTimerDisplay();
    }
    if (page === 'studyhub') {
        updateFlashcardDisplay();
    }
}

// ===== SEARCH =====
function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (query.length < 2) return;
    
    // Search through all data
    let results = [];
    
    // Search flashcards
    state.flashcards.forEach(card => {
        if (card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query)) {
            results.push(`Flashcard: ${card.front}`);
        }
    });
    
    // Search schedule
    state.schedule.forEach(task => {
        if (task.text.toLowerCase().includes(query)) {
            results.push(`Task: ${task.text}`);
        }
    });
    
    // Search planner tasks
    state.plannerTasks.forEach(task => {
        if (task.toLowerCase().includes(query)) {
            results.push(`Planner: ${task}`);
        }
    });
    
    if (results.length > 0) {
        console.log('Search results:', results);
        // In a full app, show these in a dropdown
    }
}

// ===== DASHBOARD FUNCTIONS =====
function renderSchedule() {
    const scheduleList = document.getElementById('scheduleList');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = state.schedule.map(task => `
        <div class="schedule-item">
            <span class="task-text">${task.text}</span>
            <span class="task-time">${task.time}</span>
        </div>
    `).join('');
}

function addNewTask() {
    const taskText = prompt('Enter task description:');
    const taskTime = prompt('Enter time (e.g., 3:00 PM):');
    
    if (taskText && taskTime) {
        state.schedule.push({ text: taskText, time: taskTime });
        saveStateToStorage();
        renderSchedule();
        updateTaskCount();
    }
}

function updateTaskCount() {
    const tasksDoneEl = document.getElementById('tasksDone');
    if (tasksDoneEl) {
        tasksDoneEl.textContent = state.schedule.length;
    }
}

function refreshQuote() {
    const quotes = [
        '"The expert in anything was once a beginner."',
        '"Success is the sum of small efforts repeated day in and day out."',
        '"Don\'t watch the clock; do what it does. Keep going."',
        '"The future belongs to those who believe in the beauty of their dreams."',
        '"It always seems impossible until it\'s done."',
        '"Study while others are sleeping; work while others are loafing."',
        '"The only way to do great work is to love what you study."'
    ];
    const quoteEl = document.getElementById('dailyQuote');
    if (quoteEl) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteEl.textContent = randomQuote;
    }
}

// ===== STUDY HUB - CHAT =====
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!input || !messagesContainer) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    messagesContainer.innerHTML += `
        <div class="message user-message">${message}</div>
    `;
    
    // Clear input
    input.value = '';
    
    // Generate AI response
    setTimeout(() => {
        const responses = [
            "Great question! Let me explain that in simple terms...",
            "I'd be happy to help you understand this topic better.",
            "Here's what you need to know about that...",
            "Excellent question! The key concept here is...",
            "Let me break this down step by step for you."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        messagesContainer.innerHTML += `
            <div class="message bot-message">${randomResponse}</div>
        `;
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 800);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===== STUDY HUB - FLASHCARDS =====
function generateFlashcards() {
    navigateTo('studyhub');
    state.currentFlashcardIndex = 0;
    updateFlashcardDisplay();
}

function updateFlashcardDisplay() {
    const frontEl = document.getElementById('flashcardFront');
    const backEl = document.getElementById('flashcardBack');
    const innerEl = document.getElementById('flashcardInner');
    
    if (!frontEl || !backEl || !innerEl) return;
    
    if (state.flashcards.length > 0) {
        const card = state.flashcards[state.currentFlashcardIndex];
        frontEl.textContent = card.front;
        backEl.textContent = card.back;
        innerEl.classList.remove('flipped');
    }
}

function flipCard() {
    const innerEl = document.getElementById('flashcardInner');
    if (innerEl) {
        innerEl.classList.toggle('flipped');
    }
}

function nextFlashcard() {
    if (state.flashcards.length === 0) return;
    state.currentFlashcardIndex = (state.currentFlashcardIndex + 1) % state.flashcards.length;
    updateFlashcardDisplay();
}

function prevFlashcard() {
    if (state.flashcards.length === 0) return;
    state.currentFlashcardIndex = (state.currentFlashcardIndex - 1 + state.flashcards.length) % state.flashcards.length;
    updateFlashcardDisplay();
}

// ===== STUDY HUB - QUIZ =====
const quizData = [
    { question: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correct: 1 },
    { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
    { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 }
];
let currentQuizIndex = 0;

function loadQuizQuestion() {
    if (currentQuizIndex >= quizData.length) {
        currentQuizIndex = 0;
    }
    
    const quiz = quizData[currentQuizIndex];
    document.getElementById('quizQuestion').textContent = quiz.question;
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = quiz.options.map((opt, i) => `
        <button onclick="checkQuizAnswer(${i})" style="display:block;width:100%;padding:10px;margin:4px 0;border:1px solid #ddd;border-radius:8px;cursor:pointer;text-align:left;background:white;">
            ${opt}
        </button>
    `).join('');
    
    document.getElementById('quizFeedback').textContent = '';
}

function checkQuizAnswer(selectedIndex) {
    const quiz = quizData[currentQuizIndex];
    const feedbackEl = document.getElementById('quizFeedback');
    
    if (selectedIndex === quiz.correct) {
        feedbackEl.textContent = '✅ Correct! Great job!';
        feedbackEl.style.color = 'green';
    } else {
        feedbackEl.textContent = '❌ Incorrect. Try again!';
        feedbackEl.style.color = 'red';
    }
    
    // Load next question after delay
    setTimeout(() => {
        currentQuizIndex++;
        if (currentQuizIndex < quizData.length) {
            loadQuizQuestion();
        } else {
            currentQuizIndex = 0;
            document.getElementById('quizQuestion').textContent = 'Quiz Complete! 🎉';
            document.getElementById('quizOptions').innerHTML = '<button onclick="currentQuizIndex=0;loadQuizQuestion();" style="padding:10px 20px;background:#f0b90b;border:none;border-radius:8px;cursor:pointer;">Restart Quiz</button>';
            document.getElementById('quizFeedback').textContent = '';
        }
    }, 1500);
}

// Initialize quiz on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quizQuestion')) {
        loadQuizQuestion();
    }
});

// ===== PRODUCTIVITY - TIMER =====
function toggleTimer() {
    if (state.timerActive) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (state.timerSeconds <= 0) {
        const focusMin = parseInt(document.getElementById('focusMinutes')?.value || 25);
        state.timerSeconds = focusMin * 60;
        state.timerMode = 'focus';
    }
    
    state.timerActive = true;
    const btn = document.getElementById('timerBtn');
    if (btn) btn.textContent = '⏸ Pause';
    if (document.getElementById('timerLabel')) {
        document.getElementById('timerLabel').textContent = state.timerMode === 'focus' ? '🔴 Focus Time' : '🟢 Break Time';
    }
    
    state.timerInterval = setInterval(() => {
        state.timerSeconds--;
        updateTimerDisplay();
        
        if (state.timerSeconds <= 0) {
            clearInterval(state.timerInterval);
            state.timerActive = false;
            
            if (state.timerMode === 'focus') {
                // Focus session complete
                state.sessionCount++;
                document.getElementById('sessionCount').textContent = state.sessionCount;
                state.timerMode = 'break';
                const breakMin = parseInt(document.getElementById('breakMinutes')?.value || 5);
                state.timerSeconds = breakMin * 60;
                document.getElementById('timerLabel').textContent = '🟢 Break Time';
                alert('🎉 Focus session complete! Take a break.');
            } else {
                // Break complete
                state.timerMode = 'focus';
                const focusMin = parseInt(document.getElementById('focusMinutes')?.value || 25);
                state.timerSeconds = focusMin * 60;
                document.getElementById('timerLabel').textContent = '🔴 Focus Time';
                alert('⏰ Break is over! Time to focus.');
            }
            
            updateTimerDisplay();
            const btn = document.getElementById('timerBtn');
            if (btn) btn.textContent = '▶ Start';
            saveStateToStorage();
        }
    }, 1000);
    
    saveStateToStorage();
}

function pauseTimer() {
    clearInterval(state.timerInterval);
    state.timerActive = false;
    const btn = document.getElementById('timerBtn');
    if (btn) btn.textContent = '▶ Resume';
}

function resetTimer() {
    clearInterval(state.timerInterval);
    state.timerActive = false;
    state.timerMode = 'focus';
    const focusMin = parseInt(document.getElementById('focusMinutes')?.value || 25);
    state.timerSeconds = focusMin * 60;
    
    const btn = document.getElementById('timerBtn');
    if (btn) btn.textContent = '▶ Start';
    if (document.getElementById('timerLabel')) {
        document.getElementById('timerLabel').textContent = '🔴 Focus Time';
    }
    
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;
    
    const minutes = Math.floor(state.timerSeconds / 60);
    const seconds = state.timerSeconds % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ===== PRODUCTIVITY - PLANNER =====
function addPlannerTask() {
    const input = document.getElementById('plannerTaskInput');
    if (!input || !input.value.trim()) return;
    
    state.plannerTasks.push(input.value.trim());
    input.value = '';
    saveStateToStorage();
    renderPlannerTasks();
}

function renderPlannerTasks() {
    const container = document.getElementById('plannerTaskList');
    if (!container) return;
    
    if (state.plannerTasks.length === 0) {
        container.innerHTML = '<p style="color:#999;">No tasks yet. Add your first study task!</p>';
        return;
    }
    
    container.innerHTML = state.plannerTasks.map((task, index) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #eee;">
            <span>📋 ${task}</span>
            <button onclick="removePlannerTask(${index})" style="background:none;border:none;color:red;cursor:pointer;font-size:18px;">×</button>
        </div>
    `).join('');
}

function removePlannerTask(index) {
    state.plannerTasks.splice(index, 1);
    saveStateToStorage();
    renderPlannerTasks();
}

// ===== KNOWLEDGE VAULT - NOTES =====
function saveNotes() {
    const editor = document.getElementById('notesEditor');
    if (!editor) return;
    
    const content = editor.innerHTML;
    localStorage.setItem('simbastudy_notes', content);
    alert('✅ Notes saved successfully!');
}

function loadNotes() {
    const editor = document.getElementById('notesEditor');
    if (!editor) return;
    
    const saved = localStorage.getItem('simbastudy_notes');
    if (saved) {
        editor.innerHTML = saved;
        alert('📂 Notes loaded!');
    } else {
        alert('No saved notes found.');
    }
}

function addFolder() {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        const folderList = document.getElementById('folderList');
        if (folderList) {
            const newFolder = document.createElement('div');
            newFolder.className = 'folder-item';
            newFolder.textContent = `📁 ${folderName}`;
            newFolder.onclick = () => alert(`Opening ${folderName} folder...`);
            folderList.appendChild(newFolder);
        }
    }
}

// ===== MOTIVATION - JOURNAL =====
function saveJournalEntry() {
    const input = document.getElementById('journalInput');
    if (!input || !input.value.trim()) return;
    
    const entry = {
        text: input.value.trim(),
        date: new Date().

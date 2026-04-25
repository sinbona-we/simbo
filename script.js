// ===== SIMBASTUDY - COMPLETE FUNCTIONALITY =====

// State Management
const state = {
    currentSection: 'dashboard',
    timerInterval: null,
    timerSeconds: 1500, // 25 minutes
    timerActive: false,
    timerMode: 'focus', // 'focus' or 'break'
    sessionCount: 0,
    currentFlashcardIndex: 0,
    flashcards: [],
    quizQuestions: [],
    currentQuizIndex: 0,
    quizScore: 0,
    tasks: [
        { id: 1, text: 'Complete Calculus Module 4', priority: 'high', date: '2024-01-20', completed: false },
        { id: 2, text: 'Physics Lab Report', priority: 'medium', date: '2024-01-21', completed: false },
        { id: 3, text: 'History Essay Draft', priority: 'low', date: '2024-01-22', completed: false }
    ],
    habits: [
        { id: 1, name: 'Study 2+ hours', streak: 5, completed: false },
        { id: 2, name: 'Review notes daily', streak: 3, completed: false },
        { id: 3, name: 'Practice problems', streak: 7, completed: false }
    ],
    notes: [],
    folders: ['Mathematics', 'Physics', 'History', 'Computer Science'],
    journalEntries: [],
    visionItems: [],
    badges: [
        { name: '7-Day Streak', icon: '🔥', earned: true },
        { name: '10 Study Hours', icon: '⏰', earned: true },
        { name: 'Quiz Master', icon: '🏆', earned: false },
        { name: 'Early Riser', icon: '🌅', earned: true }
    ]
};

// Load persisted data
function loadState() {
    const saved = localStorage.getItem('simbastudy_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
    }
}

function saveState() {
    localStorage.setItem('simbastudy_state', JSON.stringify(state));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupNavigation();
    setupSearch();
    setupFileUpload();
    renderCurrentSection();
    renderSchedule();
    renderWeeklyProgress();
    renderDailyQuote();
    renderHabits();
    renderFolders();
    renderBadges();
    renderJournalEntries();
    renderVisionBoard();
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
});

// ===== NAVIGATION =====
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
            
            // Close mobile sidebar
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

function switchSection(sectionId) {
    state.currentSection = sectionId;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update timer display if switching to productivity
    if (sectionId === 'productivity') {
        updateTimerDisplay();
    }
    
    saveState();
}

function renderCurrentSection() {
    switchSection(state.currentSection);
}

// ===== SEARCH =====
function setupSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }
        
        const results = [];
        
        // Search tasks
        state.tasks.forEach(task => {
            if (task.text.toLowerCase().includes(query)) {
                results.push({ type: 'Task', text: task.text });
            }
        });
        
        // Search folders
        state.folders.forEach(folder => {
            if (folder.toLowerCase().includes(query)) {
                results.push({ type: 'Folder', text: folder });
            }
        });
        
        // Search notes
        state.notes.forEach(note => {
            if (note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)) {
                results.push({ type: 'Note', text: note.title });
            }
        });
        
        if (results.length > 0) {
            searchResults.innerHTML = results.map(r => 
                `<div class="search-result-item" style="padding:8px;cursor:pointer;border-radius:8px;">
                    <strong>${r.type}:</strong> ${r.text}
                </div>`
            ).join('');
            searchResults.classList.remove('hidden');
        } else {
            searchResults.innerHTML = '<p style="padding:8px;color:var(--text-muted);">No results found</p>';
            searchResults.classList.remove('hidden');
        }
    });
    
    // Close search results on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults?.classList.add('hidden');
        }
    });
}

// ===== DASHBOARD FUNCTIONS =====
function renderSchedule() {
    const scheduleList = document.getElementById('scheduleList');
    if (!scheduleList) return;
    
    scheduleList.innerHTML = state.tasks
        .filter(t => !t.completed)
        .slice(0, 5)
        .map(task => `
            <div class="schedule-item">
                <span>${task.text}</span>
                <span class="badge" style="background:${task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#4caf50'};color:white;padding:4px 8px;border-radius:8px;font-size:12px;">
                    ${task.priority}
                </span>
                <button onclick="completeTask(${task.id})" style="background:transparent;border:none;color:var(--primary);cursor:pointer;">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `).join('');
}

function renderWeeklyProgress() {
    const container = document.getElementById('weeklyProgress');
    if (!container) return;
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = [3, 4.5, 2, 5, 3.5, 4, 2.5];
    
    container.innerHTML = days.map((day, i) => `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span>${day}</span>
                <span>${hours[i]}h</span>
            </div>
            <div style="background:var(--glass);border-radius:10px;height:8px;overflow:hidden;">
                <div style="width:${(hours[i]/5)*100}%;height:100%;background:var(--primary);border-radius:10px;"></div>
            </div>
        </div>
    `).join('');
}

function renderDailyQuote() {
    const quotes = [
        '"The expert in anything was once a beginner."',
        '"Success is the sum of small efforts, repeated day in and day out."',
        '"Don\'t watch the clock; do what it does. Keep going."',
        '"The only way to do great work is to love what you study."',
        '"Your future is created by what you do today, not tomorrow."'
    ];
    const quoteEl = document.getElementById('dailyQuote');
    if (quoteEl) {
        quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }
}

function refreshQuote() {
    renderDailyQuote();
}

function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveState();
        renderSchedule();
    }
}

// ===== STUDY HUB FUNCTIONS =====
function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    messages.innerHTML += `
        <div class="message user-message">
            <p>${message}</p>
        </div>
    `;
    
    // Simulate AI response
    setTimeout(() => {
        const responses = [
            "Great question! Let me break that down for you...",
            "Here's a simplified explanation: Think of it as building blocks...",
            "I understand your confusion. Let me explain step by step...",
            "That's an excellent topic! The key concept to understand is...",
            "Let me help you with that. The main points are..."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        messages.innerHTML += `
            <div class="message ai-message">
                <p>${response} ${message}</p>
            </div>
        `;
        
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
}

function breakdownTopic() {
    const topic = document.getElementById('topicInput').value.trim();
    const resultDiv = document.getElementById('topicBreakdownResult');
    
    if (!topic) {
        resultDiv.innerHTML = '<p style="color:#f44336;">Please enter a topic.</p>';
        return;
    }
    
    resultDiv.innerHTML = `
        <h4>📚 Topic Breakdown: ${topic}</h4>
        <div style="margin-top:12px;">
            <p><strong>Module 1:</strong> Introduction & Fundamentals (Est. 2 hours)</p>
            <p><strong>Module 2:</strong> Core Concepts (Est. 3 hours)</p>
            <p><strong>Module 3:</strong> Advanced Applications (Est. 4 hours)</p>
            <p><strong>Module 4:</strong> Practice & Review (Est. 2 hours)</p>
            <p><strong>Total estimated time:</strong> 11 hours</p>
            <p><strong>Recommended sequence:</strong> Sequential with practice between modules</p>
        </div>
    `;
}

function createFlashcards() {
    state.flashcards = [
        { front: 'What is photosynthesis?', back: 'Process by which plants convert light energy into chemical energy (glucose) using CO2 and H2O' },
        { front: 'Formula for kinetic energy', back: 'KE = ½mv²' },
        { front: 'What is the powerhouse of the cell?', back: 'Mitochondria - produces ATP through cellular respiration' },
        { front: 'Newton\'s First Law', back: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force' },
        { front: 'Define derivative', back: 'The rate of change of a function with respect to a variable' }
    ];
    state.currentFlashcardIndex = 0;
    updateFlashcardDisplay();
    saveState();
}

function updateFlashcardDisplay() {
    const front = document.getElementById('flashcardFront');
    const back = document.getElementById('flashcardBack');
    const card = document.getElementById('flashcard');
    
    if (state.flashcards.length > 0) {
        front.innerHTML = `<p>${state.flashcards[state.currentFlashcardIndex].front}</p>`;
        back.innerHTML = `<p>${state.flashcards[state.currentFlashcardIndex].back}</p>`;
        card.classList.remove('flipped');
    } else {
        front.innerHTML = '<p>Click "Generate New Flashcards" to create study cards</p>';
        back.innerHTML = '<p>Answers will appear here</p>';
    }
}

function flipFlashcard() {
    document.getElementById('flashcard')?.classList.toggle('flipped');
}

function nextCard() {
    if (state.flashcards.length === 0) return;
    state.currentFlashcardIndex = (state.currentFlashcardIndex + 1) % state.flashcards.length;
    updateFlashcardDisplay();
}

function previousCard() {
    if (state.flashcards.length === 0) return;
    state.currentFlashcardIndex = (state.currentFlashcardIndex - 1 + state.flashcards.length) % state.flashcards.length;
    updateFlashcardDisplay();
}

function markDifficulty() {
    if (state.flashcards.length === 0) return;
    alert(`Card marked as difficult. Will appear more frequently for spaced repetition.`);
}

function startQuiz() {
    state.quizQuestions = [
        {
            question: 'What is the chemical symbol for gold?',
            options: ['Ag', 'Au', 'Fe', 'Cu'],
            correct: 1
        },
        {
            question: 'What is the largest planet in our solar system?',
            options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
            correct: 2
        },
        {
            question: 'In what year did World War II end?',
            options: ['1943', '1944', '1945', '1946'],
            correct: 2
        }
    ];
    state.currentQuizIndex = 0;
    state.quizScore = 0;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const questionEl = document.getElementById('quizQuestion');
    const optionsEl = document.getElementById('quizOptions');
    const resultEl = document.getElementById('quizResult');
    
    resultEl.classList.add('hidden');
    
    if (state.currentQuizIndex >= state.quizQuestions.length) {
        questionEl.textContent = `Quiz Complete! Your score: ${state.quizScore}/${state.quizQuestions.length}`;
        optionsEl.innerHTML = '';
        return;
    }
    
    const question = state.quizQuestions[state.currentQuizIndex];
    questionEl.textContent = question.question;
    
    optionsEl.innerHTML = question.options.map((opt, i) => `
        <div class="quiz-option" onclick="answerQuiz(${i})">
            ${String.fromCharCode(65 + i)}) ${opt}
        </div>
    `).join('');
}

function answerQuiz(selectedIndex) {
    const question = state.quizQuestions[state.currentQuizIndex];
    const resultEl = document.getElementById('quizResult');
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach((opt, i) => {
        if (i === question.correct) {
            opt.classList.add('correct');
        }
        if (i === selectedIndex && selectedIndex !== question.correct) {
            opt.classList.add('wrong');
        }
    });
    
    if (selectedIndex === question.correct) {
        state.quizScore++;
    }
    
    resultEl.classList.remove('hidden');
    resultEl.textContent = selectedIndex === question.correct ? '✅ Correct!' : '❌ Incorrect';
    resultEl.style.color = selectedIndex === question.correct ? '#4caf50' : '#f44336';
    
    setTimeout(() => {
        state.currentQuizIndex++;
        renderQuizQuestion();
    }, 1500);
}

// ===== PRODUCTIVITY FUNCTIONS =====
function toggleTimer() {
    if (state.timerActive) {
        pauseTimer();
        document.getElementById('timerStartBtn').textContent = 'Resume';
    } else {
        startTimer();
        document.getElementById('timerStartBtn').textContent = 'Pause';
    }
}

function startTimer() {
    if (state.timerSeconds <= 0) {
        state.timerSeconds = state.timerMode === 'focus' ? 
            parseInt(document.getElementById('focusTime').value) * 60 : 
            parseInt(document.getElementById('breakTime').value) * 60;
    }
    
    state.timerActive = true;
    state.timerInterval = setInterval(() => {
        state.timerSeconds--;
        updateTimerDisplay();
        
        if (state.timerSeconds <= 0) {
            clearInterval(state.timerInterval);
            state.timerActive = false;
            
            if (state.timerMode === 'focus') {
                state.sessionCount++;
                document.getElementById('sessionCount').textContent = state.sessionCount;
                state.timerMode = 'break';
                state.timerSeconds = parseInt(document.getElementById('breakTime').value) * 60;
                document.getElementById('timerMode').textContent = 'Break Time';
                alert('Focus session complete! Take a break.');
            } else {
                state.timerMode = 'focus';
                state.timerSeconds = parseInt(document.getElementById('focusTime').value) * 60;
                document.getElementById('timerMode').textContent = 'Focus Time';
                alert('Break over! Time to focus.');
            }
            
            updateTimerDisplay();
            document.getElementById('timerStartBtn').textContent = 'Start';
            saveState();
        }
    }, 1000);
    
    saveState();
}

function pauseTimer() {
    clearInterval(state.timerInterval);
    state.timerActive = false;
    saveState();
}

function resetTimer() {
    clearInterval(state.timerInterval);
    state.timerActive = false;
    state.timerMode = 'focus';
    state.timerSeconds = parseInt(document.getElementById('focusTime').value) * 60;
    document.getElementById('timerMode').textContent = 'Focus Time';
    document.getElementById('timerStartBtn').textContent = 'Start';
    updateTimerDisplay();
    saveState();
}

function skipTimer() {
    clearInterval(state.timerInterval);
    state.timerActive = false;
    
    if (state.timerMode === 'focus') {
        state.timerMode = 'break';
        state.timerSeconds = parseInt(document.getElementById('breakTime').value) * 60;
        document.getElementById('timerMode').textContent = 'Break Time';
    } else {
        state.timerMode = 'focus';
        state.timerSeconds = parseInt(document.getElementById('focusTime').value) * 60;
        document.getElementById('timerMode').textContent = 'Focus Time';
    }
    
    updateTimerDisplay();
    document.getElementById('timerStartBtn').textContent = 'Start';
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const focusDisplay = document.getElementById('focusTimerLarge');
    if (display || focusDisplay) {
        const minutes = Math.floor(state.timerSeconds / 60);
        const seconds = state.timerSeconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (display) display.textContent = timeStr;
        if (focusDisplay) focusDisplay.textContent = timeStr;
    }
}

function enterFocusMode() {
    document.getElementById('focusModeOverlay').classList.remove('hidden');
    updateTimerDisplay();
    if (!state.timerActive) {
        state.timerSeconds = 25 * 60;
        updateTimerDisplay();
    }
}

function exitFocusMode() {
    document.getElementById('focusModeOverlay').classList.add('hidden');
}

function addTask() {
    const input = document.getElementById('taskInput');
    const priority = document.getElementById('prioritySelect');
    const date = document.getElementById('taskDate');
    
    const text = input.value.trim();
    if (!text) return;
    
    state.tasks.push({
        id: Date.now(),
        text,
        priority: priority.value,
        date: date.value || new Date().toISOString().split('T')[0],
        completed: false
    });
    
    input.value = '';
    saveState();
    renderSchedule();
    renderPlannerTasks();
}

function renderPlannerTasks() {
    const container = document.getElementById('plannerTasks');
    if (!container) return;
    
    container.innerHTML = state.tasks.map(task => `
        <div class="schedule-item">
            <span>${task.text}</span>
            <span>${task.date}</span>
            <span class="badge" style="background:${task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#4caf50'};color:white;padding:4px 8px;border-radius:8px;">
                ${task.priority}
            </span>
        </div>
    `).join('');
}

function addHabit() {
    const name = prompt('Enter habit name:');
    if (name) {
        state.habits.push({
            id: Date.now(),
            name,
            streak: 0,
            completed: false
        });
        saveState();
        renderHabits();
    }
}

function renderHabits() {
    const container = document.getElementById('habitsList');
    if (!container) return;
    
    container.innerHTML = state.habits.map(habit => `
        <div class="schedule-item">
            <span>${habit.name}</span>
            <span>🔥 ${habit.streak} day streak</span>
            <button onclick="toggleHabit(${habit.id})" style="background:transparent;border:none;color:var(--primary);cursor:pointer;">
                ${habit.completed ? '✅' : '⬜'}
            </button>
        </div>
    `).join('');
}

function toggleHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit) {
        habit.completed = !habit.completed;
        if (habit.completed) habit.streak++;
        saveState();
        renderHabits();
    }
}

// ===== KNOWLEDGE VAULT FUNCTIONS =====
function saveNote() {
    const editor = document.getElementById('notesEditor');
    const content = editor.innerHTML;
    const title = prompt('Enter note title:') || 'Untitled Note';
    
    state.notes.push({
        id: Date.now(),
        title,
        content,
        date: new Date().toISOString(),
        tags: []
    });
    
    saveState();
    alert('Note saved successfully!');
}

function loadNotes() {
    if (state.notes.length === 0) {
        alert('No saved notes found.');
        return;
    }
    
    const noteList = state.notes.map(n => n.title).join('\n');
    const title = prompt(`Saved notes:\n${noteList}\n\nEnter note title to load:`);
    
    const note = state.notes.find(n => n.title === title);
    if (note) {
        document.getElementById('notesEditor').innerHTML = note.content;
    }
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function addHeading() {
    document.execCommand('formatBlock', false, 'h2');
}

function addBulletList() {
    document.execCommand('insertUnorderedList', false, null);
}

function addCodeBlock() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const code = document.createElement('pre');
    code.style.background = 'rgba(0,0,0,0.3)';
    code.style.padding = '12px';
    code.style.borderRadius = '8px';
    code.textContent = selection.toString() || '// Your code here';
    range.deleteContents();
    range.insertNode(code);
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea?.addEventListener('click', () => fileInput.click());
    
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
    });
    
    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-gold)';
    });
    
    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-gold)';
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput?.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

function handleFiles(files) {
    const fileList = document.getElementById('fileList');
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'schedule-item';
        fileItem.innerHTML = `
            <span>📄 ${file.name}</span>
            <span>${(file.size / 1024).toFixed(1)} KB</span>
        `;
        fileList?.appendChild(fileItem);
    });
    saveState();
}

function summarizeText() {
    const input = document.getElementById('summarizeInput').value;
    const resultDiv = document.getElementById('summaryResult');
    
    if (!input.trim()) {
        alert('Please enter text to summarize.');
        return;
    }
    
    // Simulate AI summarization
    const words = input.split(' ');
    const summary = words.slice(0, Math.min(30, words.length)).join(' ') + '...';
    
    resultDiv.innerHTML = `
        <h4>📋 Summary</h4>
        <p>${summary}</p>
        <p style="color:var(--text-muted);margin-top:8px;">Original: ${words.length} words | Summary: ~30 words</p>
    `;
    resultDiv.classList.remove('hidden');
}

function createFolder() {
    const name = prompt('Enter folder name:');
    if (name && !state.folders.includes(name)) {
        state.folders.push(name);
        saveState();
        renderFolders();
    }
}

function renderFolders() {
    const container = document.getElementById('folderList');
    if (!container) return;
    
    container.innerHTML = state.folders.map(folder => `
        <div class="schedule-item" style="cursor:pointer;">
            <span>📁 ${folder}</span>
            <i class="fas fa-chevron-right"></i>
        </div>
    `).join('');
}

// ===== MOTIVATION FUNCTIONS =====
function saveJournalEntry() {
    const entry = document.getElementById('journalEntry').value.trim();
    if (!entry) return;
    
    state.journalEntries.push({
        id: Date.now(),
        text: entry,
        date: new Date().toISOString()
    });
    
    document.getElementById('journalEntry').value = '';
    saveState();
    renderJournalEntries();
}

function renderJournalEntries() {
    const container = document.getElementById('journalEntries');
    if (!container) return;
    
    container.innerHTML = state.journalEntries.slice(-5).reverse().map(entry => `
        <div class="schedule-item">
            <p>${entry.text}</p>
            <small style="color:var(--text-muted);">${new Date(entry.date).toLocaleDateString()}</small>
        </div>
    `).join('');
}

function addVisionItem() {
    const goal = prompt('Enter your academic goal:');
    if (goal) {
        state.visionItems.push({
            id: Date.now(),
            text: goal,
            achieved: false
        });
        saveState();
        renderVisionBoard();
    }
}

function renderVisionBoard() {
    const container = document.getElementById('visionBoard');
    if (!container) return;
    
    container.innerHTML = state.visionItems.map(item => `
        <div class="schedule-item">
            <span>${item.achieved ? '✅' : '⭐'} ${item.text}</span>
        </div>
    `).join('');
    
    if (state.visionItems.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Add your long-term academic goals</p>';
    }
}

function renderBadges() {
    const container = document.getElementById('badgesList');
    if (!container) return;
    
    container.innerHTML = state.badges.map(badge => `
        <div class="stat-card" style="opacity:${badge.earned ? '1' : '0.4'};">
            <span style="font-size:32px;">${badge.icon}</span>
            <div>
                <strong>${badge.name}</strong>
                <span style="display:block;font-size:12px;color:var(--text-muted);">${badge.earned ? 'Earned' : 'Locked'}</span>
            </div>
        </div>
    `).join('');
}

// ===== SETTINGS FUNCTIONS =====
function saveSettings() {
    const displayName = document.getElementById('displayName').value;
    const learningStyle = document.getElementById('learningStyle').value;
    
    document.querySelector('.user-name').textContent = displayName;
    localStorage.setItem('simbast

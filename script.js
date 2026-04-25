let notes = [];
let tasks = [];
let currentUser = null;
let studyStreak = 0;
let seconds = 1500;
let timerInterval;

try {
    notes = JSON.parse(localStorage.getItem('simba_notes')) || [];
    tasks = JSON.parse(localStorage.getItem('simba_tasks')) || [];
    currentUser = JSON.parse(localStorage.getItem('simba_user')) || null;
    studyStreak = parseInt(localStorage.getItem('simba_streak')) || 0;
} catch(e) {
    console.log('Starting fresh!');
}

function saveAll() {
    localStorage.setItem('simba_notes', JSON.stringify(notes));
    localStorage.setItem('simba_tasks', JSON.stringify(tasks));
    localStorage.setItem('simba_user', JSON.stringify(currentUser));
    localStorage.setItem('simba_streak', studyStreak.toString());
}

function showPage(page) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(page + 'Btn').classList.add('active');
    
    if (page === 'dashboard') showDashboard();
    else if (page === 'studyhub') showStudyHub();
    else if (page === 'planner') showPlanner();
    else if (page === 'vault') showVault();
    else if (page === 'focus') showFocusMode();
    else if (page === 'analytics') showAnalytics();
    else if (page === 'motivation') showMotivation();
    else if (page === 'login') showLogin();
}

function showDashboard() {
    const done = tasks.filter(t => t.completed).length;
    document.getElementById('mainContent').innerHTML = `
        <h1>👋 Welcome${currentUser ? ', ' + currentUser.name : ''}!</h1>
        <p style="font-size:18px;color:#aaa">"The expert in anything was once a beginner."</p>
        <div class="stats-grid">
            <div class="stat-card"><h3>🔥 ${studyStreak}</h3><p>Day Streak</p></div>
            <div class="stat-card"><h3>⏰ ${Math.floor(seconds/60)}m</h3><p>Timer</p></div>
            <div class="stat-card"><h3>✅ ${done}</h3><p>Tasks Done</p></div>
            <div class="stat-card"><h3>📈 85%</h3><p>Avg Score</p></div>
        </div>
        <h2>📅 Today's Tasks</h2>
        <div id="taskList">
            ${tasks.length === 0 ? '<p>No tasks yet!</p>' : tasks.map((t, i) => `
                <div class="task-item ${t.completed ? 'completed' : ''}">
                    <span>📚 ${t.text}</span>
                    <div>
                        <button onclick="toggleTask(${i})" class="btn" style="padding:5px 15px">${t.completed ? '↩️' : '✅'}</button>
                        <button onclick="deleteTask(${i})" class="btn" style="padding:5px 15px;background:#ef5350">🗑️</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="margin-top:20px">
            <input id="newTask" placeholder="Add task..." style="padding:10px;width:300px;border-radius:8px;border:none">
            <button onclick="addTask()" class="btn">➕ Add</button>
        </div>
    `;
}

function addTask() {
    const inp = document.getElementById('newTask');
    if(inp && inp.value.trim()) {
        tasks.push({text: inp.value, completed: false});
        inp.value = '';
        saveAll();
        showDashboard();
    }
}

function toggleTask(i) { tasks[i].completed = !tasks[i].completed; saveAll(); showDashboard(); }
function deleteTask(i) { tasks.splice(i, 1); saveAll(); showDashboard(); }

function showStudyHub() {
    document.getElementById('mainContent').innerHTML = `
        <h1>🧠 AI Study Assistant</h1>
        <div class="ai-chat-box">
            <h3>Ask me anything!</h3>
            <div class="ai-input-area">
                <input id="aiInput" placeholder="Type your question...">
                <button onclick="askAI()" class="btn">Ask AI ✨</button>
            </div>
            <div id="aiResponse"></div>
        </div>
        <h2>📝 Quick Flashcards</h2>
        <div class="stats-grid">
            <div class="stat-card"><h3>📐 Math</h3><p>Formulas & Equations</p></div>
            <div class="stat-card"><h3>🔬 Science</h3><p>Facts & Experiments</p></div>
            <div class="stat-card"><h3>📖 History</h3><p>Dates & Events</p></div>
            <div class="stat-card"><h3>📝 Vocabulary</h3><p>Words & Meanings</p></div>
        </div>
    `;
}

function askAI() {
    const q = document.getElementById('aiInput').value.toLowerCase();
    const r = document.getElementById('aiResponse');
    if(!q.trim()) { r.innerHTML = '<p style="color:#ef5350">Please type a question!</p>'; return; }
    const answers = {
        'math': 'Step 1: Identify the formula. Step 2: Plug in numbers. Step 3: Solve! ✅',
        'science': 'Think of it like puzzle pieces connecting together! 🧩',
        'study': 'Use Pomodoro: Study 25 min, break 5 min, repeat! ⏰'
    };
    let response = 'Great question! Let me explain...';
    for(let [key, value] of Object.entries(answers)) {
        if(q.includes(key)) response = value;
    }
    r.innerHTML = `<div style="margin-top:20px;padding:15px;background:rgba(0,255,0,0.1);border-radius:10px;border-left:3px solid #00ff00"><strong>🧠 Simba AI:</strong> ${response}</div>`;
}

function showPlanner() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    document.getElementById('mainContent').innerHTML = `
        <h1>📅 Weekly Planner</h1>
        <div class="planner-grid">
            ${days.map(d => `
                <div class="day-card">
                    <h3>${d}</h3>
                    <input placeholder="Subject" style="width:100%;padding:8px;margin:5px 0;border-radius:5px;border:none">
                    <input placeholder="Time" style="width:100%;padding:8px;margin:5px 0;border-radius:5px;border:none">
                    <button class="btn" style="width:100%;margin-top:10px;padding:8px">Save</button>
                </div>
            `).join('')}
        </div>
    `;
}

function showVault() {
    document.getElementById('mainContent').innerHTML = `
        <h1>📚 Knowledge Vault</h1>
        <div class="note-input-area">
            <input id="noteInput" placeholder="Write a note...">
            <button onclick="addNote()" class="btn">💾 Save Note</button>
        </div>
        <div class="notes-grid">
            ${notes.length === 0 ? '<p>No notes yet!</p>' : notes.map((n, i) => `
                <div class="note-card">
                    <p>${n.text}</p>
                    <small style="color:#aaa">${new Date(n.date).toLocaleDateString()}</small>
                    <br>
                    <button onclick="deleteNote(${i})" class="btn" style="margin-top:10px;background:#ef5350;padding:5px 15px">🗑️</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addNote() {
    const inp = document.getElementById('noteInput');
    if(inp && inp.value.trim()) {
        notes.push({text: inp.value, date: new Date().toISOString()});
        inp.value = '';
        saveAll();
        showVault();
    }
}

function deleteNote(i) { notes.splice(i, 1); saveAll(); showVault(); }

function showFocusMode() {
    document.getElementById('mainContent').innerHTML = `
        <div class="focus-center">
            <h1>🎯 Focus Mode</h1>
            <div class="timer-display" id="timerDisplay">25:00</div>
            <div style="margin:30px">
                <button onclick="startTimer()" class="btn" style="padding:15px 40px;font-size:18px">▶️ START</button>
                <button onclick="pauseTimer()" class="btn" style="padding:15px 40px;font-size:18px;background:#ffa726">⏸️ PAUSE</button>
                <button onclick="resetTimer()" class="btn" style="padding:15px 40px;font-size:18px;background:#ef5350">🔄 RESET</button>
            </div>
            <p style="font-style:italic;color:#aaa">"Focus on being productive instead of busy."</p>
        </div>
    `;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(seconds > 0) {
            seconds--;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const display = document.getElementById('timerDisplay');
            if(display) display.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        } else {
            clearInterval(timerInterval);
            alert('Great job! Take a break!');
            studyStreak++;
            saveAll();
        }
    }, 1000);
}

function pauseTimer() { clearInterval(timerInterval); }

function resetTimer() {
    clearInterval(timerInterval);
    seconds = 1500;
    const display = document.getElementById('timerDisplay');
    if(display) display.textContent = '25:00';
}

function showAnalytics() {
    document.getElementById('mainContent').innerHTML = `
        <h1>📈 Performance Analytics</h1>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Overall Progress</h3>
                <div style="background:rgba(255,255,255,0.2);height:20px;border-radius:10px;margin:10px 0">
                    <div style="background:#ffd700;width:75%;height:100%;border-radius:10px"></div>
                </div>
                <p>75% Complete</p>
            </div>
            <div class="stat-card"><h3>🎯 Subjects</h3><p>Math: 85%</p><p>Science: 72%</p><p>History: 90%</p></div>
        </div>
    `;
}

function showMotivation() {
    const quotes = [
        {t: "Believe you can and you're halfway there.", a: "Theodore Roosevelt"},
        {t: "Success is not final, failure is not fatal.", a: "Winston Churchill"},
        {t: "Push yourself, because no one else will do it for you.", a: "Unknown"}
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('mainContent').innerHTML = `
        <h1>💪 Motivation & Growth</h1>
        <div class="stat-card" style="text-align:center;margin-bottom:30px">
            <h2 style="font-style:italic">"${q.t}"</h2>
            <p>- ${q.a}</p>
            <button onclick="showMotivation()" class="btn" style="margin-top:15px">🔄 New Quote</button>
        </div>
        <h2>🏆 Achievements</h2>
        <div class="stats-grid">
            <div class="stat-card"><h3>🏅</h3><p>${studyStreak}-Day Streak</p></div>
            <div class="stat-card"><h3>📚</h3><p>${notes.length} Notes</p></div>
            <div class="stat-card"><h3>✅</h3><p>${tasks.filter(t=>t.completed).length} Tasks</p></div>
        </div>
    `;
}

function showLogin() {
    if(currentUser) {
        document.getElementById('mainContent').innerHTML = `
            <div class="login-box">
                <h2>Welcome, ${currentUser.name}!</h2>
                <p>Email: ${currentUser.email}</p>
                <button onclick="logout()" class="btn" style="background:#ef5350;margin-top:20px;width:100%">🚪 Logout</button>
            </div>
        `;
    } else {
        document.getElementById('mainContent').innerHTML = `
            <div class="login-box">
                <h2>Create Account</h2>
                <input id="signupName" placeholder="Your Name">
                <input id="signupEmail" placeholder="Email">
                <input id="signupPass" placeholder="Password" type="password">
                <button onclick="signup()" class="btn" style="width:100%">🚀 Sign Up</button>
            </div>
        `;
    }
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    if(name && email) {
        currentUser = {name, email};
        saveAll();
        alert('Account created!');
        showPage('dashboard');
    } else {
        alert('Please fill in all fields!');
    }
}

function logout() { currentUser = null; saveAll(); showPage('login'); }

showPage('dashboard');
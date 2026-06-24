// ------------------- DOM elements -------------------
const taskForm = document.getElementById('taskForm'), taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect'), dueDateInput = document.getElementById('dueDateInput'), categorySelect = document.getElementById('categorySelect');
const taskList = document.getElementById('taskList'), searchInput = document.getElementById('searchInput');
const filterPriority = document.getElementById('filterPriority'), filterCategory = document.getElementById('filterCategory'), filterStatus = document.getElementById('filterStatus'), sortSelect = document.getElementById('sortSelect');
const clearFiltersBtn = document.getElementById('clearFiltersBtn'), markAllBtn = document.getElementById('markAllBtn'), clearCompletedBtn = document.getElementById('clearCompletedBtn');
const themeToggle = document.getElementById('themeToggle'), emptyMsgDiv = document.getElementById('emptyMsg'), toastDiv = document.getElementById('toast');
const editModal = document.getElementById('editModal'), editTaskInput = document.getElementById('editTaskInput'), editPriority = document.getElementById('editPriority'), editCategory = document.getElementById('editCategory');
const saveEditBtn = document.getElementById('saveEditBtn'), cancelEditBtn = document.getElementById('cancelEditBtn');
const weatherBtn = document.getElementById('getWeatherBtn'), cityInput = document.getElementById('cityInput'), weatherResult = document.getElementById('weatherResult');
let tasks = []; let nextId = 4; let currentEditLi = null; let toastTimer = null;

// DEFAULT TASKS
const defaultTasks = [
    { id: 1, text: "Learn HTML/CSS", priority: "medium", category: "study", dueDate: "", completed: false, createdAt: Date.now() - 86400000 },
    { id: 2, text: "JavaScript Project", priority: "high", category: "study", dueDate: "", completed: true, createdAt: Date.now() - 43200000 },
    { id: 3, text: "Morning Workout", priority: "high", category: "health", dueDate: "", completed: false, createdAt: Date.now() }
];

// Helper functions
function escapeHtml(str) { return str.replace(/[&<>]/g, function (m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
function showToast(msg) { if (toastTimer) clearTimeout(toastTimer); toastDiv.textContent = msg; toastDiv.classList.add('show'); toastTimer = setTimeout(() => toastDiv.classList.remove('show'), 2500); }
function updateCharCount() { document.getElementById('charCount').innerText = taskInput.value.length + '/80'; }
taskInput.addEventListener('input', updateCharCount);

// Render tasks from array
function renderTasks() {
    taskList.innerHTML = '';
    let filtered = [...tasks];
    const searchTerm = searchInput.value.toLowerCase();
    filtered = filtered.filter(t => t.text.toLowerCase().includes(searchTerm));
    if (filterPriority.value !== 'all') filtered = filtered.filter(t => t.priority === filterPriority.value);
    if (filterCategory.value !== 'all') filtered = filtered.filter(t => t.category === filterCategory.value);
    if (filterStatus.value === 'active') filtered = filtered.filter(t => !t.completed);
    if (filterStatus.value === 'completed') filtered = filtered.filter(t => t.completed);
    // Sorting
    if (sortSelect.value === 'az') filtered.sort((a, b) => a.text.localeCompare(b.text));
    else if (sortSelect.value === 'priority') { const order = { high: 0, medium: 1, low: 2 }; filtered.sort((a, b) => order[a.priority] - order[b.priority]); }
    else if (sortSelect.value === 'oldest') filtered.sort((a, b) => a.createdAt - b.createdAt);
    else filtered.sort((a, b) => b.createdAt - a.createdAt); // newest

    filtered.forEach(task => {
        const li = document.createElement('li'); li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id; li.dataset.priority = task.priority; li.dataset.category = task.category; li.dataset.completed = task.completed;
        li.innerHTML = `<span class="task-text">${escapeHtml(task.text)}</span>
                <span class="badge priority-${task.priority}">${task.priority}</span>
                <span class="badge">${task.category}</span>
                ${task.dueDate ? `<span class="badge">📅 ${task.dueDate}</span>` : ''}
                <div class="task-actions">
                    <button class="editBtn btn btn-sm btn-outline">✏️</button>
                    <button class="deleteBtn btn btn-sm btn-danger">🗑️</button>
                    <button class="markBtn btn btn-sm btn-success">✔️</button>
                </div>`;
        // mouseover effect
        li.addEventListener('mouseover', () => li.style.transform = 'translateX(5px)');
        li.addEventListener('mouseout', () => li.style.transform = '');
        taskList.appendChild(li);
    });
    updateStatsAndUI();
    saveToLocalStorage();
    emptyMsgDiv.style.display = filtered.length === 0 ? 'block' : 'none';
}

function updateStatsAndUI() {
    const total = tasks.length, completed = tasks.filter(t => t.completed).length, active = total - completed, high = tasks.filter(t => t.priority === 'high').length;
    document.getElementById('totalCount').innerText = total; document.getElementById('activeCount').innerText = active;
    document.getElementById('completedCount').innerText = completed; document.getElementById('highCount').innerText = high;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progressBar').style.width = `${percent}%`; document.getElementById('progressPercent').innerText = `${percent}%`;
    // category table
    const cats = ['personal', 'work', 'study', 'health']; const tbody = document.getElementById('statsTableBody'); tbody.innerHTML = '';
    cats.forEach(cat => {
        const catTasks = tasks.filter(t => t.category === cat); const catTotal = catTasks.length; const catComp = catTasks.filter(t => t.completed).length;
        const catActive = catTotal - catComp; const catPct = catTotal ? Math.round((catComp / catTotal) * 100) : 0;
        tbody.innerHTML += `<tr><td>${cat}</td><td>${catTotal}</td><td>${catComp}</td><td>${catActive}</td><td><div style="background:#e2e8f0;border-radius:20px;height:6px;width:80px;"><div style="width:${catPct}%;background:var(--primary);height:6px;border-radius:20px;"></div></div> ${catPct}%</td></tr>`;
    });
}

function saveToLocalStorage() { localStorage.setItem('todoTasks', JSON.stringify(tasks)); }
function loadFromStorage() { const stored = localStorage.getItem('todoTasks'); if (stored) { tasks = JSON.parse(stored); nextId = Math.max(...tasks.map(t => t.id), 0) + 1; } else { tasks = defaultTasks; nextId = 4; } renderTasks(); }

// task actions
function addTask(text, priority, category, dueDate) {
    const newTask = { id: nextId++, text: text.trim(), priority, category, dueDate, completed: false, createdAt: Date.now() };
    tasks.push(newTask);
    renderTasks();
    showToast(`✅ "${text}" added`);
}
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = taskInput.value.trim();
    if (!val) { document.getElementById('taskError').innerText = 'Task cannot be empty'; return; }
    if (val.length < 2) { document.getElementById('taskError').innerText = 'Minimum 2 chars'; return; }
    document.getElementById('taskError').innerText = '';
    addTask(val, prioritySelect.value, categorySelect.value, dueDateInput.value);
    taskInput.value = ''; dueDateInput.value = ''; updateCharCount();
});

function deleteTaskById(id) { tasks = tasks.filter(t => t.id !== id); renderTasks(); showToast('🗑️ Task deleted'); }
function toggleComplete(id) { const task = tasks.find(t => t.id === id); if (task) task.completed = !task.completed; renderTasks(); showToast(task.completed ? '🎉 Completed!' : '↩️ Active'); }
function editTaskSave(id, newText, newPriority, newCategory) { const t = tasks.find(t => t.id === id); if (t && newText.trim().length >= 2) { t.text = newText.trim(); t.priority = newPriority; t.category = newCategory; renderTasks(); showToast('✏️ Updated'); } else showToast('Invalid name'); }

// Event delegation
taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item'); if (!li) return;
    const id = parseInt(li.dataset.id);
    if (e.target.classList.contains('deleteBtn')) deleteTaskById(id);
    else if (e.target.classList.contains('markBtn')) toggleComplete(id);
    else if (e.target.classList.contains('editBtn')) { currentEditLi = id; editTaskInput.value = tasks.find(t => t.id === id).text; editPriority.value = tasks.find(t => t.id === id).priority; editCategory.value = tasks.find(t => t.id === id).category; editModal.style.display = 'flex'; }
});
saveEditBtn.addEventListener('click', () => { if (currentEditLi !== null) editTaskSave(currentEditLi, editTaskInput.value, editPriority.value, editCategory.value); closeModal(); });
cancelEditBtn.addEventListener('click', closeModal); function closeModal() { editModal.style.display = 'none'; currentEditLi = null; }
markAllBtn.addEventListener('click', () => { tasks.forEach(t => t.completed = true); renderTasks(); showToast('✔️ All tasks completed'); });
clearCompletedBtn.addEventListener('click', () => { tasks = tasks.filter(t => !t.completed); renderTasks(); showToast('🧹 Cleared completed tasks'); });
searchInput.addEventListener('input', renderTasks); filterPriority.addEventListener('change', renderTasks); filterCategory.addEventListener('change', renderTasks); filterStatus.addEventListener('change', renderTasks); sortSelect.addEventListener('change', renderTasks);
clearFiltersBtn.addEventListener('click', () => { searchInput.value = ''; filterPriority.value = 'all'; filterCategory.value = 'all'; filterStatus.value = 'all'; sortSelect.value = 'newest'; renderTasks(); showToast('Filters cleared'); });

// Dark mode toggle
themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); const isDark = document.body.classList.contains('dark'); localStorage.setItem('darkMode', isDark); themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode'; showToast(isDark ? 'Dark mode' : 'Light mode'); });
if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark'); themeToggle.textContent = '☀️ Light Mode'; }

// Gallery Grid + interactive mouseover
const gridItems = [{ cat: 'study', title: 'Study Zone', desc: 'Pomodoro' }, { cat: 'work', title: 'Deep Work', desc: 'Focus' }, { cat: 'health', title: 'Hydrate', desc: 'Wellness' }, { cat: 'study', title: 'Flashcards', desc: 'Recall' }, { cat: 'work', title: 'Kanban', desc: 'Visual' }, { cat: 'health', title: 'Stretch', desc: 'Movement' }];
const galleryGridDiv = document.getElementById('galleryGrid');
gridItems.forEach(g => { const div = document.createElement('div'); div.className = 'gallery-item'; div.setAttribute('data-category', g.cat); div.innerHTML = `<div style="font-size:2rem;">${g.cat === 'study' ? '📚' : g.cat === 'work' ? '💼' : '🧘'}</div><strong>${g.title}</strong><p>${g.desc}</p>`; div.addEventListener('mouseover', () => div.style.background = 'var(--primary-soft)'); div.addEventListener('mouseout', () => div.style.background = ''); galleryGridDiv.appendChild(div); });

// Image Slider logic
const slidesWrapper = document.getElementById('slidesWrapper'); const slidesArr = Array.from(document.querySelectorAll('.slide')); let slideIndex = 0;
function updateSlider() { slidesWrapper.style.transform = `translateX(-${slideIndex * 100}%)`; document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === slideIndex)); }
function goSlide(dir) { slideIndex = (slideIndex + dir + slidesArr.length) % slidesArr.length; updateSlider(); }
document.getElementById('prevSlide').addEventListener('click', () => goSlide(-1)); document.getElementById('nextSlide').addEventListener('click', () => goSlide(1));
function initDots() { const dotsDiv = document.getElementById('sliderDots'); dotsDiv.innerHTML = ''; slidesArr.forEach((_, i) => { const dot = document.createElement('button'); dot.classList.add('dot'); if (i === 0) dot.classList.add('active'); dot.addEventListener('click', () => { slideIndex = i; updateSlider(); }); dotsDiv.appendChild(dot); }); }
initDots(); updateSlider(); setInterval(() => goSlide(1), 5000);

// Weather API (Open-Meteo + Geocoding)
async function fetchWeather() { const city = cityInput.value.trim(); if (!city) { weatherResult.innerHTML = '⚠️ Enter city'; return; } weatherResult.innerHTML = '⏳ Fetching...'; try { const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`); const geoData = await geo.json(); if (!geoData.results) throw new Error('City not found'); const { latitude, longitude, name } = geoData.results[0]; const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m&timezone=auto`); const w = await weatherRes.json(); const temp = Math.round(w.current.temperature_2m); const code = w.current.weather_code; let icon = code === 0 ? '☀️' : code < 3 ? '⛅' : '🌧️'; weatherResult.innerHTML = `<div class="weather-info"><div class="weather-icon">${icon}</div><div><strong>${escapeHtml(name)}</strong><br>${temp}°C · Humidity ${w.current.relative_humidity_2m}%</div></div>`; showToast(`Weather updated for ${name}`); } catch (err) { weatherResult.innerHTML = '❌ Unable to fetch weather'; } }
weatherBtn.addEventListener('click', fetchWeather); cityInput.addEventListener('keypress', (e) => e.key === 'Enter' && fetchWeather());

// AUTO CHAIN: after any data mutation renderTasks calls stats + save + filter refresh automatically
loadFromStorage();
// AUTO SLIDER


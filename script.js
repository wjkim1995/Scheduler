function safeParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

const DEFAULT_CATEGORIES = ["병원", "회사", "외근", "개인"];
const DEFAULT_COLORS = {"병원":"#4f8dff", "회사":"#8b5cf6", "외근":"#ff7a45", "개인":"#9ca3af"};
let tasks = safeParse("tasks", []);
let categories = safeParse("categories", DEFAULT_CATEGORIES);
let categoryColors = safeParse("categoryColors", DEFAULT_COLORS);
let currentDate = new Date();
let selectedDate = getTodayText();
let editingId = null;

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const $ = id => document.getElementById(id);

function getTodayText() {
    const now = new Date();
    return formatDate(now.getFullYear(), now.getMonth(), now.getDate());
}
function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function formatDateLabel(dateText) {
    const date = new Date(`${dateText}T00:00:00`);
    return `${date.getMonth() + 1}/${date.getDate()} ${dayNames[date.getDay()]}`;
}
function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
}
function getCategoryColor(category) { return categoryColors[category] || "#555555"; }

function normalizeData() {
    if (!Array.isArray(tasks)) tasks = [];
    if (!Array.isArray(categories) || categories.length === 0) categories = [...DEFAULT_CATEGORIES];
    categories = [...new Set(categories.map(item => typeof item === "string" ? item.trim() : String(item?.name || "").trim()).filter(Boolean))];
    categoryColors = (!categoryColors || typeof categoryColors !== "object" || Array.isArray(categoryColors)) ? {} : categoryColors;
    categories.forEach(c => { if (!categoryColors[c]) categoryColors[c] = DEFAULT_COLORS[c] || "#555555"; });
    tasks = tasks.filter(t => t && t.text && t.date).map(t => ({
        id: t.id || Date.now() + Math.random(),
        text: String(t.text),
        date: t.date,
        category: categories.includes(t.category) ? t.category : categories[0],
        type: t.type === "memo" ? "memo" : "task",
        done: Boolean(t.done),
        completedAt: t.done ? (t.completedAt || getTodayText()) : null
    }));
}
function saveData() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("categoryColors", JSON.stringify(categoryColors));
}
function rollOverUnfinishedTasks() {
    const today = getTodayText();
    if (localStorage.getItem("lastRolloverDate") === today) return;
    tasks = tasks.map(task => task.type !== "memo" && !task.done && task.date < today ? {...task, date: today} : task);
    localStorage.setItem("lastRolloverDate", today);
}

function renderCategories() {
    $("categoryInput").innerHTML = "";
    $("editCategory").innerHTML = "";
    categories.forEach(category => {
        const a = new Option(category, category);
        const b = new Option(category, category);
        $("categoryInput").appendChild(a);
        $("editCategory").appendChild(b);
    });
}
function renderLegend() {
    const list = $("legendList");
    list.innerHTML = "";
    categories.forEach(category => {
        const row = document.createElement("div");
        row.className = "legend-row";
        row.innerHTML = `<span class="legend-dot" style="background:${getCategoryColor(category)}"></span><span>${escapeHtml(category)}</span><span class="legend-chip">일정</span>`;
        list.appendChild(row);
    });
}

function createCalendarItem(task) {
    const item = document.createElement("div");
    item.className = task.done ? "task calendar-task done" : "task calendar-task";
    item.innerHTML = `<span class="task-dot" style="background:${getCategoryColor(task.category)}"></span><span>${escapeHtml(task.text)}</span>`;
    item.querySelector("span:last-child").addEventListener("click", e => { e.stopPropagation(); openTaskModal(task.id); });
    return item;
}
function renderCalendar() {
    const calendar = $("calendar");
    calendar.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        calendar.appendChild(empty);
    }
    for (let day = 1; day <= lastDate; day++) {
        const dateText = formatDate(year, month, day);
        const dayDate = new Date(year, month, day);
        const schedules = tasks.filter(t => t.date === dateText && t.type !== "memo");
        const dayBox = document.createElement("div");
        dayBox.className = "day";
        if (dateText === getTodayText()) dayBox.classList.add("today");
        if (dateText === selectedDate) dayBox.classList.add("selected");
        dayBox.innerHTML = `<div class="date-head"><span class="date-num">${day}</span><span class="day-name">${dayNames[dayDate.getDay()]}</span></div>`;
        dayBox.addEventListener("click", () => { selectedDate = dateText; $("dateInput").value = dateText; renderAll(); });
        schedules.forEach(task => dayBox.appendChild(createCalendarItem(task)));
        calendar.appendChild(dayBox);
    }
    renderDashboard();
}
function renderDashboard() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthTasks = tasks.filter(t => {
        const d = new Date(`${t.date}T00:00:00`);
        return d.getFullYear() === year && d.getMonth() === month && t.type !== "memo";
    });
    const total = monthTasks.length;
    const done = monthTasks.filter(t => t.done).length;
    const rate = total ? Math.round(done / total * 100) : 0;
    $("totalCount").textContent = total;
    $("doneCount").textContent = done;
    $("remainCount").textContent = total - done;
    $("rate").textContent = `${rate}%`;
}

function createTodoRow(task) {
    const row = document.createElement("li");
    row.className = "todo-row";
    row.innerHTML = `<input type="checkbox"><span class="item-dot" style="background:${getCategoryColor(task.category)}"></span><span>${escapeHtml(task.text)}</span>`;
    row.querySelector("input").addEventListener("change", () => toggleDone(task.id));
    row.querySelector("span:last-child").addEventListener("click", () => openTaskModal(task.id));
    return row;
}
function createDoneRow(task) {
    const row = document.createElement("li");
    row.className = "done-row";
    row.innerHTML = `<span class="done-mark">✓</span><span class="item-dot" style="background:${getCategoryColor(task.category)}"></span><span>${escapeHtml(task.text)}</span><button type="button" title="되돌리기">↺</button>`;
    row.querySelector("span:nth-of-type(3)").addEventListener("click", () => openTaskModal(task.id));
    row.querySelector("button").addEventListener("click", () => toggleDone(task.id));
    return row;
}
function appendTodoSection(list, title, items) {
    const head = document.createElement("li");
    head.className = "todo-section";
    head.textContent = title;
    list.appendChild(head);
    if (!items.length) {
        const empty = document.createElement("li");
        empty.className = "todo-empty";
        empty.textContent = "미완료 항목이 없어요";
        list.appendChild(empty);
        return;
    }
    items.forEach(t => list.appendChild(createTodoRow(t)));
}
function renderToday() {
    const today = getTodayText();
    $("todoDateTitle").textContent = `${formatDateLabel(today)} 기준`;
    const todayItems = tasks.filter(t => t.date === today && !t.done);
    const memos = todayItems.filter(t => t.type === "memo");
    const schedules = todayItems.filter(t => t.type !== "memo");
    const list = $("todayList");
    list.innerHTML = "";
    appendTodoSection(list, "메모", memos);
    appendTodoSection(list, "일정", schedules);

    const todaySchedules = tasks.filter(t => t.date === today && t.type !== "memo");
    const done = todaySchedules.filter(t => t.done).length;
    const rate = todaySchedules.length ? Math.round(done / todaySchedules.length * 100) : 0;
    $("todayRate").textContent = `${rate}% (${done} / ${todaySchedules.length})`;
    $("todayProgressFill").style.width = `${rate}%`;
}
function renderCompleted() {
    const today = getTodayText();
    const completed = tasks.filter(t => t.done && (t.completedAt || t.date) === today);
    $("completedCount").textContent = completed.length;
    const list = $("completedList");
    list.innerHTML = "";
    if (!completed.length) {
        list.innerHTML = `<li class="completed-empty">오늘 완료한 항목이 없어요</li>`;
        return;
    }
    completed.forEach(t => list.appendChild(createDoneRow(t)));
}
function renderSelectedDay() {
    const title = $("selectedDayTitle");
    const list = $("selectedDayList");
    title.textContent = `${formatDateLabel(selectedDate)} 일정`;
    const items = tasks.filter(t => t.date === selectedDate);
    const memos = items.filter(t => t.type === "memo");
    const schedules = items.filter(t => t.type !== "memo");
    list.innerHTML = "";
    const makeGroup = (label, groupItems, empty) => {
        const group = document.createElement("div");
        group.className = "sidebar-group";
        group.innerHTML = `<div class="detail-section-title">${label} (${groupItems.length})</div>`;
        if (!groupItems.length) group.innerHTML += `<div class="detail-empty">${empty}</div>`;
        groupItems.forEach(t => group.appendChild(createDoneRowForDetail(t)));
        list.appendChild(group);
    };
    makeGroup("📝 메모", memos, "선택한 날짜의 메모가 없어요");
    makeGroup("✅ 일정", schedules, "선택한 날짜의 일정이 없어요");
}
function createDoneRowForDetail(task) {
    const row = document.createElement("div");
    row.className = task.done ? "detail-item done" : "detail-item";
    row.innerHTML = `<span class="item-dot" style="background:${getCategoryColor(task.category)}"></span><span>${escapeHtml(task.text)}</span><button type="button" title="삭제">🗑️</button>`;
    row.querySelector("span:nth-of-type(2)").addEventListener("click", () => openTaskModal(task.id));
    row.querySelector("button").addEventListener("click", () => deleteTaskById(task.id));
    return row;
}
function renderAll() {
    renderCalendar();
    renderToday();
    renderCompleted();
    renderLegend();
    renderSelectedDay();
}

function addTask() {
    const text = $("taskInput").value.trim();
    const date = $("dateInput").value;
    if (!text || !date) { alert("일정 내용과 날짜를 입력해주세요."); return; }
    tasks.push({id: Date.now(), text, date, category: $("categoryInput").value || categories[0], type: $("typeInput").value || "task", done: false, completedAt: null});
    $("taskInput").value = "";
    saveData(); renderAll();
}
function toggleDone(id) {
    tasks = tasks.map(t => t.id === id ? {...t, done: !t.done, completedAt: !t.done ? getTodayText() : null} : t);
    saveData(); renderAll();
}
function deleteTaskById(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveData(); renderAll();
}
function openTaskModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    $("editText").value = task.text;
    $("editDate").value = task.date;
    $("editType").value = task.type;
    $("editCategory").value = task.category;
    $("taskModal").classList.remove("hidden");
}
function closeTaskModal() { $("taskModal").classList.add("hidden"); editingId = null; }
function saveTask() {
    const text = $("editText").value.trim();
    if (!text) { alert("일정 내용을 입력해주세요."); return; }
    tasks = tasks.map(t => t.id === editingId ? {...t, text, date: $("editDate").value, type: $("editType").value, category: $("editCategory").value} : t);
    saveData(); closeTaskModal(); renderAll();
}
function deleteTask() { deleteTaskById(editingId); closeTaskModal(); }

function openCategoryModal() {
    const list = $("categoryList"); list.innerHTML = "";
    categories.forEach(c => addCategoryRow(c, getCategoryColor(c)));
    $("categoryModal").classList.remove("hidden");
}
function closeCategoryModal() { $("categoryModal").classList.add("hidden"); }
function addCategoryRow(name = "새 카테고리", color = "#555555") {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `<input type="text" value="${escapeHtml(name)}"><input type="color" value="${color}"><button type="button">삭제</button>`;
    row.querySelector("button").addEventListener("click", () => row.remove());
    $("categoryList").appendChild(row);
}
function saveCategories() {
    const newCategories = [], newColors = {};
    document.querySelectorAll(".category-row").forEach(row => {
        const name = row.querySelector('input[type="text"]').value.trim();
        const color = row.querySelector('input[type="color"]').value;
        if (name && !newCategories.includes(name)) { newCategories.push(name); newColors[name] = color; }
    });
    if (!newCategories.length) { alert("카테고리는 최소 1개 이상 필요합니다."); return; }
    categories = newCategories;
    categoryColors = newColors;
    tasks = tasks.map(t => categories.includes(t.category) ? t : {...t, category: categories[0]});
    saveData(); renderCategories(); closeCategoryModal(); renderAll();
}

function init() {
    normalizeData(); rollOverUnfinishedTasks(); saveData();
    $("dateInput").value = selectedDate;
    $("addTaskBtn").addEventListener("click", addTask);
    $("taskInput").addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
    $("prevBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); });
    $("nextBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); });
    $("categoryBtn").addEventListener("click", openCategoryModal);
    $("legendEditBtn").addEventListener("click", openCategoryModal);
    $("selectedDayAddBtn").addEventListener("click", () => { $("dateInput").value = selectedDate; $("taskInput").focus(); });
    $("addCategoryBtn").addEventListener("click", () => addCategoryRow());
    $("saveCategoryBtn").addEventListener("click", saveCategories);
    $("closeCategoryBtn").addEventListener("click", closeCategoryModal);
    $("saveTaskBtn").addEventListener("click", saveTask);
    $("deleteTaskBtn").addEventListener("click", deleteTask);
    $("closeTaskBtn").addEventListener("click", closeTaskModal);
    renderCategories(); renderAll();
}
init();

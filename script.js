function safeParse(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        return fallback;
    }
}

const DEFAULT_CATEGORIES = ["병원", "회사", "외근", "할 일"];
const DEFAULT_COLORS = {
    "병원": "#4f8dff",
    "회사": "#8b5cf6",
    "외근": "#ff7a45",
    "할 일": "#555555"
};

let tasks = safeParse("tasks", []);
let goals = safeParse("goals", []);
let memo = localStorage.getItem("memo") || "";
let categories = safeParse("categories", DEFAULT_CATEGORIES);
let categoryColors = safeParse("categoryColors", DEFAULT_COLORS);
let currentDate = new Date();
let editingId = null;

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const $ = (id) => document.getElementById(id);

const taskInput = $("taskInput");
const dateInput = $("dateInput");
const categoryInput = $("categoryInput");
const calendar = $("calendar");
const taskModal = $("taskModal");
const editText = $("editText");
const editDate = $("editDate");
const editCategory = $("editCategory");
const categoryModal = $("categoryModal");
const categoryList = $("categoryList");
const memoInput = $("memoInput");

function normalizeData() {
    if (!Array.isArray(tasks)) tasks = [];
    if (!Array.isArray(goals)) goals = [];

    // 예전 코드에서 카테고리가 객체 배열로 저장되었거나 비어 있는 경우까지 방어
    if (!Array.isArray(categories) || categories.length === 0) {
        categories = [...DEFAULT_CATEGORIES];
    }

    categories = categories
        .map(item => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") return String(item.name || item.category || item.text || "").trim();
            return "";
        })
        .filter(Boolean);

    categories = [...new Set(categories)];
    if (categories.length === 0) categories = [...DEFAULT_CATEGORIES];

    if (!categoryColors || typeof categoryColors !== "object" || Array.isArray(categoryColors)) {
        categoryColors = {};
    }

    categories.forEach(category => {
        if (!categoryColors[category]) {
            categoryColors[category] = DEFAULT_COLORS[category] || "#555555";
        }
    });

    tasks = tasks
        .filter(task => task && task.text && task.date)
        .map(task => ({
            id: task.id || Date.now() + Math.random(),
            text: String(task.text),
            date: task.date,
            category: categories.includes(task.category) ? task.category : categories[0],
            done: Boolean(task.done)
        }));
}

function saveData() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("memo", memoInput ? memoInput.value : "");
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("categoryColors", JSON.stringify(categoryColors));
}

function getTodayText() {
    const now = new Date();
    return formatDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCategoryColor(category) {
    return categoryColors[category] || "#555555";
}

function getLightColor(hex) {
    return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}20` : "#eeeeee";
}

function renderCategories() {
    categoryInput.innerHTML = "";
    editCategory.innerHTML = "";

    categories.forEach(category => {
        const option1 = document.createElement("option");
        option1.value = category;
        option1.textContent = category;

        const option2 = document.createElement("option");
        option2.value = category;
        option2.textContent = category;

        categoryInput.appendChild(option1);
        editCategory.appendChild(option2);
    });
}

function openCategoryModal() {
    categoryList.innerHTML = "";
    categories.forEach(category => addCategoryRow(category, getCategoryColor(category)));
    categoryModal.classList.remove("hidden");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
}

function addCategoryRow(name = "새 카테고리", color = "#555555") {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
        <input type="text" value="${escapeHtml(name)}">
        <input type="color" value="${color}">
        <button type="button">삭제</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    categoryList.appendChild(row);
}

function saveCategories() {
    const rows = document.querySelectorAll(".category-row");
    const newCategories = [];
    const newColors = {};

    rows.forEach(row => {
        const name = row.querySelector('input[type="text"]').value.trim();
        const color = row.querySelector('input[type="color"]').value;
        if (name && !newCategories.includes(name)) {
            newCategories.push(name);
            newColors[name] = color;
        }
    });

    if (newCategories.length === 0) {
        alert("카테고리는 최소 1개 이상 필요합니다.");
        return;
    }

    categories = newCategories;
    categoryColors = newColors;
    tasks = tasks.map(task => categories.includes(task.category) ? task : { ...task, category: categories[0] });

    saveData();
    renderCategories();
    renderCalendar();
    closeCategoryModal();
}

function closeCategoryModal() {
    categoryModal.classList.add("hidden");
}

function renderCalendar() {
    calendar.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    $("monthTitle").textContent = `${year}년 ${month + 1}월`;

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
        const dayTasks = tasks.filter(task => task.date === dateText);
        const total = dayTasks.length;
        const done = dayTasks.filter(task => task.done).length;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);

        const dayBox = document.createElement("div");
        dayBox.className = "day";
        if (dateText === getTodayText()) dayBox.classList.add("today");

        dayBox.innerHTML = `
            <div class="date-head">
                <span class="date-num">${day}</span>
                <span class="day-name">${dayNames[dayDate.getDay()]}</span>
            </div>
            <div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div>
        `;

        dayBox.addEventListener("click", () => { dateInput.value = dateText; });

        dayTasks.forEach(task => {
            const taskEl = document.createElement("div");
            const color = getCategoryColor(task.category);
            taskEl.className = task.done ? "task done" : "task";
            taskEl.style.color = color;
            taskEl.style.backgroundColor = getLightColor(color);
            taskEl.innerHTML = `
                <input type="checkbox" ${task.done ? "checked" : ""}>
                <span>${escapeHtml(task.text)}</span>
            `;
            taskEl.querySelector("input").addEventListener("click", event => {
                event.stopPropagation();
                toggleDone(task.id);
            });
            taskEl.querySelector("span").addEventListener("click", event => {
                event.stopPropagation();
                openTaskModal(task.id);
            });
            dayBox.appendChild(taskEl);
        });

        calendar.appendChild(dayBox);
    }

    renderDashboard();
    renderToday();
    renderGoals();
}

function addTask() {
    const text = taskInput.value.trim();
    const date = dateInput.value;
    const category = categoryInput.value || categories[0];

    if (!text || !date) {
        alert("일정 내용과 날짜를 입력해주세요.");
        return;
    }

    tasks.push({ id: Date.now(), text, date, category, done: false });
    taskInput.value = "";
    saveData();
    renderCalendar();
}

function openTaskModal(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    editingId = id;
    editText.value = task.text;
    editDate.value = task.date;
    editCategory.value = categories.includes(task.category) ? task.category : categories[0];
    taskModal.classList.remove("hidden");
}

function saveTask() {
    const newText = editText.value.trim();
    if (!newText) {
        alert("일정 내용을 입력해주세요.");
        return;
    }
    tasks = tasks.map(task => task.id === editingId ? {
        ...task,
        text: newText,
        date: editDate.value,
        category: editCategory.value || categories[0]
    } : task);
    saveData();
    closeTaskModal();
    renderCalendar();
}

function deleteTask() {
    tasks = tasks.filter(task => task.id !== editingId);
    saveData();
    closeTaskModal();
    renderCalendar();
}

function closeTaskModal() {
    taskModal.classList.add("hidden");
    editingId = null;
}

function toggleDone(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, done: !task.done } : task);
    saveData();
    renderCalendar();
}

function renderDashboard() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthTasks = tasks.filter(task => {
        const taskDate = new Date(`${task.date}T00:00:00`);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    });
    const total = monthTasks.length;
    const done = monthTasks.filter(task => task.done).length;
    const remain = total - done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    $("totalCount").textContent = total;
    $("doneCount").textContent = done;
    $("remainCount").textContent = remain;
    $("rate").textContent = `${rate}%`;
}

function renderToday() {
    const todayTasks = tasks.filter(task => task.date === getTodayText());
    const total = todayTasks.length;
    const done = todayTasks.filter(task => task.done).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    $("todayRate").textContent = `${rate}%`;
    const todayList = $("todayList");
    todayList.innerHTML = "";

    if (todayTasks.length === 0) {
        todayList.innerHTML = "<li>오늘 등록된 일정이 없어요</li>";
        return;
    }

    todayTasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task.done ? `✅ ${task.text}` : `⬜ ${task.text}`;
        todayList.appendChild(li);
    });
}

function addGoal() {
    const input = $("goalInput");
    const text = input.value.trim();
    if (!text) return;
    goals.push({ id: Date.now(), text, done: false });
    input.value = "";
    saveData();
    renderGoals();
}

function renderGoals() {
    const goalList = $("goalList");
    goalList.innerHTML = "";
    if (goals.length === 0) {
        goalList.innerHTML = "<li>이번 달 목표를 추가해보세요</li>";
        return;
    }
    goals.forEach(goal => {
        const li = document.createElement("li");
        li.textContent = goal.done ? `✅ ${goal.text}` : `⬜ ${goal.text}`;
        li.addEventListener("click", () => {
            goal.done = !goal.done;
            saveData();
            renderGoals();
        });
        goalList.appendChild(li);
    });
}

function init() {
    normalizeData();
    dateInput.value = getTodayText();
    memoInput.value = memo;

    $("addTaskBtn").addEventListener("click", addTask);
    taskInput.addEventListener("keydown", event => { if (event.key === "Enter") addTask(); });
    $("prevBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    $("nextBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    $("categoryBtn").addEventListener("click", openCategoryModal);
    $("addCategoryBtn").addEventListener("click", () => addCategoryRow());
    $("saveCategoryBtn").addEventListener("click", saveCategories);
    $("closeCategoryBtn").addEventListener("click", closeCategoryModal);
    $("saveTaskBtn").addEventListener("click", saveTask);
    $("deleteTaskBtn").addEventListener("click", deleteTask);
    $("closeTaskBtn").addEventListener("click", closeTaskModal);
    $("addGoalBtn").addEventListener("click", addGoal);
    memoInput.addEventListener("input", saveData);

    renderCategories();
    saveData();
    renderCalendar();
}

init();

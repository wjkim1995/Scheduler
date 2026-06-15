function safeParse(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        return fallback;
    }
}

const DEFAULT_CATEGORIES = ["병원", "회사", "외근", "개인"];
const DEFAULT_COLORS = {
    "병원": "#4f8dff",
    "회사": "#8b5cf6",
    "외근": "#ff7a45",
    "개인": "#9ca3af"
};

let tasks = safeParse("tasks", []);
let goals = safeParse("goals", []);
let categories = safeParse("categories", DEFAULT_CATEGORIES);
let categoryColors = safeParse("categoryColors", DEFAULT_COLORS);
let currentDate = new Date();
let selectedDate = getTodayText();
let editingId = null;

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const $ = (id) => document.getElementById(id);

const taskInput = $("taskInput");
const dateInput = $("dateInput");
const categoryInput = $("categoryInput");
const typeInput = $("typeInput");
const calendar = $("calendar");
const taskModal = $("taskModal");
const editText = $("editText");
const editDate = $("editDate");
const editCategory = $("editCategory");
const editType = $("editType");
const categoryModal = $("categoryModal");
const categoryList = $("categoryList");

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
        .map(name => name === "할 일" || name === "메모" ? "개인" : name)
        .filter(Boolean);

    categories = [...new Set(categories)].filter(name => name !== "할 일" && name !== "메모");
    if (categories.length === 0) categories = [...DEFAULT_CATEGORIES];

    if (!categoryColors || typeof categoryColors !== "object" || Array.isArray(categoryColors)) {
        categoryColors = {};
    }
    if (!categoryColors["개인"] && categoryColors["할 일"]) {
        categoryColors["개인"] = categoryColors["할 일"];
    }
    delete categoryColors["할 일"];
    delete categoryColors["메모"];

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
            category: categories.includes(task.category) ? task.category : (task.category === "할 일" || task.category === "메모" ? "개인" : categories[0]),
            type: task.type === "memo" ? "memo" : "task",
            done: Boolean(task.done)
        }));
}

function saveData() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("goals", JSON.stringify(goals));
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

function rollOverUnfinishedTasks() {
    const today = getTodayText();
    const lastRolloverDate = localStorage.getItem("lastRolloverDate");

    if (lastRolloverDate === today) return;

    tasks = tasks.map(task => {
        const isOverdueTask = task.type !== "memo" && !task.done && task.date < today;
        return isOverdueTask ? { ...task, date: today } : task;
    });

    localStorage.setItem("lastRolloverDate", today);
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
    renderLegend();
    renderCalendar();
    closeCategoryModal();
}

function closeCategoryModal() {
    categoryModal.classList.add("hidden");
}

function createCalendarItem(task) {
    const taskEl = document.createElement("div");
    const color = getCategoryColor(task.category);
    taskEl.className = task.type === "memo" ? "task memo" : (task.done ? "task done" : "task");

    if (task.type === "memo") {
        taskEl.className = task.done ? "task memo done" : "task memo";
        taskEl.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""}>
            <span class="task-dot" style="background:${color}"></span>
            <span>${escapeHtml(task.text)}</span>
        `;
        taskEl.querySelector("input").addEventListener("click", event => {
            event.stopPropagation();
            toggleDone(task.id);
        });
    } else {
        taskEl.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""}>
            <span class="task-dot" style="background:${color}"></span>
            <span>${escapeHtml(task.text)}</span>
        `;
        taskEl.querySelector("input").addEventListener("click", event => {
            event.stopPropagation();
            toggleDone(task.id);
        });
    }

    taskEl.querySelector("span:last-child").addEventListener("click", event => {
        event.stopPropagation();
        openTaskModal(task.id);
    });

    return taskEl;
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
        const checkableTasks = dayTasks.filter(task => task.type !== "memo");
        const total = checkableTasks.length;
        const done = checkableTasks.filter(task => task.done).length;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);

        const dayBox = document.createElement("div");
        dayBox.className = "day";
        if (dateText === getTodayText()) dayBox.classList.add("today");
        if (dateText === selectedDate) dayBox.classList.add("selected");

        dayBox.innerHTML = `
            <div class="date-head">
                <span class="date-num">${day}</span>
                <span class="day-name">${dayNames[dayDate.getDay()]}</span>
            </div>
            <div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div>
        `;

        dayBox.addEventListener("click", () => {
            selectedDate = dateText;
            dateInput.value = dateText;
            renderCalendar();
        });

        const memos = dayTasks.filter(task => task.type === "memo");
        const schedules = dayTasks.filter(task => task.type !== "memo");

        if (memos.length > 0) {
            const memoTitle = document.createElement("div");
            memoTitle.className = "day-section-title memo-title";
            memoTitle.textContent = "메모";
            dayBox.appendChild(memoTitle);
        }

        memos.forEach(task => {
            const taskEl = createCalendarItem(task);
            dayBox.appendChild(taskEl);
        });

        if (schedules.length > 0) {
            const scheduleTitle = document.createElement("div");
            scheduleTitle.className = "day-section-title schedule-title";
            scheduleTitle.textContent = "일정";
            dayBox.appendChild(scheduleTitle);
        }

        schedules.forEach(task => {
            const taskEl = createCalendarItem(task);
            dayBox.appendChild(taskEl);
        });

        calendar.appendChild(dayBox);
    }

    renderDashboard();
    renderToday();
    renderLegend();
    renderSelectedDay();
}

function addTask() {
    const text = taskInput.value.trim();
    const date = dateInput.value;
    const category = categoryInput.value || categories[0];
    const type = typeInput.value || "task";

    if (!text || !date) {
        alert("일정 내용과 날짜를 입력해주세요.");
        return;
    }

    tasks.push({ id: Date.now(), text, date, category, type, done: false });
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
    editType.value = task.type === "memo" ? "memo" : "task";
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
        category: editCategory.value || categories[0],
        type: editType.value || "task",
        done: task.done
    } : task);
    saveData();
    closeTaskModal();
    renderCalendar();
}

function deleteTaskById(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveData();
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
        return taskDate.getFullYear() === year && taskDate.getMonth() === month && task.type !== "memo";
    });
    const total = monthTasks.length;
    const done = monthTasks.filter(task => task.done).length;
    const remain = total - done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    $("totalCount").textContent = total;
    $("doneCount").textContent = done;
    $("remainCount").textContent = remain;
    $("rate").textContent = `${rate}%`;
    renderMonthSummary(monthTasks);
}

function renderMonthSummary(monthSchedules) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthMemos = tasks.filter(task => {
        const taskDate = new Date(`${task.date}T00:00:00`);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month && task.type === "memo";
    });
    const todayRemain = tasks.filter(task => task.date === getTodayText() && task.type !== "memo" && !task.done).length;

    const summaryTaskCount = $("summaryTaskCount");
    const summaryMemoCount = $("summaryMemoCount");
    const summaryTodayRemain = $("summaryTodayRemain");
    if (summaryTaskCount) summaryTaskCount.textContent = monthSchedules.length;
    if (summaryMemoCount) summaryMemoCount.textContent = monthMemos.length;
    if (summaryTodayRemain) summaryTodayRemain.textContent = todayRemain;
}

function formatDateLabel(dateText) {
    const date = new Date(`${dateText}T00:00:00`);
    return `${date.getMonth() + 1}/${date.getDate()} ${dayNames[date.getDay()]}`;
}

function createSidebarDetailItem(task) {
    const row = document.createElement("div");
    const color = getCategoryColor(task.category);
    row.className = task.type === "memo" ? "detail-item memo" : (task.done ? "detail-item done" : "detail-item");

    if (task.type === "memo") {
        row.className = task.done ? "detail-item memo done" : "detail-item memo";
        row.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""}>
            <span class="item-dot" style="background:${color}"></span>
            <span>${escapeHtml(task.text)}</span>
            <button type="button" class="detail-delete" title="삭제">🗑️</button>
        `;
        row.querySelector("input").addEventListener("change", () => toggleDone(task.id));
    } else {
        row.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""}>
            <span class="item-dot" style="background:${color}"></span>
            <span>${escapeHtml(task.text)}</span>
            <button type="button" class="detail-delete" title="삭제">🗑️</button>
        `;
        row.querySelector("input").addEventListener("change", () => toggleDone(task.id));
    }

    row.querySelector("span:last-of-type").addEventListener("click", () => openTaskModal(task.id));
    row.querySelector("button").addEventListener("click", () => deleteTaskById(task.id));
    return row;
}

function renderSelectedDay() {
    const title = $("selectedDayTitle");
    const list = $("selectedDayList");
    if (!title || !list) return;

    const selectedItems = tasks.filter(task => task.date === selectedDate);
    const memos = selectedItems.filter(task => task.type === "memo");
    const schedules = selectedItems.filter(task => task.type !== "memo");

    title.textContent = `${formatDateLabel(selectedDate)} 일정`;
    list.innerHTML = "";

    const addSection = (label, items, emptyText) => {
        const group = document.createElement("div");
        group.className = "sidebar-group detail-group";

        const section = document.createElement("div");
        section.className = "detail-section-title";
        section.textContent = label;
        group.appendChild(section);

        if (items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "detail-empty";
            empty.textContent = emptyText;
            group.appendChild(empty);
            list.appendChild(group);
            return;
        }

        items.forEach(item => group.appendChild(createSidebarDetailItem(item)));
        list.appendChild(group);
    };

    addSection(`📝 메모 (${memos.length})`, memos, "선택한 날짜의 메모가 없어요");
    addSection(`✅ 일정 (${schedules.length})`, schedules, "선택한 날짜의 일정이 없어요");
}

function appendTodaySection(list, title, items, emptyText, defaultType) {
    const groupLi = document.createElement("li");
    const group = document.createElement("div");
    group.className = "sidebar-group today-group";

    const titleRow = document.createElement("div");
    titleRow.className = "today-section-title";
    titleRow.innerHTML = `<span>${title}</span><button type="button" class="section-add-btn">+</button>`;
    titleRow.querySelector("button").addEventListener("click", () => {
        dateInput.value = getTodayText();
        typeInput.value = defaultType;
        taskInput.focus();
    });
    group.appendChild(titleRow);

    if (items.length === 0) {
        const emptyLi = document.createElement("div");
        emptyLi.className = "today-empty";
        emptyLi.textContent = emptyText;
        group.appendChild(emptyLi);
        groupLi.appendChild(group);
        list.appendChild(groupLi);
        return;
    }

    items.forEach(task => {
        const row = document.createElement("div");
        const color = getCategoryColor(task.category);
        row.className = task.type === "memo" ? "today-item memo" : (task.done ? "today-item done" : "today-item");

        if (task.type === "memo") {
            row.className = task.done ? "today-item memo done" : "today-item memo";
        }
        row.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""}>
            <span class="item-dot" style="background:${color}"></span>
            <span>${escapeHtml(task.text)}</span>
            <button type="button" class="today-delete" title="삭제">🗑️</button>
        `;
        row.querySelector("input").addEventListener("change", () => toggleDone(task.id));
        row.querySelector("span:nth-of-type(2)").addEventListener("click", () => openTaskModal(task.id));
        row.querySelector("button").addEventListener("click", () => deleteTaskById(task.id));
        group.appendChild(row);
    });

    groupLi.appendChild(group);
    list.appendChild(groupLi);
}

function renderToday() {
    const todayTasks = tasks.filter(task => task.date === getTodayText());
    const todayMemos = todayTasks.filter(task => task.type === "memo");
    const todaySchedules = todayTasks.filter(task => task.type !== "memo");
    const total = todaySchedules.length;
    const done = todaySchedules.filter(task => task.done).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    $("todayRate").textContent = `${rate}% (${done} / ${total})`;
    const todayProgressFill = $("todayProgressFill");
    if (todayProgressFill) todayProgressFill.style.width = `${rate}%`;
    const todayList = $("todayList");
    todayList.innerHTML = "";

    appendTodaySection(todayList, `📝 메모 (${todayMemos.length})`, todayMemos, "오늘 메모가 없어요", "memo");
    appendTodaySection(todayList, `✅ 일정 (${todaySchedules.length})`, todaySchedules, "오늘 일정이 없어요", "task");
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

function editGoal(id) {
    const goal = goals.find(item => item.id === id);
    if (!goal) return;
    const newText = prompt("목표를 수정하세요.", goal.text);
    if (newText === null) return;
    const trimmed = newText.trim();
    if (!trimmed) return;
    goal.text = trimmed;
    saveData();
    renderGoals();
}

function deleteGoal(id) {
    goals = goals.filter(goal => goal.id !== id);
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
    const goalColors = ["#31c56a", "#b86add", "#ff9d2e", "#4f9cff", "#777777"];
    goals.forEach((goal, index) => {
        const li = document.createElement("li");
        const row = document.createElement("div");
        row.className = goal.done ? "goal-item done" : "goal-item";
        const color = goalColors[index % goalColors.length];
        row.innerHTML = `
            <input type="checkbox" ${goal.done ? "checked" : ""}>
            <span class="goal-dot" style="background:${color}"></span>
            <span>${escapeHtml(goal.text)}</span>
            <button type="button" class="goal-edit" title="수정">✎</button>
            <button type="button" class="goal-delete" title="삭제">🗑️</button>
        `;
        row.querySelector(".goal-dot").addEventListener("click", () => {
            goal.done = !goal.done;
            saveData();
            renderGoals();
        });
        row.querySelector("span:nth-of-type(2)").addEventListener("click", () => editGoal(goal.id));
        row.querySelector(".goal-edit").addEventListener("click", () => editGoal(goal.id));
        row.querySelector(".goal-delete").addEventListener("click", () => deleteGoal(goal.id));
        li.appendChild(row);
        goalList.appendChild(li);
    });
}

function renderLegend() {
    const legendList = $("legendList");
    if (!legendList) return;
    legendList.innerHTML = "";

    categories.forEach(category => {
        const row = document.createElement("div");
        row.className = "legend-row";
        const color = getCategoryColor(category);
        row.innerHTML = `
            <span class="legend-dot" style="background:${color}"></span>
            <span>${escapeHtml(category)}</span>
            <span class="legend-chip">일정</span>
        `;
        legendList.appendChild(row);
    });
}

function init() {
    normalizeData();
    rollOverUnfinishedTasks();
    dateInput.value = selectedDate;

    $("addTaskBtn").addEventListener("click", addTask);
    taskInput.addEventListener("keydown", event => { if (event.key === "Enter") addTask(); });
    $("prevBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    $("nextBtn").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    $("categoryBtn").addEventListener("click", openCategoryModal);
    const selectedDayAddBtn = $("selectedDayAddBtn");
    if (selectedDayAddBtn) selectedDayAddBtn.addEventListener("click", () => {
        dateInput.value = selectedDate;
        taskInput.focus();
    });
    $("addCategoryBtn").addEventListener("click", () => addCategoryRow());
    $("saveCategoryBtn").addEventListener("click", saveCategories);
    $("closeCategoryBtn").addEventListener("click", closeCategoryModal);
    $("saveTaskBtn").addEventListener("click", saveTask);
    $("deleteTaskBtn").addEventListener("click", deleteTask);
    $("closeTaskBtn").addEventListener("click", closeTaskModal);
    const legendEditBtn = $("legendEditBtn");
    if (legendEditBtn) legendEditBtn.addEventListener("click", openCategoryModal);

    renderCategories();
    saveData();
    renderCalendar();
}

init();

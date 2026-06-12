let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let memo = localStorage.getItem("memo") || "";

let categories = JSON.parse(localStorage.getItem("categories")) || [
    "병원",
    "회사",
    "외근",
    "할 일"
];

let currentDate = new Date();
let editingId = null;

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const taskInput = document.getElementById("taskInput");
const dateInput = document.getElementById("dateInput");
const categoryInput = document.getElementById("categoryInput");
const calendar = document.getElementById("calendar");

const modal = document.getElementById("modal");
const editText = document.getElementById("editText");
const editDate = document.getElementById("editDate");
const editCategory = document.getElementById("editCategory");

dateInput.value = getTodayText();
document.getElementById("memoInput").value = memo;

function saveData() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("memo", document.getElementById("memoInput").value);
    localStorage.setItem("categories", JSON.stringify(categories));
}

function getTodayText() {
    const now = new Date();

    return formatDate(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
}

function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

function editCategories() {
    const result = prompt(
        "카테고리를 쉼표로 구분해서 입력하세요.",
        categories.join(", ")
    );

    if (!result) {
        return;
    }

    categories = result
        .split(",")
        .map(item => item.trim())
        .filter(item => item !== "");

    saveData();
    renderCategories();
    renderCalendar();
}

function getCategoryClass(category) {
    return "category-" + category.replaceAll(" ", "");
}

function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById("monthTitle").textContent = `${year}년 ${month + 1}월`;

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

        if (dateText === getTodayText()) {
            dayBox.classList.add("today");
        }

        dayBox.innerHTML = `
            <div class="date-head">
                <span class="date-num">${day}</span>
                <span class="day-name">${dayNames[dayDate.getDay()]}</span>
            </div>

            <div class="progress">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
        `;

        dayBox.addEventListener("click", function () {
            dateInput.value = dateText;
        });

        dayTasks.forEach(task => {
            const taskEl = document.createElement("div");

            taskEl.className = `task ${getCategoryClass(task.category)}`;

            if (task.done) {
                taskEl.classList.add("done");
            }

            taskEl.innerHTML = `
                <input 
                    type="checkbox" 
                    ${task.done ? "checked" : ""}
                >
                <span>${task.text}</span>
            `;

            const checkbox = taskEl.querySelector("input");

            checkbox.addEventListener("click", function (event) {
                event.stopPropagation();
                toggleDone(task.id);
            });

            taskEl.querySelector("span").addEventListener("click", function (event) {
                event.stopPropagation();
                openEditModal(task.id);
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
    const category = categoryInput.value;

    if (text === "" || date === "") {
        alert("일정 내용과 날짜를 입력해주세요.");
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        date: date,
        category: category,
        done: false
    };

    tasks.push(newTask);

    taskInput.value = "";

    saveData();
    renderCalendar();
}

function openEditModal(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    editingId = id;

    editText.value = task.text;
    editDate.value = task.date;
    editCategory.value = task.category;

    modal.classList.remove("hidden");
}

function saveEdit() {
    const newText = editText.value.trim();

    if (newText === "") {
        alert("일정 내용을 입력해주세요.");
        return;
    }

    tasks = tasks.map(task => {
        if (task.id === editingId) {
            return {
                ...task,
                text: newText,
                date: editDate.value,
                category: editCategory.value
            };
        }

        return task;
    });

    saveData();
    closeModal();
    renderCalendar();
}

function deleteTask() {
    tasks = tasks.filter(task => task.id !== editingId);

    saveData();
    closeModal();
    renderCalendar();
}

function closeModal() {
    modal.classList.add("hidden");
    editingId = null;
}

function toggleDone(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                done: !task.done
            };
        }

        return task;
    });

    saveData();
    renderCalendar();
}

function renderDashboard() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);

        return (
            taskDate.getFullYear() === year &&
            taskDate.getMonth() === month
        );
    });

    const total = monthTasks.length;
    const done = monthTasks.filter(task => task.done).length;
    const remain = total - done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById("totalCount").textContent = total;
    document.getElementById("doneCount").textContent = done;
    document.getElementById("remainCount").textContent = remain;
    document.getElementById("rate").textContent = `${rate}%`;
}

function renderToday() {
    const today = getTodayText();

    const todayTasks = tasks.filter(task => task.date === today);

    const total = todayTasks.length;
    const done = todayTasks.filter(task => task.done).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById("todayRate").textContent = `${rate}%`;

    const todayList = document.getElementById("todayList");
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
    const input = document.getElementById("goalInput");
    const text = input.value.trim();

    if (text === "") {
        return;
    }

    goals.push({
        id: Date.now(),
        text: text,
        done: false
    });

    input.value = "";

    saveData();
    renderGoals();
}

function renderGoals() {
    const goalList = document.getElementById("goalList");

    goalList.innerHTML = "";

    if (goals.length === 0) {
        goalList.innerHTML = "<li>이번 달 목표를 추가해보세요</li>";
        return;
    }

    goals.forEach(goal => {
        const li = document.createElement("li");

        li.textContent = goal.done ? `✅ ${goal.text}` : `⬜ ${goal.text}`;

        li.addEventListener("click", function () {
            goal.done = !goal.done;
            saveData();
            renderGoals();
        });

        goalList.appendChild(li);
    });
}

document.getElementById("addTaskBtn").addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        addTask();
    }
});

document.getElementById("prevBtn").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById("nextBtn").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById("categoryBtn").addEventListener("click", editCategories);

document.getElementById("saveBtn").addEventListener("click", saveEdit);
document.getElementById("deleteBtn").addEventListener("click", deleteTask);
document.getElementById("closeBtn").addEventListener("click", closeModal);
document.getElementById("addGoalBtn").addEventListener("click", addGoal);

document.getElementById("memoInput").addEventListener("input", saveData);

renderCategories();
renderCalendar();

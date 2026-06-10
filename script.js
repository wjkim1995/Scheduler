let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let memo = localStorage.getItem("memo") || "";

let currentDate = new Date();
let expandedDates = new Set();

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const categoryColors = {
  work: "#4f8dff",
  daily: "#ff7a45",
  health: "#4caf50",
  study: "#8b5cf6",
  etc: "#ffb300"
};

function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("goals", JSON.stringify(goals));
  localStorage.setItem("memo", document.getElementById("memoInput").value);
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayText() {
  const now = new Date();
  return formatDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function rolloverUndoneTasks() {
  const todayText = getTodayText();
  const lastRolloverDate = localStorage.getItem("lastRolloverDate");

  if (lastRolloverDate === todayText) return;

  tasks = tasks.map(task => {
    if (!task.done && task.date < todayText) {
      return {
        ...task,
        date: todayText
      };
    }
    return task;
  });

  localStorage.setItem("lastRolloverDate", todayText);
  saveData();
}

function renderCalendar() {
  rolloverUndoneTasks();

  const calendar = document.getElementById("calendar");
  const monthTitle = document.getElementById("monthTitle");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthTitle.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  calendar.innerHTML = "";

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += `<div class="day empty"></div>`;
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateText = formatDate(year, month, day);
    const dayDate = new Date(year, month, day);
    const dayTasks = tasks.filter(task => task.date === dateText);

    const done = dayTasks.filter(task => task.done).length;
    const total = dayTasks.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const now = new Date();
    const isToday =
      year === now.getFullYear() &&
      month === now.getMonth() &&
      day === now.getDate();

    const isExpanded = expandedDates.has(dateText);
    const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, 4);
    const hiddenCount = dayTasks.length - 4;

    calendar.innerHTML += `
      <div class="day ${isToday ? "today" : ""}" onclick="selectDate('${dateText}')">
        <div class="date-head">
          <div class="date-num">${day}</div>
          <div class="day-name">${dayNames[dayDate.getDay()]}</div>
        </div>

        <div class="percent">
          <div class="percent-fill" style="width:${percent}%"></div>
        </div>

        <div class="task-list">
          ${visibleTasks.map(task => {
            const category = task.category || "etc";
            const color = task.done ? "#999" : categoryColors[category];

            return `
              <label class="task-item ${category} ${task.done ? "done" : ""}" onclick="event.stopPropagation()">
                <input 
                  type="checkbox" 
                  ${task.done ? "checked" : ""}
                  onchange="toggleTask(${task.id})"
                />
                <i class="task-dot" style="background:${color};"></i>
                <span style="color:${color}; font-weight:700;">
                  ${task.text}
                </span>
              </label>
            `;
          }).join("")}

          ${
            hiddenCount > 0
              ? `<div class="more" onclick="toggleMore(event, '${dateText}')">
                  ${isExpanded ? "접기" : `+${hiddenCount} more`}
                </div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  renderDashboard();
  renderGoals();
  renderToday();
}

function toggleMore(event, dateText) {
  event.stopPropagation();

  if (expandedDates.has(dateText)) {
    expandedDates.delete(dateText);
  } else {
    expandedDates.add(dateText);
  }

  renderCalendar();
}

function selectDate(dateText) {
  document.getElementById("dueDate").value = dateText;
}

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const date = document.getElementById("dueDate").value;
  const category = document.getElementById("categoryInput").value;

  if (!text || !date) {
    alert("할 일과 날짜를 모두 입력해주세요.");
    return;
  }

  tasks.push({
    id: Date.now(),
    text,
    date,
    category,
    done: false
  });

  document.getElementById("taskInput").value = "";

  saveData();
  renderCalendar();
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, done: !task.done } : task
  );

  saveData();
  renderCalendar();
}

function renderDashboard() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    return taskDate.getFullYear() === year && taskDate.getMonth() === month;
  });

  const total = monthTasks.length;
  const done = monthTasks.filter(task => task.done).length;
  const undone = total - done;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("totalCount").textContent = total;
  document.getElementById("doneCount").textContent = done;
  document.getElementById("undoneCount").textContent = undone;
  document.getElementById("rate").textContent = `${rate}%`;
}

function renderToday() {
  const todayText = getTodayText();
  const todayTasks = tasks.filter(task => task.date === todayText);

  const total = todayTasks.length;
  const done = todayTasks.filter(task => task.done).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("todayRate").textContent = `${rate}%`;
  document.getElementById("todayProgressFill").style.width = `${rate}%`;

  const todayList = document.getElementById("todayList");

  if (todayTasks.length === 0) {
    todayList.innerHTML = `<li>오늘 등록된 일정이 없어요</li>`;
    return;
  }

  todayList.innerHTML = todayTasks.map(task => {
    const category = task.category || "etc";
    const color = task.done ? "#999" : categoryColors[category];

    return `
      <li>
        <span>${task.done ? "✅" : "⬜"}</span>
        <span style="color:${color}; font-weight:700;">
          ${task.text}
        </span>
      </li>
    `;
  }).join("");
}

function addGoal() {
  const goalInput = document.getElementById("goalInput");
  const text = goalInput.value.trim();

  if (!text) return;

  goals.push({
    id: Date.now(),
    text,
    done: false
  });

  goalInput.value = "";

  saveData();
  renderGoals();
}

function toggleGoal(id) {
  goals = goals.map(goal =>
    goal.id === id ? { ...goal, done: !goal.done } : goal
  );

  saveData();
  renderGoals();
}

function renderGoals() {
  const goalList = document.getElementById("goalList");

  if (goals.length === 0) {
    goalList.innerHTML = `<li>이번 달 목표를 추가해보세요</li>`;
    return;
  }

  goalList.innerHTML = goals.map(goal => `
    <li onclick="toggleGoal(${goal.id})" style="cursor:pointer;">
      <span>${goal.done ? "✅" : "⬜"}</span>
      <span style="${goal.done ? "text-decoration:line-through;color:#999;" : ""}">
        ${goal.text}
      </span>
    </li>
  `).join("");
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

document.getElementById("dueDate").value = getTodayText();
document.getElementById("memoInput").value = memo;

document.getElementById("memoInput").addEventListener("input", saveData);

rolloverUndoneTasks();
renderCalendar();

setInterval(() => {
  rolloverUndoneTasks();
  renderCalendar();
}, 60000);

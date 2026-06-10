let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];

let currentDate = new Date();
const today = new Date();

function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("goals", JSON.stringify(goals));
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function renderCalendar() {
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
    const dayTasks = tasks.filter(task => task.date === dateText);

    const done = dayTasks.filter(task => task.done).length;
    const total = dayTasks.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const isToday =
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate();

    calendar.innerHTML += `
      <div class="day ${isToday ? "today" : ""}" onclick="selectDate('${dateText}')">
        <div class="date-bar">${day}</div>
        <div class="day-content">
          <div class="percent">
            <div class="percent-fill" style="width:${percent}%"></div>
          </div>
          ${dayTasks.map(task => `
            <label class="task-item ${task.done ? "done" : ""}" onclick="event.stopPropagation()">
              <input 
                type="checkbox" 
                ${task.done ? "checked" : ""}
                onchange="toggleTask(${task.id})"
              />
              <span>${task.text}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  renderDashboard();
  renderGoals();
}

function selectDate(dateText) {
  document.getElementById("dueDate").value = dateText;
}

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const date = document.getElementById("dueDate").value;

  if (!text || !date) {
    alert("할 일과 날짜를 모두 입력해주세요.");
    return;
  }

  tasks.push({
    id: Date.now(),
    text,
    date,
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

function addGoal() {
  const goalInput = document.getElementById("goalInput");
  const text = goalInput.value.trim();

  if (!text) return;

  goals.push(text);
  goalInput.value = "";

  saveData();
  renderGoals();
}

function renderGoals() {
  const goalList = document.getElementById("goalList");

  goalList.innerHTML = goals.map(goal => `
    <li>${goal}</li>
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

document.getElementById("dueDate").value = formatDate(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

renderCalendar();
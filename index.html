let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let memo = localStorage.getItem("memo") || "";
let settings = JSON.parse(localStorage.getItem("settings")) || {};

let currentDate = new Date();
let expandedDates = new Set();

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const categories = [
  { name: "🏥 병원", color: "#4f8dff" },
  { name: "💼 회사", color: "#8b5cf6" },
  { name: "🚗 외근", color: "#ffb300" },
  { name: "📝 할 일", color: "#ff7a45" },
  { name: "💪 일정", color: "#4caf50" }
];

function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("goals", JSON.stringify(goals));
  localStorage.setItem("memo", document.getElementById("memoInput").value);
  localStorage.setItem("settings", JSON.stringify(settings));
}

function initEditableTexts() {
  document.querySelectorAll("[data-edit-key]").forEach(el => {
    const key = el.dataset.editKey;
    if (settings[key]) el.textContent = settings[key];
    el.setAttribute("contenteditable", "true");
    el.title = "클릭해서 수정 가능";

    el.addEventListener("blur", () => {
      settings[key] = el.textContent.trim() || el.dataset.default || el.textContent;
      saveData();
    });
    el.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        el.blur();
      }
    });
  });
}

function renderCategoryOptions() {
  const select = document.getElementById("categoryInput");
  select.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
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

  tasks = tasks.map(task => !task.done && task.date < todayText ? { ...task, date: todayText } : task);
  localStorage.setItem("lastRolloverDate", todayText);
  saveData();
}

function getTaskColor(task) {
  if (task.done) return "#999";
  return categories.find(c => c.name === task.category)?.color || "#4f8dff";
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

  for (let i = 0; i < firstDay; i++) calendar.innerHTML += `<div class="day empty"></div>`;

  for (let day = 1; day <= lastDate; day++) {
    const dateText = formatDate(year, month, day);
    const dayDate = new Date(year, month, day);
    const dayTasks = tasks.filter(task => task.date === dateText);
    const done = dayTasks.filter(task => task.done).length;
    const total = dayTasks.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const now = new Date();
    const isToday = year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
    const isExpanded = expandedDates.has(dateText);
    const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, 4);
    const hiddenCount = Math.max(dayTasks.length - 4, 0);

    calendar.innerHTML += `
      <div class="day ${isToday ? "today" : ""}" onclick="selectDate('${dateText}')">
        <div class="date-head"><div class="date-num">${day}</div><div class="day-name">${dayNames[dayDate.getDay()]}</div></div>
        <div class="percent"><div class="percent-fill" style="width:${percent}%"></div></div>
        <div class="task-list">
          ${visibleTasks.map(task => {
            const color = getTaskColor(task);
            return `
              <label class="task-item ${task.done ? "done" : ""}" onclick="event.stopPropagation()">
                <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleTask(${task.id})" />
                <i class="task-dot" style="background:${color};"></i>
                <span class="task-text" style="color:${color}; ${task.done ? "text-decoration:line-through;" : ""}">${task.text}</span>
                <span class="task-actions">
                  <button class="icon-btn" type="button" onclick="editTask(event, ${task.id})">✏️</button>
                  <button class="icon-btn" type="button" onclick="deleteTask(event, ${task.id})">🗑️</button>
                </span>
              </label>`;
          }).join("")}
          ${hiddenCount > 0 ? `<div class="more" onclick="toggleMore(event, '${dateText}')">${isExpanded ? "접기" : `+${hiddenCount} more`}</div>` : ""}
        </div>
      </div>`;
  }

  renderDashboard();
  renderGoals();
  renderToday();
}

function toggleMore(event, dateText) {
  event.stopPropagation();
  expandedDates.has(dateText) ? expandedDates.delete(dateText) : expandedDates.add(dateText);
  renderCalendar();
}
function selectDate(dateText) { document.getElementById("dueDate").value = dateText; }

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const date = document.getElementById("dueDate").value;
  const category = document.getElementById("categoryInput").value;
  if (!text || !date) return alert("할 일과 날짜를 모두 입력해주세요.");
  tasks.push({ id: Date.now(), text, date, category, done: false });
  document.getElementById("taskInput").value = "";
  saveData(); renderCalendar();
}

function editTask(event, id) {
  event.stopPropagation();
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const text = prompt("일정 내용을 수정하세요", task.text);
  if (text === null || !text.trim()) return;
  const date = prompt("날짜를 수정하세요 YYYY-MM-DD", task.date);
  if (date === null || !date.trim()) return;
  task.text = text.trim();
  task.date = date.trim();
  saveData(); renderCalendar();
}

function deleteTask(event, id) {
  event.stopPropagation();
  if (!confirm("이 일정을 삭제할까요?")) return;
  tasks = tasks.filter(t => t.id !== id);
  saveData(); renderCalendar();
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, done: !task.done } : task);
  saveData(); renderCalendar();
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
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById("totalCount").textContent = total;
  document.getElementById("doneCount").textContent = done;
  document.getElementById("undoneCount").textContent = total - done;
  document.getElementById("rate").textContent = `${rate}%`;
}

function renderToday() {
  const todayTasks = tasks.filter(task => task.date === getTodayText());
  const total = todayTasks.length;
  const done = todayTasks.filter(task => task.done).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById("todayRate").textContent = `${rate}%`;
  document.getElementById("todayProgressFill").style.width = `${rate}%`;
  document.getElementById("todayList").innerHTML = todayTasks.length ? todayTasks.map(task => {
    const color = getTaskColor(task);
    return `<li><span>${task.done ? "✅" : "⬜"}</span><span style="color:${color}; font-weight:800; ${task.done ? "text-decoration:line-through;" : ""}">${task.text}</span></li>`;
  }).join("") : `<li>오늘 등록된 일정이 없어요</li>`;
}

function addGoal() {
  const goalInput = document.getElementById("goalInput");
  const text = goalInput.value.trim();
  if (!text) return;
  goals.push({ id: Date.now(), text, done: false });
  goalInput.value = "";
  saveData(); renderGoals();
}

function editGoal(event, id) {
  event.stopPropagation();
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  const text = prompt("목표를 수정하세요", goal.text);
  if (text === null || !text.trim()) return;
  goal.text = text.trim();
  saveData(); renderGoals();
}

function deleteGoal(event, id) {
  event.stopPropagation();
  if (!confirm("이 목표를 삭제할까요?")) return;
  goals = goals.filter(g => g.id !== id);
  saveData(); renderGoals();
}

function toggleGoal(id) {
  goals = goals.map(goal => goal.id === id ? { ...goal, done: !goal.done } : goal);
  saveData(); renderGoals();
}

function renderGoals() {
  const goalList = document.getElementById("goalList");
  if (goals.length === 0) {
    goalList.innerHTML = `<li>이번 달 목표를 추가해보세요</li>`;
    return;
  }
  goalList.innerHTML = goals.map(goal => `
    <li onclick="toggleGoal(${goal.id})">
      <span>${goal.done ? "✅" : "⬜"}</span>
      <span style="${goal.done ? "text-decoration:line-through;color:#999;" : ""}">${goal.text}</span>
      <span class="goal-actions">
        <button class="icon-btn" type="button" onclick="editGoal(event, ${goal.id})">✏️</button>
        <button class="icon-btn" type="button" onclick="deleteGoal(event, ${goal.id})">🗑️</button>
      </span>
    </li>`).join("");
}

function prevMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }
function nextMonth() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }

document.getElementById("dueDate").value = getTodayText();
document.getElementById("memoInput").value = memo;
document.getElementById("memoInput").addEventListener("input", saveData);

renderCategoryOptions();
initEditableTexts();
rolloverUndoneTasks();
renderCalendar();
setInterval(() => { rolloverUndoneTasks(); renderCalendar(); }, 60000);

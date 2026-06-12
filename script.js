const DEFAULT_CATEGORIES = [
  { name: "병원", color: "#4f8dff", icon: "🏥" },
  { name: "회사", color: "#8b5cf6", icon: "💼" },
  { name: "외근", color: "#ff7a45", icon: "🚗" },
  { name: "할 일", color: "#7a7a7a", icon: "📝" },
  { name: "일정", color: "#4caf50", icon: "💪" }
];
const DEFAULT_LABELS = {
  hello:"Hello, Minjung", todayTitle:"TODAY", todayRateText:"오늘 완료율",
  goalsTitle:"MONTH GOALS", memoTitle:"MEMO", subTitle:"Monthly Planner", mainTitle:"📅 민정이 스케줄러",
  progressLabel:"Progress", totalLabel:"Total Tasks", doneLabel:"Done", remainLabel:"Remain", avatar:"M"
};
const LABEL_NAMES = {
  avatar:"왼쪽 아이콘", hello:"인사말", todayTitle:"TODAY 제목", todayRateText:"오늘 완료율 문구",
  goalsTitle:"목표 제목", memoTitle:"메모 제목", subTitle:"상단 작은 제목", mainTitle:"상단 큰 제목",
  progressLabel:"진행률", totalLabel:"전체 일정", doneLabel:"완료", remainLabel:"남은 일정"
};
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let memo = localStorage.getItem("memo") || "";
let categories = JSON.parse(localStorage.getItem("categories")) || DEFAULT_CATEGORIES;
let labels = {...DEFAULT_LABELS, ...(JSON.parse(localStorage.getItem("labels")) || {})};
let currentDate = new Date();
let expandedDates = new Set();
let editingTaskId = null;
const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function saveData(){
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("goals", JSON.stringify(goals));
  localStorage.setItem("memo", $("memoInput").value);
  localStorage.setItem("categories", JSON.stringify(categories));
  localStorage.setItem("labels", JSON.stringify(labels));
}
function formatDate(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
function getTodayText(){const n=new Date();return formatDate(n.getFullYear(),n.getMonth(),n.getDate())}
function catByName(name){return categories.find(c=>c.name===name)||categories[0]||DEFAULT_CATEGORIES[0]}
function taskColor(t){return t.done ? "#999" : catByName(t.category).color}
function applyLabels(){
  $("avatarText").textContent = labels.avatar || "M";
  document.querySelectorAll("[data-label]").forEach(el => { el.textContent = labels[el.dataset.label] || DEFAULT_LABELS[el.dataset.label] || el.textContent; });
}
function openQuickLabel(key){
  const next = prompt("문구를 수정하세요", labels[key] || DEFAULT_LABELS[key] || "");
  if(next === null) return;
  labels[key] = next.trim() || DEFAULT_LABELS[key];
  saveData(); applyLabels();
}
function renderCategoryOptions(){
  const html = categories.map(c => `<option value="${esc(c.name)}">${esc(c.icon)} ${esc(c.name)}</option>`).join("");
  $("categoryInput").innerHTML = html;
  $("editTaskCategory").innerHTML = html;
}
function rolloverUndoneTasks(){
  const today = getTodayText();
  const last = localStorage.getItem("lastRolloverDate");
  if(last === today) return;
  tasks = tasks.map(t => (!t.done && t.date < today) ? {...t, date: today} : t);
  localStorage.setItem("lastRolloverDate", today); saveData();
}
function renderCalendar(){
  rolloverUndoneTasks(); renderCategoryOptions(); applyLabels();
  const y=currentDate.getFullYear(), m=currentDate.getMonth();
  $("monthTitle").textContent = `${y}년 ${m+1}월`;
  const first=new Date(y,m,1).getDay(), last=new Date(y,m+1,0).getDate();
  const cal=$("calendar"); cal.innerHTML="";
  for(let i=0;i<first;i++) cal.insertAdjacentHTML("beforeend", `<div class="day empty"></div>`);
  for(let d=1; d<=last; d++){
    const dateText=formatDate(y,m,d), dayDate=new Date(y,m,d);
    const dayTasks=tasks.filter(t=>t.date===dateText);
    const done=dayTasks.filter(t=>t.done).length;
    const percent=dayTasks.length ? Math.round(done/dayTasks.length*100) : 0;
    const now=new Date();
    const isToday=y===now.getFullYear()&&m===now.getMonth()&&d===now.getDate();
    const isExpanded=expandedDates.has(dateText);
    const visible=isExpanded ? dayTasks : dayTasks.slice(0,5);
    const hidden=Math.max(dayTasks.length-5,0);
    cal.insertAdjacentHTML("beforeend", `<div class="day ${isToday?"today":""}" data-date="${dateText}">
      <div class="date-head"><div class="date-num">${d}</div><div class="day-name">${dayNames[dayDate.getDay()]}</div></div>
      <div class="percent"><div class="percent-fill" style="width:${percent}%"></div></div>
      <div class="task-list">
        ${visible.map(t => `<div class="task-pill ${t.done?"done":""}" data-task-id="${t.id}" title="${esc(t.text)}" style="color:${taskColor(t)}"><i class="task-dot" style="background:${taskColor(t)}"></i><span class="task-text">${esc(t.text)}</span></div>`).join("")}
        ${hidden>0 ? `<div class="more" data-more="${dateText}">${isExpanded?"접기":`+${hidden} more`}</div>` : ""}
      </div></div>`);
  }
  renderDashboard(); renderToday(); renderGoals();
}
function addTask(){
  const text=$("taskInput").value.trim(), date=$("dueDate").value, category=$("categoryInput").value;
  if(!text || !date){ alert("일정 내용과 날짜를 입력해주세요."); return; }
  tasks.push({id:Date.now(), text, date, category, done:false});
  $("taskInput").value=""; saveData(); renderCalendar();
}
function openTaskDialog(id){
  const t=tasks.find(x=>x.id===id); if(!t) return;
  editingTaskId=id; renderCategoryOptions();
  $("editTaskText").value=t.text; $("editTaskDate").value=t.date; $("editTaskCategory").value=t.category; $("editTaskDone").checked=!!t.done;
  $("taskDialog").showModal();
}
function saveTaskEdit(){
  const text=$("editTaskText").value.trim(), date=$("editTaskDate").value, category=$("editTaskCategory").value, done=$("editTaskDone").checked;
  if(!text || !date) return;
  tasks=tasks.map(t=>t.id===editingTaskId ? {...t,text,date,category,done} : t);
  saveData(); $("taskDialog").close(); renderCalendar();
}
function deleteTask(){ tasks=tasks.filter(t=>t.id!==editingTaskId); saveData(); $("taskDialog").close(); renderCalendar(); }
function renderDashboard(){
  const y=currentDate.getFullYear(), m=currentDate.getMonth();
  const mt=tasks.filter(t=>{const d=new Date(t.date);return d.getFullYear()===y&&d.getMonth()===m});
  const total=mt.length, done=mt.filter(t=>t.done).length, rate=total?Math.round(done/total*100):0;
  $("totalCount").textContent=total; $("doneCount").textContent=done; $("undoneCount").textContent=total-done; $("rate").textContent=`${rate}%`;
}
function renderToday(){
  const today=tasks.filter(t=>t.date===getTodayText());
  const total=today.length, done=today.filter(t=>t.done).length, rate=total?Math.round(done/total*100):0;
  $("todayRate").textContent=`${rate}%`; $("todayProgressFill").style.width=`${rate}%`;
  $("todayList").innerHTML = today.length ? today.map(t=>`<li><span>${t.done?"✅":"⬜"}</span><span style="color:${taskColor(t)};font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${t.done?"text-decoration:line-through;color:#999;":""}">${esc(t.text)}</span></li>`).join("") : `<li>오늘 등록된 일정이 없어요</li>`;
}
function addGoal(){ const text=$("goalInput").value.trim(); if(!text) return; goals.push({id:Date.now(),text,done:false}); $("goalInput").value=""; saveData(); renderGoals(); }
function renderGoals(){
  $("goalList").innerHTML = goals.length ? goals.map(g=>`<li><button class="tiny-btn" data-goal-id="${g.id}" type="button">${g.done?"✅":"⬜"}</button><span style="${g.done?"text-decoration:line-through;color:#999;":""}">${esc(g.text)}</span><button class="tiny-btn" data-goal-del="${g.id}" type="button">삭제</button></li>`).join("") : `<li>이번 달 목표를 추가해보세요</li>`;
}
function openSettings(){
  $("categoryEditor").innerHTML = categories.map((c,i)=>`<div class="category-row"><input type="color" value="${esc(c.color)}"><input class="cat-icon" value="${esc(c.icon)}" maxlength="4"><input class="cat-name" value="${esc(c.name)}"><button type="button" data-remove-cat="${i}">삭제</button></div>`).join("");
  $("labelEditor").innerHTML = Object.keys(DEFAULT_LABELS).map(k=>`<div class="label-row"><div class="label-key">${LABEL_NAMES[k]||k}</div><input data-label-input="${k}" value="${esc(labels[k] || DEFAULT_LABELS[k])}"></div>`).join("");
  $("settingsDialog").showModal();
}
function saveSettings(){
  const rows=[...document.querySelectorAll(".category-row")];
  const newCats=rows.map(row=>({
    color: row.querySelector('input[type="color"]').value,
    icon: row.querySelector('.cat-icon').value.trim() || "📌",
    name: row.querySelector('.cat-name').value.trim() || "새 카테고리"
  })).filter(c=>c.name);
  if(newCats.length) categories=newCats;
  document.querySelectorAll("[data-label-input]").forEach(inp=>{ labels[inp.dataset.labelInput] = inp.value.trim() || DEFAULT_LABELS[inp.dataset.labelInput]; });
  saveData(); $("settingsDialog").close(); renderCalendar();
}
$("addTaskBtn").addEventListener("click", addTask);
$("taskInput").addEventListener("keydown", e=>{if(e.key==="Enter") addTask();});
$("addGoalBtn").addEventListener("click", addGoal);
$("goalInput").addEventListener("keydown", e=>{if(e.key==="Enter") addGoal();});
$("prevBtn").addEventListener("click",()=>{currentDate.setMonth(currentDate.getMonth()-1); renderCalendar();});
$("nextBtn").addEventListener("click",()=>{currentDate.setMonth(currentDate.getMonth()+1); renderCalendar();});
$("saveTaskBtn").addEventListener("click", saveTaskEdit);
$("deleteTaskBtn").addEventListener("click", deleteTask);
$("settingBtn").addEventListener("click", openSettings);
$("saveSettingsBtn").addEventListener("click", saveSettings);
$("addCategoryBtn").addEventListener("click",()=>{$("categoryEditor").insertAdjacentHTML("beforeend",`<div class="category-row"><input type="color" value="#4f8dff"><input class="cat-icon" value="📌" maxlength="4"><input class="cat-name" value="새 카테고리"><button type="button" data-remove-cat>삭제</button></div>`)});
$("resetBtn").addEventListener("click",()=>{if(confirm("저장된 문구와 카테고리를 초기화할까요? 일정은 유지됩니다.")){labels={...DEFAULT_LABELS};categories=[...DEFAULT_CATEGORIES];saveData();openSettings();renderCalendar();}});
$("calendar").addEventListener("click",e=>{
  const task=e.target.closest(".task-pill"); if(task){openTaskDialog(Number(task.dataset.taskId)); return;}
  const more=e.target.closest(".more"); if(more){const d=more.dataset.more; expandedDates.has(d)?expandedDates.delete(d):expandedDates.add(d); renderCalendar(); return;}
  const day=e.target.closest(".day:not(.empty)"); if(day) $("dueDate").value=day.dataset.date;
});
document.addEventListener("click",e=>{
  const label=e.target.closest("[data-label]"); if(label){openQuickLabel(label.dataset.label); return;}
  if(e.target.id==="avatarText"){openQuickLabel("avatar"); return;}
  const del=e.target.closest("[data-goal-del]"); if(del){goals=goals.filter(g=>g.id!==Number(del.dataset.goalDel)); saveData(); renderGoals(); return;}
  const chk=e.target.closest("[data-goal-id]"); if(chk){goals=goals.map(g=>g.id===Number(chk.dataset.goalId)?{...g,done:!g.done}:g); saveData(); renderGoals(); return;}
  const rem=e.target.closest("[data-remove-cat]"); if(rem){rem.closest(".category-row").remove();}
});
$("memoInput").addEventListener("input", saveData);
$("dueDate").value=getTodayText(); $("memoInput").value=memo;
renderCategoryOptions(); renderCalendar(); setInterval(()=>{rolloverUndoneTasks(); renderCalendar();},60000);

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = 'habitGarden.v1';
const todayKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateFromKey = key => { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); };
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const defaults = [
 {id:'h1',name:'Drink 8 glasses of water',category:'Health',time:'Anytime',icon:'💧',history:{}},
 {id:'h2',name:'Read for 15 minutes',category:'Learning',time:'Evening',icon:'📚',history:{}},
 {id:'h3',name:'Morning stretch',category:'Fitness',time:'Morning',icon:'🧘',history:{}},
 {id:'h4',name:'Write a daily journal',category:'Mindfulness',time:'Evening',icon:'✍️',history:{}},
 {id:'h5',name:'Take a mindful break',category:'Self-care',time:'Afternoon',icon:'🌱',history:{}}
];
let state = loadState();
let currentFilter = 'all';
let selectedIcon = '🌱';
let editingId = null;
let calendarDate = new Date();
let toastTimer;

function loadState(){
 try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if(saved && Array.isArray(saved.habits)) return saved;
 } catch(e) {}
 return {habits:structuredCloneSafe(defaults), dark:false};
}
function structuredCloneSafe(x){return JSON.parse(JSON.stringify(x))}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function isDone(h,key=todayKey()){return !!h.history?.[key]}
function doneCount(key=todayKey()){return state.habits.filter(h=>isDone(h,key)).length}
function completion(key=todayKey()){return state.habits.length?Math.round(doneCount(key)/state.habits.length*100):0}
function totalCheckins(){return state.habits.reduce((sum,h)=>sum+Object.values(h.history||{}).filter(Boolean).length,0)}
function streakFor(h){
 let count=0, date=new Date();
 if(!isDone(h,todayKey())) date.setDate(date.getDate()-1);
 while(isDone(h,todayKey(date))){count++;date.setDate(date.getDate()-1);if(count>3650)break}
 return count;
}
function bestStreak(){return state.habits.reduce((best,h)=>Math.max(best,streakFor(h)),0)}
function esc(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function render(){
 document.body.classList.toggle('dark',!!state.dark);
 const now=new Date();
 $('#dateChip').textContent=now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
 $('#fullDate').textContent=now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
 $('#navHabitCount').textContent=state.habits.length;
 const pct=completion();
 $('#completionStat').textContent=pct+'%';$('#completionSub').textContent=pct===100&&state.habits.length?'Garden fully watered!':pct?'Keep your rhythm going':'Let’s get started';
 $('#completionBar').style.width=pct+'%';$('#streakStat').innerHTML=`${bestStreak()} <small>days</small>`;$('#completedStat').textContent=totalCheckins();
 $$('.streak-dots i').forEach((d,i)=>d.classList.toggle('filled',i<Math.min(7,bestStreak())));
 $('#todayCount').textContent=`${doneCount()}/${state.habits.length}`;
 $('#sidebarGrowth').style.width=pct+'%';$('#sidebarGrowthText').textContent=`${pct}% of today's garden grown`;
 $('#gardenPercent').textContent=pct+'%';$('#gardenProgress').style.width=pct+'%';
 const mood=pct===100&&state.habits.length?'A garden in full bloom':pct>=60?'Look at you growing!':pct>0?'Little sprouts are showing':'A fresh start';
 $('#gardenMood').textContent=mood;
 $('#gardenMessage').textContent=pct===100&&state.habits.length?'You showed up for every habit today. Beautiful work!':pct>0?'Every small action helps your garden flourish.':'Your garden is waiting for its first drop of water.';
 const plants=$$('.plant');plants.forEach((p,i)=>p.classList.toggle('small',pct<=(i*20)));
 $('#todayHabitList').innerHTML=state.habits.length?state.habits.map(h=>habitRow(h)).join(''):`<div class="empty-state">🌱 <strong>No habits planted yet</strong><p>Create your first habit to get growing.</p></div>`;
 $('#allHabitsGrid').innerHTML=filteredHabits().map(h=>habitCard(h)).join('')||`<div class="empty-state">🌿<strong>No habits here yet</strong><p>Try another filter or create a new habit.</p></div>`;
 $('#habitResultCount').textContent=`${filteredHabits().length} habit${filteredHabits().length===1?'':'s'}`;
 renderWeek();renderCalendar();renderInsights();
}
function habitRow(h){
 const done=isDone(h);
 return `<div class="habit-row ${done?'is-done':''}"><div class="habit-emoji">${esc(h.icon)}</div><div class="habit-info"><strong>${esc(h.name)}</strong><small>${esc(h.category)} · ${esc(h.time)}</small></div><button class="habit-check ${done?'checked':''}" data-toggle="${esc(h.id)}" aria-label="${done?'Mark incomplete':'Mark complete'}">${done?'✓':''}</button></div>`;
}
function habitCard(h){
 const done=isDone(h);
 return `<article class="habit-card"><div class="habit-card-top"><div class="habit-emoji">${esc(h.icon)}</div><div class="habit-card-info"><strong>${esc(h.name)}</strong><small>${esc(h.category)} · ${esc(h.time)}</small></div><button class="more-button" data-edit="${esc(h.id)}" aria-label="Edit ${esc(h.name)}">···</button></div><div class="habit-card-bottom"><span class="habit-streak">🔥 <b>${streakFor(h)} day streak</b></span><div class="habit-card-actions"><button class="small-action ${done?'done':''}" data-toggle="${esc(h.id)}">${done?'✓ Done':'○ Check in'}</button><button class="small-action" data-delete="${esc(h.id)}">Delete</button></div></div></article>`;
}
function filteredHabits(){return state.habits.filter(h=>currentFilter==='all'||(currentFilter==='pending'&&!isDone(h))||(currentFilter==='completed'&&isDone(h)))}
function renderWeek(){
 const days=[];
 for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=todayKey(d);days.push({d,key,count:doneCount(key),pct:completion(key),today:i===0})}
 $('#weekChart').innerHTML=days.map(x=>`<div class="week-day"><div class="bar-area"><div class="week-bar ${x.today?'today':''}" style="height:${Math.max(x.pct,3)}%"></div></div><small class="${x.today?'today-label':''}">${x.today?'Today':dayNames[x.d.getDay()]}</small></div>`).join('');
}
function renderCalendar(){
 const y=calendarDate.getFullYear(),m=calendarDate.getMonth();
 $('#monthLabel').textContent=calendarDate.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=(first.getDay()+6)%7;
 let html='';
 for(let i=0;i<offset;i++)html+='<div class="calendar-day empty"></div>';
 for(let day=1;day<=days;day++){
  const d=new Date(y,m,day),key=todayKey(d),n=doneCount(key),isToday=key===todayKey();
  const dots=Array.from({length:Math.min(n,5)},()=>'<i></i>').join('');
  html+=`<div class="calendar-day ${isToday?'today':''}" title="${n} habit check-ins"><span class="day-number">${day}</span><div class="day-activity">${dots}</div></div>`;
 }
 $('#calendarGrid').innerHTML=html;
}
function renderInsights(){
 const pct=completion();$('#insightCompletion').textContent=pct+'%';$('#insightCompletionBar').style.width=pct+'%';$('#insightStreak').textContent=bestStreak()+' days';$('#insightCheckins').textContent=totalCheckins();
 const cats=['Mindfulness','Health','Learning','Productivity','Self-care','Fitness'];
 $('#categoryInsights').innerHTML=cats.map(cat=>{const list=state.habits.filter(h=>h.category===cat);if(!list.length)return '';const n=list.filter(isDone).length,p=Math.round(n/list.length*100);return `<div class="category-row"><span>${cat}</span><div class="thin-track"><span style="width:${p}%"></span></div><strong>${p}%</strong></div>`}).join('')||'<p class="subheading">Add habits to see your category breakdown.</p>';
}
function toggleHabit(id){
 const h=state.habits.find(x=>x.id===id);if(!h)return;
 const key=todayKey();h.history=h.history||{};
 if(h.history[key]){delete h.history[key];showToast('Check-in undone. Every day is a fresh start.')}
 else{h.history[key]=true;showToast(`${h.name} — beautifully done! 🌱`)}
 save();render();
}
function openModal(id=null){
 editingId=id;const h=id?state.habits.find(x=>x.id===id):null;
 $('#modalTitle').textContent=h?'Edit habit':'Create a habit';
 $('#habitName').value=h?.name||'';$('#habitCategory').value=h?.category||'Mindfulness';$('#habitTime').value=h?.time||'Morning';selectedIcon=h?.icon||'🌱';
 $$('#iconPicker button').forEach(b=>b.classList.toggle('chosen',b.dataset.icon===selectedIcon));
 $('#habitModal').classList.add('open');$('#habitModal').setAttribute('aria-hidden','false');setTimeout(()=>$('#habitName').focus(),50);
}
function closeModal(){$('#habitModal').classList.remove('open');$('#habitModal').setAttribute('aria-hidden','true');editingId=null;$('#habitForm').reset();selectedIcon='🌱';$$('#iconPicker button').forEach(b=>b.classList.toggle('chosen',b.dataset.icon===selectedIcon))}
function setView(view){
 $$('.page-view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
 $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
 const labels={overview:'Overview',habits:'My habits',calendar:'Calendar',insights:'Insights'};
 $('#pageLabel').textContent=labels[view]||'Overview';$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
}
$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
$$('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.goto)));
$('#quickAdd').addEventListener('click',()=>openModal());
$('#addHabitButton').addEventListener('click',()=>openModal());
$('#addHabitInline').addEventListener('click',()=>openModal());
$('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
$('#habitModal').addEventListener('click',e=>{if(e.target===$('#habitModal'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
$('#iconPicker').addEventListener('click',e=>{const b=e.target.closest('button[data-icon]');if(!b)return;selectedIcon=b.dataset.icon;$$('#iconPicker button').forEach(x=>x.classList.toggle('chosen',x===b))});
$('#habitForm').addEventListener('submit',e=>{
 e.preventDefault();const name=$('#habitName').value.trim();if(!name)return;
 const data={name,category:$('#habitCategory').value,time:$('#habitTime').value,icon:selectedIcon};
 if(editingId){const h=state.habits.find(x=>x.id===editingId);if(h)Object.assign(h,data);showToast('Habit updated. Keep growing!')}
 else{state.habits.push({id:`h${Date.now()}${Math.random().toString(36).slice(2,5)}`,...data,history:{}});showToast('A new seed has been planted! 🌱')}
 save();closeModal();render();
});
document.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-toggle]');if(toggle){toggleHabit(toggle.dataset.toggle);return}
 const edit=e.target.closest('[data-edit]');if(edit){openModal(edit.dataset.edit);return}
 const del=e.target.closest('[data-delete]');if(del){const h=state.habits.find(x=>x.id===del.dataset.delete);if(h&&confirm(`Delete "${h.name}"? Its check-in history will also be removed.`)){state.habits=state.habits.filter(x=>x.id!==del.dataset.delete);save();render();showToast('Habit removed from your garden.')}}});
$('#habitFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;currentFilter=b.dataset.filter;$$('#habitFilters button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('#prevMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()});
$('#nextMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()});
$('#themeToggle').addEventListener('click',()=>{state.dark=!state.dark;save();render();showToast(state.dark?'Night garden activated 🌙':'Welcome back to daylight ☀️')});
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#resetDemo').addEventListener('click',()=>{if(confirm('Reset all habits and check-in history to the original demo data?')){state={habits:structuredCloneSafe(defaults),dark:false};save();currentFilter='all';$$('#habitFilters button').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));render();showToast('Your demo garden has been replanted.')}});

// Upgrade old browsers that don't implement structuredClone: only local data is used.
render();

// Simple SPA logic — stores data in localStorage
const LS_KEY = 'grills_games_app_v1';

const state = {
  eventDate: null,
  tasks: [],
  budget: [],
  roster: []
};

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    Object.assign(state, JSON.parse(raw));
  } else {
    // sample defaults
    state.eventDate = '2025-11-14';
    state.tasks = [
      {id: idGen(), task:'Confirm DJ lineup', category:'Entertainment', owner:'Team A', status:'In Progress', deadline:'2025-10-30'},
      {id: idGen(), task:'Design promo flyer', category:'Marketing', owner:'Design', status:'Done', deadline:'2025-10-25'}
    ];
    state.budget = [];
    state.roster = [];
    saveState();
  }
}

function idGen() { return 'id_' + Math.random().toString(36).slice(2,9); }

/* ---------- countdown ---------- */
function updateCountdown() {
  const cdEl = document.getElementById('countdown');
  const dateText = document.getElementById('eventDateText');
  if (!state.eventDate) { cdEl.textContent = '-- days'; dateText.textContent = ''; return; }
  const now = dayjs();
  const event = dayjs(state.eventDate);
  const diff = event.diff(now, 'day');
  cdEl.textContent = diff >= 0 ? `${diff} days` : 'Event passed';
  dateText.textContent = `Event date: ${dayjs(state.eventDate).format('MMMM D, YYYY')}`;
}

/* ---------- tasks ---------- */
function renderTasks() {
  const container = document.getElementById('tasksList');
  container.innerHTML = '';
  state.tasks.forEach(t => {
    const el = document.createElement('div');
    el.className = 'list-group-item';
    el.innerHTML = `
      <div>
        <div class="fw-bold">${escapeHtml(t.task)}</div>
        <div class="small text-muted">${escapeHtml(t.category)} • ${escapeHtml(t.owner)} • due ${t.deadline || '—'}</div>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <select class="form-select form-select-sm status-select" data-id="${t.id}">
          <option ${t.status==='Pending'?'selected':''}>Pending</option>
          <option ${t.status==='In Progress'?'selected':''}>In Progress</option>
          <option ${t.status==='Done'?'selected':''}>Done</option>
        </select>
        <button class="btn btn-sm btn-outline-danger delete-task" data-id="${t.id}">Remove</button>
      </div>
    `;
    container.appendChild(el);
  });
  // attach events
  document.querySelectorAll('.delete-task').forEach(btn=>{
    btn.onclick = ()=> { const id=btn.dataset.id; state.tasks = state.tasks.filter(x=>x.id!==id); saveState(); renderTasks(); updateCountdown(); };
  });
  document.querySelectorAll('.status-select').forEach(sel=>{
    sel.onchange = ()=> { const id=sel.dataset.id; const item = state.tasks.find(x=>x.id===id); if(item){ item.status=sel.value; saveState(); renderTasks(); } };
  });
}

function addTaskFromInput() {
  const input = document.getElementById('taskInput');
  const raw = input.value.trim();
  if (!raw) return;
  // allow split by | for fields
  const parts = raw.split('|').map(s=>s.trim());
  const task = parts[0]||'New Task';
  const category = parts[1]||'General';
  const owner = parts[2]||'Unassigned';
  const deadline = parts[3]||'';
  state.tasks.push({id:idGen(), task, category, owner, status:'Pending', deadline});
  input.value='';
  saveState(); renderTasks();
}

/* ---------- roster ---------- */
function renderRoster(){
  const r = document.getElementById('rosterList'); r.innerHTML='';
  state.roster.forEach(p=>{
    const el = document.createElement('div');
    el.className='list-group-item';
    el.innerHTML = `<div><strong>${escapeHtml(p.name)}</strong><div class="small text-muted">${escapeHtml(p.role)} • ${escapeHtml(p.contact||'')}</div></div>
      <div><button class="btn btn-sm btn-outline-danger del-roster" data-id="${p.id}">Remove</button></div>`;
    r.appendChild(el);
  });
  document.querySelectorAll('.del-roster').forEach(b=>{ b.onclick=()=>{ state.roster = state.roster.filter(x=>x.id!==b.dataset.id); saveState(); renderRoster(); }; });
}

function addRoster(){
  const name = document.getElementById('rosterName').value.trim();
  const role = document.getElementById('rosterRole').value.trim();
  if(!name) return alert('Add a name');
  state.roster.push({id:idGen(), name, role, contact:'', attendance:'', notes:''});
  document.getElementById('rosterName').value=''; document.getElementById('rosterRole').value='';
  saveState(); renderRoster();
}

/* ---------- budget ---------- */
function renderBudget(){
  const list = document.getElementById('budgetList'); list.innerHTML='';
  let totalEst=0, totalActual=0;
  state.budget.forEach(b=>{
    totalEst += Number(b.estimated || 0);
    totalActual += Number(b.actual || 0);
    const el = document.createElement('div');
    el.className='list-group-item';
    el.innerHTML = `<div><strong>${escapeHtml(b.item)}</strong><div class="small text-muted">${escapeHtml(b.category)}</div></div>
      <div class="d-flex gap-1 align-items-center">
        <input type="number" class="form-control form-control-sm est" data-id="${b.id}" value="${b.estimated||0}" style="width:85px">
        <input type="number" class="form-control form-control-sm act" data-id="${b.id}" value="${b.actual||0}" style="width:85px">
        <button class="btn btn-sm btn-outline-danger del-budget" data-id="${b.id}">Del</button>
      </div>`;
    list.appendChild(el);
  });
  document.getElementById('totalEst').textContent = totalEst;
  document.getElementById('totalActual').textContent = totalActual;
  document.querySelectorAll('.del-budget').forEach(b=>{ b.onclick=()=>{ state.budget = state.budget.filter(x=>x.id!==b.dataset.id); saveState(); renderBudget(); }; });
  document.querySelectorAll('.est').forEach(inp=>{ inp.onchange = ()=>{ const row = state.budget.find(x=>x.id===inp.dataset.id); if(row){ row.estimated = Number(inp.value); saveState(); renderBudget(); } }; });
  document.querySelectorAll('.act').forEach(inp=>{ inp.onchange = ()=>{ const row = state.budget.find(x=>x.id===inp.dataset.id); if(row){ row.actual = Number(inp.value); saveState(); renderBudget(); } }; });
}

function addBudget(){
  const item = document.getElementById('budgetItem').value.trim(); const est = Number(document.getElementById('budgetEst').value || 0);
  if(!item) return alert('Add item');
  state.budget.push({id:idGen(), item, category:'General', estimated:est, actual:0});
  document.getElementById('budgetItem').value=''; document.getElementById('budgetEst').value='';
  saveState(); renderBudget();
}

/* ---------- import/export helpers ---------- */
function exportCSV(rows, headers, filename){
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function exportTasksCSV(){
  const headers = ['task','category','owner','status','deadline'];
  exportCSV(state.tasks.map(t=>({task:t.task,category:t.category,owner:t.owner,status:t.status,deadline:t.deadline||''})), headers, 'tasks.csv');
}
function exportRosterCSV(){ exportCSV(state.roster.map(r=>({name:r.name,role:r.role,contact:r.contact||''})), ['name','role','contact'], 'roster.csv'); }
function exportBudgetCSV(){ exportCSV(state.budget.map(b=>({item:b.item,category:b.category,estimated:b.estimated||0,actual:b.actual||0})), ['item','category','estimated','actual'], 'budget.csv'); }

function exportAllJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='grills_games_export.json'; a.click();
  URL.revokeObjectURL(url);
}

function importAllJSON(file){
  const reader = new FileReader();
  reader.onload = e=>{ try { const obj = JSON.parse(e.target.result); Object.assign(state, obj); saveState(); reRenderAll(); alert('Imported'); } catch(err){ alert('Invalid file'); } };
  reader.readAsText(file);
}

function importRosterCSV(file){
  const r = new FileReader();
  r.onload = e=>{
    const text = e.target.result.trim();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines.shift().split(',').map(h=>h.trim().toLowerCase());
    lines.forEach(l=>{
      const cols = l.split(',').map(c=>c.replace(/^"|"$/g,'').trim());
      const row = {};
      headers.forEach((h,i)=> row[h]=cols[i]||'');
      state.roster.push({id:idGen(), name: row.name||'Unknown', role: row.role||'', contact: row.contact||''});
    });
    saveState(); renderRoster();
  };
  r.readAsText(file);
}

/* ---------- util ---------- */
function escapeHtml(s){ return (s||'').replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

function reRenderAll(){
  renderTasks(); renderBudget(); renderRoster(); updateCountdown();
}

/* ---------- init ---------- */
function init(){
  loadState();
  document.getElementById('eventDate').value = state.eventDate || '';
  document.getElementById('eventDate').onchange = e=>{ state.eventDate = e.target.value; saveState(); updateCountdown(); };
  document.getElementById('addTaskBtn').onclick = addTaskFromInput;
  document.getElementById('taskInput').onkeypress = (e)=>{ if(e.key==='Enter') addTaskFromInput(); };
  document.getElementById('addRosterBtn').onclick = addRoster;
  document.getElementById('addBudgetBtn').onclick = addBudget;
  document.getElementById('saveBtn').onclick = ()=>{ saveState(); alert('Saved'); };
  document.getElementById('resetBtn').onclick = ()=>{ if(confirm('Clear all saved data?')){ localStorage.removeItem(LS_KEY); location.reload(); } };
  document.getElementById('exportTasks').onclick = exportTasksCSV;
  document.getElementById('exportRoster').onclick = exportRosterCSV;
  document.getElementById('exportBudget').onclick = exportBudgetCSV;
  document.getElementById('exportAll').onclick = exportAllJSON;
  document.getElementById('importAllBtn').onclick = ()=>document.getElementById('allFile').click();
  document.getElementById('allFile').onchange = (e)=> importAllJSON(e.target.files[0]);
  document.getElementById('importRosterBtn').onclick = ()=>document.getElementById('rosterFile').click();
  document.getElementById('rosterFile').onchange = (e)=> importRosterCSV(e.target.files[0]);
  document.getElementById('clearDone').onclick = ()=>{ state.tasks = state.tasks.filter(t=>t.status!=='Done'); saveState(); renderTasks(); };
  reRenderAll();
  // countdown update every minute
  setInterval(updateCountdown, 60*1000);
  updateCountdown();
}

init();
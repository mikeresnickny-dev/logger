
const $ = (q)=>document.querySelector(q);
const $$ = (q)=>document.querySelectorAll(q);
const todayKey = ()=> new Date().toISOString().slice(0,10);
const store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(e){ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

// Preloaded foods (name, P,F,C,K)
const PRELOADED = [
  // Proteins
  ["Chicken breast (4 oz)", 26, 3, 0, 140],
  ["Ground beef 85% lean (4 oz)", 22, 17, 0, 250],
  ["Rib-eye steak (4 oz)", 23, 20, 0, 290],
  ["NY strip steak (4 oz)", 25, 18, 0, 275],
  ["Egg (1 large)", 6, 5, 0.5, 70],
  ["Canned tuna, albacore (3 oz)", 20, 1, 0, 100],
  // Fats
  ["Olive oil (1 tbsp)", 0, 14, 0, 120],
  ["Ghee (1 tbsp)", 0, 14, 0, 120],
  ["Beef tallow (1 tbsp)", 0, 13, 0, 115],
  ["Avocado (1 medium)", 3, 21, 12, 240],
  ["Butter, grass-fed (1 tbsp)", 0, 12, 0, 100],
  // Veggies
  ["Bell pepper (1 medium)", 1, 0.2, 6, 25],
  ["Broccoli (1 cup, cooked)", 4, 0.5, 11, 55],
  ["Kimchi (1/2 cup)", 1, 0.5, 4, 15],
  ["Sauerkraut (1/2 cup)", 1, 0, 2, 10],
  ["Baby carrot (5 pcs)", 0.5, 0, 6, 25],
  ["Baby cucumber (1 pc)", 0.3, 0.1, 1.5, 8],
  // Fruit
  ["Mango (1/2 cup)", 0.5, 0.5, 14, 70],
  ["Cherries (1/2 cup)", 0.5, 0.3, 12, 60],
  ["Blueberries (1/2 cup)", 0.5, 0.3, 10, 42],
  ["Strawberries (1/2 cup)", 0.5, 0.2, 6, 25],
  ["Peach (1 medium)", 1, 0.3, 15, 60],
  ["Plum (1 medium)", 0.5, 0.2, 8, 35],
  ["Pear (1 medium)", 1, 0.2, 26, 100],
  ["Apple (1 medium)", 0.5, 0.3, 25, 95],
  // Beverages
  ["Coffee (black, 8 oz)", 0, 0, 0, 2],
  ["Beef bone broth (1 cup)", 10, 3, 1, 50],
];

const defaults = { goals:{P:180,F:80,C:110,K:2000,fastingGoal:'16:00'}, heightIn:69 };

function favoritesGet(){ return store.get('favorites', []); }
function favoritesSet(arr){ store.set('favorites', arr); }
function favoriteAdd(item){ const favs=favoritesGet(); if(!favs.find(f=>f.name===item.name)){ favs.push(item); favoritesSet(favs); } }
function favoriteButtons(){
  const bar = $('#favBar'); const favs=favoritesGet(); if(!bar) return;
  bar.innerHTML = favs.map(f=>`<button class="fav" data-name="${f.name}">${f.name}</button>`).join('') || '<div class="small">No favorites yet — add one above.</div>';
  bar.querySelectorAll('.fav').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = btn.getAttribute('data-name');
      const f = favoritesGet().find(x=>x.name===name);
      if(f){
        $('#foodName').value = f.name;
        $('#foodP').value = f.P;
        $('#foodF').value = f.F;
        $('#foodC').value = f.C;
        $('#foodK').value = f.K;
      }
    });
  });
}

function preloadedList(filter=""){
  const select = $('#foodPick'); if(!select) return;
  const q = (filter||'').toLowerCase();
  const all = PRELOADED.concat(favoritesGet().map(f=>[f.name,f.P,f.F,f.C,f.K]));
  const opts = all
    .filter(row => row[0].toLowerCase().includes(q))
    .map(row => `<option value="${row[0]}|${row[1]}|${row[2]}|${row[3]}|${row[4]}">${row[0]}</option>`)
    .join('');
  select.innerHTML = `<option value="">Pick from list…</option>` + opts;
}

function applyPick(){
  const val = $('#foodPick').value;
  if(!val) return;
  const [name,P,F,C,K] = val.split('|');
  $('#foodName').value = name;
  $('#foodP').value = P;
  $('#foodF').value = F;
  $('#foodC').value = C;
  $('#foodK').value = K;
}

function searchFoods(){
  preloadedList($('#foodSearch').value);
}

function loadGoals(){ const g=store.get('goals',defaults.goals);
  $('#goalP').value=g.P; $('#goalF').value=g.F; $('#goalC').value=g.C; $('#goalK').value=g.K; $('#goalFast').value=g.fastingGoal||'16:00';
}
function saveGoals(){ const g={P:+$('#goalP').value||0,F:+$('#goalF').value||0,C:+$('#goalC').value||0,K:+$('#goalK').value||0,fastingGoal:$('#goalFast').value||'16:00'};
  store.set('goals',g); render();
}
function getDay(k){ const all=store.get('days',{}); if(!all[k]){ all[k]={foods:[],activities:[],notes:'',body:{},cached:{}}; store.set('days',all); } return all[k]; }
function setDay(k,d){ const all=store.get('days',{}); all[k]=d; store.set('days',all); }
function minutesFromHHMM(hm){ if(!hm) return 0; const [h,m]=hm.split(':').map(Number); return h*60+m; }
function hhmmFromMinutes(min){ const h=Math.floor(min/60), m=min%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

function addFood(){
  const name=$('#foodName').value.trim(), time=$('#foodTime').value;
  const P=+$('#foodP').value||0, F=+$('#foodF').value||0, C=+$('#foodC').value||0;
  const K=+$('#foodK').value || Math.round(P*4 + C*4 + F*9);
  if(!name) return;
  const d=getDay(todayKey()); d.foods.push({name,time,P,F,C,K,ts:Date.now()}); setDay(todayKey(),d);
  $('#foodName').value=''; $('#foodP').value=''; $('#foodF').value=''; $('#foodC').value=''; $('#foodK').value=''; $('#foodTime').value='';
  render();
}

function favAddFromInputs(){
  const name=$('#foodName').value.trim();
  if(!name) return;
  const P=+$('#foodP').value||0, F=+$('#foodF').value||0, C=+$('#foodC').value||0;
  const K=+$('#foodK').value || Math.round(P*4 + C*4 + F*9);
  favoriteAdd({name,P,F,C,K});
  favoriteButtons();
  preloadedList($('#foodSearch').value);
}

function resetDay(){ if(!confirm("Reset today's entries?")) return;
  setDay(todayKey(), {foods:[],activities:[],notes:'',body:{},cached:{}}); render();
}
function metForActivity(type,intensity=2){ const base={
  'Tennis (singles)':8, 'Tennis (doubles)':5, 'Strength training':4, 'Walking':3, 'Running':9, 'Cycling':7, 'Other':4
}[type]||4; const mult=intensity==1?0.85:intensity==3?1.2:1.0; return base*mult; }
function addActivity(){ const type=$('#actType').value, minutes=+$('#actMin').value||0, intensity=+$('#actInt').value||2;
  if(minutes<=0) return; const d=getDay(todayKey()); d.activities.push({type,minutes,intensity,ts:Date.now()}); setDay(todayKey(),d); $('#actMin').value=''; render();
}
function saveBody(){ const d=getDay(todayKey()); const weight=+$('#wWeight').value || (d.body?.weight||0);
  const bf=+$('#wBF').value || (d.body?.bf||0); const sm=+$('#wSM').value || (d.body?.sm||0); const heightIn=+$('#wHeight').value || (store.get('heightIn',defaults.heightIn));
  store.set('heightIn',heightIn); d.body={weight,bf,sm,heightIn,ts:Date.now()}; setDay(todayKey(),d); render();
}
function saveNotes(){ const d=getDay(todayKey()); d.notes=$('#notesText').value; setDay(todayKey(),d); render(); }

function renderDashboard(){
  const g=store.get('goals',defaults.goals); const d=getDay(todayKey());
  const P=d.foods.reduce((s,x)=>s+x.P,0), F=d.foods.reduce((s,x)=>s+x.F,0), C=d.foods.reduce((s,x)=>s+x.C,0), K=d.foods.reduce((s,x)=>s+x.K,0);
  $('#kpiProtein').textContent=`${P} / ${g.P} g`; $('#kpiFat').textContent=`${F} / ${g.F} g`; $('#kpiCarbs').textContent=`${C} / ${g.C} g`; $('#kpiCalories').textContent=`${K} / ${g.K} kcal`;
  let warns=[]; if(P>g.P) warns.push('<span class="badge warn">Protein over</span>'); if(F>g.F) warns.push('<span class="badge warn">Fat over</span>');
  if(C>g.C) warns.push('<span class="badge warn">Carbs over</span>'); if(K>g.K) warns.push('<span class="badge danger">Calories over</span>'); $('#macroWarnings').innerHTML=warns.join(' ');

  const w=d.body?.weight||195, kg=w*0.453592; let kcal=0, lines=[];
  d.activities.forEach(a=>{ const mets=metForActivity(a.type,a.intensity), hours=a.minutes/60, cal=Math.round(mets*kg*hours);
    kcal+=cal; lines.push(`<div class="item"><div>${a.type} • ${a.minutes} min</div><div class="badge">${cal} kcal</div></div>`); });
  $('#kpiActivity').textContent=`${kcal} kcal burned`; $('#activitySummary').innerHTML=lines.join('')||'<div class="small">No activities yet.</div>';

  const hIn=d.body?.heightIn || store.get('heightIn',defaults.heightIn), hM=hIn*0.0254;
  const bmi=(d.body?.weight && hM)?(d.body.weight/(hM*hM)):null;
  const fatMass=(d.body?.weight && d.body?.bf)?(d.body.weight*d.body.bf/100):null;
  $('#kpiWeight').textContent=d.body?.weight?`${d.body.weight.toFixed(1)} lb`:'—';
  $('#kpiBody').textContent=`BMI ${bmi?bmi.toFixed(1):'—'} • BF% ${d.body?.bf||'—'} • SM% ${d.body?.sm||'—'} • Fat Mass ${fatMass?fatMass.toFixed(1):'—'} lb`;

  $('#todayNotes').textContent=d.notes||'—';

  const yKey=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const yd=getDay(yKey);
  const lastY=(yd.foods||[]).filter(f=>f.time).sort((a,b)=>a.time.localeCompare(b.time)).slice(-1)[0]?.time;
  const firstT=(d.foods||[]).filter(f=>f.time).sort((a,b)=>a.time.localeCompare(b.time))[0]?.time;
  let fastMin=0; if(lastY && firstT){ const lastM=minutesFromHHMM(lastY); const first=minutesFromHHMM(firstT); fastMin=(24*60-lastM)+first; }
  const gMin=minutesFromHHMM(g.fastingGoal||'16:00');
  $('#fastingText').textContent=`Fasting: ${hhmmFromMinutes(fastMin)} / ${g.fastingGoal||'16:00'}`;
  $('#fastingProgress').style.width = Math.max(0,Math.min(100,Math.round(fastMin/gMin*100))) + '%';
  $('#lastMeals').textContent=`Last meal yesterday: ${lastY||'—'} • First meal today: ${firstT||'—'}`;
}

function renderFood(){
  const d=getDay(todayKey());
  $('#foodList').innerHTML = d.foods.map(f=>`<div class="item"><div>${f.time||'--:--'} • ${f.name}</div><div class="small">${f.P}P / ${f.F}F / ${f.C}C • ${f.K} kcal</div></div>`).join('')
    || '<div class="small">No foods yet. Add your first meal above.</div>';
}
function renderActivity(){
  const d=getDay(todayKey());
  $('#actList').innerHTML = d.activities.map(a=>`<div class="item"><div>${a.type}</div><div class="small">${a.minutes} min • Int ${a.intensity}</div></div>`).join('')
    || '<div class="small">No activities yet.</div>';
}
function renderBody(){
  const d=getDay(todayKey());
  $('#wWeight').value=d.body?.weight||''; $('#wBF').value=d.body?.bf||''; $('#wSM').value=d.body?.sm||'';
  $('#wHeight').value=d.body?.heightIn || store.get('heightIn',defaults.heightIn);
  const hIn=d.body?.heightIn || store.get('heightIn',defaults.heightIn), hM=hIn*0.0254;
  const bmi=(d.body?.weight && hM)?(d.body.weight/(hM*hM)):null;
  const fatMass=(d.body?.weight && d.body?.bf)?(d.body.weight*d.body.bf/100):null;
  $('#bodyCalc').textContent=`BMI ${bmi?bmi.toFixed(1):'—'} • Fat Mass ${fatMass?fatMass.toFixed(1):'—'} lb`;
}
function renderNotes(){ const d=getDay(todayKey()); $('#notesText').value=d.notes||''; }
function renderHistory(){
  const days=store.get('days',{}), keys=Object.keys(days).sort().reverse(), g=store.get('goals',defaults.goals);
  const rows=keys.map(k=>{ const d=days[k]; const P=d.foods.reduce((s,x)=>s+x.P,0),F=d.foods.reduce((s,x)=>s+x.F,0),C=d.foods.reduce((s,x)=>s+x.C,0),K=d.foods.reduce((s,x)=>s+x.K,0);
    const prevKey=new Date(new Date(k).getTime()-86400000).toISOString().slice(0,10), prev=days[prevKey]||{foods:[]};
    const lastPrev=(prev.foods||[]).filter(f=>f.time).sort((a,b)=>a.time.localeCompare(b.time)).slice(-1)[0]?.time;
    const firstCur=(d.foods||[]).filter(f=>f.time).sort((a,b)=>a.time.localeCompare(b.time))[0]?.time;
    let fastMin=0; if(lastPrev && firstCur){ const lastM=minutesFromHHMM(lastPrev), firstT=minutesFromHHMM(firstCur); fastMin=(24*60-lastM)+firstT; }
    const pct=g.fastingGoal ? Math.min(100, Math.round(fastMin / minutesFromHHMM(g.fastingGoal) * 100)) : 0;
    const w=d.body?.weight?`${d.body.weight.toFixed(1)} lb`:'—';
    return `<div class="item"><div><strong>${k}</strong><div class="small">${w}</div></div>
      <div class="small">${P}/${g.P}P • ${F}/${g.F}F • ${C}/${g.C}C • ${K}/${g.K}kcal</div>
      <div class="badge">Fast ${hhmmFromMinutes(fastMin)} (${pct}%)</div></div>`;
  }).join('');
  $('#historyList').innerHTML=rows||'<div class="small">No history yet.</div>';
}
function renderHelp(){
  const help=`LOGGER QUICK START

ADD FOOD – 3 WAYS
1) Type in name + P/F/C/K (+ meal time) and tap Add.
2) Pick from preloaded list (or Favorites) and tap Apply to auto-fill.
3) Tap a Favorite chip to auto-fill instantly. Use ★ Save to add your own.

FAVORITES
• After entering a food, tap ★ Save to Favorites.
• Favorites are local to your device and appear as quick-add chips.

DASHBOARD
• See today's macros, weight, body comp, activity, and notes at a glance.
• Fasting shows time between last meal yesterday and first meal today.
• Progress bar compares fasting duration to your daily goal (default 16:00).

ACTIVITY
• Log type, minutes, and intensity (1 easy, 2 moderate, 3 hard).
• Calorie burn uses METs × body weight.

BODY
• Save weight, body fat %, skeletal muscle %, and height.
• BMI and Fat Mass are auto-calculated.

NOTES
• Track energy, sleep, digestion, or workout details.

HISTORY
• Review past days: macros, weight, fasting duration vs goal.

SETTINGS
• Set daily macro goals and fasting goal (default 16:00).`;
  $('#helpContent').textContent=help;
}
function render(){
  favoriteButtons();
  preloadedList($('#foodSearch')?.value||"");
  renderDashboard(); renderFood(); renderActivity(); renderBody(); renderNotes(); renderHistory(); renderHelp();
}

function initTabs(){ $$('.tab').forEach(b=>{ b.addEventListener('click',()=>{
  $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.tabcontent').forEach(s=>s.style.display='none'); $('#'+b.dataset.tab).style.display='block'; render();
});}); }
function initEvents(){
  $('#addFoodBtn').addEventListener('click', addFood);
  $('#favAddBtn').addEventListener('click', favAddFromInputs);
  $('#resetDayBtn').addEventListener('click', resetDay);
  $('#addActBtn').addEventListener('click', addActivity);
  $('#saveBodyBtn').addEventListener('click', saveBody);
  $('#saveNotesBtn').addEventListener('click', saveNotes);
  $('#saveGoalsBtn').addEventListener('click', saveGoals);
  $('#helpBtn').addEventListener('click', ()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelector('.tab[data-tab="settings"]').classList.add('active');
    $$('.tabcontent').forEach(s=>s.style.display='none'); $('#settings').style.display='block';
  });
  $('#applyPickBtn').addEventListener('click', applyPick);
  $('#foodSearch').addEventListener('input', searchFoods);
}
function firstRun(){ if(!localStorage.getItem('goals')) store.set('goals',defaults.goals);
  if(!localStorage.getItem('heightIn')) store.set('heightIn',defaults.heightIn);
  if(!localStorage.getItem('favorites')) store.set('favorites', []);
}
firstRun(); initTabs(); initEvents(); loadGoals(); render();

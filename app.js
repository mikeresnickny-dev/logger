
const $ = (q)=>document.querySelector(q);
const $$ = (q)=>document.querySelectorAll(q);
const todayKey = ()=> new Date().toISOString().slice(0,10);
const store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(e){ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};
const defaults = { goals:{P:180,F:80,C:110,K:2000,fastingGoal:'16:00'}, heightIn:69 };

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
  $('#foodName').value=''; $('#foodP').value=''; $('#foodF').value=''; $('#foodC').value=''; $('#foodK').value=''; render();
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

function renderFood(){ const d=getDay(todayKey());
  $('#foodList').innerHTML = d.foods.map(f=>`<div class="item"><div>${f.time||'--:--'} • ${f.name}</div><div class="small">${f.P}P / ${f.F}F / ${f.C}C • ${f.K} kcal</div></div>`).join('')
    || '<div class="small">No foods yet. Add your first meal above.</div>';
}
function renderActivity(){ const d=getDay(todayKey());
  $('#actList').innerHTML = d.activities.map(a=>`<div class="item"><div>${a.type}</div><div class="small">${a.minutes} min • Int ${a.intensity}</div></div>`).join('')
    || '<div class="small">No activities yet.</div>';
}
function renderBody(){ const d=getDay(todayKey());
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

DASHBOARD
• See today's macros, weight, body comp, activity, and notes at a glance.
• Fasting shows time between last meal yesterday and first meal today.
• Progress bar compares fasting duration to your daily goal (default 16:00).

ADD FOOD
• Enter food name, P/F/C/K, and meal time.
• Calories auto-calc if left blank.
• Entries update totals instantly.

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
function render(){ renderDashboard(); renderFood(); renderActivity(); renderBody(); renderNotes(); renderHistory(); renderHelp(); }
function initTabs(){ $$('.tab').forEach(b=>{ b.addEventListener('click',()=>{
  $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.tabcontent').forEach(s=>s.style.display='none'); $('#'+b.dataset.tab).style.display='block'; render();
});}); }
function initEvents(){
  $('#addFoodBtn').addEventListener('click', addFood);
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
}
function firstRun(){ if(!localStorage.getItem('goals')) store.set('goals',defaults.goals);
  if(!localStorage.getItem('heightIn')) store.set('heightIn',defaults.heightIn);
}
firstRun(); initTabs(); initEvents(); loadGoals(); render();

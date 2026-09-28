/* ============================================================
   EMERALD GUILD — UI HELPERS (main.js)
   toast / modal / sounds / ripple / count-up / particles / session
================================================================ */

/* ---------------- SOUND ENGINE (Web Audio API, no files needed) ---------------- */
const Sound = (()=>{
  let ctx=null;
  function ac(){ if(!ctx){ ctx = new (window.AudioContext||window.webkitAudioContext)(); } return ctx; }
  function tone(freq, dur, type="sine", vol=.05, delay=0){
    try{
      const c = ac();
      const o = c.createOscillator(); const g = c.createGain();
      o.type=type; o.frequency.value=freq;
      g.gain.value=vol;
      o.connect(g); g.connect(c.destination);
      const t0 = c.currentTime+delay;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
      o.start(t0); o.stop(t0+dur);
    }catch(e){}
  }
  return {
    click(){ tone(920,.06,"triangle",.045); },
    success(){ tone(660,.09,"sine",.05); tone(990,.12,"sine",.045,.09); },
    error(){ tone(180,.18,"sawtooth",.05); },
    open(){ tone(500,.07,"sine",.04); tone(760,.08,"sine",.035,.05); },
    coin(){ tone(1200,.05,"square",.03); tone(1600,.07,"square",.025,.05); },
  };
})();

document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".btn, .tab, .iconbtn, .nav-item, .seg button");
  if(btn){
    Sound.click();
    const circle = document.createElement("span");
    circle.className="ripple";
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = size+"px";
    circle.style.left = (e.clientX - rect.left - size/2)+"px";
    circle.style.top = (e.clientY - rect.top - size/2)+"px";
    if(getComputedStyle(btn).position==="static") btn.style.position="relative";
    btn.style.overflow="hidden";
    btn.appendChild(circle);
    setTimeout(()=>circle.remove(),650);
  }
});

/* ---------------- TOAST ---------------- */
function ensureToastBox(){
  let box = document.getElementById("toast-box");
  if(!box){ box=document.createElement("div"); box.id="toast-box"; document.body.appendChild(box); }
  return box;
}
function toast(msg, type="info"){
  const box = ensureToastBox();
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icon = type==="success"?"fa-circle-check":type==="error"?"fa-circle-xmark":"fa-circle-info";
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${msg}</span>`;
  box.appendChild(el);
  if(type==="success") Sound.success(); else if(type==="error") Sound.error();
  setTimeout(()=>{ el.style.animation="toastOut .3s ease forwards"; setTimeout(()=>el.remove(),300); }, 3200);
}

/* ---------------- MODAL ---------------- */
function openModal(id){ const m=document.getElementById(id); if(m){ m.classList.add("show"); Sound.open(); } }
function closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove("show"); }
document.addEventListener("click",(e)=>{
  if(e.target.classList && e.target.classList.contains("modal-bg")) e.target.classList.remove("show");
});

/* ---------------- CONFIRM (styled) ---------------- */
function confirmAction(message, onYes){
  let wrap = document.getElementById("confirm-modal");
  if(!wrap){
    wrap = document.createElement("div");
    wrap.id="confirm-modal"; wrap.className="modal-bg";
    wrap.innerHTML = `<div class="modal" style="max-width:340px;text-align:center;">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:30px;color:var(--warning);margin-bottom:10px;"></i>
      <p id="confirm-msg" style="margin-bottom:18px;font-weight:600;font-size:14px;"></p>
      <div class="flex gap10">
        <button class="btn btn-ghost btn-block" id="confirm-no">إلغاء</button>
        <button class="btn btn-danger btn-block" id="confirm-yes">تأكيد</button>
      </div>
    </div>`;
    document.body.appendChild(wrap);
  }
  document.getElementById("confirm-msg").textContent = message;
  wrap.classList.add("show");
  const yes = document.getElementById("confirm-yes");
  const no = document.getElementById("confirm-no");
  const cleanup = ()=>{ wrap.classList.remove("show"); yes.replaceWith(yes.cloneNode(true)); no.replaceWith(no.cloneNode(true)); };
  document.getElementById("confirm-yes").onclick = ()=>{ cleanup(); onYes(); };
  document.getElementById("confirm-no").onclick = cleanup;
}

/* ---------------- COUNT UP ---------------- */
function countUp(el, target, duration=900, suffix=""){
  const start = 0; const t0 = performance.now();
  function step(t){
    const p = Math.min(1,(t-t0)/duration);
    const eased = 1-Math.pow(1-p,3);
    el.textContent = Math.round(start + (target-start)*eased).toLocaleString("en-US") + suffix;
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------------- PARTICLES BG ---------------- */
function initParticles(count=16){
  const bg = document.querySelector(".bg-fx");
  if(!bg) return;
  for(let i=0;i<count;i++){
    const p = document.createElement("div");
    p.className="particle";
    p.style.left = Math.random()*100+"%";
    p.style.animationDuration = (8+Math.random()*10)+"s";
    p.style.animationDelay = (Math.random()*10)+"s";
    p.style.width = p.style.height = (2+Math.random()*3)+"px";
    bg.appendChild(p);
  }
}
function mountBgFx(){
  if(document.querySelector(".bg-fx")) return;
  const bg = document.createElement("div");
  bg.className="bg-fx";
  bg.innerHTML = `<div class="orb"></div><div class="orb"></div><div class="orb"></div>`;
  document.body.prepend(bg);
  initParticles();
}

/* ---------------- SESSION HELPERS ----------------
   نستخدم localStorage (بدل sessionStorage) عشان الجلسة تثبت
   حتى لو صار تحويل بين صفحات أو فتح رابط بتبويب جديد على الجوال.
------------------------------------------------------ */
const Session = {
  set(role, data){ localStorage.setItem("eg_session", JSON.stringify({role, ...data, ts:Date.now()})); },
  get(){ try{ return JSON.parse(localStorage.getItem("eg_session")); }catch(e){ return null; } },
  clear(){ localStorage.removeItem("eg_session"); },
  requireRole(roles, redirectTo){
    const s = Session.get();
    if(!s || !roles.includes(s.role)){
      const sep = redirectTo.includes("?") ? "&" : "?";
      location.href = redirectTo + sep + "authRequired=1";
      return null;
    }
    return s;
  }
};

/* ---------------- WHATSAPP HELPER ---------------- */
function waLink(number, message){
  const clean = (number||"").replace(/[^0-9]/g,"");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/* ---------------- PASSWORD TOGGLE ---------------- */
function togglePw(inputId, iconEl){
  const inp = document.getElementById(inputId);
  if(inp.type==="password"){ inp.type="text"; iconEl.classList.replace("fa-eye","fa-eye-slash"); }
  else{ inp.type="password"; iconEl.classList.replace("fa-eye-slash","fa-eye"); }
}

/* ---------------- DATE FORMAT ---------------- */
function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleString("ar-SA",{ day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}
function fmtMoney(n){ return Number(n||0).toLocaleString("en-US"); }

document.addEventListener("DOMContentLoaded", mountBgFx);

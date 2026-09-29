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
  const btn = e.target.closest(".btn, .tab, .iconbtn, .nav-item, .seg button, .fab");
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



/* ============================================================
   v4 — HELPERS: escape / photo picker / floating buttons / staff login / help
================================================================ */
function esc(v){
  return String(v==null?"":v).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ---------------- PHOTO PICKER ----------------
   يقصّ الصورة مربعة ويصغّرها (320px) ويحفظها كنص Base64 داخل قاعدة البيانات،
   فتشتغل بدون سيرفر. عند الربط بـ Supabase الأفضل نقلها إلى Storage.
------------------------------------------------ */
const _avatarVals = {};
function resizeImage(file, max=320){
  return new Promise((resolve, reject)=>{
    if(!file || !/^image\//.test(file.type)){ reject(new Error("اختر ملف صورة صالح")); return; }
    const fr = new FileReader();
    fr.onerror = ()=> reject(new Error("تعذّر قراءة الصورة"));
    fr.onload = ()=>{
      const img = new Image();
      img.onerror = ()=> reject(new Error("الصورة غير صالحة"));
      img.onload = ()=>{
        const side = Math.min(img.width, img.height);
        const out = Math.min(side, max);
        const c = document.createElement("canvas"); c.width = c.height = out;
        const x = c.getContext("2d");
        x.fillStyle = "#0a1815"; x.fillRect(0,0,out,out);
        x.drawImage(img, (img.width-side)/2, (img.height-side)/2, side, side, 0, 0, out, out);
        resolve(c.toDataURL("image/jpeg", .85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function avatarPickerHTML(id, current, label){
  _avatarVals[id] = current || "";
  return `<div class="field"><label><i class="fa-solid fa-image"></i> ${label||"الصورة الشخصية"}</label>
    <div class="ap">
      <img class="pv" id="apv_${id}" src="${current||'assets/logo.png'}" alt="">
      <div class="btns">
        <button type="button" class="btn btn-outline btn-sm" onclick="pickAvatar('${id}')"><i class="fa-solid fa-camera"></i> اختيار صورة</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="clearAvatar('${id}')"><i class="fa-solid fa-trash"></i> إزالة</button>
      </div>
    </div></div>`;
}
function pickAvatar(id){
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*"; inp.style.display = "none";
  document.body.appendChild(inp);
  inp.onchange = async ()=>{
    const f = inp.files && inp.files[0];
    inp.remove();
    if(!f) return;
    try{
      const data = await resizeImage(f);
      _avatarVals[id] = data;
      const pv = document.getElementById("apv_"+id); if(pv) pv.src = data;
      toast("تم اختيار الصورة، اضغط حفظ لتثبيتها","info");
    }catch(e){ toast(e.message,"error"); }
  };
  inp.click();
}
function clearAvatar(id){
  _avatarVals[id] = "";
  const pv = document.getElementById("apv_"+id); if(pv) pv.src = "assets/logo.png";
}
function getAvatar(id){ return _avatarVals[id] || ""; }

/* ---------------- STAFF LOGIN (bank / store / leader) ---------------- */
const STAFF = {
  bank:  { title:"تسجيل دخول مسؤول البنك",  icon:"fa-user-shield", target:"bank.html",   hint:"هذا القسم مخصص لمسؤول البنك فقط" },
  store: { title:"تسجيل دخول مسؤول المتجر", icon:"fa-shop",        target:"store.html",  hint:"هذا القسم مخصص لمسؤول المتجر فقط" },
  leader:{ title:"دخول القيادة العليا",     icon:"fa-crown",       target:"leader.html", hint:"القائد الأعلى أو أحد النواب المعيّنين فقط" },
};
function openStaffLogin(kind){
  const c = STAFF[kind]; if(!c) return;
  let m = document.getElementById("staffModal"); if(m) m.remove();
  m = document.createElement("div"); m.className = "modal-bg show"; m.id = "staffModal";
  m.innerHTML = `<div class="modal" style="max-width:360px;">
    <div class="modal-head"><h3><i class="fa-solid ${c.icon}"></i> ${c.title}</h3>
      <button class="modal-close" onclick="document.getElementById('staffModal').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="field"><div class="pw-wrap"><input type="password" id="staffPw" placeholder="كلمة المرور" autocomplete="off"><i class="fa-solid fa-eye" onclick="togglePw('staffPw',this)"></i></div></div>
    <div class="flex gap10">
      <button class="btn btn-ghost btn-block" onclick="document.getElementById('staffModal').remove()"><i class="fa-solid fa-xmark"></i> إلغاء</button>
      <button class="btn btn-primary btn-block" onclick="doStaffLogin('${kind}')"><i class="fa-solid fa-right-to-bracket"></i> تأكيد</button>
    </div>
    <div class="hint center mt12"><i class="fa-solid fa-circle-info"></i> ${c.hint}</div>
  </div>`;
  document.body.appendChild(m); Sound.open();
  const inp = document.getElementById("staffPw");
  inp.addEventListener("keydown", e=>{ if(e.key==="Enter") doStaffLogin(kind); });
  setTimeout(()=>inp.focus(), 80);
}
async function doStaffLogin(kind){
  const pw = document.getElementById("staffPw").value.trim();
  if(!pw){ toast("أدخل كلمة المرور","error"); return; }
  const go = (msg)=>{ toast(msg,"success"); setTimeout(()=>{ location.href = STAFF[kind].target; }, 450); };
  try{
    if(kind==="bank"){
      if(!(await DB.verifyBankAdmin(pw))){ toast("كلمة مرور خاطئة","error"); return; }
      Session.set("bankAdmin",{}); go("مرحبًا بك يا مسؤول البنك"); return;
    }
    if(kind==="store"){
      if(!(await DB.verifyStoreAdmin(pw))){ toast("كلمة مرور خاطئة","error"); return; }
      Session.set("storeAdmin",{}); go("مرحبًا بك يا مسؤول المتجر"); return;
    }
    if(await DB.verifyLeader(pw)){
      const g = await DB.getGuild();
      Session.set("leader",{name:g.leaderName}); go("مرحبًا بعودتك أيها القائد"); return;
    }
    const dep = await DB.verifyDeputy(pw);
    if(dep){ Session.set("deputy",{id:dep.id, name:dep.name}); go("تم التحقق، مرحبًا "+dep.name); return; }
    toast("كلمة المرور غير صحيحة","error");
  }catch(e){ console.error(e); toast("خطأ غير متوقع: "+e.message,"error"); }
}

/* ---------------- HELP (شرح طريقة الاستخدام) ---------------- */
window.HELP_CTX = window.HELP_CTX || "home";
const HELP = {
  home:{ title:"طريقة استخدام الموقع", sections:[
    { icon:"fa-user", t:"تسجيل الدخول", steps:["أدخل الآيدي المكوّن من الأرقام في الحقل المخصص","أدخل لقبك في النقابة بالضبط كما هو مسجّل","أدخل كلمة المرور ثم اضغط زر دخول العضو"], note:"تأكد من صحة البيانات قبل الضغط على زر الدخول" },
    { icon:"fa-paper-plane", t:"التحويلات المالية", steps:["بعد تسجيل الدخول اضغط على زر تحويل","أدخل آيدي العضو المستلم والمبلغ المطلوب","يصل طلبك لمسؤول البنك، وعند اعتماده يُنفّذ التحويل فورًا"] },
    { icon:"fa-shop", t:"متجر النقابة", steps:["اضغط على «متجر» من الشريط العلوي أو من قسم المتجر","تصفّح المنتجات واضغط أيقونة السلة على المنتج","أدخل بيانات حسابك لتأكيد الطلب، ويُخصم المبلغ من رصيدك بعد الاعتماد"] },
    { icon:"fa-headset", t:"التواصل والاستفسار", steps:["اضغط «تواصل مع مسؤول البنك» لفتح واتساب مباشرة","يمكنك أيضًا التواصل مع القائد أو النواب من قسم قيادة النقابة"] },
    { icon:"fa-circle-info", t:"الأزرار الجانبية", steps:["الزر الأحمر: دخول مسؤول البنك","الزر الذهبي: دخول القائد والنواب","علامة الاستفهام: هذا الشرح"] },
  ]},
  member:{ title:"طريقة استخدام حسابك", sections:[
    { icon:"fa-wallet", t:"رصيدك وعملياتك", steps:["يظهر رصيدك الحالي في أعلى الصفحة","أسفله قائمة بآخر عملياتك المصرفية مع التاريخ والمبلغ"] },
    { icon:"fa-paper-plane", t:"تحويل رصيد", steps:["اضغط زر تحويل","أدخل آيدي العضو المستلم والمبلغ وأي ملاحظة","أرسل الطلب وانتظر اعتماد مسؤول البنك"], note:"لن يُخصم المبلغ إلا بعد اعتماد المسؤول" },
    { icon:"fa-right-from-bracket", t:"الخروج", steps:["اضغط أيقونة الخروج أعلى الصفحة لإنهاء الجلسة"] },
  ]},
  bankAdmin:{ title:"دليل لوحة مسؤول البنك", sections:[
    { icon:"fa-inbox", t:"طلبات الأعضاء", steps:["تظهر هنا طلبات التحويل المعلّقة","اضغط «موافقة وتنفيذ» لتنفيذ التحويل أو «رفض» لإلغائه"] },
    { icon:"fa-bag-shopping", t:"طلبات المتجر", steps:["تظهر طلبات الشراء القادمة من المتجر","عند القبول يُخصم المبلغ تلقائيًا من رصيد العضو"] },
    { icon:"fa-users", t:"الأعضاء", steps:["أضف عضوًا جديدًا مع صورته وبياناته","غيّر صورة العضو بأيقونة الكاميرا","عدّل الرصيد بأيقونة العملات، أو جمّد الحساب بأيقونة القفل"] },
    { icon:"fa-clock-rotate-left", t:"السجل", steps:["يعرض آخر الإجراءات التي نُفّذت على النظام"] },
  ]},
  store:{ title:"طريقة استخدام المتجر", sections:[
    { icon:"fa-magnifying-glass", t:"التصفح", steps:["اختر القسم من الشريط العلوي للتصنيفات","تصفّح المنتجات، والتصفح مفتوح للجميع بدون تسجيل"] },
    { icon:"fa-cart-shopping", t:"الشراء", steps:["اضغط أيقونة السلة على المنتج واختر الكمية","أدخل الآيدي واللقب وكلمة المرور لتأكيد هويتك","يُرسل الطلب للمراجعة، ويُخصم المبلغ من رصيدك بعد القبول"] },
    { icon:"fa-circle-info", t:"الأزرار الجانبية", steps:["الزر الأحمر: دخول مسؤول المتجر","الزر الذهبي: دخول القائد والنواب"] },
  ]},
  storeAdmin:{ title:"دليل لوحة مسؤول المتجر", sections:[
    { icon:"fa-receipt", t:"طلبات الشراء", steps:["راجع الطلبات الجديدة من الأعضاء","اضغط «قبول وخصم المبلغ» أو «رفض»"] },
    { icon:"fa-boxes-stacked", t:"إدارة المنتجات", steps:["فعّل المنتج أو أخفِه بخيار «نشط»","عدّل الكمية المتوفرة أو احذف المنتج"] },
    { icon:"fa-plus", t:"إضافة منتج", steps:["اكتب الاسم والتصنيف والوصف والسعر والكمية","أضف رابط صورة (اختياري) ثم اضغط نشر المنتج"] },
  ]},
  leader:{ title:"دليل لوحة القيادة العليا", sections:[
    { icon:"fa-gauge", t:"نظرة عامة", steps:["إحصائيات النقابة في أعلى الصفحة","عدّل بيانات النقابة وصورة القائد ونبذة البنك وبيانات المبرمج ثم احفظ"] },
    { icon:"fa-user-shield", t:"النواب", steps:["عيّن نائبًا جديدًا مع صورته ورقم تواصله وكلمة مروره","عدّل بياناته أو صورته بأيقونة القلم، وأعزله عند الحاجة"] },
    { icon:"fa-building-columns", t:"مسؤولو البنك والمتجر", steps:["غيّر الاسم والصورة والواتساب وكلمة مرور كل مسؤول"] },
    { icon:"fa-users", t:"إدارة الأعضاء", steps:["ابحث عن العضو وعدّل بياناته وصورته ورصيده","يمكنك حذف العضو نهائيًا"] },
    { icon:"fa-gear", t:"الإعدادات", steps:["غيّر كلمة مرور القائد","نزّل نسخة احتياطية من البيانات (JSON)"], note:"إعادة التعيين الكاملة تحذف كل البيانات ولا يمكن التراجع عنها" },
  ]},
};
function openHelp(ctx){
  const h = HELP[ctx || window.HELP_CTX] || HELP.home;
  let m = document.getElementById("helpModal"); if(m) m.remove();
  m = document.createElement("div"); m.className = "modal-bg show"; m.id = "helpModal";
  m.innerHTML = `<div class="modal help-modal">
    <div class="modal-head"><h3><i class="fa-solid fa-book-open"></i> ${h.title}</h3>
      <button class="modal-close" onclick="document.getElementById('helpModal').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    ${h.sections.map(s=>`<div class="help-sec"><h4><i class="fa-solid ${s.icon}"></i> ${s.t}</h4>
      ${s.steps.map((t,i)=>`<div class="help-step"><b>${i+1}</b><span>${t}</span></div>`).join("")}
      ${s.note?`<div class="help-note"><i class="fa-solid fa-lightbulb"></i> ${s.note}</div>`:""}</div>`).join("")}
  </div>`;
  document.body.appendChild(m); Sound.open();
}

/* ---------------- FLOATING BUTTONS ---------------- */
function mountFab(opts){
  opts = opts || {};
  if(document.getElementById("fab-stack")) return;
  const box = document.createElement("div"); box.id = "fab-stack"; box.className = "fab-stack";
  let h = `<button class="fab help" title="طريقة الاستخدام" onclick="openHelp()"><i class="fa-solid fa-question"></i></button>`;
  if(opts.admin) h += `<button class="fab admin" title="${STAFF[opts.admin].title}" onclick="openStaffLogin('${opts.admin}')"><i class="fa-solid fa-user-shield"></i></button>`;
  if(opts.leader) h += `<button class="fab leader" title="دخول القائد" onclick="openStaffLogin('leader')"><i class="fa-solid fa-crown"></i></button>`;
  box.innerHTML = h;
  document.body.appendChild(box);
}

/* ---------------- REVEAL ON SCROLL ---------------- */
function initReveal(){
  const els = document.querySelectorAll(".rv");
  if(!("IntersectionObserver" in window)){ els.forEach(e=>e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
  }, {threshold:.08});
  els.forEach(e=>io.observe(e));
  setTimeout(()=>els.forEach(e=>e.classList.add("in")), 2500); // ضمان الظهور
}

document.addEventListener("DOMContentLoaded", mountBgFx);

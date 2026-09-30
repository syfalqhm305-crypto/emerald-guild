/* ============================================================
   EMERALD GUILD — DATA LAYER (db.js) — Firebase Firestore Edition
   ------------------------------------------------------------
   نفس أسماء الدوال وشكل البيانات بالضبط زي نسخة localStorage القديمة،
   فكل صفحات HTML تشتغل بدون أي تعديل. الفرق إن البيانات الآن محفوظة
   على Firestore (سحابة Google) بدل متصفحك، فتفضل موجودة لأي زائر
   ومن أي جهاز، ولا تنقطع أبدًا.

   لازم قبل هذا الملف تحمّل بالترتيب:
   1) firebase-app.js  2) firebase-firestore.js  3) js/firebase-config.js
================================================================ */

/* بيانات المبرمج ثابتة في الكود (لا تُعدَّل من لوحة التحكم) */
const DEVELOPER = {
  name:"لوفي/سيف",
  role:"مبرمج ومطوّر الموقع",
  whatsapp:"967781814733",
  phoneDisplay:"+967781814733",
  avatar:"assets/developer.jpg",
};

if(typeof firebase === "undefined"){
  document.addEventListener("DOMContentLoaded", ()=>{
    document.body.insertAdjacentHTML("afterbegin", `<div style="background:#7f1d1d;color:#fff;padding:14px;text-align:center;font-family:sans-serif;font-size:13px;">
      ⚠️ لم يتم تحميل مكتبة Firebase. تأكد إن ملفات firebase-app.js و firebase-firestore.js محمّلة قبل db.js
    </div>`);
  });
}
if(typeof firebaseConfig === "undefined" || firebaseConfig.apiKey === "ضع القيمة هنا"){
  document.addEventListener("DOMContentLoaded", ()=>{
    document.body.insertAdjacentHTML("afterbegin", `<div style="background:#7f1d1d;color:#fff;padding:14px;text-align:center;font-family:sans-serif;font-size:13px;">
      ⚠️ لم تُعبَّأ إعدادات Firebase بعد. افتح js/firebase-config.js وعبّي بيانات مشروعك.
    </div>`);
  });
}
if(typeof firebase !== "undefined" && !firebase.apps.length && typeof firebaseConfig !== "undefined"){
  firebase.initializeApp(firebaseConfig);
}
const fdb = (typeof firebase !== "undefined") ? firebase.firestore() : null;

function _now(){ return new Date().toISOString(); }

function _seedGuild(){
  return {
    name:"نقابة إميرالد", nameEn:"EMERALD GUILD", tagline:"القوة والولاء تحت راية الزمرد",
    logo:"assets/logo.png", treasury:1480250, feeRate:1.5, exchangeRate:100,
    leaderName:"القائد الأعلى", leaderId:"EMD-00001", leaderPassword:"leader123",
    leaderAvatar:"", leaderWhatsapp:"",
    bankIntro:"بنك إميرالد هو المنصة المالية الرقمية الرسمية لنقابة إميرالد، تهدف إلى تقديم حلول مصرفية حديثة وآمنة وسهلة الاستخدام. نوفّر لأعضاء النقابة حساباتهم الخاصة، وتحويلات فورية بين الأعضاء، والوصول لمتجر النقابة بكل سهولة، مع أعلى معايير الحماية والخصوصية.",
  };
}
function _seedAdmins(){
  return {
    bank:{ name:"مسؤول البنك", role:"مسؤول البنك", whatsapp:"", password:"bank123", avatar:"" },
    store:{ name:"مسؤول المتجر", role:"مسؤول المتجر", whatsapp:"", password:"store123", avatar:"" },
  };
}
function _seedSampleMember(){
  return { id:"1000001", title:"العضو المؤسس", rank:"قائد فرقة", password:"member123", whatsapp:"", avatar:"", balance:5000, status:"active", joined:_now() };
}
function _seedProducts(){
  return [
    { name:"رتبة فارس الزمرد الملكي", category:"رتب", priceEMD:5000, priceUSD:50, qty:99, image:"", desc:"ترقية دائمة في سجلات النقابة.", active:true },
    { name:"صندوق سيولة الزمرد (10,000)", category:"سيولة", priceEMD:10000, priceUSD:100, qty:0, image:"", desc:"رصيد فوري يضاف لحسابك في البنك.", active:true, unlimited:true },
    { name:"شارة الشرف الزمردية", category:"أوسمة", priceEMD:2500, priceUSD:25, qty:3, image:"", desc:"وسام تكريمي يظهر بجانب اسمك.", active:true },
  ];
}

/* أول مرة يُفتح فيها الموقع بعد إنشاء المشروع، تُزرع البيانات الافتراضية تلقائيًا */
let _seedReady = null;
function ensureSeed(){
  if(_seedReady) return _seedReady;
  _seedReady = (async ()=>{
    const gRef = fdb.collection("guild").doc("main");
    const gSnap = await gRef.get();
    if(gSnap.exists) return;
    const admins = _seedAdmins();
    await gRef.set(_seedGuild());
    await fdb.collection("admins").doc("bank").set(admins.bank);
    await fdb.collection("admins").doc("store").set(admins.store);
    await fdb.collection("members").doc("1000001").set(_seedSampleMember());
    for(const p of _seedProducts()){ await fdb.collection("products").add(p); }
  })();
  return _seedReady;
}

function withId(doc){ return { id: doc.id, ...doc.data() }; }
async function getAll(colName){
  const snap = await fdb.collection(colName).get();
  return snap.docs.map(withId);
}
function sortDesc(list){ return list.slice().sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))); }

const DB = {

  async resetAll(){
    await ensureSeed();
    const cols = ["deputies","leaders","registrations","members","products","orders","transactions","requests","auditLog"];
    for(const c of cols){
      const snap = await fdb.collection(c).get();
      const batch = fdb.batch();
      snap.docs.forEach(d=>batch.delete(d.ref));
      if(snap.docs.length) await batch.commit();
    }
    const admins = _seedAdmins();
    await fdb.collection("guild").doc("main").set(_seedGuild());
    await fdb.collection("admins").doc("bank").set(admins.bank);
    await fdb.collection("admins").doc("store").set(admins.store);
    await fdb.collection("members").doc("1000001").set(_seedSampleMember());
    return true;
  },

  async exportJSON(){
    await ensureSeed();
    const [guildSnap, admins, deputies, leaders, registrations, members, products, orders, transactions, requests, auditLog] = await Promise.all([
      fdb.collection("guild").doc("main").get(),
      getAll("admins"), getAll("deputies"), getAll("leaders"), getAll("registrations"),
      getAll("members"), getAll("products"), getAll("orders"), getAll("transactions"), getAll("requests"), getAll("auditLog"),
    ]);
    const adminsObj = {}; admins.forEach(a=>{ const {id,...rest}=a; adminsObj[id]=rest; });
    return JSON.stringify({ guild:guildSnap.data(), admins:adminsObj, deputies, leaders, registrations, members, products, orders, transactions, requests, auditLog }, null, 2);
  },

  /* ---------------- GUILD ---------------- */
  async getGuild(){ await ensureSeed(); const s = await fdb.collection("guild").doc("main").get(); return s.data(); },
  async updateGuild(patch){
    await ensureSeed();
    await fdb.collection("guild").doc("main").update(patch);
    const s = await fdb.collection("guild").doc("main").get();
    return s.data();
  },

  /* ---------------- DEPUTIES (نواب القائد) ---------------- */
  async getDeputies(){ await ensureSeed(); return getAll("deputies"); },
  async addDeputy(dep){
    await ensureSeed();
    const data = { name:dep.name, role:dep.role||"نائب القائد", whatsapp:dep.whatsapp||"", password:dep.password, avatar:dep.avatar||"" };
    const ref = await fdb.collection("deputies").add(data);
    return { id:ref.id, ...data };
  },
  async updateDeputy(id, patch){ await ensureSeed(); await fdb.collection("deputies").doc(id).update(patch); return true; },
  async removeDeputy(id){ await ensureSeed(); await fdb.collection("deputies").doc(id).delete(); return true; },

  /* ---------------- LEADERS (قادة إضافيون) ---------------- */
  async getLeaders(){ await ensureSeed(); return getAll("leaders"); },
  async addLeader(l){
    await ensureSeed();
    const data = { name:l.name, role:l.role||"قائد", whatsapp:l.whatsapp||"", avatar:l.avatar||"" };
    const ref = await fdb.collection("leaders").add(data);
    return { id:ref.id, ...data };
  },
  async updateLeader(id, patch){ await ensureSeed(); await fdb.collection("leaders").doc(id).update(patch); return true; },
  async removeLeader(id){ await ensureSeed(); await fdb.collection("leaders").doc(id).delete(); return true; },

  /* ---------------- REGISTRATIONS (طلبات التسجيل) ---------------- */
  async getRegistrations(status=null){
    await ensureSeed();
    const l = await getAll("registrations");
    return status? l.filter(r=>r.status===status) : l;
  },
  async addRegistration(reg){
    await ensureSeed();
    const title = (reg.title||"").trim();
    if(!title || !reg.password) throw new Error("أكمل اللقب وكلمة المرور");
    const t = title.toLowerCase();
    const [members, regs] = await Promise.all([getAll("members"), getAll("registrations")]);
    if(members.some(m=>(m.title||"").trim().toLowerCase()===t) || regs.some(r=>r.status==="pending" && (r.title||"").trim().toLowerCase()===t))
      throw new Error("هذا اللقب مستخدم مسبقًا، اختر لقبًا آخر");
    const used = new Set([...members.map(m=>m.id), ...regs.map(r=>r.memberId)]);
    let memberId = null;
    for(let i=0;i<300;i++){ const cand = String(Math.floor(1000000 + Math.random()*9000000)); if(!used.has(cand)){ memberId = cand; break; } }
    if(!memberId) throw new Error("تعذّر توليد آيدي، حاول مرة أخرى");
    const data = { memberId, title, rank:(reg.rank||"").trim()||"عضو", password:reg.password, avatar:reg.avatar||"", status:"pending", createdAt:_now() };
    const ref = await fdb.collection("registrations").add(data);
    return { id:ref.id, ...data };
  },
  async decideRegistration(id, approve, actor, reason){
    await ensureSeed();
    return fdb.runTransaction(async (tx)=>{
      const regRef = fdb.collection("registrations").doc(id);
      const regSnap = await tx.get(regRef);
      if(!regSnap.exists) throw new Error("الطلب غير موجود");
      const r = regSnap.data();
      if(r.status!=="pending") return {ok:false, msg:"تم البتّ في هذا الطلب مسبقًا"};
      let memberSnap = null;
      if(approve){
        memberSnap = await tx.get(fdb.collection("members").doc(r.memberId));
        if(memberSnap.exists) return {ok:false, msg:"الآيدي مستخدم مسبقًا"};
      }
      if(approve){
        tx.set(fdb.collection("members").doc(r.memberId), { id:r.memberId, title:r.title, rank:r.rank, password:r.password, whatsapp:"", avatar:r.avatar||"", balance:0, status:"active", joined:_now() });
        tx.update(regRef, { status:"approved", decidedAt:_now(), decidedBy:actor||"مسؤول البنك" });
      } else {
        tx.update(regRef, { status:"rejected", reason:reason||"", decidedAt:_now(), decidedBy:actor||"مسؤول البنك" });
      }
      tx.set(fdb.collection("auditLog").doc(), { actor:actor||"مسؤول البنك", action:approve?"قبول طلب تسجيل":"رفض طلب تسجيل", detail:`${r.title} #${r.memberId}`, createdAt:_now() });
      return {ok:true};
    });
  },
  async findRegistration(title, password){
    await ensureSeed();
    const l = await getAll("registrations");
    return l.find(r=>r.title===title && r.password===password) || null;
  },
  async findMemberByTitlePass(title, password){
    await ensureSeed();
    const l = await getAll("members");
    return l.find(m=>m.title===title && m.password===password) || null;
  },

  /* ---------------- MAINTENANCE ---------------- */
  async resetBalances(){
    await ensureSeed();
    const members = await getAll("members");
    const batch = fdb.batch();
    members.forEach(m=> batch.update(fdb.collection("members").doc(m.id), {balance:0}));
    if(members.length) await batch.commit();
    await fdb.collection("auditLog").add({ actor:"القيادة", action:"تصفير الأرصدة", detail:"تم ضبط رصيد كل الأعضاء إلى 0", createdAt:_now() });
    return true;
  },
  async deleteAllMembers(){
    await ensureSeed();
    const members = await getAll("members");
    const batch = fdb.batch();
    members.forEach(m=> batch.delete(fdb.collection("members").doc(m.id)));
    if(members.length) await batch.commit();
    await fdb.collection("auditLog").add({ actor:"القيادة", action:"حذف جميع الأعضاء", detail:"تم حذف كل الأعضاء", createdAt:_now() });
    return true;
  },

  /* ---------------- LEADERBOARD ---------------- */
  async getLeaderboard(){
    await ensureSeed();
    const [members, transactions] = await Promise.all([getAll("members"), getAll("transactions")]);
    const act = members.filter(m=>m.status!=="frozen");
    const top = (arr)=> arr.filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,5);
    const row = (m,v)=>({ id:m.id, title:m.title, avatar:m.avatar||"", value:v });
    return {
      rich: top(act.map(m=>row(m, Number(m.balance)||0))),
      transfers: top(act.map(m=>row(m, transactions.filter(t=>t.memberId===m.id && t.type==="transfer_out").length))),
      spend: top(act.map(m=>row(m, transactions.filter(t=>t.memberId===m.id && t.type==="purchase").reduce((s,t)=>s+Math.abs(Number(t.amount)||0),0)))),
    };
  },

  /* ---------------- ADMINS (bank/store) ---------------- */
  async getAdmins(){
    await ensureSeed();
    const [bank, store] = await Promise.all([fdb.collection("admins").doc("bank").get(), fdb.collection("admins").doc("store").get()]);
    return { bank: bank.data(), store: store.data() };
  },
  async updateAdmin(role, patch){
    await ensureSeed();
    await fdb.collection("admins").doc(role).update(patch);
    const s = await fdb.collection("admins").doc(role).get();
    return s.data();
  },

  /* ---------------- AUTH ---------------- */
  async verifyLeader(password){ await ensureSeed(); const g = await DB.getGuild(); return !!password && password===g.leaderPassword; },
  async verifyDeputy(password){ await ensureSeed(); const deps = await getAll("deputies"); return deps.find(d=>d.password===password) || null; },
  async verifyBankAdmin(password){ await ensureSeed(); const a = (await DB.getAdmins()).bank; return !!password && password===a.password; },
  async verifyStoreAdmin(password){ await ensureSeed(); const a = (await DB.getAdmins()).store; return !!password && password===a.password; },
  async verifyMember(id, title, password){
    await ensureSeed();
    const snap = await fdb.collection("members").doc(id).get();
    if(!snap.exists) return null;
    const m = snap.data();
    return (m.title===title && m.password===password) ? m : null;
  },

  /* ---------------- MEMBERS ---------------- */
  async getMembers(){ await ensureSeed(); return getAll("members"); },
  async getMember(id){ await ensureSeed(); const s = await fdb.collection("members").doc(id).get(); return s.exists? s.data() : null; },
  async addMember(m){
    await ensureSeed();
    const ref = fdb.collection("members").doc(m.id);
    const exists = await ref.get();
    if(exists.exists) throw new Error("رقم الآيدي مستخدم مسبقًا");
    const members = await getAll("members");
    if(members.some(x=>(x.title||"").trim().toLowerCase()===(m.title||"").trim().toLowerCase())) throw new Error("اللقب مستخدم مسبقًا");
    const item = { id:m.id, title:m.title, rank:m.rank||"عضو", password:m.password, whatsapp:m.whatsapp||"", avatar:m.avatar||"", balance:Number(m.balance)||0, status:"active", joined:_now() };
    await ref.set(item);
    return item;
  },
  async updateMember(id, patch){ await ensureSeed(); await fdb.collection("members").doc(id).update(patch); return true; },
  async deleteMember(id){ await ensureSeed(); await fdb.collection("members").doc(id).delete(); return true; },
  async adjustBalance(memberId, amount, type, note, actor){
    await ensureSeed();
    return fdb.runTransaction(async (tx)=>{
      const ref = fdb.collection("members").doc(memberId);
      const snap = await tx.get(ref);
      if(!snap.exists) throw new Error("العضو غير موجود");
      const cur = snap.data();
      const newBal = Math.max(0, (Number(cur.balance)||0) + Number(amount));
      tx.update(ref, {balance:newBal});
      tx.set(fdb.collection("transactions").doc(), { memberId, type, amount, note:note||"", createdAt:_now(), status:"done" });
      tx.set(fdb.collection("auditLog").doc(), { actor:actor||"النظام", action:type, detail:`${note||''} (${amount>0?'+':''}${amount} EMD) لعضو ${memberId}`, createdAt:_now() });
      return { ...cur, id:memberId, balance:newBal };
    });
  },

  /* ---------------- TRANSACTIONS ---------------- */
  async getTransactions(memberId=null){
    await ensureSeed();
    let list = await getAll("transactions");
    if(memberId) list = list.filter(t=>t.memberId===memberId);
    return sortDesc(list);
  },

  /* ---------------- BANK REQUESTS (طلبات التحويل من العضو) ---------------- */
  async getRequests(status=null){
    await ensureSeed();
    let list = (await getAll("requests")).filter(r=>r.type==="transfer");
    if(status) list = list.filter(r=>r.status===status);
    return sortDesc(list);
  },
  async addRequest(req){
    await ensureSeed();
    if(req.type!=="transfer") throw new Error("هذا النوع من الطلبات غير مدعوم");
    const data = { status:"pending", createdAt:_now(), ...req };
    const ref = await fdb.collection("requests").add(data);
    return { id:ref.id, ...data };
  },
  async decideRequest(id, approve, actor){
    await ensureSeed();
    return fdb.runTransaction(async (tx)=>{
      const reqRef = fdb.collection("requests").doc(id);
      const reqSnap = await tx.get(reqRef);
      if(!reqSnap.exists) throw new Error("الطلب غير موجود");
      const req = reqSnap.data();
      if(!approve){
        tx.update(reqRef, {status:"rejected", decidedAt:_now(), decidedBy:actor||"مسؤول البنك"});
        tx.set(fdb.collection("auditLog").doc(), {actor:actor||"مسؤول البنك", action:"رفض طلب", detail:`${req.type} - ${req.amount} EMD - عضو ${req.memberId}`, createdAt:_now()});
        return {ok:true};
      }
      const memberRef = fdb.collection("members").doc(req.memberId);
      const toRef = fdb.collection("members").doc(req.toMemberId);
      const [memberSnap, toSnap] = await Promise.all([tx.get(memberRef), tx.get(toRef)]);
      if(!toSnap.exists){ tx.update(reqRef,{status:"rejected"}); return {ok:false,msg:"العضو المستلم غير موجود"}; }
      const member = memberSnap.data(), to = toSnap.data();
      if(Number(member.balance) < Number(req.amount)){ tx.update(reqRef,{status:"rejected"}); return {ok:false,msg:"الرصيد غير كافٍ"}; }
      tx.update(memberRef, {balance: Number(member.balance) - Number(req.amount)});
      tx.update(toRef, {balance: Number(to.balance) + Number(req.amount)});
      tx.set(fdb.collection("transactions").doc(), {memberId:req.memberId, type:"transfer_out", amount:-Number(req.amount), note:`تحويل إلى ${req.toMemberId}`, createdAt:_now(), status:"done"});
      tx.set(fdb.collection("transactions").doc(), {memberId:req.toMemberId, type:"transfer_in", amount:Number(req.amount), note:`تحويل من ${req.memberId}`, createdAt:_now(), status:"done"});
      tx.update(reqRef, {status:"approved", decidedAt:_now(), decidedBy:actor||"مسؤول البنك"});
      tx.set(fdb.collection("auditLog").doc(), {actor:actor||"مسؤول البنك", action:"اعتماد طلب", detail:`${req.type} - ${req.amount} EMD - عضو ${req.memberId}`, createdAt:_now()});
      return {ok:true};
    });
  },

  /* ---------------- PRODUCTS ---------------- */
  async getProducts(){ await ensureSeed(); return getAll("products"); },
  async addProduct(p){
    await ensureSeed();
    const data = { active:true, qty:Number(p.qty)||0, ...p };
    const ref = await fdb.collection("products").add(data);
    return { id:ref.id, ...data };
  },
  async updateProduct(id, patch){ await ensureSeed(); await fdb.collection("products").doc(id).update(patch); return true; },
  async deleteProduct(id){ await ensureSeed(); await fdb.collection("products").doc(id).delete(); return true; },

  /* ---------------- ORDERS (طلبات الشراء من المتجر) ---------------- */
  async getOrders(status=null){
    await ensureSeed();
    let list = await getAll("orders");
    if(status) list = list.filter(o=>o.status===status);
    return sortDesc(list);
  },
  async createOrder(order){
    await ensureSeed();
    const data = { status:"pending", createdAt:_now(), ...order };
    const ref = await fdb.collection("orders").add(data);
    return { id:ref.id, ...data };
  },
  async decideOrder(id, approve, actor){
    await ensureSeed();
    return fdb.runTransaction(async (tx)=>{
      const orderRef = fdb.collection("orders").doc(id);
      const orderSnap = await tx.get(orderRef);
      if(!orderSnap.exists) throw new Error("الطلب غير موجود");
      const order = orderSnap.data();
      if(!approve){
        tx.update(orderRef, {status:"rejected", decidedAt:_now(), decidedBy:actor||"مسؤول المتجر"});
        tx.set(fdb.collection("auditLog").doc(), {actor:actor||"مسؤول المتجر", action:"رفض طلب شراء", detail:`${order.productName} - عضو ${order.memberId}`, createdAt:_now()});
        return {ok:true};
      }
      const memberRef = fdb.collection("members").doc(order.memberId);
      const productRef = order.productId ? fdb.collection("products").doc(order.productId) : null;
      // -- كل القراءات أولًا --
      const memberSnap = await tx.get(memberRef);
      const prodSnap = productRef ? await tx.get(productRef) : null;
      if(!memberSnap.exists) return {ok:false,msg:"العضو غير موجود"};
      const member = memberSnap.data();
      if(Number(member.balance) < Number(order.totalEMD)) return {ok:false,msg:"رصيد العضو غير كافٍ لإتمام الشراء"};
      // -- ثم الكتابة --
      tx.update(memberRef, {balance: Number(member.balance) - Number(order.totalEMD)});
      if(prodSnap && prodSnap.exists){
        const prod = prodSnap.data();
        if(!prod.unlimited) tx.update(productRef, {qty: Math.max(0, Number(prod.qty) - Number(order.qty))});
      }
      tx.set(fdb.collection("transactions").doc(), {memberId:order.memberId, type:"purchase", amount:-Number(order.totalEMD), note:`شراء: ${order.productName}`, createdAt:_now(), status:"done"});
      tx.update(orderRef, {status:"approved", decidedAt:_now(), decidedBy:actor||"مسؤول المتجر"});
      tx.set(fdb.collection("auditLog").doc(), {actor:actor||"مسؤول المتجر", action:"قبول طلب شراء", detail:`${order.productName} - عضو ${order.memberId}`, createdAt:_now()});
      return {ok:true};
    });
  },

  /* ---------------- AUDIT LOG ---------------- */
  async getLog(){ await ensureSeed(); return sortDesc(await getAll("auditLog")); },

  /* ---------------- STATS ---------------- */
  async getStats(){
    await ensureSeed();
    const [guild, members, deputies, leaders, products, orders, transactions, requests, registrations] = await Promise.all([
      DB.getGuild(), getAll("members"), getAll("deputies"), getAll("leaders"), getAll("products"), getAll("orders"), getAll("transactions"), getAll("requests"), getAll("registrations"),
    ]);
    return {
      membersCount: members.length,
      activeMembers: members.filter(m=>m.status!=="frozen").length,
      activeProducts: products.filter(p=>p.active).length,
      transfersCount: transactions.filter(t=>t.type==="transfer_out").length,
      deputiesCount: deputies.length,
      productsCount: products.length,
      treasury: guild.treasury,
      totalBalances: members.reduce((s,m)=>s+Number(m.balance||0),0),
      pendingRequests: requests.filter(r=>r.type==="transfer" && r.status==="pending").length,
      pendingOrders: orders.filter(o=>o.status==="pending").length,
      transactionsCount: transactions.length,
      leadersCount: 1 + leaders.length,
      categoriesCount: new Set(products.map(p=>p.category)).size,
      revenue: transactions.filter(t=>t.type==="purchase").reduce((s,t)=>s+Math.abs(Number(t.amount)||0),0),
      ordersCount: orders.length,
      pendingRegistrations: registrations.filter(r=>r.status==="pending").length,
    };
  }
};

window.DB = DB;

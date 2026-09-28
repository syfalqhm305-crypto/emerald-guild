/* ============================================================
   EMERALD GUILD — DATA LAYER (db.js)
   ------------------------------------------------------------
   يعمل الآن على localStorage بنفس الشكل والوظائف اللي بتحتاجها
   لما تربطه بـ Supabase. كل دالة هنا شكلها async (زي استعلام حقيقي)
   عشان لما تبدّل الجسم الداخلي فقط (بدون ما تغيّر أي صفحة HTML).

   خطوات الربط بـ Supabase لاحقًا:
   1) عبي SUPABASE_URL و SUPABASE_ANON_KEY تحت.
   2) بدّل كل دالة بحيث تستخدم supabase.from('...').select/insert/update
      بدل localStorage (الأماكن معلّمة بتعليق TODO-SUPABASE).
   3) الجداول المقترحة: guild, members, admins, deputies, products,
      orders, transactions.
================================================================ */

const SUPABASE_URL = "";      // TODO-SUPABASE: ضع رابط مشروعك هنا
const SUPABASE_ANON_KEY = ""; // TODO-SUPABASE: ضع المفتاح العام هنا

const DB_KEY = "emerald_guild_db_v1";

function _uid(prefix){
  return prefix + Math.random().toString(36).slice(2,7).toUpperCase() + Date.now().toString().slice(-4);
}
function _now(){ return new Date().toISOString(); }
function _wait(ms=120){ return new Promise(r=>setTimeout(r,ms)); }

function _seed(){
  return {
    guild:{
      name:"نقابة إميرالد",
      nameEn:"EMERALD GUILD",
      tagline:"القوة والولاء تحت راية الزمرد",
      logo:"assets/logo.png",
      treasury: 1480250,
      feeRate: 1.5,
      exchangeRate: 100, // 1 EMD = ? (يظهر فقط للعرض)
      leaderName:"القائد الأعلى",
      leaderId:"EMD-00001",
      leaderPassword:"leader123",
      leaderAvatar:"",
      leaderWhatsapp:"",
    },
    deputies:[
      // { id, name, role, whatsapp, password, avatar }
    ],
    admins:{
      bank:{ name:"مسؤول البنك", whatsapp:"", password:"bank123" },
      store:{ name:"مسؤول المتجر", whatsapp:"", password:"store123" },
    },
    members:[
      {
        id:"1000001",
        title:"العضو المؤسس",
        rank:"قائد فرقة",
        password:"member123",
        whatsapp:"",
        avatar:"",
        balance:5000,
        status:"active", // active | frozen
        joined:_now(),
      }
    ],
    products:[
      { id:_uid("P-"), name:"رتبة فارس الزمرد الملكي", category:"رتب", priceEMD:5000, priceUSD:50, qty:99, image:"", desc:"ترقية دائمة في سجلات النقابة.", active:true },
      { id:_uid("P-"), name:"صندوق سيولة الزمرد (10,000)", category:"سيولة", priceEMD:10000, priceUSD:100, qty:0, image:"", desc:"رصيد فوري يضاف لحسابك في البنك.", active:true, unlimited:true },
      { id:_uid("P-"), name:"شارة الشرف الزمردية", category:"أوسمة", priceEMD:2500, priceUSD:25, qty:3, image:"", desc:"وسام تكريمي يظهر بجانب اسمك.", active:true },
    ],
    orders:[
      // { id, memberId, productId, productName, qty, totalEMD, status: pending|approved|rejected, note, createdAt, decidedAt, decidedBy }
    ],
    transactions:[
      // { id, memberId, type: deposit|withdraw|purchase|transfer_in|transfer_out|admin_add|admin_deduct, amount, note, createdAt, status: done|pending|rejected }
    ],
    requests:[
      // بنكية: طلبات سحب/إيداع/تحويل من الأعضاء تحتاج موافقة مسؤول البنك
      // { id, memberId, type: withdraw|deposit|transfer, amount, toMemberId, note, status, createdAt }
    ],
    auditLog:[
      // { id, actor, action, detail, createdAt }
    ],
  };
}

function _load(){
  let raw = localStorage.getItem(DB_KEY);
  if(!raw){
    const seeded = _seed();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try{ return JSON.parse(raw); }catch(e){ const s=_seed(); localStorage.setItem(DB_KEY, JSON.stringify(s)); return s; }
}
function _save(data){ localStorage.setItem(DB_KEY, JSON.stringify(data)); }

const DB = {

  async resetAll(){
    // TODO-SUPABASE: احذف كل الصفوف من الجداول ثم اعمل seed
    _save(_seed());
    await _wait();
    return true;
  },

  async exportJSON(){
    return JSON.stringify(_load(), null, 2);
  },

  /* ---------------- GUILD ---------------- */
  async getGuild(){
    await _wait();
    return _load().guild;
  },
  async updateGuild(patch){
    // TODO-SUPABASE: update('guild')
    const d = _load(); d.guild = {...d.guild, ...patch}; _save(d); await _wait();
    return d.guild;
  },

  /* ---------------- DEPUTIES (نواب القائد) ---------------- */
  async getDeputies(){ await _wait(); return _load().deputies; },
  async addDeputy(dep){
    // TODO-SUPABASE: insert('deputies')
    const d = _load();
    const item = { id:_uid("DEP-"), name:dep.name, role:dep.role||"نائب القائد", whatsapp:dep.whatsapp||"", password:dep.password, avatar:dep.avatar||"" };
    d.deputies.push(item); _save(d); await _wait();
    return item;
  },
  async updateDeputy(id, patch){
    const d = _load();
    d.deputies = d.deputies.map(x=> x.id===id? {...x,...patch}: x);
    _save(d); await _wait(); return true;
  },
  async removeDeputy(id){
    const d = _load(); d.deputies = d.deputies.filter(x=>x.id!==id); _save(d); await _wait(); return true;
  },

  /* ---------------- ADMINS (bank/store) ---------------- */
  async getAdmins(){ await _wait(); return _load().admins; },
  async updateAdmin(role, patch){ // role: 'bank' | 'store'
    const d = _load(); d.admins[role] = {...d.admins[role], ...patch}; _save(d); await _wait();
    return d.admins[role];
  },

  /* ---------------- AUTH ---------------- */
  async verifyLeader(password){
    const g = _load().guild;
    await _wait();
    return password && password === g.leaderPassword;
  },
  async verifyDeputy(password){
    const deps = _load().deputies;
    await _wait();
    return deps.find(d=>d.password===password) || null;
  },
  async verifyBankAdmin(password){
    const a = _load().admins.bank; await _wait();
    return password && password===a.password;
  },
  async verifyStoreAdmin(password){
    const a = _load().admins.store; await _wait();
    return password && password===a.password;
  },
  async verifyMember(id, title, password){
    const m = _load().members.find(x=>x.id===id && x.title===title && x.password===password);
    await _wait();
    return m || null;
  },

  /* ---------------- MEMBERS ---------------- */
  async getMembers(){ await _wait(); return _load().members; },
  async getMember(id){ await _wait(); return _load().members.find(m=>m.id===id) || null; },
  async addMember(m){
    // TODO-SUPABASE: insert('members')
    const d = _load();
    if(d.members.some(x=>x.id===m.id)) throw new Error("رقم الآيدي مستخدم مسبقًا");
    const item = {
      id:m.id, title:m.title, rank:m.rank||"عضو", password:m.password,
      whatsapp:m.whatsapp||"", avatar:m.avatar||"", balance:Number(m.balance)||0,
      status:"active", joined:_now()
    };
    d.members.push(item); _save(d); await _wait();
    return item;
  },
  async updateMember(id, patch){
    const d = _load();
    d.members = d.members.map(x=> x.id===id? {...x,...patch}: x);
    _save(d); await _wait(); return true;
  },
  async deleteMember(id){
    const d = _load(); d.members = d.members.filter(x=>x.id!==id); _save(d); await _wait(); return true;
  },
  async adjustBalance(memberId, amount, type, note, actor){
    // amount موجب = إضافة | سالب = خصم
    const d = _load();
    const idx = d.members.findIndex(m=>m.id===memberId);
    if(idx===-1) throw new Error("العضو غير موجود");
    d.members[idx].balance = Math.max(0, (Number(d.members[idx].balance)||0) + Number(amount));
    const tx = { id:_uid("TX-"), memberId, type, amount, note:note||"", createdAt:_now(), status:"done" };
    d.transactions.unshift(tx);
    d.auditLog.unshift({ id:_uid("LOG-"), actor:actor||"النظام", action:type, detail:`${note||''} (${amount>0?'+':''}${amount} EMD) لعضو ${memberId}`, createdAt:_now() });
    _save(d); await _wait();
    return d.members[idx];
  },

  /* ---------------- TRANSACTIONS ---------------- */
  async getTransactions(memberId=null){
    await _wait();
    const list = _load().transactions;
    return memberId? list.filter(t=>t.memberId===memberId) : list;
  },

  /* ---------------- BANK REQUESTS (سحب/إيداع/تحويل من العضو) ---------------- */
  async getRequests(status=null){
    await _wait();
    const list = _load().requests;
    return status? list.filter(r=>r.status===status) : list;
  },
  async addRequest(req){
    const d = _load();
    const item = { id:_uid("REQ-"), status:"pending", createdAt:_now(), ...req };
    d.requests.unshift(item); _save(d); await _wait();
    return item;
  },
  async decideRequest(id, approve, actor){
    const d = _load();
    const idx = d.requests.findIndex(r=>r.id===id);
    if(idx===-1) throw new Error("الطلب غير موجود");
    const req = d.requests[idx];
    if(approve){
      const member = d.members.find(m=>m.id===req.memberId);
      if(req.type==="deposit"){
        member.balance += Number(req.amount);
        d.transactions.unshift({id:_uid("TX-"), memberId:req.memberId, type:"deposit", amount:Number(req.amount), note:"إيداع معتمد", createdAt:_now(), status:"done"});
      } else if(req.type==="withdraw"){
        if(member.balance < Number(req.amount)){ d.requests[idx].status="rejected"; _save(d); return {ok:false,msg:"الرصيد غير كافٍ حاليًا للعضو"}; }
        member.balance -= Number(req.amount);
        d.transactions.unshift({id:_uid("TX-"), memberId:req.memberId, type:"withdraw", amount:-Number(req.amount), note:"سحب معتمد", createdAt:_now(), status:"done"});
      } else if(req.type==="transfer"){
        const to = d.members.find(m=>m.id===req.toMemberId);
        if(!to){ d.requests[idx].status="rejected"; _save(d); return {ok:false,msg:"العضو المستلم غير موجود"}; }
        if(member.balance < Number(req.amount)){ d.requests[idx].status="rejected"; _save(d); return {ok:false,msg:"الرصيد غير كافٍ"}; }
        member.balance -= Number(req.amount);
        to.balance += Number(req.amount);
        d.transactions.unshift({id:_uid("TX-"), memberId:req.memberId, type:"transfer_out", amount:-Number(req.amount), note:`تحويل إلى ${req.toMemberId}`, createdAt:_now(), status:"done"});
        d.transactions.unshift({id:_uid("TX-"), memberId:req.toMemberId, type:"transfer_in", amount:Number(req.amount), note:`تحويل من ${req.memberId}`, createdAt:_now(), status:"done"});
      }
      d.requests[idx].status="approved";
    } else {
      d.requests[idx].status="rejected";
    }
    d.requests[idx].decidedAt=_now(); d.requests[idx].decidedBy=actor||"مسؤول البنك";
    d.auditLog.unshift({id:_uid("LOG-"), actor:actor||"مسؤول البنك", action:approve?"اعتماد طلب":"رفض طلب", detail:`${req.type} - ${req.amount} EMD - عضو ${req.memberId}`, createdAt:_now()});
    _save(d); await _wait();
    return {ok:true};
  },

  /* ---------------- PRODUCTS ---------------- */
  async getProducts(){ await _wait(); return _load().products; },
  async addProduct(p){
    const d = _load();
    const item = { id:_uid("P-"), active:true, qty:Number(p.qty)||0, ...p };
    d.products.push(item); _save(d); await _wait();
    return item;
  },
  async updateProduct(id, patch){
    const d = _load(); d.products = d.products.map(x=> x.id===id? {...x,...patch}: x); _save(d); await _wait();
    return true;
  },
  async deleteProduct(id){
    const d = _load(); d.products = d.products.filter(x=>x.id!==id); _save(d); await _wait(); return true;
  },

  /* ---------------- ORDERS (طلبات الشراء من المتجر) ---------------- */
  async getOrders(status=null){
    await _wait();
    const list = _load().orders;
    return status? list.filter(o=>o.status===status) : list;
  },
  async createOrder(order){
    const d = _load();
    const item = { id:_uid("ORD-"), status:"pending", createdAt:_now(), ...order };
    d.orders.unshift(item); _save(d); await _wait();
    return item;
  },
  async decideOrder(id, approve, actor){
    const d = _load();
    const idx = d.orders.findIndex(o=>o.id===id);
    if(idx===-1) throw new Error("الطلب غير موجود");
    const order = d.orders[idx];
    if(approve){
      const member = d.members.find(m=>m.id===order.memberId);
      if(!member) return {ok:false,msg:"العضو غير موجود"};
      if(member.balance < order.totalEMD) return {ok:false,msg:"رصيد العضو غير كافٍ لإتمام الشراء"};
      member.balance -= order.totalEMD;
      const prod = d.products.find(p=>p.id===order.productId);
      if(prod && !prod.unlimited){ prod.qty = Math.max(0, prod.qty - order.qty); }
      d.transactions.unshift({id:_uid("TX-"), memberId:order.memberId, type:"purchase", amount:-order.totalEMD, note:`شراء: ${order.productName}`, createdAt:_now(), status:"done"});
      d.orders[idx].status="approved";
    } else {
      d.orders[idx].status="rejected";
    }
    d.orders[idx].decidedAt=_now(); d.orders[idx].decidedBy = actor||"مسؤول المتجر";
    d.auditLog.unshift({id:_uid("LOG-"), actor:actor||"مسؤول المتجر", action:approve?"قبول طلب شراء":"رفض طلب شراء", detail:`${order.productName} - عضو ${order.memberId}`, createdAt:_now()});
    _save(d); await _wait();
    return {ok:true};
  },

  /* ---------------- AUDIT LOG ---------------- */
  async getLog(){ await _wait(); return _load().auditLog; },

  /* ---------------- STATS ---------------- */
  async getStats(){
    const d = _load(); await _wait();
    return {
      membersCount: d.members.length,
      deputiesCount: d.deputies.length,
      productsCount: d.products.length,
      treasury: d.guild.treasury,
      totalBalances: d.members.reduce((s,m)=>s+Number(m.balance||0),0),
      pendingRequests: d.requests.filter(r=>r.status==="pending").length,
      pendingOrders: d.orders.filter(o=>o.status==="pending").length,
      transactionsCount: d.transactions.length,
    };
  }
};

window.DB = DB;

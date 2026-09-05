/**
 * db.js — طبقة البيانات لموقع نقابة الزمرد
 * ------------------------------------------------------------
 * هذا الملف يمثل "قاعدة البيانات المؤقتة" ويعمل حالياً على LocalStorage
 * (بيانات المتصفح) حتى يتم ربط قاعدة البيانات الحقيقية.
 *
 * ✅ عند جهوزية قاعدة البيانات الحقيقية:
 *    كل دالة هنا مبنية بشكل async وتُرجع Promise، تماماً مثل استدعاء API حقيقي.
 *    كل ما عليك فعله هو استبدال محتوى كل دالة باستدعاء fetch() لسيرفرك،
 *    مع إبقاء نفس اسم الدالة ونفس شكل البيانات التي تُرجعها (return shape).
 *    بقية صفحات الموقع (index.html, store.html, dashboard-*.html ...)
 *    لن تحتاج لأي تعديل لأنها تتعامل فقط مع دوال EGDB.* ولا تلمس LocalStorage مباشرة.
 * ------------------------------------------------------------
 */

const EGDB = (() => {
  const STORAGE_KEY = 'emerald_guild_db_v1';

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n, len) { return String(n).padStart(len, '0'); }

  function genMemberId() {
    return '#EMD-' + pad(Math.floor(1000 + Math.random() * 8999), 4);
  }

  function genOrderCode() {
    return 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
  }

  function nowISO() { return new Date().toISOString(); }

  function seed() {
    return {
      settings: {
        guildName: 'نقابة الزمرد السيادية',
        guildTagline: 'ثروتك، تحت حماية الزمرد',
        guildIntro: 'المنصة المركزية الكبرى التي توحد أرقى محاربي النخبة ومستثمري الأصول الرقمية. نظام بنكي متطور، متجر حر مفتوح دون تعقيدات، وحصانة مشفرة تضمن خلود أصولك وهيمنتك في ميادين التنافس.',
        logoUrl: '',
        treasuryBalance: 1480250,
        bankAdminPassword: 'bank12345',
        storeAdminPassword: 'store12345',
        sovereignPassword: 'sovereign12345',
        bankWhatsapp: '966500000001',
        storeWhatsapp: '966500000002',
        commissionRate: 5
      },
      leaders: [
        { id: uid('ldr'), name: 'ليدي يوروريها', title: 'قائدة النقابة العليا', tag: 'SOVEREIGN LEADER' },
        { id: uid('ldr'), name: 'ميسي (Misi)', title: 'نائب الشؤون المالية', tag: 'CHIEF FINANCIAL' },
        { id: uid('ldr'), name: 'رين (Rin)', title: 'نائب العمليات الميدانية', tag: 'FIELD OPERATIONS' }
      ],
      members: [
        {
          id: uid('mem'), memberId: '#EMD-8829', username: 'lady.yuroriha', password: '123456',
          nickname: 'ليدي يوروريها', rank: 'قائدة النقابة', balance: 12450, status: 'active',
          joinDate: nowISO()
        }
      ],
      transactions: [],
      storeItems: [
        { id: uid('itm'), name: "رتبة 'فارس الزمرد الملكي'", category: 'رتب', priceEMD: 5000, priceFiat: 50, image: '', description: 'رتبة شرفية رسمية داخل النقابة', stock: null },
        { id: uid('itm'), name: 'حزمة سبائك الزمرد (10,000 EMD)', category: 'شحن', priceEMD: 0, priceFiat: 90, image: '', description: 'باقة شحن رصيد مباشرة للمحفظة', stock: null }
      ],
      storeOrders: [],
      registrationRequests: []
    };
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    try { return JSON.parse(raw); } catch (e) { const s = seed(); save(s); return s; }
  }

  function save(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function delay(v) {
    // محاكاة زمن استجابة شبكة بسيط، يمكن حذفه لاحقاً عند ربط API حقيقي
    return new Promise((resolve) => setTimeout(() => resolve(v), 120));
  }

  // ---------------------- الإعدادات العامة ----------------------
  async function getSettings() {
    const db = load();
    return delay({ ...db.settings });
  }

  async function updateSettings(partial) {
    const db = load();
    db.settings = { ...db.settings, ...partial };
    save(db);
    return delay({ ...db.settings });
  }

  async function authenticateAdmin(role, password) {
    const db = load();
    const map = { bank: 'bankAdminPassword', store: 'storeAdminPassword', sovereign: 'sovereignPassword' };
    const key = map[role];
    if (!key) return delay({ ok: false, error: 'دور غير معروف' });
    if (db.settings[key] === password) return delay({ ok: true });
    return delay({ ok: false, error: 'كلمة المرور غير صحيحة' });
  }

  // ---------------------- القادة والنواب ----------------------
  async function listLeaders() {
    const db = load();
    return delay([...db.leaders]);
  }

  // ---------------------- الأعضاء ----------------------
  async function listMembers() {
    const db = load();
    return delay([...db.members]);
  }

  async function getMemberById(id) {
    const db = load();
    return delay(db.members.find(m => m.id === id) || null);
  }

  async function getMemberByMemberId(memberId) {
    const db = load();
    return delay(db.members.find(m => m.memberId === memberId) || null);
  }

  async function authenticateMember(loginId, password) {
    const db = load();
    const m = db.members.find(mm =>
      (mm.username === loginId || mm.memberId === loginId) && mm.password === password
    );
    if (!m) return delay({ ok: false, error: 'بيانات الدخول غير صحيحة' });
    if (m.status !== 'active') return delay({ ok: false, error: 'حسابك بانتظار موافقة إدارة البنك' });
    return delay({ ok: true, member: { ...m } });
  }

  async function addMember(data) {
    const db = load();
    const member = {
      id: uid('mem'),
      memberId: data.memberId || genMemberId(),
      username: data.username,
      password: data.password,
      nickname: data.nickname,
      rank: data.rank || 'عضو مستجد',
      balance: Number(data.balance) || 0,
      status: data.status || 'active',
      joinDate: nowISO()
    };
    db.members.push(member);
    save(db);
    return delay({ ...member });
  }

  async function updateMember(id, patch) {
    const db = load();
    const idx = db.members.findIndex(m => m.id === id);
    if (idx === -1) return delay({ ok: false, error: 'العضو غير موجود' });
    db.members[idx] = { ...db.members[idx], ...patch };
    save(db);
    return delay({ ok: true, member: { ...db.members[idx] } });
  }

  async function deleteMember(id) {
    const db = load();
    db.members = db.members.filter(m => m.id !== id);
    save(db);
    return delay({ ok: true });
  }

  // ---------------------- طلبات الانضمام (تسجيل عضو جديد) ----------------------
  async function submitRegistration(data) {
    const db = load();
    const req = {
      id: uid('reg'),
      username: data.username,
      nickname: data.nickname,
      password: data.password,
      email: data.email || '',
      date: nowISO(),
      status: 'pending'
    };
    db.registrationRequests.push(req);
    save(db);
    return delay({ ...req });
  }

  async function listRegistrationRequests() {
    const db = load();
    return delay([...db.registrationRequests]);
  }

  async function approveRegistration(id) {
    const db = load();
    const req = db.registrationRequests.find(r => r.id === id);
    if (!req) return delay({ ok: false, error: 'الطلب غير موجود' });
    req.status = 'approved';
    const member = {
      id: uid('mem'), memberId: genMemberId(), username: req.username, password: req.password,
      nickname: req.nickname, rank: 'عضو مستجد', balance: 0, status: 'active', joinDate: nowISO()
    };
    db.members.push(member);
    save(db);
    return delay({ ok: true, member });
  }

  async function rejectRegistration(id) {
    const db = load();
    const req = db.registrationRequests.find(r => r.id === id);
    if (!req) return delay({ ok: false, error: 'الطلب غير موجود' });
    req.status = 'rejected';
    save(db);
    return delay({ ok: true });
  }

  // ---------------------- العمليات المصرفية ----------------------
  async function requestTransaction(memberId, type, amount, note, toMemberId) {
    const db = load();
    const tx = {
      id: uid('tx'), memberId, type, amount: Number(amount), toMemberId: toMemberId || null,
      note: note || '', status: 'pending', date: nowISO()
    };
    db.transactions.unshift(tx);
    save(db);
    return delay({ ...tx });
  }

  async function listTransactionsForMember(memberId) {
    const db = load();
    return delay(db.transactions.filter(t => t.memberId === memberId));
  }

  async function listPendingTransactions() {
    const db = load();
    return delay(db.transactions.filter(t => t.status === 'pending'));
  }

  async function listAllTransactions() {
    const db = load();
    return delay([...db.transactions]);
  }

  async function approveTransaction(txId) {
    const db = load();
    const tx = db.transactions.find(t => t.id === txId);
    if (!tx) return delay({ ok: false, error: 'العملية غير موجودة' });
    const member = db.members.find(m => m.id === tx.memberId);
    if (!member) return delay({ ok: false, error: 'العضو غير موجود' });

    if (tx.type === 'deposit') {
      member.balance += tx.amount;
    } else if (tx.type === 'withdraw') {
      member.balance = Math.max(0, member.balance - tx.amount);
    } else if (tx.type === 'transfer') {
      const target = db.members.find(m => m.memberId === tx.toMemberId);
      if (!target) return delay({ ok: false, error: 'العضو المستلم غير موجود' });
      member.balance = Math.max(0, member.balance - tx.amount);
      target.balance += tx.amount;
    }
    tx.status = 'approved';
    save(db);
    return delay({ ok: true });
  }

  async function rejectTransaction(txId) {
    const db = load();
    const tx = db.transactions.find(t => t.id === txId);
    if (!tx) return delay({ ok: false, error: 'العملية غير موجودة' });
    tx.status = 'rejected';
    save(db);
    return delay({ ok: true });
  }

  // ---------------------- المتجر ----------------------
  async function listStoreItems() {
    const db = load();
    return delay([...db.storeItems]);
  }

  async function addStoreItem(data) {
    const db = load();
    const item = {
      id: uid('itm'), name: data.name, category: data.category || 'عام',
      priceEMD: Number(data.priceEMD) || 0, priceFiat: Number(data.priceFiat) || 0,
      image: data.image || '', description: data.description || '', stock: data.stock ?? null
    };
    db.storeItems.push(item);
    save(db);
    return delay({ ...item });
  }

  async function updateStoreItem(id, patch) {
    const db = load();
    const idx = db.storeItems.findIndex(i => i.id === id);
    if (idx === -1) return delay({ ok: false, error: 'السلعة غير موجودة' });
    db.storeItems[idx] = { ...db.storeItems[idx], ...patch };
    save(db);
    return delay({ ok: true, item: { ...db.storeItems[idx] } });
  }

  async function deleteStoreItem(id) {
    const db = load();
    db.storeItems = db.storeItems.filter(i => i.id !== id);
    save(db);
    return delay({ ok: true });
  }

  async function placeOrder(data) {
    const db = load();
    const order = {
      id: uid('ord'), orderCode: genOrderCode(), itemId: data.itemId, itemName: data.itemName,
      buyerName: data.buyerName, buyerMemberId: data.buyerMemberId || null,
      buyerContact: data.buyerContact, status: 'pending', date: nowISO()
    };
    db.storeOrders.unshift(order);
    save(db);
    return delay({ ...order });
  }

  async function listOrders() {
    const db = load();
    return delay([...db.storeOrders]);
  }

  async function listOrdersForBuyer(buyerMemberId) {
    const db = load();
    return delay(db.storeOrders.filter(o => o.buyerMemberId === buyerMemberId));
  }

  async function approveOrder(id) {
    const db = load();
    const o = db.storeOrders.find(x => x.id === id);
    if (!o) return delay({ ok: false, error: 'الطلب غير موجود' });
    o.status = 'approved';
    save(db);
    return delay({ ok: true });
  }

  async function rejectOrder(id) {
    const db = load();
    const o = db.storeOrders.find(x => x.id === id);
    if (!o) return delay({ ok: false, error: 'الطلب غير موجود' });
    o.status = 'rejected';
    save(db);
    return delay({ ok: true });
  }

  return {
    getSettings, updateSettings, authenticateAdmin,
    listLeaders,
    listMembers, getMemberById, getMemberByMemberId, authenticateMember, addMember, updateMember, deleteMember,
    submitRegistration, listRegistrationRequests, approveRegistration, rejectRegistration,
    requestTransaction, listTransactionsForMember, listPendingTransactions, listAllTransactions, approveTransaction, rejectTransaction,
    listStoreItems, addStoreItem, updateStoreItem, deleteStoreItem,
    placeOrder, listOrders, listOrdersForBuyer, approveOrder, rejectOrder,
    _debugReset: () => { localStorage.removeItem(STORAGE_KEY); load(); }
  };
})();

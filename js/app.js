(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const toast = (msg, ok = true) => {
    let box = $('#emerald-toast');
    if (!box) { box = document.createElement('div'); box.id = 'emerald-toast'; box.className = 'fixed z-[100] bottom-20 left-1/2 -translate-x-1/2 max-w-[90vw] px-4 py-3 rounded-xl shadow-xl text-sm'; document.body.appendChild(box); }
    box.style.background = ok ? '#0b6b50' : '#7f1d1d'; box.style.color = '#fff'; box.textContent = msg; box.hidden = false;
    clearTimeout(box._t); box._t = setTimeout(() => box.hidden = true, 3200);
  };
  window.emeraldToast = toast;

  function disableWhenMissing() {
    if (!window.emeraldConfigMissing) return;
    const note = document.createElement('div');
    note.className = 'fixed top-0 left-0 right-0 z-[120] bg-amber-500 text-black text-center text-xs md:text-sm font-bold px-3 py-2';
    note.textContent = 'قاعدة البيانات غير مربوطة بعد — افتح js/config.js وضع رابط Supabase والمفتاح العام.';
    document.body.appendChild(note);
  }

  async function currentUser() {
    if (!window.emeraldReady) return null;
    const { data } = await sb.auth.getUser();
    return data.user || null;
  }

  async function protectPage(requiredRole) {
    const user = await currentUser();
    if (!user) { location.href = requiredRole ? 'admin-login.html' : 'bank.html'; return null; }
    if (requiredRole) {
      const { data, error } = await sb.from('profiles').select('role,display_name').eq('id', user.id).single();
      if (error || !data || data.role !== requiredRole) { toast('ليس لديك صلاحية لهذه الصفحة', false); await sb.auth.signOut(); location.href = 'admin-login.html'; return null; }
      window.emeraldProfile = data;
    }
    return user;
  }

  async function populateStats() {
    if (!window.emeraldReady) return;
    try {
      const [{ count: members }, { data: treasury }, { count: products }] = await Promise.all([
        sb.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        sb.from('bank_transactions').select('amount').eq('status', 'completed'),
        sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);
      const totalFlow = (treasury || []).reduce((a, r) => a + Number(r.amount || 0), 0);
      $$('[data-db-members]').forEach(e => e.textContent = Number(members || 0).toLocaleString('en-US'));
      $$('[data-db-products]').forEach(e => e.textContent = Number(products || 0).toLocaleString('en-US'));
      $$('[data-db-flow]').forEach(e => e.textContent = totalFlow.toLocaleString('en-US') + ' EMD');
    } catch (_) {}
  }

  async function registerForm() {
    const form = $('#member-register-form'); if (!form || !window.emeraldReady) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      const displayName = String(fd.get('display_name') || '').trim();
      const username = String(fd.get('username') || '').trim();
      if (password.length < 6) return toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', false);
      const { error } = await sb.auth.signUp({ email, password, options: { data: { display_name: displayName, username } } });
      if (error) return toast(error.message, false);
      toast('تم إنشاء الحساب. إذا كان تأكيد البريد مفعلاً تحقق من بريدك الإلكتروني.');
      setTimeout(() => location.href = 'bank.html', 1800);
    });
  }

  async function loginForm() {
    const form = $('#member-login-form'); if (!form || !window.emeraldReady) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const { error } = await sb.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
      if (error) return toast(error.message, false);
      location.href = 'bank-dashboard.html';
    });
  }

  async function adminLoginForm() {
    const form = $('#admin-login-form'); if (!form || !window.emeraldReady) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const { error } = await sb.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
      if (error) return toast(error.message, false);
      const user = await currentUser();
      const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
      if (!data || data.role !== 'admin') { await sb.auth.signOut(); return toast('هذا الحساب ليس حساب مسؤول', false); }
      location.href = 'leader.html';
    });
  }

  async function bankDashboard() {
    if (!$('#bank-balance')) return;
    const user = await protectPage(); if (!user) return;
    const { data: account, error } = await sb.from('bank_accounts').select('balance,currency,status').eq('user_id', user.id).single();
    if (error) { toast('لم يتم إنشاء حساب بنكي لهذا العضو بعد', false); return; }
    $('#bank-balance').textContent = Number(account.balance || 0).toLocaleString('en-US');
    if ($('#bank-currency')) $('#bank-currency').textContent = account.currency || 'EMD';
    const { data: txs } = await sb.from('bank_transactions').select('type,amount,description,created_at,status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    const host = $('#transactions-list');
    if (host) host.innerHTML = (txs || []).map(t => `<div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-low"><div><div class="text-sm font-semibold">${escapeHtml(t.description || 'معاملة')}</div><div class="text-xs text-on-surface-variant">${new Date(t.created_at).toLocaleString('ar-SA')}</div></div><div class="font-bold ${Number(t.amount)>=0?'text-primary-fixed':'text-error'}">${Number(t.amount)>=0?'+':''}${Number(t.amount).toLocaleString('en-US')} EMD</div></div>`).join('') || '<div class="text-sm text-on-surface-variant">لا توجد معاملات بعد.</div>';
  }

  async function adminDashboard() {
    const adminPage = document.body?.dataset?.adminPage === 'true';
    const root = $('#admin-dashboard');
    if (!root && !adminPage) return;
    const user = await protectPage('admin'); if (!user) return;
    const { data: members } = await sb.from('profiles').select('id,display_name,username,role,status,created_at').order('created_at', { ascending: false }).limit(50);
    const list = $('#members-list');
    if (list) list.innerHTML = (members || []).map(m => `<div class="grid grid-cols-[1fr_auto] gap-3 p-3 rounded-xl bg-surface-container-high"><div><div class="font-semibold">${escapeHtml(m.display_name||m.username||'عضو')}</div><div class="text-xs text-on-surface-variant">${escapeHtml(m.username||'')} • ${escapeHtml(m.role)}</div></div><div class="text-xs rounded-full px-2 py-1 bg-surface-container-lowest">${escapeHtml(m.status)}</div></div>`).join('');
    const { data: products } = await sb.from('products').select('id,name,price,is_active,stock').order('created_at', { ascending: false }).limit(50);
    const plist = $('#products-list');
    if (plist) plist.innerHTML = (products || []).map(p => `<div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-high"><div><div class="font-semibold">${escapeHtml(p.name)}</div><div class="text-xs text-on-surface-variant">${Number(p.price).toLocaleString('en-US')} EMD • مخزون ${p.stock}</div></div><div class="text-xs">${p.is_active?'نشط':'متوقف'}</div></div>`).join('');
    const addProduct = $('#add-product-form');
    if (addProduct) {
      if (adminPage && !user) return;
      addProduct.addEventListener('submit', async e => {
      e.preventDefault(); const fd = new FormData(addProduct);
      const { error } = await sb.from('products').insert({ name: fd.get('name'), description: fd.get('description'), price: Number(fd.get('price')), stock: Number(fd.get('stock') || 0), created_by: user.id });
      if (error) return toast(error.message, false); toast('تمت إضافة المنتج'); addProduct.reset(); adminDashboard();
      });
    }
  }

  async function loadStore() {
    const host = $('#store-products'); if (!host || !window.emeraldReady) return;
    const { data, error } = await sb.from('products').select('id,name,description,price,stock').eq('is_active', true).gt('stock', 0).order('created_at', { ascending: false });
    if (error) return toast(error.message, false);
    host.innerHTML = (data || []).map(p => `<article class="rounded-xl bg-surface-container-high p-4 shadow"><div class="flex items-start justify-between gap-3"><div><h3 class="font-semibold">${escapeHtml(p.name)}</h3><p class="text-sm text-on-surface-variant mt-1">${escapeHtml(p.description||'')}</p></div><span class="font-bold text-primary-fixed">${Number(p.price).toLocaleString('en-US')} EMD</span></div><button data-order="${p.id}" class="mt-4 w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-bold">طلب السلعة</button></article>`).join('') || '<div class="text-on-surface-variant">لا توجد سلع متاحة حالياً.</div>';
    $$('#store-products [data-order]').forEach(btn => btn.addEventListener('click', async () => {
      const name = prompt('اكتب اسم المستلم'); if (!name) return;
      const phone = prompt('اكتب رقم التواصل'); if (!phone) return;
      const qty = Number(prompt('الكمية', '1') || 1); if (!Number.isFinite(qty) || qty < 1) return;
      const { error } = await sb.from('orders').insert({ product_id: btn.dataset.order, quantity: qty, customer_name: name, customer_phone: phone });
      if (error) return toast(error.message, false); toast('تم تسجيل الطلب بنجاح');
    }));
  }

  function wireLinks() {
    const map = { 'al-raisiya':'index.html', 'al-khazina':'bank.html', 'al-matjar':'store.html', 'al-idara':'leader.html', 'lawhat-al-qiyada':'leader.html' };
    $$('[data-path]').forEach(a => { if (map[a.dataset.path]) a.href = map[a.dataset.path]; });
    $$('a').forEach(a => {
      const txt = (a.textContent || '').trim();
      if (/تسجيل عضو جديد/.test(txt)) a.href='register.html';
      if (/دخول بنك الزمرد/.test(txt) && !/bank-dashboard/.test(a.href)) a.href='bank.html';
      if (/دخول المتجر بدون قيود|بوابة سوق|المتجر الحر/.test(txt)) a.href='store.html';
      if (/تسجيل دخول المسؤول|ولوج القيادة/.test(txt)) a.href='admin-login.html';
    });
  }

  function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  disableWhenMissing();
  wireLinks();
  populateStats(); registerForm(); loginForm(); adminLoginForm();
  bankDashboard(); adminDashboard(); loadStore();
})();

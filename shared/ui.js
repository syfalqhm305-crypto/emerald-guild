/**
 * ui.js — أدوات واجهة مشتركة: تنبيهات Toast، تنسيق الأرقام، روابط واتساب
 */
const EGUI = (() => {
  let toastTimer = null;

  function toast(message, type) {
    let el = document.getElementById('eg-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'eg-toast';
      el.className = 'eg-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = 'eg-toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'eg-toast'; }, 3200);
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function whatsappLink(number, message) {
    const clean = String(number || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(message || '');
    return `https://wa.me/${clean}?text=${text}`;
  }

  function openWhatsApp(number, message) {
    window.open(whatsappLink(number, message), '_blank', 'noopener');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  return { toast, formatNumber, whatsappLink, openWhatsApp, escapeHtml };
})();

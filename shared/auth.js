/**
 * auth.js — إدارة الجلسات (تسجيل الدخول) لكل من: العضو، مسؤول البنك، مسؤول المتجر، قائدة النقابة
 * الجلسة تُحفظ في sessionStorage (تنتهي بإغلاق التبويب) لأسباب أمنية.
 */
const EGAuth = (() => {
  const KEY = 'emerald_guild_session_v1';

  function get() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }

  function set(session) {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  }

  function clear() {
    sessionStorage.removeItem(KEY);
  }

  function loginMember(member) {
    set({ role: 'member', memberDbId: member.id, memberId: member.memberId, nickname: member.nickname });
  }

  function loginAdmin(role) {
    // role: 'bank' | 'store' | 'sovereign'
    set({ role });
  }

  // يحمي صفحة معيّنة: إن لم تتطابق الجلسة الحالية مع الدور المطلوب يعيد التوجيه لصفحة الدخول
  function requireRole(requiredRole, redirectTo) {
    const s = get();
    if (!s || s.role !== requiredRole) {
      window.location.href = redirectTo;
      return null;
    }
    return s;
  }

  function logout(redirectTo) {
    clear();
    window.location.href = redirectTo || 'index.html';
  }

  return { get, loginMember, loginAdmin, requireRole, logout, clear };
})();

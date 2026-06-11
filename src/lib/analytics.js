// ─── GA4 EVENT HELPER ────────────────────────────────
// Thin wrapper around gtag so tracking is a no-op when GA is absent.
window.ZT = window.ZT || {};

ZT.gaEvent = (name, params = {}) => {
  if (typeof gtag !== 'undefined') gtag('event', name, params);
};

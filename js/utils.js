/* Funzioni di utilità */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Escape HTML: tutti i dati dei JSON passano da qui prima di finire nel DOM */
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function fmt(s) {
  s = Math.max(0, Math.round(Number(s) || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

/** Accetta percorsi relativi (anche con spazi/accenti) e http(s); blocca altri schemi (es. javascript:) */
export function safeUrl(u) {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^(https?|blob):/i.test(s)) return "";
  return s;
}
/** Valore sicuro da mettere dentro url('...') in CSS */
export function cssUrl(u) {
  let s = safeUrl(u); if (!s) return "";
  try { s = encodeURI(decodeURI(s)); } catch { s = encodeURI(s); }
  return s.replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

export function hash(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/** Sfumature di riserva (solo colori della palette) per copertine mancanti */
const PAL = [["#b08968", "#7f5539"], ["#9c6644", "#4a2f1d"], ["#ddb892", "#9c6644"], ["#7f5539", "#2b1b11"], ["#e6ccb2", "#b08968"]];
export function gradient(seed) {
  const [a, b] = PAL[hash(seed) % PAL.length];
  return `linear-gradient(135deg,${a},${b})`;
}

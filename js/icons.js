/* Icone SVG inline (nessuna dipendenza esterna, funzionano offline) */
const P = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
  prev: '<path d="M6 5h2v14H6zM20 5v14L9 12z"/>',
  next: '<path d="M16 5h2v14h-2zM4 5v14l11-7z"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  library: '<path d="M5 4h2v16H5zM10 4h2v16h-2zM15.2 5.6l2-.6 3.2 14-2 .6z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  fwd: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  repeat: '<path d="M7 7h10v3l4-4-4-4v3H5v6h2zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2z"/>',
  repeat1: '<path d="M7 7h10v3l4-4-4-4v3H5v6h2zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2z"/><path d="M11 9.5h1.4v5H11v-3.4l-.8.4v-1.2z"/>',
  shuffle: '<path d="M16 3h5v5l-2-2-4.6 4.6-1.4-1.4L17.6 5zM3 5h4.5l9.5 11 2-2 2 2v5h-5l2-2-2-2.3L7.5 7H3zM3 17h4l2.5-3 1.4 1.5L8.5 19H3z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  heartfill: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  note: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'
};
const STROKE = new Set(["search", "back", "fwd", "down", "note", "heart"]);
export function icon(name, extra = "") {
  return `<svg viewBox="0 0 24 24" class="${STROKE.has(name) ? "stroke " : ""}${extra}" aria-hidden="true">${P[name]}</svg>`;
}

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
  note: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'
};
const STROKE = new Set(["search", "back", "fwd", "down", "note"]);
export function icon(name, extra = "") {
  return `<svg viewBox="0 0 24 24" class="${STROKE.has(name) ? "stroke " : ""}${extra}" aria-hidden="true">${P[name]}</svg>`;
}

/* Caricamento e accesso ai dati (data/*.json) */
import { CONFIG, A, B, P } from "./config.js";
import { safeUrl, fmt } from "./utils.js";

export const DB = { artisti: [], brani: [], playlist: [] };

export async function loadData() {
  const entries = Object.entries(CONFIG.files);
  const res = await Promise.all(entries.map(([, url]) =>
    fetch(url).then(r => { if (!r.ok) throw new Error("Impossibile caricare " + url); return r.json(); })));
  entries.forEach(([k], i) => { DB[k] = res[i]; });
}

const same = (a, b) => String(a) === String(b);
export const artistaById = (id) => DB.artisti.find(a => same(a[A.id], id));
export const branoById = (id) => DB.brani.find(b => same(b[B.id], id));
export const playlistById = (id) => DB.playlist.find(p => same(p[P.id], id));
export const artistaDi = (b) => artistaById(b[B.artista]);
export const braniDi = (a) => DB.brani.filter(b => same(b[B.artista], a[A.id]));
export const braniPlaylist = (p) => (p[P.brani] || []).map(branoById).filter(Boolean);
export const generi = () => [...new Set(DB.brani.map(b => b[B.genere]).filter(Boolean))];

/** Legge la durata reale dai file audio (se non indicata nel JSON), così non va scritta a mano */
export function fillDurations() {
  DB.brani.forEach(b => {
    const src = safeUrl(b[B.file]);
    if (!src || Number(b[B.durata]) > 0) return;
    const a = new Audio(); a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => {
      if (!isFinite(a.duration)) return;
      b[B.durata] = Math.round(a.duration);
      document.querySelectorAll(`[data-dur="${CSS.escape(String(b[B.id]))}"]`).forEach(el => { el.textContent = fmt(b[B.durata]); });
    });
    a.src = src;
  });
}

/** true se il brano ha un file audio indicato nel JSON */
export const hasAudio = (b) => !!safeUrl(b[B.file]);

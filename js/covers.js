/* Copertine automatiche. Ordine di priorità per ogni brano:
 *  1. campo "copertina" nel JSON (immagine tua, es. img/covers/nome.jpg)
 *  2. immagine incorporata nel file MP3 (tag ID3), se presente
 *  3. ricerca per titolo + artista con la iTunes Search API (pubblica, senza chiave)
 *  4. sfumatura colorata con l'iniziale (gestita in components.js)
 */
import { A, B, CONFIG } from "./config.js";
import { safeUrl } from "./utils.js";
import { artistaDi } from "./data.js";

const LS_KEY = "justunes.covers.v1";
const ITUNES_OK = /^https:\/\/[\w.-]*mzstatic\.com\//;
const cache = new Map();   // id brano -> url immagine

try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  for (const [k, v] of Object.entries(saved)) if (ITUNES_OK.test(v)) cache.set(k, v);
} catch { /* localStorage non disponibile */ }
function persist(id, url) {
  if (!ITUNES_OK.test(url)) return;               // i blob ID3 valgono solo per la sessione
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); saved[id] = url;
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  } catch { /* ignora */ }
}

/** URL della copertina attualmente disponibile per un brano ("" se non c'è) */
export const coverOfTrack = (b) => safeUrl(b[B.copertina]) || cache.get(String(b[B.id])) || "";

/* ---------- 2. tag ID3 dentro l'MP3 ---------- */
const synch = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const latin = (b, o, n) => String.fromCharCode(...b.subarray(o, o + n));

function sniffMime(d) {
  if (d[0] === 0xff && d[1] === 0xd8) return "image/jpeg";
  if (d[0] === 0x89 && d[1] === 0x50 && d[2] === 0x4e && d[3] === 0x47) return "image/png";
  if (latin(d, 0, 4) === "GIF8") return "image/gif";
  if (latin(d, 0, 4) === "RIFF" && latin(d, 8, 4) === "WEBP") return "image/webp";
  return "";
}
function parseApic(f, v22) {
  const enc = f[0]; let q = 1;
  if (v22) q = 4;                                   // formato a 3 lettere (PNG/JPG)
  else { while (q < f.length && f[q] !== 0) q++; q++; }
  const type = f[q++];
  if (enc === 1 || enc === 2) { while (q + 1 < f.length && !(f[q] === 0 && f[q + 1] === 0)) q += 2; q += 2; }
  else { while (q < f.length && f[q] !== 0) q++; q++; }
  const data = f.subarray(q);
  const mime = data.length > 16 ? sniffMime(data) : "";
  return mime ? { type, blob: new Blob([data.slice()], { type: mime }) } : null;
}
function findApic(body, ver, flags) {
  let p = 0;
  if (flags & 0x40) p = ver === 4 ? synch(body, 0) : u32(body, 0) + 4;   // header esteso
  const idLen = ver === 2 ? 3 : 4, hdr = ver === 2 ? 6 : 10, found = [];
  while (p + hdr <= body.length) {
    const id = latin(body, p, idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const sz = ver === 2 ? (body[p + 3] << 16) | (body[p + 4] << 8) | body[p + 5]
      : ver === 4 ? synch(body, p + 4) : u32(body, p + 4);
    const start = p + hdr;
    if (sz <= 0 || start + sz > body.length) break;
    if (id === "APIC" || id === "PIC") { const r = parseApic(body.subarray(start, start + sz), ver === 2); if (r) found.push(r); }
    p = start + sz;
  }
  const best = found.find(x => x.type === 3) || found[0];
  return best ? URL.createObjectURL(best.blob) : "";
}
async function fromId3(b) {
  const src = safeUrl(b[B.file]); if (!src) return "";
  const ctrl = new AbortController();
  const res = await fetch(src, { signal: ctrl.signal });
  if (!res.ok || !res.body) return "";
  const rd = res.body.getReader(); let buf = new Uint8Array(0);
  const fill = async (n) => {
    while (buf.length < n) {
      const { done, value } = await rd.read(); if (done) return false;
      const nb = new Uint8Array(buf.length + value.length); nb.set(buf); nb.set(value, buf.length); buf = nb;
    }
    return true;
  };
  try {
    if (!(await fill(10)) || latin(buf, 0, 3) !== "ID3") return "";
    const size = synch(buf, 6); if (size > 6 * 1024 * 1024) return "";
    await fill(10 + size);                          // legge solo l'intestazione del file, non tutta la canzone
    return findApic(buf.subarray(10, 10 + size), buf[3], buf[5]);
  } finally { ctrl.abort(); }
}

/* ---------- 3. iTunes Search API (JSONP: funziona anche da GitHub Pages) ---------- */
let jsonpN = 0;
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "__justunes_cb" + (++jsonpN), s = document.createElement("script");
    const done = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    const t = setTimeout(() => { done(); reject(new Error("timeout")); }, 8000);
    window[cb] = (d) => { done(); resolve(d); };
    s.onerror = () => { done(); reject(new Error("rete")); };
    s.src = url + "&callback=" + cb; document.head.appendChild(s);
  });
}
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
async function fromItunes(b) {
  const a = artistaDi(b);
  if (!a || String(a[A.id]) === CONFIG.artistaIgnoto) return "";         // senza artista certo non si indovina
  const title = String(b[B.titolo] ?? ""), artist = String(a[A.nome] ?? "");
  const mainArtist = norm(artist.split(/,|&| feat\.?/i)[0]);
  const url = "https://itunes.apple.com/search?media=music&entity=song&limit=10&term=" + encodeURIComponent(title + " " + artist);
  const data = await jsonp(url);
  const hit = (data.results || []).find(r => norm(r.trackName).includes(norm(title)) && norm(r.artistName).includes(mainArtist) && ITUNES_OK.test(r.artworkUrl100 || ""));
  return hit ? hit.artworkUrl100.replace(/\/\d+x\d+bb\./, "/600x600bb.") : "";
}

/** Cerca le copertine mancanti (3 alla volta); onUpdate viene chiamato a ogni copertina trovata */
export async function resolveCovers(list, onUpdate) {
  const todo = list.filter(b => !safeUrl(b[B.copertina]) && !cache.has(String(b[B.id])));
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const b = todo[i++], id = String(b[B.id]); let url = "";
      try { url = await fromId3(b); } catch { /* nessun tag */ }
      if (!url) { try { url = await fromItunes(b); } catch { /* offline o non trovata */ } }
      if (url) { cache.set(id, url); persist(id, url); onUpdate(); }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

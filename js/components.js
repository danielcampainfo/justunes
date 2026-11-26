/* Componenti HTML riutilizzabili */
import { A, B, P } from "./config.js";
import { esc, fmt, cssUrl, gradient } from "./utils.js";
import { icon } from "./icons.js";
import { artistaDi, braniDi, braniPlaylist, hasAudio } from "./data.js";
import { coverOfTrack } from "./covers.js";
import { isFav } from "./store.js";

const enc = encodeURIComponent;

function bg(img, seed) {
  const u = cssUrl(img), g = gradient(seed);
  return u ? `background-image:url('${u}'),${g}` : `background-image:${g}`;
}

/** Copertina: foto se presente, altrimenti sfumatura + iniziale (o nota per le playlist) */
export function cover(item, kind, cls = "") {
  let img = "", seed = "", label = "";
  if (kind === "brano") {
    const a = artistaDi(item);
    img = coverOfTrack(item) || (a && a[A.foto]) || ""; seed = item[B.id] + item[B.titolo]; label = item[B.titolo];
  } else if (kind === "artista") {
    img = item[A.foto] || braniDi(item).map(coverOfTrack).find(Boolean) || ""; seed = item[A.id] + item[A.nome]; label = item[A.nome];
  } else {
    img = item[P.copertina] || braniPlaylist(item).map(coverOfTrack).find(Boolean) || ""; seed = item[P.id] + item[P.nome];
  }
  const inner = img ? "" : (kind === "playlist" ? icon("note") : esc((label || "?").trim().charAt(0).toUpperCase()));
  return `<div class="cov ${cls}" style="${esc(bg(img, seed))}">${inner}</div>`;
}
/** Stringa style (per elementi che hanno già la propria classe) */
export function coverStyle(item, kind) {
  const m = cover(item, kind).match(/style="([^"]*)"/);
  return m ? m[1] : "";
}

/** Cuore dei preferiti (aggiornato da main.js con paintFavs) */
export const favBtn = (b, cls = "t-fav") => { const on = isFav(b[B.id]);
  return `<button class="${cls}${on ? " on" : ""}" data-act="fav" data-id="${esc(b[B.id])}" aria-label="${on ? "Togli dai preferiti" : "Aggiungi ai preferiti"}" aria-pressed="${on}">${icon(on ? "heartfill" : "heart")}</button>`; };

export function trackRow(b, ctx, n) {
  const a = artistaDi(b);
  const meta = [b[B.genere], b[B.anno]].filter(Boolean).map(esc).join(" · ");
  return `<article class="track${hasAudio(b) ? "" : " no-audio"}" data-track="${esc(b[B.id])}" data-ctx="${esc(ctx)}">
    <div class="t-idx"><span class="num">${n}</span><span class="ic-play">${icon("play")}</span><span class="ic-pause">${icon("pause")}</span><span class="eq"><i></i><i></i><i></i></span></div>
    ${cover(b, "brano")}
    <div class="t-main">
      <div class="t-title">${esc(b[B.titolo])}${hasAudio(b) ? "" : '<em class="tag-off">audio mancante</em>'}</div>
      <div class="t-sub">${a ? `<a href="#/artista/${enc(a[A.id])}">${esc(a[A.nome])}</a>` : "Artista sconosciuto"}${meta ? " · " + meta : ""}</div>
    </div>
    ${favBtn(b)}
    <span class="t-dur" data-dur="${esc(b[B.id])}">${Number(b[B.durata]) > 0 ? fmt(b[B.durata]) : ""}</span>
  </article>`;
}
export function trackList(list, ctx) {
  if (!list.length) return `<div class="empty">Nessun brano.</div>`;
  return `<div class="tracks"><div class="tracks-head"><span>#</span><span></span><span>Titolo</span><span></span><span>Durata</span></div>${list.map((b, i) => trackRow(b, ctx, i + 1)).join("")}</div>`;
}

export const artistCard = (a) => `<a class="card round" href="#/artista/${enc(a[A.id])}">${cover(a, "artista")}<strong>${esc(a[A.nome])}</strong><small>Artista · ${braniDi(a).length} brani</small></a>`;
export const playlistCard = (p) => `<a class="card" href="#/playlist/${enc(p[P.id])}">${cover(p, "playlist")}<strong>${esc(p[P.nome])}</strong><small>${esc(p[P.descrizione] || braniPlaylist(p).length + " brani")}</small></a>`;
export const trackCard = (b) => { const a = artistaDi(b); return `<button class="card" data-track="${esc(b[B.id])}" data-ctx="home">${cover(b, "brano")}<strong>${esc(b[B.titolo])}</strong><small>${a ? esc(a[A.nome]) : ""}</small></button>`; };

export function tile(item, kind) {
  if (kind === "playlist") return `<a class="tile" href="#/playlist/${enc(item[P.id])}">${cover(item, "playlist")}<strong>${esc(item[P.nome])}</strong></a>`;
  return `<button class="tile" data-track="${esc(item[B.id])}" data-ctx="home">${cover(item, "brano")}<strong>${esc(item[B.titolo])}</strong></button>`;
}

/** Riga della libreria (sidebar e pagina Libreria su telefono) */
export function libRow(item, kind) {
  if (kind === "playlist") return `<a class="lib-row" href="#/playlist/${enc(item[P.id])}">${cover(item, "playlist")}<div><strong>${esc(item[P.nome])}</strong><small>Playlist · ${braniPlaylist(item).length} brani</small></div></a>`;
  if (kind === "artisti") return `<a class="lib-row round" href="#/artista/${enc(item[A.id])}">${cover(item, "artista")}<div><strong>${esc(item[A.nome])}</strong><small>Artista</small></div></a>`;
  const a = artistaDi(item);
  return `<div class="lib-row" data-track="${esc(item[B.id])}" data-ctx="home" style="cursor:pointer">${cover(item, "brano")}<div><strong>${esc(item[B.titolo])}</strong><small>${a ? esc(a[A.nome]) : "Brano"}</small></div></div>`;
}

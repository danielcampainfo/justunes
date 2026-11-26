/* Pagine dell'app: ogni funzione restituisce l'HTML della vista */
import { A, B, P } from "./config.js";
import { esc } from "./utils.js";
import { icon } from "./icons.js";
import { state } from "./state.js";
import { DB, artistaById, artistaDi, braniDi, braniPlaylist, playlistById, generi } from "./data.js";
import { favIds } from "./store.js";
import { cover, favBtn, trackList, artistCard, playlistCard, trackCard, tile, libRow } from "./components.js";

const enc = encodeURIComponent;
const saluto = () => { const h = new Date().getHours(); return h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera"; };
const same = (a, b) => String(a) === String(b);

export function home() {
  const tiles = [...DB.playlist.map(p => tile(p, "playlist")), ...DB.brani.map(b => tile(b, "brano"))].slice(0, 6);
  return `<h1 class="greeting">${saluto()}</h1>
    <div class="tiles">${tiles.join("")}</div>
    <section class="section"><div class="section-head"><h2>Playlist per te</h2><a href="#/playlist">Mostra tutto</a></div>
      <div class="cards">${DB.playlist.map(playlistCard).join("")}</div></section>
    <section class="section"><div class="section-head"><h2>I tuoi artisti</h2><a href="#/artisti">Mostra tutto</a></div>
      <div class="cards">${DB.artisti.map(artistCard).join("")}</div></section>
    <section class="section"><div class="section-head"><h2>Brani popolari</h2></div>
      <div class="cards">${DB.brani.slice(0, 8).map(trackCard).join("")}</div></section>
    <section class="section"><div class="section-head"><h2>Tutti i brani</h2></div>${trackList(DB.brani, "home")}</section>`;
}

export function artisti() {
  return `<h1 class="greeting">Artisti</h1><div class="cards">${DB.artisti.map(artistCard).join("")}</div>`;
}

export function artista(id) {
  const a = artistaById(id);
  if (!a) return `<div class="empty">Artista non trovato. <a href="#/artisti"><u>Torna agli artisti</u></a></div>`;
  const l = braniDi(a);
  return `<div class="detail round">${cover(a, "artista")}
      <div><p class="eyebrow">Artista${a[A.paese] ? " · " + esc(a[A.paese]) : ""}</p><h1>${esc(a[A.nome])}</h1><p>${esc(a[A.bio] || "")}</p></div></div>
    ${l.length ? `<div class="actions"><button class="fab" data-playall="artista:${esc(a[A.id])}" aria-label="Riproduci tutto">${icon("play")}</button></div>` : ""}
    <section><div class="section-head"><h2>Brani</h2></div>${trackList(l, "artista:" + a[A.id])}</section>`;
}

export function playlist(id) {
  if (!id) return `<h1 class="greeting">Playlist</h1><div class="cards">${DB.playlist.map(playlistCard).join("")}</div>`;
  const p = playlistById(id);
  if (!p) return `<div class="empty">Playlist non trovata. <a href="#/playlist"><u>Torna alle playlist</u></a></div>`;
  const l = braniPlaylist(p);
  return `<div class="detail">${cover(p, "playlist")}
      <div><p class="eyebrow">Playlist</p><h1>${esc(p[P.nome])}</h1><p>${esc(p[P.descrizione] || "")}</p></div></div>
    ${l.length ? `<div class="actions"><button class="fab" data-playall="playlist:${esc(p[P.id])}" aria-label="Riproduci tutto">${icon("play")}</button></div>` : ""}
    <section>${trackList(l, "playlist:" + p[P.id])}</section>`;
}

const matches = (q, ...vals) => vals.some(v => String(v ?? "").toLowerCase().includes(q));
export function cercaRisultati(q) {
  q = q.toLowerCase();
  return {
    brani: DB.brani.filter(b => matches(q, b[B.titolo], b[B.genere], (artistaDi(b) || {})[A.nome])),
    artisti: DB.artisti.filter(a => matches(q, a[A.nome], a[A.paese])),
    playlist: DB.playlist.filter(p => matches(q, p[P.nome], p[P.descrizione]))
  };
}
export function cerca(q) {
  q = (q || "").trim();
  if (!q) {
    const gen = generi();
    return `<h1 class="greeting">Cerca</h1>` + (gen.length
      ? `<section><div class="section-head"><h2>Sfoglia per genere</h2></div><div class="genres">${gen.map(g =>
        `<a class="genre" style="background:${genreBg(g)}" href="#/cerca/${enc(g)}">${esc(g)}</a>`).join("")}</div></section>`
      : `<div class="empty">Scrivi qualcosa nella barra di ricerca.</div>`);
  }
  const r = cercaRisultati(q);
  const none = (t) => `<div class="empty">${t}</div>`;
  return `<h1 class="greeting" style="font-size:1.8rem">Risultati per “${esc(q)}”</h1>
    <section><div class="section-head"><h2>Brani</h2></div>${r.brani.length ? trackList(r.brani, "cerca:" + q) : none("Nessun brano.")}</section>
    <section class="section"><div class="section-head"><h2>Artisti</h2></div>${r.artisti.length ? `<div class="cards">${r.artisti.map(artistCard).join("")}</div>` : none("Nessun artista.")}</section>
    <section class="section"><div class="section-head"><h2>Playlist</h2></div>${r.playlist.length ? `<div class="cards">${r.playlist.map(playlistCard).join("")}</div>` : none("Nessuna playlist.")}</section>`;
}
const GBG = ["#7f5539", "#9c6644", "#b08968", "#6b4630", "#8a5a3c", "#a47551"];
const genreBg = (g) => GBG[[...g].reduce((s, c) => s + c.charCodeAt(0), 0) % GBG.length];

export function preferiti() {
  const f = favIds(), l = DB.brani.filter(b => f.has(String(b[B.id])));
  return `<div class="detail"><div class="cov fav-cover">${icon("heartfill")}</div>
      <div><small>Playlist</small><h1>Brani preferiti</h1><p>${l.length} brani</p></div></div>
    ${l.length ? `<div class="actions"><button class="fab" data-playall="preferiti" aria-label="Riproduci tutto">${icon("play")}</button></div>
    <section>${trackList(l, "preferiti")}</section>` : `<div class="empty">Non hai ancora preferiti. Premi il cuore accanto a un brano per aggiungerlo.</div>`}`;
}

/* Libreria: usata nella sidebar e, su telefono, come pagina #/libreria */
export function libraryChips() {
  return [["playlist", "Playlist"], ["artisti", "Artisti"], ["brani", "Brani"]]
    .map(([k, t]) => `<button class="chip${state.libFilter === k ? " active" : ""}" data-lib="${k}">${t}</button>`).join("");
}
export function libraryItems() {
  const f = state.libFilter;
  const list = f === "playlist" ? DB.playlist : f === "artisti" ? DB.artisti : DB.brani;
  return list.length ? list.map(i => libRow(i, f)).join("") : `<div class="empty" style="margin:8px">Vuoto.</div>`;
}
export function libreria() {
  return `<h1 class="greeting">La tua libreria</h1><div class="chips" style="padding:0 0 12px" id="libChipsPage">${libraryChips()}</div><div class="lib-big" id="libListPage">${libraryItems()}</div>`;
}

/* Pannello destro: info sul brano e sull'artista */
export function rightPanel() {
  const b = state.current;
  const a = b ? artistaDi(b) : DB.artisti[0];
  const rep = state.repeat, on = (x) => x ? " on" : "";
  const player = `<div class="mp3"><div class="mp3-stars"></div>
    ${b ? cover(b, "brano", "mp3-cover") : `<div class="cov mp3-cover mp3-empty">${icon("note")}</div>`}
    <div class="mp3-text">${b ? favBtn(b, "mp3-fav") : ""}<h3>${b ? esc(b[B.titolo]) : "Nessun brano"}</h3><p>${b && a ? esc(a[A.nome]) : "Scegli un brano"}</p></div>
    <div class="mp3-ctl">
      <button class="mp3-btn small${on(rep !== "off")}" data-act="repeat" aria-label="Ripeti: ${rep}">${icon(rep === "one" ? "repeat1" : "repeat")}</button>
      <button class="mp3-btn" data-act="prev" aria-label="Precedente">${icon("prev")}</button>
      <button class="mp3-btn key main" data-act="toggle" aria-label="Riproduci / Pausa">${icon(state.playing ? "pause" : "play")}</button>
      <button class="mp3-btn" data-act="next" aria-label="Successivo">${icon("next")}</button>
      <button class="mp3-btn small${on(state.shuffle)}" data-act="shuffle" aria-label="Casuale">${icon("shuffle")}</button>
    </div></div>`;
  const about = a ? `<div class="rp-about">${cover(a, "artista", "rp-about-img")}
      <div class="rp-about-body"><div class="rp-label">Informazioni sull'artista</div><h4>${esc(a[A.nome])}</h4>
      <p>${esc(a[A.bio] || "")}</p><p>${braniDi(a).length} brani${a[A.paese] ? " · " + esc(a[A.paese]) : ""}</p></div></div>` : "";
  return player + about;
}

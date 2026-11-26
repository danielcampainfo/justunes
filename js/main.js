/* Avvio dell'app: routing, eventi globali, PWA */
import { B } from "./config.js";
import { $, $$ } from "./utils.js";
import { icon } from "./icons.js";
import { state } from "./state.js";
import { DB, hasAudio, loadData, fillDurations, branoById, braniDi, braniPlaylist, artistaById, playlistById } from "./data.js";
import * as V from "./views.js";
import { initPlayer, playList, toggle, isCurrent, paintTrack, restoreLast, next, prev, toggleRepeat, toggleShuffle } from "./player.js";
import { resolveCovers } from "./covers.js";
import { toggleFav, isFav, favIds } from "./store.js";

const view = $("#view");
const main = $("#main");

/* ---------- routing ---------- */
function route() {
  const [, page = "", arg = ""] = location.hash.split("/");
  const val = arg ? decodeURIComponent(arg) : "";
  const name = page || "home";
  const map = { home: () => V.home(), artisti: () => V.artisti(), artista: () => V.artista(val), playlist: () => V.playlist(val),
    cerca: () => V.cerca(val), preferiti: () => V.preferiti(), libreria: () => V.libreria() };
  view.innerHTML = (map[name] || map.home)();
  const nav = name === "artista" || name === "artisti" ? "libreria" : name === "playlist" ? "libreria" : name;
  $$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === nav));
  if (name !== "cerca") $("#searchInput").value = "";
  else if (document.activeElement !== $("#searchInput")) $("#searchInput").value = val;
  main.scrollTop = 0;
  syncRows();
}

/* evidenzia il brano corrente nelle liste */
function syncRows() {
  const cur = state.current ? String(state.current[B.id]) : null;
  $$(".track").forEach(el => {
    el.classList.toggle("playing", el.dataset.track === cur);
    el.classList.toggle("is-on", el.dataset.track === cur && state.playing);
  });
}
function refreshSide() {
  $("#libChips").innerHTML = V.libraryChips(); $("#libList").innerHTML = V.libraryItems();
  const cp = $("#libChipsPage"); if (cp) { cp.innerHTML = V.libraryChips(); $("#libListPage").innerHTML = V.libraryItems(); }
}
/* cuori: aggiorna tutti i pulsanti preferito presenti in pagina */
function paintFavs() {
  $$("[data-act=fav]").forEach(el => {
    const on = isFav(el.dataset.id); el.classList.toggle("on", on); el.setAttribute("aria-pressed", on);
    el.setAttribute("aria-label", on ? "Togli dai preferiti" : "Aggiungi ai preferiti");
    el.innerHTML = icon(on ? "heartfill" : "heart");
  });
}
document.addEventListener("player:change", () => { syncRows(); $("#rightPanel").innerHTML = V.rightPanel(); paintFavs(); });

/* ---------- elenco brani di un contesto (per la coda) ---------- */
function contextList(ctx) {
  const i = String(ctx || "home").indexOf(":");
  const tipo = i < 0 ? ctx : ctx.slice(0, i), id = i < 0 ? "" : ctx.slice(i + 1);
  if (tipo === "artista") { const a = artistaById(id); return a ? braniDi(a) : DB.brani; }
  if (tipo === "playlist") { const p = playlistById(id); return p ? braniPlaylist(p) : DB.brani; }
  if (tipo === "preferiti") { const f = favIds(); return DB.brani.filter(b => f.has(String(b[B.id]))); }
  if (tipo === "cerca") return V.cercaRisultati(id).brani;
  return DB.brani;
}

/* messaggio breve in basso */
let tt;
function toast(msg) {
  let el = $("#toast"); if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("on"), 3200);
}
const NOAUDIO = "Audio non presente: metti il file MP3 in audio/ e scrivine il percorso in data/brani.json.";

/* ---------- eventi ---------- */
document.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]");
  if (act) {
    if (act.dataset.act === "fav") {
      toggleFav(act.dataset.id); paintFavs();
      if (location.hash === "#/preferiti") { const top = main.scrollTop; route(); main.scrollTop = top; }
      return;
    }
    const f = { toggle, prev, next, repeat: toggleRepeat, shuffle: toggleShuffle }[act.dataset.act];
    if (act.dataset.act === "toggle" && !state.current) { if (!playList(DB.brani.filter(hasAudio), 0)) toast(NOAUDIO); } else if (f) f();
    return;
  }
  const lib = e.target.closest("[data-lib]");
  if (lib) { state.libFilter = lib.dataset.lib; refreshSide(); return; }

  const all = e.target.closest("[data-playall]");
  if (all) {
    const list = contextList(all.dataset.playall);
    if (state.current && list.some(b => isCurrent(b))) toggle(); else if (!playList(list, 0)) toast(NOAUDIO);
    return;
  }
  if (e.target.closest("a")) return;                 // i link navigano normalmente
  const row = e.target.closest("[data-track]"); if (!row) return;
  const b = branoById(row.dataset.track); if (!b) return;
  if (!hasAudio(b)) { toast(NOAUDIO); return; }
  if (isCurrent(b)) { toggle(); return; }
  const list = contextList(row.dataset.ctx), i = list.findIndex(x => String(x[B.id]) === String(b[B.id]));
  playList(i >= 0 ? list : [b], Math.max(0, i));
});
window.addEventListener("hashchange", route);
main.addEventListener("scroll", () => $("#mainHead").classList.toggle("scrolled", main.scrollTop > 40), { passive: true });

$("#btnBack").addEventListener("click", () => history.back());
$("#btnFwd").addEventListener("click", () => history.forward());

/* ricerca: invio = vai ai risultati; mentre scrivi aggiorna la pagina senza riempire la cronologia */
const input = $("#searchInput");
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault(); const q = input.value.trim(); location.hash = q ? "#/cerca/" + encodeURIComponent(q) : "#/cerca";
});
let t;
input.addEventListener("input", () => {
  clearTimeout(t); t = setTimeout(() => {
    const q = input.value.trim(), target = q ? "#/cerca/" + encodeURIComponent(q) : "#/cerca";
    if (location.hash.startsWith("#/cerca")) { history.replaceState(null, "", target); route(); }
    else location.hash = target;
  }, 250);
});

/* ---------- PWA ---------- */
let deferred;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; $("#installBtn").hidden = false; });
$("#installBtn").addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#installBtn").hidden = true; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

/* ---------- avvio ---------- */
function paintIcons() {
  $("#navHome").innerHTML = icon("home") + "<span>Home</span>";
  $("#navSearch").innerHTML = icon("search") + "<span>Cerca</span>";
  $("#navFav").innerHTML = icon("heart") + "<span>Preferiti</span>";
  $("#tabFav").innerHTML = icon("heart") + "Preferiti";
  $("#libHead").innerHTML = icon("library") + "<span>La tua libreria</span>";
  $("#btnBack").innerHTML = icon("back"); $("#btnFwd").innerHTML = icon("fwd");
  $("#searchIcon").innerHTML = icon("search");
  $("#tabHome").innerHTML = icon("home") + "Home";
  $("#tabSearch").innerHTML = icon("search") + "Cerca";
  $("#tabLib").innerHTML = icon("library") + "Libreria";
}
/* aggiorna le copertine man mano che vengono trovate (senza perdere la posizione di scorrimento) */
let tc;
function refreshCovers() {
  clearTimeout(tc);
  tc = setTimeout(() => {
    const top = main.scrollTop, q = document.activeElement === input;
    refreshSide(); $("#rightPanel").innerHTML = V.rightPanel();
    if (!q) { route(); main.scrollTop = top; }
    if (state.current) paintTrack();
  }, 400);
}
function startCovers() { resolveCovers(DB.brani, refreshCovers).catch(() => {}); }
paintIcons(); initPlayer();
loadData().then(() => { refreshSide(); $("#rightPanel").innerHTML = V.rightPanel(); route(); fillDurations(); startCovers(); restoreLast(); })
  .catch(() => { view.innerHTML = `<div class="empty">Impossibile caricare i dati. Avvia l'app da un server (es. GitHub Pages) e non aprendo il file direttamente.</div>`; });

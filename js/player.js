/* Riproduzione audio: coda, controlli, barra in basso e schermata giradischi.
 * Se il file audio manca, la riproduzione viene simulata (utile in fase di sviluppo). */
import { A, B, CONFIG } from "./config.js";
import { $, fmt, safeUrl } from "./utils.js";
import { icon } from "./icons.js";
import { state } from "./state.js";
import { artistaDi } from "./data.js";
import { coverStyle } from "./components.js";

const audio = $("#audio");
const bar = $("#bar"), full = $("#full");
const Q = { list: [], index: -1, simulated: false, simTime: 0, simDur: 0, timer: null };
const emit = () => document.dispatchEvent(new CustomEvent("player:change"));

const dur = () => Q.simulated ? Q.simDur : (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Q.simDur);
const time = () => Q.simulated ? Q.simTime : (audio.currentTime || 0);

function stopSim() { clearInterval(Q.timer); Q.timer = null; }
function runSim() {
  stopSim();
  Q.timer = setInterval(() => {
    Q.simTime += 0.25;
    if (Q.simTime >= Q.simDur) { Q.simTime = Q.simDur; ended(); }
    paintProgress();
  }, 250);
}
function useSimulation() {
  audio.removeAttribute("src"); Q.simulated = true; $("#simNote").hidden = false;
  setPlaying(true); runSim();
}

export function playList(list, i) {
  Q.list = list.slice(); Q.index = i; start();
}
function start() {
  const b = Q.list[Q.index]; if (!b) return;
  stopSim(); state.current = b; Q.simulated = false; Q.simTime = 0;
  Q.simDur = Number(b[B.durata]) || CONFIG.durataPredefinita;
  $("#simNote").hidden = true;
  const src = safeUrl(b[B.file]);
  if (src) { audio.src = src; audio.play().then(() => setPlaying(true)).catch(useSimulation); }
  else useSimulation();
  paintTrack(); emit();
}
export function toggle() {
  if (!state.current) return;
  if (Q.simulated) { if (state.playing) { stopSim(); setPlaying(false); } else { setPlaying(true); runSim(); } return; }
  if (audio.paused) audio.play().then(() => setPlaying(true)).catch(useSimulation);
  else { audio.pause(); setPlaying(false); }
}
export function next() { if (!Q.list.length) return; Q.index = (Q.index + 1) % Q.list.length; start(); }
export function prev() {
  if (time() > 3) return seek(0);
  if (!Q.list.length) return; Q.index = (Q.index - 1 + Q.list.length) % Q.list.length; start();
}
function ended() {
  stopSim();
  if (Q.index < Q.list.length - 1) next(); else { setPlaying(false); Q.simTime = 0; if (!Q.simulated) audio.currentTime = 0; paintProgress(); }
}
function seek(t) { if (Q.simulated) Q.simTime = Math.min(t, Q.simDur); else audio.currentTime = t; paintProgress(); }
function setPlaying(v) { state.playing = v; paintState(); emit(); }
export const isCurrent = (b) => state.current && String(state.current[B.id]) === String(b[B.id]);

/* ---------- aspetto ---------- */
const setRange = (el, p) => { el.value = Math.round(p * 1000); el.style.setProperty("--p", (p * 100) + "%"); };
function paintProgress() {
  const d = dur() || 1, t = time(), p = Math.min(1, t / d);
  setRange($("#barSeek"), p); setRange($("#fullSeek"), p);
  $("#barCur").textContent = fmt(t); $("#barDur").textContent = fmt(d);
  $("#fullCur").textContent = fmt(t); $("#fullLeft").textContent = "-" + fmt(Math.max(0, d - t));
}
function paintState() {
  const ic = state.playing ? icon("pause") : icon("play");
  $("#barPlay").innerHTML = ic; $("#fullPlay").innerHTML = ic;
  full.classList.toggle("is-on", state.playing);
  $("#barPlay").setAttribute("aria-label", state.playing ? "Pausa" : "Riproduci");
  $("#fullPlay").setAttribute("aria-label", state.playing ? "Pausa" : "Riproduci");
}
export function paintTrack() {
  const b = state.current; if (!b) return;
  const a = artistaDi(b), st = coverStyle(b, "brano");
  bar.hidden = false;
  $("#barCover").setAttribute("style", st); $("#fullLabel").setAttribute("style", st);
  $("#barCover").textContent = "";
  $("#barTitle").textContent = b[B.titolo]; $("#barArtist").textContent = a ? a[A.nome] : "";
  $("#fullTitle").textContent = b[B.titolo];
  const fa = $("#fullArtist"); fa.textContent = a ? a[A.nome] : "Artista sconosciuto"; fa.href = a ? "#/artista/" + encodeURIComponent(a[A.id]) : "#/";
  $("#fullFrom").textContent = "In riproduzione";
  paintState(); paintProgress();
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: b[B.titolo], artist: a ? a[A.nome] : "", album: "JusTunes" });
    for (const [act, fn] of [["play", toggle], ["pause", toggle], ["nexttrack", next], ["previoustrack", prev]]) {
      try { navigator.mediaSession.setActionHandler(act, fn); } catch { /* non supportato */ }
    }
  }
}

export function openFull() { if (!state.current) return; full.hidden = false; full.classList.remove("closing"); $("#fullClose").focus(); }
export function closeFull() { full.hidden = true; }

export function initPlayer() {
  $("#barPrev").innerHTML = icon("prev"); $("#barNext").innerHTML = icon("next");
  $("#fullPrev").innerHTML = icon("prev"); $("#fullNext").innerHTML = icon("next");
  $("#barPlay").innerHTML = icon("play"); $("#fullPlay").innerHTML = icon("play");
  $("#fullClose").innerHTML = icon("down"); $("#volIcon").innerHTML = icon("vol");

  for (const id of ["barPlay", "fullPlay"]) $("#" + id).addEventListener("click", toggle);
  for (const id of ["barNext", "fullNext"]) $("#" + id).addEventListener("click", next);
  for (const id of ["barPrev", "fullPrev"]) $("#" + id).addEventListener("click", prev);
  $("#barOpen").addEventListener("click", openFull);
  $("#fullClose").addEventListener("click", closeFull);
  $("#fullArtist").addEventListener("click", closeFull);
  for (const id of ["barSeek", "fullSeek"]) $("#" + id).addEventListener("input", (e) => seek(Number(e.target.value) / 1000 * (dur() || 0)));
  $("#vol").addEventListener("input", (e) => { audio.volume = Number(e.target.value); e.target.style.setProperty("--p", e.target.value * 100 + "%"); });
  audio.volume = 0.8; $("#vol").style.setProperty("--p", "80%");

  audio.addEventListener("timeupdate", () => { if (!Q.simulated) paintProgress(); });
  audio.addEventListener("loadedmetadata", paintProgress);
  audio.addEventListener("ended", ended);
  audio.addEventListener("play", () => { if (!Q.simulated) setPlaying(true); });
  audio.addEventListener("pause", () => { if (!Q.simulated && !audio.ended) setPlaying(false); });
  audio.addEventListener("error", () => { if (audio.getAttribute("src")) useSimulation(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFull();
    if (e.code === "Space" && state.current && !/INPUT|TEXTAREA|BUTTON|A/.test(document.activeElement.tagName)) { e.preventDefault(); toggle(); }
  });
}

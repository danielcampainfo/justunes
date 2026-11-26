/* Dati personali dell'utente: brani preferiti e punto di ripresa.
 * Per ora sono salvati nel browser (localStorage). Quando avrai un database con gli utenti
 * (es. Supabase), basta riscrivere queste funzioni: il resto dell'app non cambia. */
const K_FAV = "justunes.preferiti.v1", K_RES = "justunes.ripresa.v1";
const read = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* spazio pieno o storage bloccato */ } };

export const favIds = () => new Set(read(K_FAV, []).map(String));
export const isFav = (id) => favIds().has(String(id));
/** Aggiunge/toglie un preferito; restituisce true se ora è tra i preferiti */
export function toggleFav(id) {
  const s = favIds(), k = String(id), on = !s.has(k);
  on ? s.add(k) : s.delete(k); write(K_FAV, [...s]); return on;
}

/** Ripresa: ultimo brano e secondo raggiunto */
export const saveResume = (id, t) => write(K_RES, { id: String(id), t: Math.max(0, Math.floor(t || 0)) });
export const loadResume = () => { const r = read(K_RES, null); return r && r.id ? r : null; };

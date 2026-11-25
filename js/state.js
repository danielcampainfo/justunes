/* Stato condiviso tra i moduli (evita dipendenze circolari) */
export const state = {
  current: null,        // brano in riproduzione (oggetto dal JSON)
  playing: false,
  libFilter: "playlist" // filtro della libreria: playlist | artisti | brani
};

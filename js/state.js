/* Stato condiviso tra i moduli (evita dipendenze circolari) */
export const state = {
  current: null,        // brano in riproduzione (oggetto dal JSON)
  playing: false,
  repeat: "off",       // off | all | one
  shuffle: false,
  libFilter: "playlist" // filtro della libreria: playlist | artisti | brani
};

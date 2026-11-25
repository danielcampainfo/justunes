/* Configurazione: file dati e nomi dei campi.
 * Quando lo schema E/R sarà definitivo, adatta qui i nomi dei campi
 * (e i file in data/) senza toccare il resto del codice. */
export const CONFIG = {
  files: {
    artisti: "data/artisti.json",
    brani: "data/brani.json",
    playlist: "data/playlist.json"
  },
  campi: {
    artista:  { id: "id", nome: "nome", bio: "bio", paese: "paese", foto: "foto" },
    brano:    { id: "id", titolo: "titolo", artista: "artista_id", durata: "durata_s", genere: "genere",
                anno: "anno", file: "file", copertina: "copertina" },
    playlist: { id: "id", nome: "nome", descrizione: "descrizione", brani: "brani_ids", copertina: "copertina" }
  },
  artistaIgnoto: "ignoto",  // id dell'artista segnaposto: per questi brani non si cercano copertine online
  durataPredefinita: 180   // secondi, usata solo se la durata non è nota
};

export const B = CONFIG.campi.brano;
export const A = CONFIG.campi.artista;
export const P = CONFIG.campi.playlist;

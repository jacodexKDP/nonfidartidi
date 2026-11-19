# nonfidartidi.it

File pubblici dell'archivio online di «Non fidarti di questo libro – La seconda tiratura» (https://nonfidartidi.it).

- `dist/`: il sito statico già generato. Suggerimenti, soluzioni ed epilogo sono cifrati (AES-GCM, chiavi PBKDF2):
  si aprono solo nel browser del lettore con il codice o la risposta giusta. Le risposte non sono in questo repository.
- `Dockerfile`, `nginx.conf`: immagine nginx statica (nessun log di accesso).
- `docker-compose.yaml`: costruisce l'immagine da questo repository e la espone tramite il Traefik della VPS
  (HTTPS con Let's Encrypt, redirect 301 da www).

Il sito viene generato altrove: non modificare `dist/` a mano.

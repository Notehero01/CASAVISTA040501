# Persistenza CasaVista

CasaVista ora supporta:

- PostgreSQL per utenti, annunci, chat e amministrazioni
- Cloudflare R2 per le immagini degli annunci
- fallback locale su JSON/uploads quando `DATABASE_URL` e R2 non sono configurati

## Render Postgres

Il file `render.yaml` crea un database:

- nome: `casavista-db`
- piano: `basic-256mb`
- regione: `frankfurt`

La variabile `DATABASE_URL` viene collegata automaticamente dal Blueprint.

## Cloudflare R2

Creare un bucket R2 e una chiave API con permessi di lettura/scrittura sul bucket.

Impostare queste variabili nel servizio Render:

```text
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=<nome-bucket>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_PUBLIC_URL=https://<dominio-pubblico-o-custom-domain-del-bucket>
```

Se queste variabili non sono presenti, gli upload continuano a usare `backend/uploads`
solo per sviluppo locale.

## Note operative

- Non salvare le foto nel database: nel DB restano solo gli URL.
- Non inserire chiavi R2 nel repository.
- Per produzione, usare sempre Render Postgres e R2 configurato.

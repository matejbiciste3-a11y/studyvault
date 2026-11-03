# StudyVault

Soukromá knihovna učebnic a studijních materiálů. Next.js + Vercel Blob (private).

## Funkce

- Společné heslo pro čtenáře
- Oddělené administrátorské heslo pro nahrávání a mazání
- Privátní soubory ve Vercel Blob
- Nahrávání PDF, JPG, PNG a WebP
- Kategorie, vyhledávání a prohlížení dokumentů
- Přihlášení přes podepsanou HTTP-only cookie

Metadata jsou uložena v cestě souboru v Blobu, takže aplikace nepotřebuje databázi.

## Lokální spuštění

Potřebuješ Node.js 20.9 nebo novější.

```bash
npm install
```

Zkopíruj `.env.example` na `.env.local` a nastav `USER_PASSWORD`, `ADMIN_PASSWORD`, `SESSION_SECRET` a `BLOB_READ_WRITE_TOKEN`.

```bash
npm run dev
```

Otevři http://localhost:3000.

## Vercel

1. Vytvoř ve Vercelu privátní Blob store a připoj ho k projektu.
2. Nastav proměnné `USER_PASSWORD`, `ADMIN_PASSWORD` a `SESSION_SECRET`.
3. Vercel přidá `BLOB_READ_WRITE_TOKEN` po připojení Blob store.
4. Znovu nasaď projekt.

## Bezpečnost

Blob store musí být nastavený jako Private. Token `BLOB_READ_WRITE_TOKEN` nikdy nedávej do proměnné `NEXT_PUBLIC_*`. Hesla neposílej v chatu ani je nevkládej do zdrojového kódu. Společné heslo může uživatel předat dál; pro individuální rušení přístupů jsou potřeba samostatné účty.

Nahrávání je omezené na 25 MB na soubor.

Confirmar configuração de URL do PWA

O usuário perguntou se `https://www.stylisme.company` é o URL que deve usar no PWA. Verificamos o estado atual:

- `public/manifest.json` usa `start_url: "/auth"` e `scope: "/"` (caminhos relativos), portanto funciona em ambos os domínios: `stylisme.company` e `www.stylisme.company`.
- `capacitor.config.ts` aponta o app nativo para `https://stylisme.company` (sem `www`).
- `public/.well-known/assetlinks.json` está configurado para `com.stylisme.inteli` com os fingerprints SHA-256 corretos.

Recomendação técnica: manter o domínio canonical sem `www` e deixar o `www` apenas como redirecionamento. Assim o PWA, App Links e SEO permanecem consistentes.

Ação: nenhuma alteração de código será feita, conforme escolha do usuário.

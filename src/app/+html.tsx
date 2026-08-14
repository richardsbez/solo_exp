import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Este arquivo é exclusivo da web e controla o HTML raiz de todas as
// páginas geradas no export estático (web.output: "static" no app.json).
//
// O conteúdo desta função roda só em Node.js durante o build — não tem
// acesso ao DOM nem a APIs de navegador.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* Manifest do PWA (fica em public/manifest.json, copiado direto pro dist) */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#208AEF" />

        {/* Meta tags específicas do iOS — o Safari não segue o manifest.json
            à risca, então isso garante o modo standalone (sem barra do
            Safari) e o ícone correto ao adicionar à Tela de Início. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="solo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Desativa o scroll do body na web, deixando o comportamento mais
            parecido com o ScrollView nativo. Remova se quiser scroll do
            body normal. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

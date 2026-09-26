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
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
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

        {/* Garante que html/body sempre preencham 100% da viewport real
            (dvh, não vh — no Safari mobile o vh não conta a barra de
            endereço dinâmica) e nunca deixem o branco padrão da página
            aparecer atrás do app, mesmo se algum flex filho ainda não
            tiver altura calculada.

            `touch-action: manipulation` desativa o zoom por duplo toque
            (double-tap) e a maior parte do pinch-zoom em navegadores
            modernos, mantendo o pan (arrastar/rolar) normal — é o que faz
            o swipe entre abas (HudSwipePager) continuar funcionando. */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                min-height: 100dvh;
                background-color: #05070d;
                touch-action: manipulation;
              }
            `,
          }}
        />

        {/* `touch-action` e `user-scalable=no` cobrem a maioria dos
            navegadores, mas o Safari (inclusive em modo standalone/PWA)
            ainda dispara os eventos proprietários "gesture*" num pinch com
            2 dedos, ignorando os dois acima. Bloquear esses eventos é o
            que efetivamente tira o pinch-to-zoom no iPhone. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
              document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
              document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

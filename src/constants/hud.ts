import { Platform } from 'react-native';

/**
 * Paleta da "janela do Sistema". Foi extraída de dentro do index.tsx pra
 * cá porque agora duas telas (Status e Missões) precisam exatamente das
 * mesmas cores — com a cópia duplicada, mudar um tom no Figma viraria uma
 * caça a valores hardcoded em arquivos diferentes.
 *
 * Intencionalmente NÃO segue o Colors claro/escuro de constants/theme.ts:
 * a janela é sempre escura, igual no anime, independente do modo do
 * aparelho.
 */
export const Hud = {
  background: '#05070d',
  panelBorder: 'rgba(150, 190, 255, 0.28)',
  panelBorderStrong: 'rgba(170, 205, 255, 0.5)',
  textPrimary: '#e7edff',
  textLabel: '#8ea0c9',
  textMuted: '#5d6e94',
  glow: '#6fa8ff',
  barTrack: 'rgba(150, 190, 255, 0.16)',
  barFill: '#e7edff',
  success: '#4ade80',
  danger: '#ff4f6d',
} as const;

/**
 * Fonte monoespaçada usada nos textos "de terminal" do design (o aviso de
 * penalidade, os valores entre colchetes). Cada plataforma expõe um nome
 * diferente; no web o fallback genérico resolve.
 */
export const HudMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
});

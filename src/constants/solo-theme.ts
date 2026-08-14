/**
 * Tema visual do "Sistema" (Solo Leveling). Diferente de `theme.ts`
 * (light/dark do Expo Router), esse tema é fixo — o app do jogo sempre usa
 * o mesmo visual holográfico azul-neon, independente do modo do sistema.
 */

export const SoloColors = {
  // Fundo geral da tela — quase preto, com uma leve tonalidade azulada.
  backgroundBase: '#02050b',
  backgroundGradientTop: '#040b18',

  // Preenchimento dos painéis (translúcido, deixa o glow do fundo passar).
  panelFill: 'rgba(6, 18, 36, 0.55)',
  panelFillSoft: 'rgba(8, 22, 42, 0.35)',

  // Bordas e acentos neon.
  neonPrimary: '#3fd6ff',
  neonPrimaryDim: 'rgba(63, 214, 255, 0.35)',
  neonSecondary: '#8b7bff',

  // Texto.
  textPrimary: '#eaf6ff',
  textSecondary: '#7fb2d1',
  textMuted: '#4d7086',

  // Estados.
  danger: '#ff4f6d',
  success: '#4fffb0',

  // Preenchimento da barra de XP.
  barTrack: 'rgba(63, 214, 255, 0.08)',
  barFillStart: '#3fd6ff',
  barFillEnd: '#8b7bff',
} as const;

/** Glow externo padrão usado em painéis e na barra de XP. shadowColor +
 * shadowOffset/Opacity/Radius simulam o brilho holográfico; em web (RNW)
 * isso vira `box-shadow`, então funciona direto no Safari do iPhone. */
export const NeonGlow = {
  soft: {
    shadowColor: SoloColors.neonPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  strong: {
    shadowColor: SoloColors.neonPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

/** Glow aplicado em texto (textShadow*) pra simular o brilho holográfico
 * das letras nas telas de status do anime. */
export const NeonTextGlow = {
  textShadowColor: 'rgba(63, 214, 255, 0.75)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 8,
} as const;

export const SoloSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

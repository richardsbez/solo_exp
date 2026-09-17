import type { Feather } from '@expo/vector-icons';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export type TabKey = 'status' | 'missions' | 'quests' | 'notifications' | 'menu';

export interface TabDef {
  key: TabKey;
  icon: FeatherIconName;
  /** Só o Status usa — Feather não tem ícone de losango, então é o
   * "square" girado 45°. */
  rotated?: boolean;
}

/**
 * Ordem e ícone de cada aba. O índice (a posição no array) É o "índice da
 * aba" usado tanto pelo pager (HudSwipePager) quanto pela barra inferior
 * (HudBottomNav) — os dois olham pra este mesmo array, então a ordem só
 * precisa existir aqui.
 */
export const TABS: TabDef[] = [
  { key: 'status', icon: 'square', rotated: true },
  { key: 'missions', icon: 'check-square' },
  { key: 'quests', icon: 'calendar' },
  { key: 'notifications', icon: 'message-circle' },
  { key: 'menu', icon: 'align-center' },
];

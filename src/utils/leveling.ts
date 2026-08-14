import { BASE_XP_TO_LEVEL_2 } from '@/constants/game';
import type { Player, XpGainResult } from '@/types/game';

/**
 * Curva de XP necessário para completar um nível, dado o nível atual.
 * Crescimento exponencial suave (expoente 1.35) — nada absurdo como um
 * RPG hardcore, só o bastante pra níveis altos exigirem mais consistência
 * em vez de só volume de tarefas.
 *
 * level 1 -> 100 XP
 * level 2 -> ~255 XP
 * level 3 -> ~435 XP
 * level 5 -> ~840 XP
 */
export function calculateXpToNextLevel(level: number): number {
  return Math.round(BASE_XP_TO_LEVEL_2 * Math.pow(level, 1.35));
}

/**
 * Aplica um ganho de XP ao jogador, processando quantos level ups forem
 * necessários numa única chamada (ex: uma missão de rank S pode subir
 * mais de um nível de uma vez).
 *
 * Não muta o objeto recebido — sempre retorna um novo Player, pra ficar
 * seguro de usar direto num setState do React.
 */
export function applyXpGain(player: Player, xpAmount: number): XpGainResult {
  if (xpAmount <= 0) {
    return { player, leveledUp: false, levelsGained: 0 };
  }

  let level = player.level;
  let currentXP = player.currentXP + xpAmount;
  let xpToNextLevel = player.xpToNextLevel;
  let levelsGained = 0;

  while (currentXP >= xpToNextLevel) {
    currentXP -= xpToNextLevel;
    level += 1;
    levelsGained += 1;
    xpToNextLevel = calculateXpToNextLevel(level);
  }

  const updatedPlayer: Player = {
    ...player,
    level,
    currentXP,
    xpToNextLevel,
    updatedAt: new Date().toISOString(),
  };

  return {
    player: updatedPlayer,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

/** Porcentagem (0 a 100) de preenchimento da barra de XP do nível atual —
 * útil direto pra Fase 3 (UI), pra não recalcular isso na tela. */
export function calculateXpPercentage(player: Player): number {
  if (player.xpToNextLevel <= 0) return 0;
  return Math.min(100, Math.round((player.currentXP / player.xpToNextLevel) * 100));
}

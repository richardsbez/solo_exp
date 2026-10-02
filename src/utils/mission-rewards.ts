import { createEmptyAttributes, type AttributeAllocation, type DailyMission } from '@/types/mission-editor';
import type { AttributeKey, Player, XpGainResult } from '@/types/game';
import { applyXpGain } from '@/utils/leveling';

// ---------------------------------------------------------------------------
// Regras que ligam as missões ao jogador: entregar recompensas quando uma
// missão é concluída e resetar as diárias. Tudo aqui é função pura (não
// muta nada, não toca no storage) — quem persiste é o GameProvider.
// ---------------------------------------------------------------------------

export interface RewardTotals {
  xp: number;
  coins: number;
  abilityPoints: number;
  attributes: AttributeAllocation;
}

/**
 * Procura missões concluídas cujas recompensas ainda não foram entregues,
 * marca-as como pagas e soma o que elas dão. `totals` é null quando não há
 * nada a pagar (e `missions` volta como o mesmo array, sem recriar).
 */
export function claimRewards(missions: DailyMission[]): {
  missions: DailyMission[];
  totals: RewardTotals | null;
} {
  const totals: RewardTotals = {
    xp: 0,
    coins: 0,
    abilityPoints: 0,
    attributes: createEmptyAttributes(),
  };
  let anyClaimed = false;

  const updated = missions.map((mission) => {
    if (!mission.completed || mission.rewardClaimed) return mission;

    anyClaimed = true;
    totals.xp += mission.rewards.xp;
    totals.coins += mission.rewards.coins;
    totals.abilityPoints += mission.abilityPoints;
    for (const key of Object.keys(totals.attributes) as AttributeKey[]) {
      totals.attributes[key] += mission.attributes[key];
    }
    return { ...mission, rewardClaimed: true };
  });

  return anyClaimed ? { missions: updated, totals } : { missions, totals: null };
}

/** Entrega os totais ao jogador: XP (com level up, que já dá pontos de
 * habilidade), +atributos, +pontos de habilidade da missão e coins. */
export function applyRewards(player: Player, totals: RewardTotals): XpGainResult {
  const gained = applyXpGain(player, totals.xp);

  const attributes = { ...gained.player.attributes };
  for (const key of Object.keys(attributes) as AttributeKey[]) {
    attributes[key] += totals.attributes[key];
  }

  return {
    ...gained,
    player: {
      ...gained.player,
      attributes,
      abilityPoints: gained.player.abilityPoints + totals.abilityPoints,
      coins: gained.player.coins + totals.coins,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Reset diário: as missões da categoria "diaria" voltam a pendente, com
 * progresso zerado e recompensa liberada de novo. Principais e secundárias
 * não resetam. Contagem de texto não tem progresso, então só o status muda.
 */
export function resetDailyMissions(missions: DailyMission[]): DailyMission[] {
  return missions.map((mission) => {
    if (mission.category !== 'diaria') return mission;

    const count = { ...mission.count };
    if (count.method === 'check') count.checked = false;
    if (count.method === 'numeric' || count.method === 'distance') count.progress = 0;

    return { ...mission, completed: false, rewardClaimed: false, count };
  });
}

/**
 * Avança o início do ciclo de 24h. Se passou pelo menos um ciclo inteiro,
 * devolve o novo início (sempre múltiplo de 24h a partir do original, então
 * o horário do reset não "escorrega" por causa de quando o app foi aberto).
 * Ficar vários dias sem abrir conta como um único reset.
 */
export function advanceCycle(
  cycleStart: number,
  now: number,
  cycleMs: number
): { cycleStart: number; due: boolean } {
  if (now < cycleStart) return { cycleStart: now, due: false }; // relógio mudou pra trás
  const elapsedCycles = Math.floor((now - cycleStart) / cycleMs);
  if (elapsedCycles < 1) return { cycleStart, due: false };
  return { cycleStart: cycleStart + elapsedCycles * cycleMs, due: true };
}

import type { Attributes, AttributeKey, Mission, MissionRank, Player } from '@/types/game';

/** Nome de exibição de cada atributo, pra usar direto na UI (Fase 3). */
export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: 'Força',
  agility: 'Agilidade',
  intelligence: 'Inteligência',
  vitality: 'Vitalidade',
  perception: 'Percepção',
};

/** XP base concedido por rank de missão. Ranks maiores dão mais XP. */
export const RANK_BASE_XP: Record<MissionRank, number> = {
  E: 10,
  D: 20,
  C: 35,
  B: 55,
  A: 80,
  S: 120,
};

/** XP necessário pra sair do nível 1 pro 2. As curvas de XP em RPG sempre
 * crescem a partir disso — ver `calculateXpToNextLevel` em utils/leveling. */
export const BASE_XP_TO_LEVEL_2 = 100;

export function createDefaultAttributes(): Attributes {
  return {
    strength: 1,
    agility: 1,
    intelligence: 1,
    vitality: 1,
    perception: 1,
  };
}

export function createDefaultPlayer(name = 'Caçador'): Player {
  const now = new Date().toISOString();
  return {
    name,
    level: 1,
    currentXP: 0,
    xpToNextLevel: BASE_XP_TO_LEVEL_2,
    attributes: createDefaultAttributes(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Missões diárias iniciais, no espírito das quests que o Sistema costuma
 * dar num personagem recém-desperto: bem básicas, cobrindo os 5 atributos.
 * O jogador pode editar/adicionar as dele depois — isso é só o ponto de
 * partida pra não abrir o app com uma lista vazia.
 */
export function createDefaultMissions(): Mission[] {
  const base: Array<Pick<Mission, 'title' | 'category' | 'rank'>> = [
    { title: '50 flexões', category: 'strength', rank: 'D' },
    { title: 'Corrida de 3km', category: 'agility', rank: 'D' },
    { title: 'Ler 20 páginas', category: 'intelligence', rank: 'E' },
    { title: 'Beber 8 copos de água', category: 'vitality', rank: 'E' },
    { title: '10 min de meditação', category: 'perception', rank: 'E' },
  ];

  return base.map((mission, index) => ({
    id: `default-${index}`,
    title: mission.title,
    category: mission.category,
    rank: mission.rank,
    isDaily: true,
    completed: false,
    completedAt: null,
  }));
}

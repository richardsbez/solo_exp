import type { Attributes, AttributeKey, Mission, MissionRank, Player } from '@/types/game';

/** Nome de exibição de cada atributo, pra usar direto na UI (Fase 3). */
export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: 'Força',
  agility: 'Agilidade',
  intelligence: 'Inteligência',
  vitality: 'Vitalidade',
  perception: 'Percepção',
};

/** Sigla de 3 letras usada na janela de status (estilo anime). Separada do
 * label completo porque a grade do HUD não tem largura pra "Inteligência". */
export const ATTRIBUTE_SHORT_LABELS: Record<AttributeKey, string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  intelligence: 'INT',
  perception: 'PER',
};

/** Ordem em que os atributos aparecem na grade 2x3 do HUD. */
export const ATTRIBUTE_DISPLAY_ORDER: AttributeKey[] = [
  'strength',
  'vitality',
  'agility',
  'intelligence',
  'perception',
];

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

/** Pontos livres concedidos a cada level up. */
export const POINTS_PER_LEVEL = 3;

/** Título inicial de todo jogador recém-desperto. */
export const DEFAULT_TITLE = 'Novato';

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
    title: DEFAULT_TITLE,
    level: 1,
    currentXP: 0,
    xpToNextLevel: BASE_XP_TO_LEVEL_2,
    attributes: createDefaultAttributes(),
    abilityPoints: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Completa um save antigo com os campos que passaram a existir depois.
 *
 * Isso importa porque o save vive no IndexedDB do iPhone, não num banco
 * que a gente possa migrar por fora: se o app ler um JSON salvo na versão
 * anterior e tentar renderizar `player.title`, vem `undefined` na tela.
 * Toda leitura passa por aqui (ver services/storage.ts).
 */
export function normalizePlayer(stored: Partial<Player> | null | undefined): Player {
  const fallback = createDefaultPlayer();
  if (!stored) return fallback;

  return {
    ...fallback,
    ...stored,
    title: stored.title ?? fallback.title,
    abilityPoints: stored.abilityPoints ?? 0,
    attributes: {
      ...fallback.attributes,
      ...(stored.attributes ?? {}),
    },
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

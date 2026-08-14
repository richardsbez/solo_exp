// Tipos centrais do "motor" do sistema. Tudo que envolve o estado do
// jogador e das missões passa por essas definições.

/**
 * As cinco stats no estilo Solo Leveling. Cada missão concluída injeta
 * XP no atributo correspondente, além do XP geral do jogador.
 */
export type AttributeKey =
  | 'strength' // Força
  | 'agility' // Agilidade
  | 'intelligence' // Inteligência
  | 'vitality' // Vitalidade
  | 'perception'; // Percepção

export type Attributes = Record<AttributeKey, number>;

/**
 * Rank da missão, também no estilo Solo Leveling (E é a mais fácil, S a
 * mais difícil). Usado só para calcular o multiplicador de XP e, mais pra
 * frente, pra estilizar visualmente o card da missão.
 */
export type MissionRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  category: AttributeKey;
  rank: MissionRank;
  /** Missão diária reseta todo dia; caso contrário é uma missão única. */
  isDaily: boolean;
  completed: boolean;
  /** ISO date string de quando foi concluída pela última vez. */
  completedAt: string | null;
}

export interface Player {
  name: string;
  level: number;
  /** XP acumulado dentro do nível atual (não é o XP total desde o início). */
  currentXP: number;
  /** Quanto XP falta pra bater o próximo nível, a partir do currentXP. */
  xpToNextLevel: number;
  attributes: Attributes;
  createdAt: string;
  updatedAt: string;
}

/** Resultado de aplicar um ganho de XP — usado pra disparar a animação de
 * "Level Up!" na UI sem a tela precisar conhecer a fórmula de XP. */
export interface XpGainResult {
  player: Player;
  leveledUp: boolean;
  levelsGained: number;
}

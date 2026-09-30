import type { AttributeKey } from '@/types/game';

// ---------------------------------------------------------------------------
// Modelo de dados do fluxo de criação/edição de Missão Diária (telas de
// mission-editor-sheet, mission-count-method-sheet e mission-connect-sheet).
//
// De propósito, é um tipo separado do `Mission` antigo (usePlayer/
// storage/constants/game.ts) — esse aqui é mais rico (categoria PRINCIPAL/
// SECUNDARIA/DIARIA, XP por atributo individual em vez de só "+1 num
// atributo", coins, vínculo entre missões). A ideia é validar esse modelo
// na tela primeiro e só depois migrar o save de verdade pra ele.
// ---------------------------------------------------------------------------

export type MissionCategory = 'principal' | 'secundaria' | 'diaria';

export type CountMethod = 'numeric' | 'text' | 'check' | 'distance';

export interface CountConfig {
  method: CountMethod;
  /** Meta numérica (método "numeric") ou em km (método "distance"). */
  target?: number;
  /** Progresso atual, na mesma unidade de `target`. */
  progress?: number;
  /** Texto livre do método "text" (ex: "gastar -20R"). */
  text?: string;
  /** Estado do método "check" — missão de tudo-ou-nada, sem contador. */
  checked?: boolean;
}

export type AttributeAllocation = Record<AttributeKey, number>;

export interface MissionRewards {
  coins: number;
  xp: number;
}

export interface DailyMission {
  /** Vazio ("") num rascunho novo ainda não confirmado. */
  id: string;
  title: string;
  category: MissionCategory;
  attributes: AttributeAllocation;
  /** Pontos de habilidade livres (os que aparecem em "Available Ability
   * Points" na tela de Status) concedidos ao concluir esta missão. */
  abilityPoints: number;
  rewards: MissionRewards;
  count: CountConfig;
  /** Ids de outras missões que compartilham o mesmo progresso desta —
   * concluir uma conclui (ou reseta) todas as vinculadas junto. */
  linkedMissionIds: string[];
  completed: boolean;
}

export function createEmptyAttributes(): AttributeAllocation {
  return { strength: 0, agility: 0, intelligence: 0, vitality: 0, perception: 0 };
}

export function createDraftMission(): DailyMission {
  return {
    id: '',
    title: '',
    category: 'diaria',
    attributes: createEmptyAttributes(),
    abilityPoints: 0,
    rewards: { coins: 0, xp: 0 },
    count: { method: 'check', checked: false },
    linkedMissionIds: [],
    completed: false,
  };
}

export function createMissionId(): string {
  return `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Métodos que têm meta + progresso numéricos (os que ganham +/-). */
export function isCounter(count: CountConfig): boolean {
  return count.method === 'numeric' || count.method === 'distance';
}

/** Passo do +/- da META no editor. */
export function getTargetStep(method: CountMethod): number {
  return method === 'distance' ? 1 : 5;
}

/** Passo do +/- do PROGRESSO na lista — cresce com a meta pra não
 * precisar de 100 toques em "100 sit-ups". */
export function getProgressStep(count: CountConfig): number {
  if (count.method === 'distance') return 1;
  const target = count.target ?? 0;
  if (target >= 100) return 10;
  if (target >= 20) return 5;
  return 1;
}

/** Ids que compartilham progresso com `mission`: ela mesma, as que ela
 * aponta e as que apontam pra ela. */
export function getLinkedGroup(missions: DailyMission[], mission: DailyMission): Set<string> {
  const group = new Set<string>([mission.id, ...mission.linkedMissionIds]);
  for (const m of missions) {
    if (m.linkedMissionIds.includes(mission.id)) group.add(m.id);
  }
  return group;
}

/** Formata o valor entre colchetes mostrado na lista e nos submenus —
 * "[0/100]", "[gastar -20R]", "[0/10km]"... */
export function formatCountConfig(count: CountConfig): string {
  switch (count.method) {
    case 'numeric':
      return `${count.progress ?? 0}/${count.target ?? 0}`;
    case 'distance':
      return `${count.progress ?? 0}/${count.target ?? 0}km`;
    case 'text':
      return count.text?.trim() || '';
    case 'check':
      return '';
    default:
      return '';
  }
}

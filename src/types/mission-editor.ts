import type { AttributeKey } from '@/types/game';

// ---------------------------------------------------------------------------
// Modelo de dados do fluxo de criação/edição de Missão Diária (telas de
// mission-editor-sheet, mission-count-method-sheet e mission-connect-sheet).
//
// De propósito, é um tipo separado do `Mission` antigo (usePlayer/
// storage/constants/game.ts) — esse aqui é mais rico (categoria PRINCIPAL/
// SECUNDARIA/DIARIA, XP por atributo individual em vez de só "+1 num
// atributo", coins, vínculo entre missões). Ele é persistido em uma chave
// própria do storage (`@solo:daily-missions`, ver services/storage.ts),
// separada do save antigo, até o Status migrar pra ele.
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

// ---------------------------------------------------------------------------
// Persistência: valores padrão e validação do que vem do disco.
// ---------------------------------------------------------------------------

/** Missões de exemplo da primeira abertura do app (quando ainda não existe
 * nada salvo). É função, e não constante, pra cada chamada devolver
 * objetos novos — nada compartilhado por referência entre chamadas. */
export function createDefaultDailyMissions(): DailyMission[] {
  const attrs = (partial: Partial<AttributeAllocation>): AttributeAllocation => ({
    ...createEmptyAttributes(),
    ...partial,
  });

  return [
    {
      id: 'seed-situps',
      title: 'Sit-ups',
      category: 'diaria',
      attributes: attrs({ strength: 1 }),
      abilityPoints: 0,
      rewards: { coins: 5, xp: 20 },
      count: { method: 'numeric', target: 100, progress: 0 },
      linkedMissionIds: [],
      completed: false,
    },
    {
      id: 'seed-squats',
      title: 'Squats',
      category: 'diaria',
      attributes: attrs({ strength: 1 }),
      abilityPoints: 0,
      rewards: { coins: 5, xp: 20 },
      count: { method: 'check', checked: true },
      linkedMissionIds: [],
      completed: true,
    },
    {
      id: 'seed-run',
      title: 'Run',
      category: 'diaria',
      attributes: attrs({ agility: 1 }),
      abilityPoints: 0,
      rewards: { coins: 10, xp: 40 },
      count: { method: 'distance', target: 10, progress: 0 },
      linkedMissionIds: [],
      completed: false,
    },
    {
      id: 'seed-compras',
      title: 'Compras',
      category: 'diaria',
      attributes: attrs({ intelligence: 1 }),
      abilityPoints: 0,
      rewards: { coins: 0, xp: 10 },
      count: { method: 'text', text: 'gastar -20R' },
      linkedMissionIds: [],
      completed: false,
    },
  ];
}

const CATEGORIES: MissionCategory[] = ['principal', 'secundaria', 'diaria'];
const COUNT_METHODS: CountMethod[] = ['numeric', 'text', 'check', 'distance'];

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Valida UMA missão lida do disco, preenchendo campos que faltem (saves
 * de versões antigas). Devolve null se não der pra aproveitar. */
export function normalizeDailyMission(raw: unknown): DailyMission | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, any>;
  if (typeof m.id !== 'string' || m.id === '' || typeof m.title !== 'string') return null;

  const attributes = createEmptyAttributes();
  for (const key of Object.keys(attributes) as AttributeKey[]) {
    attributes[key] = finiteNumber(m.attributes?.[key]);
  }

  const rawCount = (m.count ?? {}) as Record<string, unknown>;
  const method: CountMethod = COUNT_METHODS.includes(rawCount.method as CountMethod)
    ? (rawCount.method as CountMethod)
    : 'check';
  const count: CountConfig = { method };
  if (typeof rawCount.target === 'number') count.target = finiteNumber(rawCount.target);
  if (typeof rawCount.progress === 'number') count.progress = finiteNumber(rawCount.progress);
  if (typeof rawCount.text === 'string') count.text = rawCount.text;
  if (typeof rawCount.checked === 'boolean') count.checked = rawCount.checked;

  return {
    id: m.id,
    title: m.title,
    category: CATEGORIES.includes(m.category) ? m.category : 'diaria',
    attributes,
    abilityPoints: finiteNumber(m.abilityPoints),
    rewards: {
      coins: finiteNumber(m.rewards?.coins),
      xp: finiteNumber(m.rewards?.xp),
    },
    count,
    linkedMissionIds: Array.isArray(m.linkedMissionIds)
      ? m.linkedMissionIds.filter((id: unknown): id is string => typeof id === 'string')
      : [],
    completed: m.completed === true,
  };
}

/** Valida a lista inteira lida do disco. Devolve null se não for uma lista
 * (nada salvo ou dado corrompido). Uma lista vazia `[]` é válida — é o caso
 * de quem apagou todas as missões, e NÃO deve voltar a mostrar os exemplos.
 * Também remove vínculos que apontam pra missões que não existem mais. */
export function normalizeDailyMissions(raw: unknown): DailyMission[] | null {
  if (!Array.isArray(raw)) return null;

  const missions = raw
    .map(normalizeDailyMission)
    .filter((mission): mission is DailyMission => mission !== null);

  const ids = new Set(missions.map((mission) => mission.id));
  return missions.map((mission) => ({
    ...mission,
    linkedMissionIds: mission.linkedMissionIds.filter((id) => ids.has(id)),
  }));
}

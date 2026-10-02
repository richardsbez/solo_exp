import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultMissions, normalizePlayer } from '@/constants/game';
import type { Mission, Player } from '@/types/game';
import {
  createDefaultDailyMissions,
  normalizeDailyMissions,
  type DailyMission,
} from '@/types/mission-editor';

// No web, o AsyncStorage 3.x usa IndexedDB por baixo dos panos (não mais
// localStorage), então não temos o limite de ~5MB nem operações
// síncronas travando a thread principal.
const KEYS = {
  player: '@solo:player',
  missions: '@solo:missions',
  /** Missões do modelo novo (`DailyMission`), usadas pela tela de Missões.
   * Chave separada de `missions` porque o formato é outro. */
  dailyMissions: '@solo:daily-missions',
  /** Timestamp (ms) do início do ciclo atual de 24h das missões diárias. */
  dailyCycleStart: '@solo:daily-cycle-start',
} as const;

async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.error(`[storage] Falha ao ler "${key}"`, error);
    return null;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[storage] Falha ao salvar "${key}"`, error);
    return false;
  }
}

// Fila de escrita por chave: cada ação do usuário salva logo em seguida, e
// duas gravações assíncronas disparadas em sequência podem terminar fora de
// ordem — aí o estado ANTIGO sobrescreveria o novo. Encadeando, a última
// chamada é sempre a última a ser gravada. `writeJSON` nunca rejeita, então
// a fila não quebra no meio.
const writeQueues = new Map<string, Promise<unknown>>();

function queuedWrite<T>(key: string, value: T): Promise<boolean> {
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const task = previous.then(() => writeJSON(key, value));
  writeQueues.set(key, task);
  return task;
}

/**
 * Sempre passa o que veio do disco por `normalizePlayer`: saves gravados
 * por versões anteriores do app não têm `title`/`abilityPoints`, e a UI
 * renderizaria `undefined` sem isso.
 */
export async function loadPlayer(): Promise<Player> {
  const stored = await readJSON<Partial<Player>>(KEYS.player);
  return normalizePlayer(stored);
}

export async function savePlayer(player: Player): Promise<boolean> {
  return queuedWrite(KEYS.player, player);
}

export async function loadMissions(): Promise<Mission[]> {
  const stored = await readJSON<Mission[]>(KEYS.missions);
  return stored ?? createDefaultMissions();
}

export async function saveMissions(missions: Mission[]): Promise<boolean> {
  return writeJSON(KEYS.missions, missions);
}

/**
 * Lê as missões da tela de Missões. Devolve null quando não há nada salvo
 * (primeira abertura) ou o dado está corrompido — quem chama decide usar os
 * exemplos. Uma lista vazia salva é devolvida como `[]`, não como null.
 */
export async function loadDailyMissions(): Promise<DailyMission[] | null> {
  const stored = await readJSON<unknown>(KEYS.dailyMissions);
  return normalizeDailyMissions(stored);
}

export function saveDailyMissions(missions: DailyMission[]): Promise<boolean> {
  return queuedWrite(KEYS.dailyMissions, missions);
}

/** Início do ciclo de 24h das missões diárias, ou null se ainda não existe. */
export async function loadDailyCycleStart(): Promise<number | null> {
  const stored = await readJSON<unknown>(KEYS.dailyCycleStart);
  return typeof stored === 'number' && Number.isFinite(stored) ? stored : null;
}

export function saveDailyCycleStart(timestamp: number): Promise<boolean> {
  return queuedWrite(KEYS.dailyCycleStart, timestamp);
}

/** Apaga o save inteiro. Usado no botão de "recomeçar do zero". */
export async function clearSave(): Promise<void> {
  await AsyncStorage.removeMany([
    KEYS.player,
    KEYS.missions,
    KEYS.dailyMissions,
    KEYS.dailyCycleStart,
  ]);
}

/**
 * Exporta o save inteiro como uma string JSON — a rede de segurança que
 * um app sem nuvem precisa ter. Sem isso, um "Limpar dados do Safari" ou
 * uma troca de iPhone apaga o progresso sem chance de recuperar.
 */
export async function exportSave(): Promise<string> {
  const [player, missions, storedDaily] = await Promise.all([
    loadPlayer(),
    loadMissions(),
    loadDailyMissions(),
  ]);
  const dailyMissions = storedDaily ?? createDefaultDailyMissions();
  return JSON.stringify(
    { player, missions, dailyMissions, exportedAt: new Date().toISOString() },
    null,
    2
  );
}

/**
 * Importa um backup gerado por `exportSave`. Retorna false (sem
 * sobrescrever o save atual) se o JSON estiver corrompido ou faltando
 * algum campo esperado.
 */
export async function importSave(json: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(json) as {
      player?: Partial<Player>;
      missions?: Mission[];
      dailyMissions?: unknown;
    };
    if (!parsed.player || !parsed.missions) return false;

    // `dailyMissions` não existe em backups antigos — nesse caso o save
    // atual das missões diárias é mantido. Se existir mas estiver
    // inválido, recusa tudo antes de gravar qualquer coisa.
    let dailyMissions: DailyMission[] | null = null;
    if (parsed.dailyMissions !== undefined) {
      dailyMissions = normalizeDailyMissions(parsed.dailyMissions);
      if (!dailyMissions) return false;
    }

    await Promise.all([
      savePlayer(normalizePlayer(parsed.player)),
      saveMissions(parsed.missions),
      dailyMissions ? saveDailyMissions(dailyMissions) : Promise.resolve(true),
    ]);
    return true;
  } catch (error) {
    console.error('[storage] Falha ao importar backup', error);
    return false;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultMissions, createDefaultPlayer } from '@/constants/game';
import type { Mission, Player } from '@/types/game';

// No web, o AsyncStorage 3.x usa IndexedDB por baixo dos panos (não mais
// localStorage), então não temos o limite de ~5MB nem operações
// síncronas travando a thread principal.
const KEYS = {
  player: '@solo:player',
  missions: '@solo:missions',
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

export async function loadPlayer(): Promise<Player> {
  const stored = await readJSON<Player>(KEYS.player);
  return stored ?? createDefaultPlayer();
}

export async function savePlayer(player: Player): Promise<boolean> {
  return writeJSON(KEYS.player, player);
}

export async function loadMissions(): Promise<Mission[]> {
  const stored = await readJSON<Mission[]>(KEYS.missions);
  return stored ?? createDefaultMissions();
}

export async function saveMissions(missions: Mission[]): Promise<boolean> {
  return writeJSON(KEYS.missions, missions);
}

/** Apaga o save inteiro. Usado no botão de "recomeçar do zero". */
export async function clearSave(): Promise<void> {
  await AsyncStorage.removeMany([KEYS.player, KEYS.missions]);
}

/**
 * Exporta o save inteiro como uma string JSON — a rede de segurança que
 * um app sem nuvem precisa ter. Sem isso, um "Limpar dados do Safari" ou
 * uma troca de iPhone apaga o progresso sem chance de recuperar.
 */
export async function exportSave(): Promise<string> {
  const [player, missions] = await Promise.all([loadPlayer(), loadMissions()]);
  return JSON.stringify({ player, missions, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Importa um backup gerado por `exportSave`. Retorna false (sem
 * sobrescrever o save atual) se o JSON estiver corrompido ou faltando
 * algum campo esperado.
 */
export async function importSave(json: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(json) as { player?: Player; missions?: Mission[] };
    if (!parsed.player || !parsed.missions) return false;
    await Promise.all([savePlayer(parsed.player), saveMissions(parsed.missions)]);
    return true;
  } catch (error) {
    console.error('[storage] Falha ao importar backup', error);
    return false;
  }
}

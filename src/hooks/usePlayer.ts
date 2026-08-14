import { useCallback, useEffect, useState } from 'react';

import { RANK_BASE_XP } from '@/constants/game';
import * as storage from '@/services/storage';
import type { Mission, Player, XpGainResult } from '@/types/game';
import { applyXpGain, calculateXpPercentage } from '@/utils/leveling';

interface UsePlayerResult {
  player: Player | null;
  missions: Mission[];
  /** true só durante o load inicial do save — use pra mostrar um splash/spinner. */
  loading: boolean;
  /** 0–100, já pronto pra virar largura de uma barra de progresso. */
  xpPercentage: number;
  /** Marca a missão como concluída, aplica XP + atributo, e persiste tudo.
   * Retorna o resultado do ganho de XP (útil pra disparar a animação de
   * "Level Up!" na UI) ou null se a missão não existir ou já tiver sido
   * concluída. */
  completeMission: (missionId: string) => Promise<XpGainResult | null>;
  /** Desmarca todas as missões diárias — chame isso uma vez por dia
   * (ex: ao abrir o app, comparando a data salva com a de hoje). */
  resetDailyMissions: () => Promise<void>;
  /** Apaga o save e recomeça do zero. */
  resetProgress: () => Promise<void>;
}

export function usePlayer(): UsePlayerResult {
  const [player, setPlayer] = useState<Player | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [loadedPlayer, loadedMissions] = await Promise.all([
        storage.loadPlayer(),
        storage.loadMissions(),
      ]);
      if (!mounted) return;
      setPlayer(loadedPlayer);
      setMissions(loadedMissions);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const completeMission = useCallback(
    async (missionId: string): Promise<XpGainResult | null> => {
      if (!player) return null;

      const mission = missions.find((m) => m.id === missionId);
      if (!mission || mission.completed) return null;

      const xpAmount = RANK_BASE_XP[mission.rank];
      const gainResult = applyXpGain(player, xpAmount);

      // Clona `attributes` explicitamente em vez de mutar — applyXpGain
      // reaproveita a referência do objeto attributes original, então sem
      // isso a gente acabaria mexendo no estado antigo por engano.
      const updatedPlayer: Player = {
        ...gainResult.player,
        attributes: {
          ...gainResult.player.attributes,
          [mission.category]: gainResult.player.attributes[mission.category] + 1,
        },
      };

      const updatedMissions = missions.map((m) =>
        m.id === missionId ? { ...m, completed: true, completedAt: new Date().toISOString() } : m
      );

      setPlayer(updatedPlayer);
      setMissions(updatedMissions);

      await Promise.all([
        storage.savePlayer(updatedPlayer),
        storage.saveMissions(updatedMissions),
      ]);

      return { ...gainResult, player: updatedPlayer };
    },
    [player, missions]
  );

  const resetDailyMissions = useCallback(async () => {
    const resetMissions = missions.map((m) =>
      m.isDaily ? { ...m, completed: false, completedAt: null } : m
    );
    setMissions(resetMissions);
    await storage.saveMissions(resetMissions);
  }, [missions]);

  const resetProgress = useCallback(async () => {
    await storage.clearSave();
    const [freshPlayer, freshMissions] = await Promise.all([
      storage.loadPlayer(),
      storage.loadMissions(),
    ]);
    setPlayer(freshPlayer);
    setMissions(freshMissions);
  }, []);

  return {
    player,
    missions,
    loading,
    xpPercentage: player ? calculateXpPercentage(player) : 0,
    completeMission,
    resetDailyMissions,
    resetProgress,
  };
}

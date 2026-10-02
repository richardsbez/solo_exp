import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { AppState } from 'react-native';

import { DAILY_RESET_MS } from '@/constants/game';
import * as storage from '@/services/storage';
import type { Player } from '@/types/game';
import { createDefaultDailyMissions, type DailyMission } from '@/types/mission-editor';
import { calculateXpPercentage } from '@/utils/leveling';
import {
  advanceCycle,
  applyRewards,
  claimRewards,
  resetDailyMissions,
} from '@/utils/mission-rewards';

// ---------------------------------------------------------------------------
// Estado único do jogo: jogador + missões.
//
// Antes, o Status (usePlayer) e a tela de Missões tinham cada um o seu
// estado, então concluir uma missão não aparecia no Status. Agora as duas
// telas leem daqui (as 5 abas ficam montadas ao mesmo tempo no pager, então
// precisam compartilhar o MESMO estado).
//
// Regras que moram aqui:
// - Toda alteração nas missões passa por `updateDailyMissions`, que entrega
//   ao jogador as recompensas de qualquer missão que acabou de ser concluída.
// - A cada 24h as missões "diaria" são resetadas (ver DAILY_RESET_MS).
// - Tudo é salvo no storage a cada mudança. Nada é gravado antes de a
//   leitura inicial terminar, senão o estado vazio sobrescreveria o save.
// ---------------------------------------------------------------------------

interface GameContextValue {
  player: Player | null;
  dailyMissions: DailyMission[];
  /** false só durante a leitura inicial do disco. */
  ready: boolean;
  /** 0–100, pronto pra largura da barra de XP. */
  xpPercentage: number;
  /** Mesma assinatura de um `setState` (valor ou função). Salva e paga as
   * recompensas das missões recém-concluídas. */
  updateDailyMissions: (update: SetStateAction<DailyMission[]>) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [ready, setReady] = useState(false);

  // Espelhos síncronos do estado: toques rápidos (ex: +/- em sequência)
  // chegam antes do React re-renderizar, e cada ação precisa partir do
  // valor mais recente, não do que estava na tela no render anterior.
  const playerRef = useRef<Player | null>(null);
  const missionsRef = useRef<DailyMission[]>([]);
  const cycleStartRef = useRef(0);
  const readyRef = useRef(false);

  const commitPlayer = useCallback((next: Player) => {
    playerRef.current = next;
    setPlayer(next);
    void storage.savePlayer(next);
  }, []);

  const commitMissions = useCallback((next: DailyMission[]) => {
    missionsRef.current = next;
    setDailyMissions(next);
    void storage.saveDailyMissions(next);
  }, []);

  // Leitura inicial do disco.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const [loadedPlayer, storedMissions, storedCycle] = await Promise.all([
        storage.loadPlayer(),
        storage.loadDailyMissions(),
        storage.loadDailyCycleStart(),
      ]);
      if (!mounted) return;

      const missions = storedMissions ?? createDefaultDailyMissions();
      const cycleStart = storedCycle ?? Date.now();
      if (storedCycle === null) void storage.saveDailyCycleStart(cycleStart);

      playerRef.current = loadedPlayer;
      missionsRef.current = missions;
      cycleStartRef.current = cycleStart;
      readyRef.current = true;

      setPlayer(loadedPlayer);
      setDailyMissions(missions);
      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updateDailyMissions = useCallback(
    (update: SetStateAction<DailyMission[]>) => {
      if (!readyRef.current || !playerRef.current) return;

      const next = typeof update === 'function' ? update(missionsRef.current) : update;
      const claim = claimRewards(next);
      commitMissions(claim.missions);

      if (claim.totals) {
        commitPlayer(applyRewards(playerRef.current, claim.totals).player);
      }
    },
    [commitMissions, commitPlayer]
  );

  /** Se o ciclo de 24h acabou, reseta as diárias e começa o próximo. */
  const checkDailyReset = useCallback(() => {
    if (!readyRef.current) return;

    const cycle = advanceCycle(cycleStartRef.current, Date.now(), DAILY_RESET_MS);
    if (cycle.cycleStart !== cycleStartRef.current) {
      cycleStartRef.current = cycle.cycleStart;
      void storage.saveDailyCycleStart(cycle.cycleStart);
    }
    if (cycle.due) commitMissions(resetDailyMissions(missionsRef.current));
  }, [commitMissions]);

  // Confere o reset ao abrir, enquanto o app fica aberto (timer até o fim
  // do ciclo) e ao voltar do segundo plano — timers não rodam com o app
  // suspenso, então só o timer não bastaria no celular.
  useEffect(() => {
    if (!ready) return;

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      const remaining = cycleStartRef.current + DAILY_RESET_MS - Date.now();
      timer = setTimeout(() => {
        checkDailyReset();
        schedule();
      }, Math.max(1000, remaining));
    };

    checkDailyReset();
    schedule();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      checkDailyReset();
      schedule();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [ready, checkDailyReset]);

  const value = useMemo<GameContextValue>(
    () => ({
      player,
      dailyMissions,
      ready,
      xpPercentage: player ? calculateXpPercentage(player) : 0,
      updateDailyMissions,
    }),
    [player, dailyMissions, ready, updateDailyMissions]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame precisa estar dentro de <GameProvider>.');
  return context;
}

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import * as storage from '@/services/storage';
import { createDefaultDailyMissions, type DailyMission } from '@/types/mission-editor';

interface UseDailyMissionsResult {
  missions: DailyMission[];
  /** Mesma assinatura do `setState` do React (aceita valor ou função).
   * Toda mudança é salva automaticamente. */
  setMissions: Dispatch<SetStateAction<DailyMission[]>>;
  /** false só durante a leitura inicial do disco. */
  loaded: boolean;
}

/**
 * Lista de missões da tela de Missões, persistida no storage do aparelho.
 *
 * - Ao montar, lê o que está salvo. Se não houver nada (primeira abertura),
 *   usa as missões de exemplo.
 * - Depois disso, qualquer alteração em `missions` é gravada sozinha — a
 *   tela continua usando `setMissions` como se fosse um `useState`.
 * - Nada é gravado antes da leitura terminar, senão o estado vazio inicial
 *   sobrescreveria o save de verdade.
 */
export function useDailyMissions(): UseDailyMissionsResult {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loaded, setLoaded] = useState(false);
  // O array que acabou de vir do disco — não precisa ser regravado.
  const hydratedRef = useRef<DailyMission[] | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const stored = await storage.loadDailyMissions();
      if (!mounted) return;
      const initial = stored ?? createDefaultDailyMissions();
      hydratedRef.current = initial;
      setMissions(initial);
      setLoaded(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || missions === hydratedRef.current) return;
    void storage.saveDailyMissions(missions);
  }, [missions, loaded]);

  return { missions, setMissions, loaded };
}

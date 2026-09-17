import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HudBottomNav } from '@/components/hud-bottom-nav';
import { HudSwipePager } from '@/components/hud-swipe-pager';
import { Hud } from '@/constants/hud';
import { TABS } from '@/constants/tabs';
import { MenuScreen } from '@/screens/menu-screen';
import { MissionsScreen } from '@/screens/missions-screen';
import { NotificationsScreen } from '@/screens/notifications-screen';
import { QuestsScreen } from '@/screens/quests-screen';
import { StatusScreen } from '@/screens/status-screen';

// ---------------------------------------------------------------------------
// Shell único que hospeda as 5 abas do Sistema (Status, Missões, Quests,
// Notifications, Menu).
//
// Antes cada aba era uma rota separada do expo-router, trocada com
// router.replace: funcional, mas são telas empilhadas de verdade — dá pra
// trocar, não dá pra "arrastar" visualmente de uma pra outra. Pra ter
// swipe com transição suave e a barra inferior sempre em sincronia com o
// que está na tela, as 5 abas viraram painéis de um único pager horizontal
// (HudSwipePager) dentro desta única rota "/". A lógica do gesto em si
// mora lá; aqui é só a lista de painéis + o estado de qual está ativo.
// ---------------------------------------------------------------------------

const SCREENS = [StatusScreen, MissionsScreen, QuestsScreen, NotificationsScreen, MenuScreen];

export default function TabsShell() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.pagerArea}>
          <HudSwipePager index={activeIndex} onIndexChange={setActiveIndex}>
            {SCREENS.map((Screen, i) => (
              <Screen key={TABS[i].key} />
            ))}
          </HudSwipePager>
        </View>

        <HudBottomNav activeIndex={activeIndex} onSelect={setActiveIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Hud.background,
  },
  container: {
    flex: 1,
  },
  pagerArea: {
    flex: 1,
    // Essencial: o pager por dentro é largo o bastante pra caber as 5
    // abas lado a lado. Sem isso, os painéis fora da tela vazariam
    // visualmente por cima do resto do app.
    overflow: 'hidden',
  },
});

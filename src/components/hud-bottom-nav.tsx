import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hud } from '@/constants/hud';
import { TABS } from '@/constants/tabs';

// ---------------------------------------------------------------------------
// Barra inferior compartilhada por todas as abas do Sistema.
//
// Não navega mais por rota (router.replace) — agora é só um índice
// (0 a 4) controlado pelo shell em app/index.tsx, o mesmo índice que o
// HudSwipePager usa. Tocar num ícone e arrastar a tela terminam no mesmo
// lugar: `onSelect(index)`.
// ---------------------------------------------------------------------------

interface HudBottomNavProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function HudBottomNav({ activeIndex, onSelect }: HudBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 14 }]}>
      {TABS.map((tab, index) => {
        const isActive = index === activeIndex;

        return (
          <Pressable
            key={tab.key}
            disabled={isActive}
            onPress={() => onSelect(index)}
            hitSlop={10}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
            <Feather
              name={tab.icon}
              size={22}
              color={isActive ? Hud.textPrimary : Hud.textLabel}
              style={[tab.rotated && styles.diamondIcon, isActive && styles.activeIconGlow]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  navButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  navButtonPressed: {
    opacity: 0.55,
  },
  diamondIcon: {
    transform: [{ rotate: '45deg' }],
  },
  activeIconGlow: {
    textShadowColor: Hud.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});

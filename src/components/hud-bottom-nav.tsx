import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hud } from '@/constants/hud';

// ---------------------------------------------------------------------------
// Barra inferior compartilhada por todas as telas do Sistema.
//
// - O losango é o Status (home) e o checkbox são as Missões Diárias.
// - Todos os 5 ícones navegam de verdade (router.replace, pra não empilhar
//   histórico — trocar de aba não deveria acumular "voltar, voltar,
//   voltar" no Safari).
// - A aba correspondente à rota atual acende com o glow neon.
// - O último ícone (3 linhas centralizadas) veio do último design do
//   Figma, no lugar do "align-left" antigo. A rota /log é só um
//   placeholder até a tela final ser desenhada.
// ---------------------------------------------------------------------------

type NavItem = {
  icon: keyof typeof Feather.glyphMap;
  route: string;
  rotated?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'square', route: '/', rotated: true }, // losango = STATUS
  { icon: 'check-square', route: '/missions' },
  { icon: 'calendar', route: '/calendar' },
  { icon: 'message-circle', route: '/chat' },
  { icon: 'align-center', route: '/log' },
];

export function HudBottomNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 14 }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route;

        return (
          <Pressable
            key={item.route}
            disabled={isActive}
            onPress={() => router.replace(item.route as never)}
            hitSlop={10}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
            <Feather
              name={item.icon}
              size={22}
              color={isActive ? Hud.textPrimary : Hud.textLabel}
              style={[item.rotated && styles.diamondIcon, isActive && styles.activeIconGlow]}
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

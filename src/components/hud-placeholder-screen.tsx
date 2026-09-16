import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HudBottomNav } from '@/components/hud-bottom-nav';
import { Hud } from '@/constants/hud';

/**
 * Casca comum pras abas que ainda não têm design/conteúdo definitivo.
 * Mantém o fundo, a barra inferior e o espaçamento seguro do iPhone
 * consistentes com as outras telas, pra trocar de aba não parecer sair
 * do app. Cada tela troca só o `title`.
 */
export function HudPlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Em construção</Text>
        </View>

        <HudBottomNav />
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 6,
  },
  subtitle: {
    color: Hud.textMuted,
    fontSize: 12,
  },
});

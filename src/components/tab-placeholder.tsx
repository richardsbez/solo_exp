import { StyleSheet, Text, View } from 'react-native';

import { Hud } from '@/constants/hud';

/**
 * Conteúdo comum pras abas que ainda não têm design definitivo (Quests,
 * Notifications, Menu). Sem fundo/StatusBar/barra própria — isso agora
 * vive uma única vez no shell (app/index.tsx), então cada painel é só o
 * miolo da tela.
 */
export function TabPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Em construção</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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

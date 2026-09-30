import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { Hud } from '@/constants/hud';

interface HudSheetProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
}

// `backdropFilter` não existe no tipo ViewStyle do React Native (só faz
// sentido na web) — react-native-web aceita a propriedade normalmente e
// já adiciona o prefixo -webkit- sozinho (essencial pro Safari do
// iPhone), mas o TypeScript não sabe disso. Isola isso num tipo só.
type GlassStyle = ViewStyle & { backdropFilter?: string };

const backdropGlass: GlassStyle = {
  backdropFilter: 'blur(22px) saturate(140%)',
};
const panelGlass: GlassStyle = {
  backdropFilter: 'blur(28px) saturate(160%)',
};

const ENTER_MS = 220;
const EXIT_MS = 150;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Painel centralizado com fundo em vidro fosco, usado pelos submenus de
 * missão.
 *
 * Por que não `animationType="fade"` do Modal: o fade do Modal é feito
 * pelo próprio RN (na web, um timeout + transição CSS em cima do portal),
 * e tem um atraso perceptível pra montar/desmontar — pior ainda quando
 * um Modal abre por cima de outro. Aqui o Modal fica sem animação
 * (`none`) e quem anima é o próprio painel, via `Animated`:
 *  - entrada: fade + sobe 14px + escala 0.96 → 1 (220ms, ease-out)
 *  - saída: o inverso, mais rápida (150ms, ease-in), e só depois disso o
 *    Modal é desmontado — então fechar nunca "pisca" nem corta a animação.
 */
export function HudSheet({ visible, onRequestClose, children }: HudSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const panelAnimation = {
    opacity: progress,
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.root}>
        {/* Fundo: só o fade. Tocar aqui fecha. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable
            style={[styles.backdrop, backdropGlass]}
            onPress={onRequestClose}
            accessibilityLabel="Fechar"
          />
        </Animated.View>

        {/* O painel é irmão do fundo (não filho), então tocar dentro dele
            nunca chega no fundo — não precisa mais do Pressable vazio. */}
        <Animated.View style={[styles.panelWrap, panelAnimation]}>
          <View style={[styles.panel, panelGlass]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    flex: 1,
    // O blur é que esconde o conteúdo de trás, não a cor.
    backgroundColor: 'rgba(4, 11, 24, 0.42)', // #040b18 com 42% de opacidade
  },
  panelWrap: {
    width: '100%',
    maxWidth: 340,
    // Teto de altura: em telas baixas o conteúdo (ScrollView do editor)
    // rola dentro do painel em vez de estourar a tela.
    maxHeight: '92%',
  },
  panel: {
    flexShrink: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Hud.panelBorderStrong,
    // Fio mais claro no topo — o "brilho pegando a borda" de vidro.
    borderTopColor: 'rgba(210, 225, 255, 0.55)',
    backgroundColor: 'rgba(4, 11, 24, 0.55)', // #040b18 com 55% de opacidade
    padding: 20,
  },
});

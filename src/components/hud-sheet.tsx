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
  /** Submenu aberto POR CIMA de outro painel (ex: método de contagem
   * sobre o editor). Usa só um escurecido leve, sem blur — o painel de
   * baixo continua legível e não há blur empilhado (que é o que mais
   * pesa no Safari). */
  nested?: boolean;
}

// `backdropFilter` não existe no tipo ViewStyle do React Native (só faz
// sentido na web) — react-native-web aceita normalmente e já adiciona o
// prefixo -webkit- (essencial pro Safari do iPhone).
type GlassStyle = ViewStyle & { backdropFilter?: string };

const backdropGlass: GlassStyle = {
  backdropFilter: 'blur(16px) saturate(140%)',
};

const ENTER_MS = 240;
const EXIT_MS = 140;
// Curva do iOS pra sheets: arranca rápido e assenta devagar — é o que dá
// a sensação de "sem atraso" mesmo com a animação durando 240ms.
const ENTER_EASING = Easing.bezier(0.32, 0.72, 0, 1);
// Saída só acelera (sem "freio" no fim) — some logo, não fica se arrastando.
const EXIT_EASING = Easing.bezier(0.4, 0, 1, 1);
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Painel centralizado com fundo em vidro fosco.
 *
 * O que elimina o atraso:
 *  1. O Modal monta NO MESMO render em que `visible` vira true. Antes o
 *     `mounted` era ligado dentro de um useEffect — 1 a 2 frames
 *     perdidos antes de qualquer coisa aparecer. Agora o estado é
 *     derivado durante o render (padrão "ajustar estado ao mudar prop").
 *  2. `animationType="none"`: quem anima é o painel, não o Modal do RN.
 *  3. Só o fundo tem backdrop-filter. O painel não tem mais o seu — ele
 *     já fica em cima de um fundo borrado, então o segundo blur só
 *     gastava GPU (e era animado junto com scale/opacity).
 *  4. A opacidade do painel chega a 100% na metade da animação: o
 *     conteúdo aparece logo e o movimento termina depois.
 *  5. Na saída o Modal só desmonta quando a animação termina.
 */
export function HudSheet({ visible, onRequestClose, nested = false, children }: HudSheetProps) {
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  const [prevVisible, setPrevVisible] = useState(visible);
  const [exiting, setExiting] = useState(false);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setExiting(!visible);
  }

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: ENTER_MS,
        easing: ENTER_EASING,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: EXIT_EASING,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setExiting(false);
      });
    }
  }, [visible, progress]);

  const panelAnimation = {
    opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  };

  return (
    <Modal
      visible={visible || exiting}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable
            style={[styles.backdrop, nested ? styles.backdropNested : backdropGlass]}
            onPress={onRequestClose}
            accessibilityLabel="Fechar"
          />
        </Animated.View>

        <Animated.View style={[styles.panelWrap, panelAnimation]}>
          <View style={styles.panel}>{children}</View>
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
    backgroundColor: 'rgba(4, 11, 24, 0.42)', // #040b18 com 42% de opacidade
  },
  backdropNested: {
    backgroundColor: 'rgba(4, 11, 24, 0.3)',
  },
  panelWrap: {
    width: '100%',
    maxWidth: 340,
    // Em telas baixas o conteúdo rola por dentro em vez de estourar.
    maxHeight: '92%',
  },
  panel: {
    flexShrink: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Hud.panelBorderStrong,
    // Fio mais claro no topo — o "brilho pegando a borda" de vidro.
    borderTopColor: 'rgba(210, 225, 255, 0.55)',
    // Um pouco mais opaco que antes (era 0.55): sem o blur próprio, é
    // a cor que garante a leitura do texto.
    backgroundColor: 'rgba(4, 11, 24, 0.68)',
    padding: 20,
  },
});

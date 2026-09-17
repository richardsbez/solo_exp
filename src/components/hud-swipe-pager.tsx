import { type ReactNode, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Pager horizontal com swipe, usado pelas 5 abas do Sistema (ver
// app/index.tsx). Não depende de nenhuma lib de tab-view — só
// gesture-handler + reanimated, que já estavam no projeto.
//
// Como funciona:
// - Todos os painéis (`children`) ficam lado a lado dentro de um único
//   View largo (largura da tela × quantidade de abas), e o gesto arrasta
//   esse View inteiro pelo eixo X via `translateX`.
// - `.activeOffsetX(...)` / `.failOffsetY(...)` fazem o gesto só "ganhar"
//   o toque quando o arrasto é predominantemente horizontal — arrastar
//   pra cima/baixo continua rolando o ScrollView de dentro de cada painel
//   normalmente (importante: a tela de Status rola verticalmente).
// - Ao soltar o dedo, decide a aba de destino por distância arrastada OU
//   velocidade (um "flick" rápido troca de aba mesmo sem arrastar muito,
//   igual Instagram/TikTok) e anima até lá com withTiming.
// - Trocar de aba pela barra inferior (prop `index` mudando de fora)
//   anima exatamente do mesmo jeito — swipe e toque na barra usam a
//   mesma transição, então nunca há um "salto seco" num dos dois casos.
// ---------------------------------------------------------------------------

const TRANSITION_DURATION = 280;
const TRANSITION_EASING = Easing.out(Easing.cubic);

/** Fração da largura da tela que precisa ser arrastada pra contar como
 * "troca de aba" quando o gesto termina devagar (sem flick). */
const DISTANCE_THRESHOLD_RATIO = 0.28;

/** Velocidade (px/s) acima da qual um "flick" troca de aba mesmo com
 * pouco deslocamento arrastado. */
const VELOCITY_THRESHOLD = 800;

/** Quanto o arrasto resiste nas pontas (1ª e última aba) — 1 = sem
 * resistência nenhuma, 0 = travado. É o "elástico" avisando que acabou. */
const EDGE_RESISTANCE = 0.3;

interface HudSwipePagerProps {
  /** Índice da aba ativa — controlado de fora (pela barra inferior). */
  index: number;
  /** Chamado quando o gesto (ou a troca externa de `index`) muda de aba. */
  onIndexChange: (index: number) => void;
  /** Um painel por aba, na mesma ordem de `constants/tabs.ts`. */
  children: ReactNode[];
}

export function HudSwipePager({ index, onIndexChange, children }: HudSwipePagerProps) {
  const { width } = useWindowDimensions();
  const pageCount = children.length;

  const translateX = useSharedValue(-index * width);
  const dragStartX = useSharedValue(0);

  // Troca de aba vinda de fora (toque na barra inferior): anima até lá
  // com a mesma curva do gesto, em vez de simplesmente saltar pro lugar.
  useEffect(() => {
    translateX.value = withTiming(-index * width, {
      duration: TRANSITION_DURATION,
      easing: TRANSITION_EASING,
    });
  }, [index, width, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((event) => {
      const min = -(pageCount - 1) * width;
      const max = 0;
      let next = dragStartX.value + event.translationX;

      if (next > max) next = max + (next - max) * EDGE_RESISTANCE;
      if (next < min) next = min + (next - min) * EDGE_RESISTANCE;

      translateX.value = next;
    })
    .onEnd((event) => {
      const currentFraction = -translateX.value / width;
      let target = index;

      if (Math.abs(event.velocityX) > VELOCITY_THRESHOLD) {
        target = event.velocityX < 0 ? index + 1 : index - 1;
      } else if (Math.abs(currentFraction - index) > DISTANCE_THRESHOLD_RATIO) {
        target = Math.round(currentFraction);
      }

      target = Math.max(0, Math.min(pageCount - 1, target));

      translateX.value = withTiming(-target * width, {
        duration: TRANSITION_DURATION,
        easing: TRANSITION_EASING,
      });

      if (target !== index) {
        runOnJS(onIndexChange)(target);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.row, { width: width * pageCount }, rowStyle]}>
        {children.map((child, i) => (
          <View key={i} style={{ width }}>
            {child}
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});

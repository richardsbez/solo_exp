import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface HudPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Opacidade enquanto o dedo está em cima. */
  pressedOpacity?: number;
}

/** Pressable com feedback imediato ao tocar (opacidade + escala de 2%).
 * Sem isso, botão que não reage ao toque parece ter atraso, mesmo quando
 * a ação dispara na hora. */
export function HudPressable({ style, pressedOpacity = 0.55, ...rest }: HudPressableProps) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        style,
        pressed && { opacity: pressedOpacity, transform: [{ scale: 0.98 }] },
      ]}
    />
  );
}

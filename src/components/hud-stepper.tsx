import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { Hud } from '@/constants/hud';

const REPEAT_DELAY_MS = 380;
const REPEAT_INTERVAL_MS = 80;

interface StepButtonProps {
  kind: 'plus' | 'minus';
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

/** Botão +/- com "segurar pra repetir": dispara na hora ao tocar e, se o
 * dedo continuar, repete a cada 80ms depois de 380ms. Para sozinho ao
 * soltar, ao desabilitar (chegou no limite) ou ao desmontar. */
export function StepButton({ kind, onPress, disabled, size = 22 }: StepButtonProps) {
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const start = () => {
    if (disabled) return;
    onPressRef.current();
    stop();
    delayRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onPressRef.current(), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={kind === 'plus' ? 'Aumentar' : 'Diminuir'}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <Feather name={kind} size={Math.round(size * 0.6)} color={Hud.textPrimary} />
    </Pressable>
  );
}

interface StepperProps {
  value: number | string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  size?: number;
  valueStyle?: StyleProp<TextStyle>;
  valueMinWidth?: number;
}

/** [−] valor [+] */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  size = 22,
  valueStyle,
  valueMinWidth = 26,
}: StepperProps) {
  return (
    <View style={styles.row}>
      <StepButton kind="minus" onPress={onDecrement} disabled={!canDecrement} size={size} />
      <Text style={[styles.value, { minWidth: valueMinWidth }, valueStyle]}>{value}</Text>
      <StepButton kind="plus" onPress={onIncrement} disabled={!canIncrement} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: Hud.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    borderWidth: 1,
    borderColor: Hud.panelBorder,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    borderColor: Hud.glow,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
});

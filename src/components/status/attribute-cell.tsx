import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SoloColors, SoloSpacing } from '@/constants/solo-theme';
import type { AttributeKey } from '@/types/game';

/** Ícone simples por atributo — glifo leve, sem depender de nenhuma lib de
 * ícones extra (mantém o bundle do build web enxuto). */
const ATTRIBUTE_ICON: Record<AttributeKey, string> = {
  strength: '💪',
  agility: '💨',
  intelligence: '🧠',
  vitality: '❤️',
  perception: '👁️',
};

/** Abreviação de 3 letras, no mesmo espírito "STR / AGI / INT / VIT / PER"
 * das imagens de referência. */
const ATTRIBUTE_SHORT_LABEL: Record<AttributeKey, string> = {
  strength: 'STR',
  agility: 'AGI',
  intelligence: 'INT',
  vitality: 'VIT',
  perception: 'PER',
};

interface AttributeCellProps {
  attribute: AttributeKey;
  value: number;
  /** Ocupa a linha inteira em vez de meia-coluna — usado no último item
   * ímpar da grade (PER), pra não sobrar uma célula vazia torta. */
  fullWidth?: boolean;
}

export function AttributeCell({ attribute, value, fullWidth }: AttributeCellProps) {
  return (
    <View style={[styles.cell, fullWidth && styles.cellFullWidth]}>
      <ThemedText style={styles.icon}>{ATTRIBUTE_ICON[attribute]}</ThemedText>
      <ThemedText type="smallBold" style={styles.label}>
        {ATTRIBUTE_SHORT_LABEL[attribute]}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SoloSpacing.xs,
    paddingVertical: SoloSpacing.xs,
  },
  cellFullWidth: {
    flexBasis: '100%',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    color: SoloColors.textSecondary,
    letterSpacing: 0.5,
  },
  value: {
    color: SoloColors.textPrimary,
    marginLeft: 'auto',
  },
});

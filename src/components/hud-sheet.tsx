import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { Hud } from '@/constants/hud';

interface HudSheetProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
}

/**
 * Painel centralizado com fundo escurecido, usado pelos 3 submenus de
 * missão (editor, método de contagem, conectar missões). Tocar fora do
 * painel fecha, igual a um modal comum.
 *
 * Não tenta replicar o blur do fundo que aparece nas imagens de
 * referência — `backdrop-filter` não é confiável entre iOS Safari e o
 * resto da web, então o fundo aqui só escurece, sem borrar.
 */
export function HudSheet({ visible, onRequestClose, children }: HudSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        {/* onPress vazio: um Pressable aninhado "absorve" o toque antes
            dele borbulhar pro backdrop — é isso que faz tocar DENTRO do
            painel não fechar o modal. */}
        <Pressable style={styles.panel} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 10, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Hud.panelBorderStrong,
    backgroundColor: 'rgba(26, 32, 50, 0.94)',
    padding: 20,
  },
});

import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Hud } from '@/constants/hud';

interface HudSheetProps extends PropsWithChildren {
  visible: boolean;
  onRequestClose: () => void;
}

// `backdropFilter` não existe no tipo ViewStyle do React Native (só faz
// sentido na web) — react-native-web aceita a propriedade normalmente e
// já adiciona o prefixo -webkit- sozinho (essencial pro Safari do
// iPhone), mas o TypeScript não sabe disso. Em vez de espalhar `as any`
// pelo arquivo, isola isso aqui, num tipo só.
type GlassStyle = ViewStyle & { backdropFilter?: string };

/** Vidro fosco azulado — mesma cor do glow do app (Hud.glow), só que bem
 * diluída, pra não parecer um blur genérico de iOS "puro". */
const backdropGlass: GlassStyle = {
  backdropFilter: 'blur(22px) saturate(140%)',
};
const panelGlass: GlassStyle = {
  backdropFilter: 'blur(28px) saturate(160%)',
};

/**
 * Painel centralizado com fundo em vidro fosco (glassmorphism, estilo
 * "Liquid Glass" do iOS), usado pelos 3 submenus de missão (editor,
 * método de contagem, conectar missões). Tocar fora do painel fecha,
 * igual a um modal comum.
 *
 * Fora da web (apps nativos), `backdropFilter` é simplesmente ignorado
 * pelo React Native — sem erro, só sem o blur, caindo de volta pro fundo
 * translúcido liso. Como o alvo aqui é o Safari do iPhone, isso cobre o
 * caso que importa.
 */
export function HudSheet({ visible, onRequestClose, children }: HudSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={[styles.backdrop, backdropGlass]} onPress={onRequestClose}>
        {/* onPress vazio: um Pressable aninhado "absorve" o toque antes
            dele borbulhar pro backdrop — é isso que faz tocar DENTRO do
            painel não fechar o modal. */}
        <Pressable style={[styles.panel, panelGlass]} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // Bem mais transparente que antes (era 0.78 opaco) — o blur é que
    // precisa fazer o trabalho de esconder o conteúdo de trás, não a cor.
    backgroundColor: 'rgba(8, 14, 28, 0.42)',
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
    // Um fio mais claro no topo — o "brilho pegando a borda" clássico de
    // vidro, sutil o bastante pra não brigar com a borda azul do resto
    // do app.
    borderTopColor: 'rgba(210, 225, 255, 0.55)',
    backgroundColor: 'rgba(28, 36, 58, 0.55)',
    padding: 20,
  },
});

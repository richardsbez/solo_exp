import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Impede a splash nativa de sumir sozinha assim que o JS carrega — a
// removemos manualmente no useEffect abaixo, assim que a tela de Status
// já montou. Sem tela de boas-vindas, sem tabs, sem logo da Expo: só o
// "Sistema" aparecendo direto.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Stack sem header: uma rota só (a tela de Status), sem barra de
          navegação nem abas por cima do app. */}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

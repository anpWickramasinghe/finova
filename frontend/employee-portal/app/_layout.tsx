import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { ThemeProvider } from '@/theme/theme-provider';
import { osName } from 'expo-device';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/providers/auth-context';

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

function RootLayoutNav() {
  const colorScheme = useColorScheme() || 'light';
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(
        colorScheme === 'light' ? 'dark' : 'light'
      );
    }
  }, [colorScheme]);

  useEffect(() => {
    setBackgroundColorAsync(
      colorScheme === 'dark' ? Colors.dark.background : Colors.light.background
    );
  }, [colorScheme]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to the login page
      router.replace('/auth/login' as any);
    } else if (user && inAuthGroup) {
      // Redirect to the tabs page
      router.replace('/(tabs)' as any);
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return null; // Or a splash screen component
  }

  return (
    <ThemeProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='auth/login' options={{ headerShown: false }} />

        <Stack.Screen
          name='sheet'
          options={{
            headerShown: false,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.4, 0.7, 1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? 'transparent'
                : colorScheme === 'dark'
                  ? Colors.dark.card
                  : Colors.light.card,
            },
            headerTransparent: Platform.OS === 'ios' ? true : false,
            headerLargeTitle: false,
            title: '',
            presentation:
              Platform.OS === 'ios'
                ? isLiquidGlassAvailable() && osName !== 'iPadOS'
                  ? 'formSheet'
                  : 'modal'
                : 'modal',
            sheetInitialDetentIndex: 0,
            headerStyle: {
              backgroundColor:
                Platform.OS === 'ios'
                  ? 'transparent'
                  : colorScheme === 'dark'
                    ? Colors.dark.card
                    : Colors.light.card,
            },
            headerBlurEffect: isLiquidGlassAvailable()
              ? undefined
              : colorScheme === 'dark'
                ? 'dark'
                : 'light',
          }}
        />
        <Stack.Screen name='+not-found' />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

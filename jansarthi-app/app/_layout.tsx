import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/noto-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/global.css";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while checking auth state
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animationDuration: 500 }}>
      {!isAuthenticated ? (
        // Auth screens - shown when not authenticated
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        // App screens - shown when authenticated
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState<boolean>(false);

  const [fontsLoaded, fontError] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (fontsLoaded || fontError) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    async function hideSplash() {
      if (appIsReady) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <LanguageProvider>
          <RootNavigator />
        </LanguageProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}

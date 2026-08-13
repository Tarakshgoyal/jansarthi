import { Redirect } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";

export default function RootIndex() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

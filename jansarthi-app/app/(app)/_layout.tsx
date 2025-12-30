import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth state to be determined
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="my-reports" />
      <Stack.Screen name="report-detail" />
      <Stack.Screen name="water-issue" />
      <Stack.Screen name="electricity-issue" />
      <Stack.Screen name="road-issue" />
      <Stack.Screen name="garbage-issue" />
      <Stack.Screen name="map-view" />
      <Stack.Screen name="parshad-dashboard" />
      <Stack.Screen name="parshad-issue-detail" />
      <Stack.Screen name="pwd-dashboard" />
      <Stack.Screen name="pwd-issue-detail" />
    </Stack>
  );
}

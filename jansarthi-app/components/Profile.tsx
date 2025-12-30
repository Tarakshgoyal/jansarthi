import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { Calendar, CheckCircle, LogOut, Phone, RefreshCw, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

interface ProfileProps {}

const Profile: React.FC<ProfileProps> = () => {
  const { isAuthenticated, logout, user: cachedUser } = useAuth();
  const { t, language, getText } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState(cachedUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // User is always authenticated in (app) routes - layout handles redirect
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      getText(t.profile.logoutConfirm),
      getText(t.profile.logoutConfirmMessage),
      [
        {
          text: getText(t.actions.cancel),
          style: 'cancel',
        },
        {
          text: getText(t.profile.logoutButton),
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Layout will automatically redirect to login
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading && !user) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">{getText(t.profile.loadingProfile)}</Text>
      </View>
    );
  }

  if (error && !user) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50 p-6">
        <Text className="text-2xl mb-4">⚠️</Text>
        <Text className="text-red-600 text-center font-semibold mb-2">
          {getText(t.profile.failedToLoad)}
        </Text>
        <Text className="text-gray-600 text-center mb-6">{error}</Text>
        <Button size="md" onPress={loadUserProfile} className="bg-blue-600">
          <ButtonText>{getText(t.actions.tryAgain)}</ButtonText>
        </Button>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <Text className="text-gray-600">{getText(t.profile.noUserData)}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background-50">
      <VStack className="flex-1 p-6" space="lg">
        {/* Profile Header */}
        <VStack className="items-center mb-4" space="md">
          <View
            className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <User size={48} color="#3b82f6" />
          </View>
          <VStack className="items-center" space="xs">
            <Heading size="2xl" className="text-gray-900">
              {user.name}
            </Heading>
            {user.is_verified && (
              <HStack space="xs" className="items-center">
                <CheckCircle size={16} color="#22c55e" />
                <Text className="text-sm text-green-600">{getText(t.profile.verifiedAccount)}</Text>
              </HStack>
            )}
          </VStack>
        </VStack>

        {/* Profile Information Card */}
        <Box className="bg-white rounded-2xl p-6 shadow-sm">
          <VStack space="lg">
            <VStack space="xs">
              <Text className="text-sm text-gray-500 uppercase font-semibold">
                {getText(t.profile.accountInformation)}
              </Text>
            </VStack>

            {/* Mobile Number */}
            <HStack space="md" className="items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Phone size={20} color="#3b82f6" />
              </View>
              <VStack className="flex-1" space="xs">
                <Text className="text-xs text-gray-500">{getText(t.profile.mobileNumber)}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {user.mobile_number}
                </Text>
              </VStack>
            </HStack>

            {/* Member Since */}
            <HStack space="md" className="items-center py-3">
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
                <Calendar size={20} color="#22c55e" />
              </View>
              <VStack className="flex-1" space="xs">
                <Text className="text-xs text-gray-500">{getText(t.profile.memberSince)}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {formatDate(user.created_at)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Error Message */}
        {error && (
          <Box className="bg-red-50 p-4 rounded-lg">
            <Text className="text-red-600 text-center text-sm">{error}</Text>
          </Box>
        )}

        {/* Action Buttons */}
        <VStack space="md" className="mt-2">
          <Button
            size="lg"
            variant="outline"
            onPress={handleRefresh}
            isDisabled={isRefreshing}
            className="border-blue-600"
          >
            <HStack space="sm" className="items-center">
              <RefreshCw size={20} color="#3b82f6" />
              <ButtonText className="text-blue-600">
                {isRefreshing ? getText(t.profile.refreshing) : getText(t.profile.refreshProfile)}
              </ButtonText>
            </HStack>
          </Button>

          <Button
            size="lg"
            onPress={handleLogout}
            className="bg-red-600"
          >
            <HStack space="sm" className="items-center">
              <LogOut size={20} color="#ffffff" />
              <ButtonText>{getText(t.profile.logout)}</ButtonText>
            </HStack>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export default Profile;

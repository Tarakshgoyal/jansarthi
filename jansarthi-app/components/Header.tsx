import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Bell, MapPin, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export const Header = () => {
  const { t, getText } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  const handleProfilePress = () => {
    // User is always authenticated in (app) routes
    router.push('/(app)/profile');
  };

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocation(getText(t.location.denied));
          setIsLoadingLocation(false);
          return;
        }

        // Get current position
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Reverse geocode to get address
        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (address && address.length > 0) {
          const { city, district, subregion, region } = address[0];
          // Display the most specific location available
          const locationText =
            city ||
            district ||
            subregion ||
            region ||
            getText(t.location.unavailable);
          setLocation(locationText);
        } else {
          setLocation(getText(t.location.unavailable));
        }
      } catch (error) {
        console.error("Error getting location:", error);
        setLocation(getText(t.location.error));
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getLocation();
  }, [getText, t.location]);

  return (
    <View className="bg-brand-500 px-6 pt-20 pb-8">
      <HStack className="justify-between items-start mb-6">
        <VStack space="xs" className="flex-1">
          <Heading size="2xl" className="text-typography-white font-bold">
            {getText(t.appName)}
          </Heading>
          {/* Location Display */}
          <HStack className="items-center mt-2" space="xs">
            <MapPin size={16} className="text-typography-white/90" />
            <Text size="sm" className="text-typography-white/90">
              {isLoadingLocation ? getText(t.location.loading) : location}
            </Text>
          </HStack>
          <Text size="sm" className="text-typography-white/90 mt-1">
            {getText(t.menu.subtitle)}
          </Text>
        </VStack>
        <HStack className="ml-4 items-center" space="md">
          <LanguageSwitcher />
          <Pressable
            className="border border-white/20 rounded-full p-3 bg-white/10 active:opacity-70"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Bell size={20} className="text-typography-white" />
          </Pressable>
          <Pressable
            onPress={handleProfilePress}
            className="border border-white/20 rounded-full p-3 bg-white/10 active:opacity-70"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <User size={20} className="text-typography-white" />
          </Pressable>
        </HStack>
      </HStack>
    </View>
  );
};

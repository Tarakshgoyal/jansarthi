import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Platform, StatusBar, TouchableOpacity } from "react-native";
import { Box } from "./ui/box";
import { HStack } from "./ui/hstack";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";

interface BackHeaderProps {
  title: string;
}

/**
 * BackHeader Component
 * A custom header with just a back button icon
 * Provides a clean, minimal navigation experience
 */
const BackHeader: React.FC<BackHeaderProps> = ({ title }) => {
  const handleGoBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/(app)");
    }
  };

  // Calculate top padding for safe area (notch/status bar)
  const topPadding = Platform.OS === "ios" ? 10 : StatusBar.currentHeight || 0;

  return (
    <Box
      className="bg-background-0 border-b border-outline-100"
      style={{ paddingTop: topPadding }}
    >
      <HStack className="items-center px-4 py-3" space="md">
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon as={ChevronLeft} size="xl" className="text-typography-900" />
        </TouchableOpacity>

        {/* Title */}
        <Text size="xl" className="text-typography-900 font-semibold">
          {title}
        </Text>
      </HStack>
    </Box>
  );
};

export default BackHeader;

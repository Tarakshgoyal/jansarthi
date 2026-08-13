import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "./ui/icon";

interface QuickActionItemProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID?: string;
}

export const QuickActionItem = ({
  icon: IconComponent,
  label,
  onPress,
  testID,
}: QuickActionItemProps) => {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="items-center justify-center py-6 px-4 active:opacity-70 bg-background-0 rounded-2xl border border-outline-100 shadow-soft-1"
      style={{
        // Ensure larger touch target and comfortable width for horizontal scroll
        minWidth: 130,
        minHeight: 130,
      }}
    >
      <VStack space="md" className="items-center">
        <View className="rounded-full p-4 bg-brand-100">
          <Icon size="xl" className="text-brand-600" as={IconComponent} />
        </View>
        <Text size="sm" className="text-typography-800 text-center font-medium">
          {label}
        </Text>
      </VStack>
    </Pressable>
  );
};

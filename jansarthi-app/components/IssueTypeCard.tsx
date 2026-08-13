import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { LucideIcon } from "lucide-react-native";

interface IssueTypeCardProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID?: string;
}

export const IssueTypeCard = ({
  icon: Icon,
  label,
  onPress,
  testID,
}: IssueTypeCardProps) => {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="bg-background-50 rounded-xl p-6 border border-outline-100 active:bg-background-100 active:border-brand-500"
    >
      <VStack space="md" className="items-center">
        <Icon size={40} className="text-brand-500" strokeWidth={1.5} />
        <Text size="sm" className="text-typography-900 text-center font-medium">
          {label}
        </Text>
      </VStack>
    </Pressable>
  );
};

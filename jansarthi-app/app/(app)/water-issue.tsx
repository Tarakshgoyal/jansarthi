import BackHeader from "@/components/BackHeader";
import WaterIssue from "@/components/WaterIssue";
import { useLanguage } from "@/contexts/LanguageContext";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WaterIssuePage() {
  const { t, getText } = useLanguage();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} className="bg-background-0">
        <BackHeader title={getText(t.issueTypes.jalSamasya)} />
        <WaterIssue />
      </SafeAreaView>
    </>
  );
}

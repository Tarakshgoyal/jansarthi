import BackHeader from "@/components/BackHeader";
import RoadIssue from "@/components/RoadIssue";
import { useLanguage } from "@/contexts/LanguageContext";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoadIssuePage() {
  const { t, getText } = useLanguage();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} className="bg-background-0">
        <BackHeader title={getText(t.issueTypes.sadakSamasya)} />
        <RoadIssue />
      </SafeAreaView>
    </>
  );
}

import BackHeader from "@/components/BackHeader";
import { ParshadIssueDetail } from "@/components/ParshadIssueDetail";
import { useLanguage } from "@/contexts/LanguageContext";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParshadIssueDetailScreen() {
  const { t, getText } = useLanguage();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} className="bg-background-0">
        <BackHeader title={getText(t.parshad.issueDetail.title)} />
        <ParshadIssueDetail />
      </SafeAreaView>
    </>
  );
}

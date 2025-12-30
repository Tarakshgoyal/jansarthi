import BackHeader from "@/components/BackHeader";
import IssuesMap from "@/components/IssuesMap";
import { useLanguage } from "@/contexts/LanguageContext";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapViewPage() {
  const { t, getText } = useLanguage();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} className="bg-background-0">
        <BackHeader title={getText(t.issuesMap.title)} />
        <IssuesMap />
      </SafeAreaView>
    </>
  );
}

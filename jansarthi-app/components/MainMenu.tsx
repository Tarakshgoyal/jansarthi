import { Header } from "@/components/Header";
import { IssueTypeCard } from "@/components/IssueTypeCard";
import { MenuCard } from "@/components/MenuCard";
import { QuickActionItem } from "@/components/QuickActionItem";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import {
  Construction,
  Droplet,
  Eye,
  Map,
  Plus,
  Trash2,
  Zap
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

export const MainMenu = () => {
  const { t, getText } = useLanguage();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [showIssueTypeSheet, setShowIssueTypeSheet] = useState(false);

  // Redirect Parshad users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'parshad') {
      router.replace('/(app)/parshad-dashboard');
    }
    // PWD workers would go to their own dashboard (to be implemented)
    // else if (user?.role === 'pwd_worker') {
    //   router.replace('/(app)/pwd-dashboard');
    // }
  }, [isAuthenticated, isLoading, user?.role]);

  const handleCreateReport = () => {
    setShowIssueTypeSheet(true);
  };

  const handleIssueTypeSelect = (issueType: string) => {
    setShowIssueTypeSheet(false);
    // Navigate to create report screen with issue type
    switch (issueType) {
      case "water":
        router.push("/(app)/water-issue");
        break;
      case "electricity":
        router.push("/(app)/electricity-issue");
        break;
      case "road":
        router.push("/(app)/road-issue");
        break;
      case "garbage":
        router.push("/(app)/garbage-issue");
        break;
      default:
        console.log(`Navigate to create report with type: ${issueType}`);
    }
  };

  const handleViewReports = () => {
    router.push('/(app)/my-reports');
  };

  const handleViewMap = () => {
    router.push('/(app)/map-view');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleJalSamasya = () => {
    handleIssueTypeSelect("water");
  };

  const handleBijliSamasya = () => {
    handleIssueTypeSelect("electricity");
  };

  const handleSadakSamasya = () => {
    handleIssueTypeSelect("road");
  };

  const handleKachraSamasya = () => {
    handleIssueTypeSelect("garbage");
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      {/* Header with Brand Background */}
      <Header />

      {/* Content Area */}
      <View className="flex-1 bg-background-0 rounded-t-3xl -mt-4 pt-6 px-6 pb-10 min-h-screen">
        {/* Create New Report Card - Primary Action */}
        <VStack space="lg" className="mt-2 mb-6">
          <MenuCard
            title={getText(t.menu.createReport)}
            description={getText(t.menu.createReportDesc)}
            icon={Plus}
            onPress={handleCreateReport}
            variant="cta"
          />
          <MenuCard
            title={getText(t.quickActions.viewReports)}
            description={getText(t.menu.viewReportsDesc)}
            icon={Eye}
            onPress={handleViewReports}
            variant="secondary"
          />
          <MenuCard
            title={getText(t.quickActions.viewMap)}
            description={getText(t.menu.viewMapDesc)}
            icon={Map}
            onPress={handleViewMap}
            variant="secondary"
          />
        </VStack>

        {/* Quick Actions Section */}
        <Box className="mb-6">
          <Heading size="lg" className="text-typography-900 mb-4">
            {getText(t.menu.quickActions)}
          </Heading>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-3"
            contentContainerStyle={{ gap: 12 }}
          >
            <QuickActionItem
              icon={Droplet}
              label={getText(t.quickActions.jalSamasya)}
              onPress={handleJalSamasya}
            />
            <QuickActionItem
              icon={Zap}
              label={getText(t.quickActions.bijliSamasya)}
              onPress={handleBijliSamasya}
            />
            <QuickActionItem
              icon={Construction}
              label={getText(t.quickActions.sadakSamasya)}
              onPress={handleSadakSamasya}
            />
            <QuickActionItem
              icon={Trash2}
              label={getText(t.quickActions.kachraSamasya)}
              onPress={handleKachraSamasya}
            />
          </ScrollView>
        </Box>
      </View>

      {/* Issue Type Selection ActionSheet */}
      <Actionsheet
        isOpen={showIssueTypeSheet}
        onClose={() => setShowIssueTypeSheet(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="px-6 pb-8">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack space="lg" className="w-full mt-4">
            <VStack space="xs">
              <Heading size="xl" className="text-typography-900">
                {getText(t.menu.selectIssueType)}
              </Heading>
              <Text size="sm" className="text-typography-500">
                {getText(t.menu.selectIssueTypeDesc)}
              </Text>
            </VStack>

            <Grid
              className="gap-4"
              _extra={{
                className: "grid-cols-2",
              }}
            >
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <IssueTypeCard
                  icon={Droplet}
                  label={getText(t.issueTypes.jalSamasya)}
                  onPress={handleJalSamasya}
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <IssueTypeCard
                  icon={Zap}
                  label={getText(t.issueTypes.bijliSamasya)}
                  onPress={handleBijliSamasya}
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <IssueTypeCard
                  icon={Construction}
                  label={getText(t.issueTypes.sadakSamasya)}
                  onPress={handleSadakSamasya}
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <IssueTypeCard
                  icon={Trash2}
                  label={getText(t.issueTypes.kachraSamasya)}
                  onPress={handleKachraSamasya}
                />
              </GridItem>
            </Grid>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </ScrollView>
  );
};

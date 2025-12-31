import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    apiService,
    ParshadDashboardStats,
    ParshadIssue
} from "@/services/api";
import { useRouter } from "expo-router";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Construction,
    Droplet,
    RefreshCw,
    Trash2,
    User,
    Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}) => (
  <Box className={`${bgColor} rounded-2xl p-4 flex-1`}>
    <HStack className="items-center justify-between">
      <VStack space="xs">
        <Text className="text-typography-600 text-sm">{title}</Text>
        <Heading size="2xl" className={color}>
          {value}
        </Heading>
      </VStack>
      <Box className={`${bgColor} rounded-full p-2`}>
        <Icon size={24} className={color} />
      </Box>
    </HStack>
  </Box>
);

interface IssueCardProps {
  issue: ParshadIssue;
  onPress: () => void;
  getText: (t: { en: string; hi: string }) => string;
  t: any;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onPress, getText, t }) => {
  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "water":
        return Droplet;
      case "electricity":
        return Zap;
      case "road":
        return Construction;
      case "garbage":
        return Trash2;
      default:
        return AlertCircle;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "water":
        return getText(t.quickActions.jalSamasya);
      case "electricity":
        return getText(t.quickActions.bijliSamasya);
      case "road":
        return getText(t.quickActions.sadakSamasya);
      case "garbage":
        return getText(t.quickActions.kachraSamasya);
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-warning-100 text-warning-700";
      case "representative_acknowledged":
        return "bg-info-100 text-info-700";
      case "pwd_working":
      case "pwd_completed":
        return "bg-primary-100 text-primary-700";
      case "representative_reviewed":
        return "bg-success-100 text-success-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return getText(t.status.assigned);
      case "representative_acknowledged":
        return getText(t.status.parshadCheck);
      case "pwd_working":
        return getText(t.status.startedWorking);
      case "pwd_completed":
        return getText(t.status.pwdCompleted);
      case "representative_reviewed":
        return getText(t.status.finishedWork);
      default:
        return status;
    }
  };

  const Icon = getIssueTypeIcon(issue.issue_type);
  const statusColorClass = getStatusColor(issue.status);

  return (
    <Pressable onPress={onPress}>
      <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100 mb-3">
        <HStack className="items-start justify-between">
          <HStack className="items-center flex-1" space="md">
            <Box className="bg-primary-50 rounded-xl p-3">
              <Icon size={24} className="text-primary-600" />
            </Box>
            <VStack className="flex-1" space="xs">
              <Text className="text-typography-900 font-semibold">
                {getIssueTypeLabel(issue.issue_type)}
              </Text>
              <Text
                className="text-typography-500 text-sm"
                numberOfLines={2}
              >
                {issue.description}
              </Text>
              {issue.reporter && (
                <Text className="text-typography-400 text-xs">
                  {getText(t.parshad.issueDetail.reportedBy)}: {issue.reporter.name}
                </Text>
              )}
            </VStack>
          </HStack>
        </HStack>
        <HStack className="mt-3 items-center justify-between">
          <Box className={`px-3 py-1 rounded-full ${statusColorClass.split(" ")[0]}`}>
            <Text className={`text-xs font-medium ${statusColorClass.split(" ")[1]}`}>
              {getStatusLabel(issue.status)}
            </Text>
          </Box>
          <Text className="text-typography-400 text-xs">
            {new Date(issue.created_at).toLocaleDateString()}
          </Text>
        </HStack>
      </Box>
    </Pressable>
  );
};

export const ParshadDashboard: React.FC = () => {
  const { t, getText } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<ParshadDashboardStats | null>(null);
  const [issues, setIssues] = useState<ParshadIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "pending_review" | "completed" | "all">("pending");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [dashboardStats, issuesResponse] = await Promise.all([
        apiService.getParshadDashboard(),
        activeTab === "pending"
          ? apiService.getParshadPendingIssues({ page: 1, page_size: 50 })
          : activeTab === "in_progress"
          ? apiService.getParshadInProgressIssues({ page: 1, page_size: 50 })
          : activeTab === "pending_review"
          ? apiService.getParshadPendingReviewIssues({ page: 1, page_size: 50 })
          : apiService.getParshadIssues({
              page: 1,
              page_size: 50,
              status:
                activeTab === "completed"
                  ? "parshad_reviewed"
                  : undefined,
            }),
      ]);

      setStats(dashboardStats);
      setIssues(issuesResponse.items);
    } catch (err) {
      console.error("Failed to fetch Parshad data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleIssuePress = (issueId: number) => {
    router.push(`/parshad-issue-detail?id=${issueId}` as any);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-typography-600">Loading...</Text>
      </View>
    );
  }

  const tabs = [
    { key: "pending", label: getText(t.parshad.issues.pending), count: stats?.pending_acknowledgement || 0 },
    { key: "in_progress", label: getText(t.parshad.issues.inProgress), count: stats?.in_progress || 0 },
    { key: "pending_review", label: getText(t.parshad.issues.pendingReview), count: stats?.pending_review || 0 },
    { key: "completed", label: getText(t.parshad.issues.completed), count: stats?.completed || 0 },
    { key: "all", label: getText(t.parshad.issues.all), count: stats?.total_assigned || 0 },
  ] as const;

  return (
    <View className="flex-1 bg-background-50">
      {/* Header */}
      <View className="bg-brand-500 px-6 pt-20 pb-6">
        <HStack className="justify-between items-center">
          <VStack>
            <Text className="text-typography-white/80 text-sm">
              {getText(t.parshad.dashboard.welcome)}
            </Text>
            <Heading size="xl" className="text-typography-white">
              {user?.name || "Parshad"}
            </Heading>
            {user?.locality_name && (
              <Text className="text-typography-white/70 text-sm mt-1">
                {user.locality_name}
              </Text>
            )}
          </VStack>
          <HStack space="md" className="items-center">
            <LanguageSwitcher />
            <Pressable
              onPress={() => router.push('/(app)/profile')}
              className="border border-white/20 rounded-full p-3 bg-white/10 active:opacity-70"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <User size={20} className="text-typography-white" />
            </Pressable>
          </HStack>
        </HStack>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Stats Cards */}
        <View className="px-4 mt-4">
          <HStack space="md" className="mb-4">
            <StatCard
              title={getText(t.parshad.dashboard.pendingAcknowledgement)}
              value={stats?.pending_acknowledgement || 0}
              icon={Clock}
              color="text-warning-600"
              bgColor="bg-warning-50"
            />
            <StatCard
              title={getText(t.parshad.dashboard.inProgress)}
              value={stats?.in_progress || 0}
              icon={RefreshCw}
              color="text-primary-600"
              bgColor="bg-primary-50"
            />
          </HStack>
          <HStack space="md" className="mb-6">
            <StatCard
              title={getText(t.parshad.dashboard.completed)}
              value={stats?.completed || 0}
              icon={CheckCircle}
              color="text-success-600"
              bgColor="bg-success-50"
            />
            <StatCard
              title={getText(t.parshad.dashboard.totalAssigned)}
              value={stats?.total_assigned || 0}
              icon={AlertCircle}
              color="text-info-600"
              bgColor="bg-info-50"
            />
          </HStack>
        </View>

        {/* Tabs */}
        <View className="px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="sm">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full ${
                    activeTab === tab.key
                      ? "bg-brand-500"
                      : "bg-background-100"
                  }`}
                >
                  <HStack space="xs" className="items-center">
                    <Text
                      className={`text-sm font-medium ${
                        activeTab === tab.key
                          ? "text-typography-white"
                          : "text-typography-600"
                      }`}
                    >
                      {tab.label}
                    </Text>
                    <Box
                      className={`px-2 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-white/20"
                          : "bg-background-200"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          activeTab === tab.key
                            ? "text-typography-white"
                            : "text-typography-500"
                        }`}
                      >
                        {tab.count}
                      </Text>
                    </Box>
                  </HStack>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        </View>

        {/* Issues List */}
        <View className="px-4">
          <Heading size="lg" className="text-typography-900 mb-4">
            {getText(t.parshad.issues.title)}
          </Heading>

          {error ? (
            <Box className="bg-error-50 rounded-xl p-4">
              <Text className="text-error-700">{error}</Text>
              <Pressable
                onPress={onRefresh}
                className="mt-2 bg-error-100 rounded-lg px-4 py-2 self-start"
              >
                <Text className="text-error-700">{getText(t.actions.tryAgain)}</Text>
              </Pressable>
            </Box>
          ) : issues.length === 0 ? (
            <Box className="bg-background-100 rounded-xl p-6 items-center">
              <AlertCircle size={48} className="text-typography-300 mb-4" />
              <Text className="text-typography-500 text-center">
                {getText(t.parshad.dashboard.noIssuesAssigned)}
              </Text>
              <Text className="text-typography-400 text-sm text-center mt-1">
                {getText(t.parshad.dashboard.noIssuesAssignedMessage)}
              </Text>
            </Box>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onPress={() => handleIssuePress(issue.id)}
                getText={getText}
                t={t}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

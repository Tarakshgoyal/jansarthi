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
  ParshadIssue,
  PWDWorkerDashboardStats
} from "@/services/api";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Construction,
  Droplet,
  HardHat,
  PlayCircle,
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
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  onPress,
}) => (
  <Pressable onPress={onPress} disabled={!onPress} className="flex-1">
    <Box className={`${bgColor} rounded-2xl p-4`}>
      <HStack className="items-center justify-between">
        <VStack space="xs" className="flex-1">
          <Text className="text-typography-600 text-xs" numberOfLines={1}>{title}</Text>
          <Heading size="2xl" className={color}>
            {value}
          </Heading>
        </VStack>
        <Box className={`rounded-full p-2`}>
          <Icon size={24} className={color} />
        </Box>
      </HStack>
    </Box>
  </Pressable>
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
      case "representative_acknowledged":
        return "bg-warning-100 text-warning-700";
      case "pwd_working":
        return "bg-primary-100 text-primary-700";
      case "pwd_completed":
        return "bg-info-100 text-info-700";
      case "representative_reviewed":
        return "bg-success-100 text-success-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "representative_acknowledged":
        return getText(t.pwd.status.pendingWork);
      case "pwd_working":
        return getText(t.pwd.status.inProgress);
      case "pwd_completed":
        return getText(t.pwd.status.pendingReview);
      case "representative_reviewed":
        return getText(t.pwd.status.completed);
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
              {issue.assigned_representative && (
                <Text className="text-typography-400 text-xs">
                  {getText(t.pwd.issueDetail.parshad)}: {issue.assigned_representative.name}
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

export const PWDWorkerDashboard: React.FC = () => {
  const { t, getText } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<PWDWorkerDashboardStats | null>(null);
  const [issues, setIssues] = useState<ParshadIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "completed">("pending");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [dashboardStats, issuesResponse] = await Promise.all([
        apiService.getPWDWorkerDashboard(),
        apiService.getPWDWorkerIssues({
          page: 1,
          page_size: 50,
          filter_type: activeTab,
        }),
      ]);
      setStats(dashboardStats);
      setIssues(issuesResponse.items);
    } catch (err) {
      console.error("Failed to fetch PWD worker data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleIssuePress = (issue: ParshadIssue) => {
    router.push(`/(app)/pwd-issue-detail?id=${issue.id}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-typography-600">{getText(t.pwd.dashboard.loading)}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50 p-6">
        <AlertCircle size={48} className="text-error-500 mb-4" />
        <Text className="text-error-700 text-center mb-4">{error}</Text>
        <Pressable
          onPress={fetchData}
          className="bg-primary-500 rounded-lg px-6 py-3"
        >
          <Text className="text-typography-white">{getText(t.actions.tryAgain)}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-50">
      {/* Header - Fixed height to prevent layout shift on language change */}
      <View className="bg-amber-600 px-6 pt-16 pb-6" style={{ minHeight: 140 }}>
        <HStack className="items-center justify-between">
          <VStack className="flex-1 mr-3">
            <Heading size="lg" className="text-typography-white" numberOfLines={1}>
              {getText(t.pwd.dashboard.title)}
            </Heading>
            <Text className="text-amber-100 mt-1" numberOfLines={1}>
              {getText(t.pwd.dashboard.welcome)}, {user?.name || "PWD Worker"}
            </Text>
          </VStack>
          <HStack space="sm" className="items-center">
            <LanguageSwitcher />
            <Pressable
              onPress={() => router.push('/(app)/profile')}
              className="border border-white/20 rounded-full p-2 bg-amber-500 active:opacity-70"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <User size={24} color="#fff" />
            </Pressable>
          </HStack>
        </HStack>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Cards */}
        <View className="px-4 pt-4">
          <HStack space="sm" className="mb-3">
            <StatCard
              title={getText(t.pwd.dashboard.pendingWork)}
              value={stats?.pending_work || 0}
              icon={Clock}
              color="text-warning-700"
              bgColor="bg-warning-50"
              onPress={() => setActiveTab("pending")}
            />
            <StatCard
              title={getText(t.pwd.dashboard.inProgress)}
              value={stats?.in_progress || 0}
              icon={PlayCircle}
              color="text-primary-700"
              bgColor="bg-primary-50"
              onPress={() => setActiveTab("in_progress")}
            />
          </HStack>
          <HStack space="sm">
            <StatCard
              title={getText(t.pwd.dashboard.pendingReview)}
              value={stats?.pending_review || 0}
              icon={RefreshCw}
              color="text-info-700"
              bgColor="bg-info-50"
            />
            <StatCard
              title={getText(t.pwd.dashboard.completed)}
              value={stats?.completed || 0}
              icon={CheckCircle}
              color="text-success-700"
              bgColor="bg-success-50"
              onPress={() => setActiveTab("completed")}
            />
          </HStack>
        </View>

        {/* Tab Selector */}
        <View className="px-4 mt-6">
          <HStack space="sm" className="mb-4">
            {(["pending", "in_progress", "completed"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl ${
                  activeTab === tab ? "bg-amber-600" : "bg-background-100"
                }`}
              >
                <Text
                  className={`text-center font-medium text-sm ${
                    activeTab === tab ? "text-typography-white" : "text-typography-600"
                  }`}
                >
                  {tab === "pending"
                    ? getText(t.pwd.issues.pending)
                    : tab === "in_progress"
                    ? getText(t.pwd.issues.inProgress)
                    : getText(t.pwd.issues.completed)}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </View>

        {/* Issues List */}
        <View className="px-4">
          <Heading size="md" className="text-typography-800 mb-4">
            {activeTab === "pending"
              ? getText(t.pwd.issues.pendingTitle)
              : activeTab === "in_progress"
              ? getText(t.pwd.issues.inProgressTitle)
              : getText(t.pwd.issues.completedTitle)}
          </Heading>

          {issues.length === 0 ? (
            <Box className="bg-background-0 rounded-2xl p-8 items-center">
              <HardHat size={48} className="text-typography-300 mb-4" />
              <Text className="text-typography-500 text-center">
                {getText(t.pwd.dashboard.noIssues)}
              </Text>
            </Box>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onPress={() => handleIssuePress(issue)}
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

import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, Issue } from '@/services/api';
import { useRouter } from 'expo-router';
import { Calendar, Construction, Droplet, MapPin, Trash2, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

interface MyReportsProps {}

interface StatusTrackerProps {
  currentStatus: string;
  createdAt: string;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ currentStatus, createdAt }) => {
  const { t, language, getText } = useLanguage();

  // The stages now include 'assigned' which maps to 'parshad' visually
  // assigned = PWD assigned to Parshad, parshad_check = Parshad acknowledged
  const stages = [
    { key: 'reported', label: getText(t.status.reported) },
    { key: 'assigned', label: getText(t.status.parshad) }, // assigned = Parshad assigned
    { key: 'started_working', label: getText(t.status.pwdClerkStartedWorking) },
    { key: 'finished_work', label: getText(t.status.finishedWorking) },
  ];

  const getCurrentStageIndex = () => {
    const status = currentStatus?.toLowerCase();
    // Map parshad_check to assigned stage (both mean Parshad is involved)
    if (status === 'parshad_check') {
      return stages.findIndex(stage => stage.key === 'assigned');
    }
    return stages.findIndex(stage => stage.key === status);
  };

  const currentStageIndex = getCurrentStageIndex();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View className="mt-4 mb-2">
      {/* Circles and Arrows Row */}
      <View className="flex-row items-center justify-between px-2">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            {/* Stage Circle */}
            <View className="items-center" style={{ width: 48 }}>
              <View
                className={`w-12 h-12 rounded-full border-2 items-center justify-center ${
                  index <= currentStageIndex
                    ? 'bg-green-500 border-green-500'
                    : 'bg-gray-300 border-gray-300'
                }`}
              >
                <View className={`w-6 h-6 rounded-full ${
                  index <= currentStageIndex ? 'bg-white' : 'bg-gray-400'
                }`} />
              </View>
            </View>

            {/* Connecting Arrow */}
            {index < stages.length - 1 && (
              <View className="flex-1 items-center" style={{ marginHorizontal: 4 }}>
                <View className="flex-row items-center w-full">
                  <View
                    className={`h-0.5 flex-1 ${
                      index < currentStageIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <View
                    className="w-0 h-0 border-l-8 border-y-4 border-y-transparent"
                    style={{
                      borderLeftColor: index < currentStageIndex ? '#22c55e' : '#d1d5db',
                    }}
                  />
                </View>
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Labels Row */}
      <View className="flex-row items-start justify-between px-2 mt-2">
        {stages.map((stage, index) => (
          <View key={`label-${stage.key}`} className="items-center" style={{ width: index < stages.length - 1 ? 80 : 70 }}>
            <Text className="text-xs text-gray-700 text-center font-medium">
              {stage.label}
            </Text>
            {index === 0 && (
              <Text className="text-xs text-gray-500 mt-1">
                {formatDate(createdAt)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const MyReports: React.FC<MyReportsProps> = () => {
  const { isAuthenticated } = useAuth();
  const { t, language, getText } = useLanguage();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setError(null);

      const response = await apiService.getMyIssues({
        page: 1,
        page_size: 50,
      });
      
      setIssues(response.items);
    } catch (err) {
      console.error('Failed to load issues:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load issues';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadIssues();
  };

  const handleIssuePress = (issueId: number) => {
    router.push(`/report-detail?id=${issueId}` as any);
  };

  const getIssueIcon = (issueType: string) => {
    switch (issueType) {
      case 'water':
        return <Droplet size={24} color="#3b82f6" />;
      case 'electricity':
        return <Zap size={24} color="#eab308" />;
      case 'road':
        return <Construction size={24} color="#ef4444" />;
      case 'garbage':
        return <Trash2 size={24} color="#22c55e" />;
      default:
        return <MapPin size={24} color="#6b7280" />;
    }
  };

  const getIssueTypeLabel = (issueType: string) => {
    switch (issueType) {
      case 'water':
        return getText(t.issueTypes.jalSamasya);
      case 'electricity':
        return getText(t.issueTypes.bijliSamasya);
      case 'road':
        return getText(t.issueTypes.sadakSamasya);
      case 'garbage':
        return getText(t.issueTypes.kachraSamasya);
      default:
        return issueType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-red-100 text-red-800';
      case 'parshad_check':
        return 'bg-yellow-100 text-yellow-800';
      case 'started_working':
        return 'bg-green-100 text-green-800';
      case 'finished_work':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reported':
        return getText(t.status.reported);
      case 'parshad_check':
        return getText(t.status.parshadCheck);
      case 'started_working':
        return getText(t.status.startedWorking);
      case 'finished_work':
        return getText(t.status.finishedWork);
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <Text className="text-gray-600">{getText(t.myReports.loadingReports)}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background-50"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <VStack className="flex-1 p-4" space="md">
        {error && (
          <Box className="p-4 bg-red-50 rounded-lg mb-4">
            <Text className="text-red-600">{error}</Text>
          </Box>
        )}

        {issues.length === 0 ? (
          <Box className="p-8 bg-white rounded-lg items-center">
            <MapPin size={48} color="#d1d5db" />
            <Heading size="md" className="text-gray-600 mt-4 mb-2">
              {getText(t.myReports.noReports)}
            </Heading>
            <Text className="text-gray-500 text-center">
              {getText(t.myReports.noReportsMessage)}
            </Text>
          </Box>
        ) : (
          <VStack space="md">
            {issues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                onPress={() => handleIssuePress(issue.id)}
                activeOpacity={0.7}
              >
                <Box className="bg-white rounded-lg p-4 shadow-sm">
                  <HStack className="items-start justify-between mb-3">
                    <HStack space="md" className="flex-1 items-start">
                      <View className="mt-1">
                        {getIssueIcon(issue.issue_type)}
                      </View>
                      <VStack className="flex-1" space="xs">
                        <Text className="font-semibold text-typography-900 text-base">
                          {getIssueTypeLabel(issue.issue_type)}
                        </Text>
                        <Text className="text-gray-600 text-sm" numberOfLines={2}>
                          {issue.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Box className={`px-3 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                      <Text className="text-xs font-medium">
                        {getStatusLabel(issue.status)}
                      </Text>
                    </Box>
                  </HStack>

                  {/* Status Tracker */}
                  <StatusTracker 
                    currentStatus={issue.status} 
                    createdAt={issue.created_at}
                  />

                  <HStack space="lg" className="mt-2">
                    <HStack space="xs" className="items-center">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-500">
                        {formatDate(issue.created_at)}
                      </Text>
                    </HStack>
                  </HStack>
                </Box>
              </TouchableOpacity>
            ))}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
};

export default MyReports;

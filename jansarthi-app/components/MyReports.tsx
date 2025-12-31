import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, Issue } from '@/services/api';
import { useRouter } from 'expo-router';
import { Construction, Droplet, MapPin, Trash2, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

interface MyReportsProps {}

interface StatusTrackerProps {
  currentStatus: string;
  createdAt: string;
  localityType?: string;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ currentStatus, createdAt, localityType }) => {
  const { t, language, getText } = useLanguage();

  // Determine the representative title based on locality type
  const isWard = localityType === 'ward';
  const repTitle = isWard 
    ? (language === 'hi' ? 'पार्षद' : 'Parshad')
    : (language === 'hi' ? 'प्रधान' : 'Pradhan');

  // New flow stages with all 6 steps:
  // 1. REPORTED → 2. ASSIGNED → 3. REPRESENTATIVE_ACKNOWLEDGED → 4. PWD_WORKING → 5. PWD_COMPLETED → 6. REPRESENTATIVE_REVIEWED
  const stages = [
    { key: 'reported', label: getText(t.status.reported) },
    { key: 'assigned', label: language === 'hi' ? `${repTitle} को सौंपा गया` : `Assigned to ${repTitle}` },
    { key: 'representative_acknowledged', label: language === 'hi' ? `${repTitle} ने स्वीकार किया` : `${repTitle} Acknowledged` },
    { key: 'pwd_working', label: language === 'hi' ? 'PWD काम कर रहा है' : 'PWD Working' },
    { key: 'pwd_completed', label: language === 'hi' ? 'PWD ने पूरा किया' : 'PWD Completed' },
    { key: 'representative_reviewed', label: language === 'hi' ? `${repTitle} ने समीक्षा की` : `${repTitle} Reviewed` },
  ];

  const getCurrentStageIndex = () => {
    const status = currentStatus?.toLowerCase();
    switch (status) {
      case 'reported':
        return 0;
      case 'assigned':
        return 1;
      case 'representative_acknowledged':
        return 2;
      case 'pwd_working':
        return 3;
      case 'pwd_completed':
        return 4;
      case 'representative_reviewed':
        return 5;
      default:
        return 0;
    }
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
      {/* Debug info - remove after testing */}
      {__DEV__ && (
        <Text className="text-xs text-gray-500 mb-2">
          Status: {currentStatus} | Locality: {localityType || 'N/A'} | Stage: {currentStageIndex}
        </Text>
      )}
      
      {/* Vertical Status Tracker */}
      <VStack space="xs">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex; // Only past stages, not current
          const isCurrent = index === currentStageIndex;
          const isLast = index === stages.length - 1;

          return (
            <View key={stage.key}>
              <HStack space="md" className="items-start">
                {/* Circle and Vertical Line */}
                <View className="items-center" style={{ width: 32 }}>
                  <View
                    className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    {(isCompleted || isCurrent) && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      className={`w-0.5 h-8 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </View>

                {/* Label */}
                <View className="flex-1 pb-2">
                  <Text
                    className={`text-sm ${
                      isCurrent
                        ? 'text-blue-700 font-semibold'
                        : isCompleted
                        ? 'text-green-700 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {stage.label}
                  </Text>
                  {index === 0 && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {formatDate(createdAt)}
                    </Text>
                  )}
                  {isCurrent && (
                    <Text className="text-xs text-blue-600 mt-1">
                      {currentStatus === 'representative_reviewed'
                        ? (language === 'hi' ? 'पूर्ण' : 'Completed')
                        : (language === 'hi' ? 'वर्तमान चरण' : 'Current step')}
                    </Text>
                  )}
                </View>
              </HStack>
            </View>
          );
        })}
      </VStack>
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
      case 'assigned':
        return 'bg-orange-100 text-orange-800';
      case 'representative_acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'pwd_working':
        return 'bg-blue-100 text-blue-800';
      case 'pwd_completed':
        return 'bg-green-100 text-green-800';
      case 'representative_reviewed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, localityType?: string) => {
    const isWard = localityType === 'ward';
    const repTitle = isWard 
      ? (language === 'hi' ? 'पार्षद' : 'Parshad')
      : (language === 'hi' ? 'प्रधान' : 'Pradhan');

    switch (status) {
      case 'reported':
        return getText(t.status.reported);
      case 'assigned':
        return language === 'hi' ? `${repTitle} को सौंपा गया` : `Assigned to ${repTitle}`;
      case 'representative_acknowledged':
        return language === 'hi' ? `${repTitle} ने स्वीकार किया` : `${repTitle} Acknowledged`;
      case 'pwd_working':
        return getText(t.status.startedWorking);
      case 'pwd_completed':
        return getText(t.status.pwdCompleted);
      case 'representative_reviewed':
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
                        {getStatusLabel(issue.status, issue.locality_type)}
                      </Text>
                    </Box>
                  </HStack>

                  {/* Status Tracker */}
                  <StatusTracker 
                    currentStatus={issue.status} 
                    createdAt={issue.created_at}
                    localityType={issue.locality_type}
                  />
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

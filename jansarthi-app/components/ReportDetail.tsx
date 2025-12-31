import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiService, Issue } from '@/services/api';
import { Camera, MapView, PointAnnotation } from '@maplibre/maplibre-react-native';
import { Building, Calendar, Construction, Droplet, MapPin, Trash2, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, View } from 'react-native';

interface ReportDetailProps {
  issueId: number;
}

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
    
    // Map each status to its exact stage index
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

const ReportDetail: React.FC<ReportDetailProps> = ({ issueId }) => {
  const { t, language, getText } = useLanguage();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadIssue();
  }, [issueId]);

  const loadIssue = async () => {
    try {
      setError(null);
      const data = await apiService.getIssue(issueId);
      setIssue(data);
    } catch (err) {
      console.error('Failed to load issue:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load issue details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getIssueIcon = (issueType: string) => {
    switch (issueType) {
      case 'water':
        return <Droplet size={32} color="#3b82f6" />;
      case 'electricity':
        return <Zap size={32} color="#eab308" />;
      case 'road':
        return <Construction size={32} color="#ef4444" />;
      case 'garbage':
        return <Trash2 size={32} color="#22c55e" />;
      default:
        return <MapPin size={32} color="#6b7280" />;
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
        return 'bg-red-500';
      case 'assigned':
        return 'bg-orange-500';
      case 'representative_acknowledged':
        return 'bg-yellow-500';
      case 'pwd_working':
        return 'bg-blue-500';
      case 'pwd_completed':
        return 'bg-green-500';
      case 'representative_reviewed':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">{getText(t.reportDetail.loadingDetails)}</Text>
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50 p-4">
        <MapPin size={48} color="#ef4444" />
        <Text className="text-red-600 mt-4 text-center">{error || getText(t.reportDetail.reportNotFound)}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background-50">
      <VStack className="flex-1" space="md">
        <Box>
        <View className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 250 }}>
            <MapView
              style={{ flex: 1 }}
              mapStyle="https://tiles.openfreemap.org/styles/bright"
              logoEnabled={false}
              attributionEnabled={false}
              attributionPosition={{ bottom: 8, left: 8 }}
              compassEnabled={true}
              compassViewPosition={1}
              zoomEnabled={true}
              scrollEnabled={true}
              pitchEnabled={true}
              rotateEnabled={true}
            >
              <Camera
                zoomLevel={16}
                centerCoordinate={[issue.longitude, issue.latitude]}
                animationMode="flyTo"
                animationDuration={1000}
              />

              {/* Issue location marker */}
              <PointAnnotation
                id="issueLocation"
                coordinate={[issue.longitude, issue.latitude]}
                title={getIssueTypeLabel(issue.issue_type)}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#ef4444',
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={20} color="#FFFFFF" />
                </View>
              </PointAnnotation>
            </MapView>
          </View>
          </Box>
        {/* Status Progress */}
        <Box className="bg-white p-4 shadow-sm">
          <Heading size="md" className="text-typography-900 mb-2">
            {getText(t.reportDetail.progressStatus)}
          </Heading>
          <StatusTracker 
            currentStatus={issue.status} 
            createdAt={issue.created_at}
            localityType={issue.locality_type}
          />
        </Box>

        {/* Description */}
        <Box className="bg-white p-4 shadow-sm">
          <Heading size="md" className="text-typography-900 mb-3">
            {getText(t.reportDetail.description)}
          </Heading>
          <Text className="text-gray-700 leading-6">
            {issue.description}
          </Text>
        </Box>

        {/* Completion Information (when work is completed) */}
        {(issue.status === 'pwd_completed' || issue.status === 'representative_reviewed') && 
         issue.completion_description && (
          <Box className="bg-green-50 p-4 shadow-sm border-l-4 border-green-500">
            <Heading size="md" className="text-green-800 mb-3">
              {getText(t.pwd.status.completionDescription)}
            </Heading>
            <Text className="text-green-700 leading-6 mb-3">
              {issue.completion_description}
            </Text>
            {issue.completed_at && (
              <HStack className="items-center" space="sm">
                <Calendar size={16} color="#15803d" />
                <Text className="text-green-600 text-sm">
                  {getText(t.pwd.status.completedAt)}: {formatDateTime(issue.completed_at)}
                </Text>
              </HStack>
            )}
            {issue.completion_photo_url && (
              <View className="mt-3 rounded-lg overflow-hidden border border-green-200">
                <Image
                  source={{ uri: issue.completion_photo_url }}
                  style={{ 
                    width: screenWidth - 32 - 32, 
                    height: 250,
                    resizeMode: 'cover',
                  }}
                />
                <View className="bg-green-100 p-2">
                  <Text className="text-xs text-green-700">
                    {language === 'hi' ? 'पूर्ण किए गए काम की फोटो' : 'Completion Photo'}
                  </Text>
                </View>
              </View>
            )}
          </Box>
        )}

        {/* Attached Photos */}
        {issue.photos && issue.photos.length > 0 && (
          <Box className="bg-white p-4 shadow-sm">
            <Heading size="md" className="text-typography-900 mb-3">
              {getText(t.reportDetail.attachedPhotos)} ({issue.photos.length})
            </Heading>
            <VStack space="md">
              {issue.photos.map((photo) => (
                <View key={photo.id} className="rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    source={{ uri: photo.photo_url }}
                    style={{ 
                      width: screenWidth - 32 - 32, 
                      height: 300,
                      resizeMode: 'cover',
                    }}
                  />
                  <View className="bg-gray-50 p-2">
                    <Text className="text-xs text-gray-500">
                      {photo.filename}
                    </Text>
                  </View>
                </View>
              ))}
            </VStack>
          </Box>
        )}

        {/* Report Information */}
        <Box className="bg-white p-4 shadow-sm mb-4">
          <Heading size="md" className="text-typography-900 mb-3">
            {getText(t.reportDetail.reportInformation)}
          </Heading>
          <VStack space="md">
            {/* Locality Information */}
            {(issue.locality_id || issue.locality_name) && (
              <HStack className="items-center" space="sm">
                <Building size={18} color="#6b7280" />
                <VStack className="flex-1">
                  <Text className="text-xs text-gray-500">{getText(t.locality.locality)}</Text>
                  <Text className="text-gray-800 font-medium">
                    {issue.locality_name || `${getText(t.locality.locality)} ${issue.locality_id}`}
                  </Text>
                </VStack>
              </HStack>
            )}
            <HStack className="items-center" space="sm">
              <Calendar size={18} color="#6b7280" />
              <VStack className="flex-1">
                <Text className="text-xs text-gray-500">{getText(t.reportDetail.reportedOn)}</Text>
                <Text className="text-gray-800 font-medium">
                  {formatDateTime(issue.created_at)}
                </Text>
              </VStack>
            </HStack>
            <HStack className="items-center" space="sm">
              <Calendar size={18} color="#6b7280" />
              <VStack className="flex-1">
                <Text className="text-xs text-gray-500">{getText(t.reportDetail.lastUpdated)}</Text>
                <Text className="text-gray-800 font-medium">
                  {formatDateTime(issue.updated_at)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </ScrollView>
  );
};

export default ReportDetail;

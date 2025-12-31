import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiService, ParshadIssue } from "@/services/api";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  Construction,
  Droplet,
  RefreshCw,
  Trash2,
  User,
  X,
  Zap
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export const ParshadIssueDetail: React.FC = () => {
  const { t, getText } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [issue, setIssue] = useState<ParshadIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For status update with photos
  const [progressNotes, setProgressNotes] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        if (photo && photo.uri) {
          setSelectedPhotos((prev) => [...prev, photo.uri].slice(0, 5));
          setShowCamera(false);
        }
      } catch (err) {
        console.error("Error taking photo:", err);
        Alert.alert("Error", "Failed to capture photo");
      }
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission required", "Please grant access to your camera");
        return;
      }
    }
    setShowCamera(true);
  };

  const fetchIssue = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      // Fetch the specific issue using the detail API
      const foundIssue = await apiService.getParshadIssueDetail(parseInt(id));
      setIssue(foundIssue);
    } catch (err) {
      console.error("Failed to fetch issue:", err);
      setError(err instanceof Error ? err.message : "Failed to load issue");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

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
        return { bg: "bg-warning-100", text: "text-warning-700" };
      case "representative_acknowledged":
        return { bg: "bg-info-100", text: "text-info-700" };
      case "pwd_working":
        return { bg: "bg-primary-100", text: "text-primary-700" };
      case "pwd_completed":
        return { bg: "bg-amber-100", text: "text-amber-700" };
      case "representative_reviewed":
        return { bg: "bg-success-100", text: "text-success-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
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
        return getText(t.parshad.status.pendingReview);
      case "representative_reviewed":
        return getText(t.status.finishedWork);
      default:
        return status;
    }
  };

  const handleAcknowledge = async () => {
    if (!issue) return;

    Alert.alert(
      getText(t.parshad.issues.acknowledge),
      getText(t.parshad.status.acknowledgeConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.parshad.issues.acknowledge),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await apiService.acknowledgeIssue(issue.id);
              await fetchIssue();
              Alert.alert("Success", getText(t.parshad.status.statusUpdated));
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to acknowledge");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewAndClose = async () => {
    if (!issue) return;

    Alert.alert(
      getText(t.parshad.issues.reviewAndClose),
      getText(t.parshad.status.reviewConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.parshad.issues.reviewAndClose),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await apiService.reviewIssue(issue.id);
              await fetchIssue();
              Alert.alert("Success", getText(t.parshad.status.issueResolved));
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to review");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStartWork = async () => {
    if (!issue) return;

    Alert.alert(
      getText(t.parshad.issues.startWork),
      getText(t.parshad.status.startWorkConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.parshad.issues.startWork),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await apiService.startWorkOnIssue(issue.id);
              await fetchIssue();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to start work");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompleteWithPhotos = async () => {
    if (!issue) return;

    if (selectedPhotos.length === 0) {
      Alert.alert("Photos Required", "Please add at least one photo as proof of work completion");
      return;
    }

    Alert.alert(
      getText(t.parshad.issues.markComplete),
      getText(t.parshad.status.completeConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.parshad.issues.markComplete),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              
              // Convert photo URIs to the expected format
              const photos = selectedPhotos.map((uri, index) => ({
                uri,
                name: `photo_${index}.jpg`,
                type: 'image/jpeg',
              }));
              
              await apiService.updateIssueWithPhotos({
                issueId: issue.id,
                new_status: "representative_reviewed",
                progress_notes: progressNotes || undefined,
                photos,
              });
              setSelectedPhotos([]);
              setProgressNotes("");
              setShowUpdateForm(false);
              await fetchIssue();
              Alert.alert("Success", getText(t.parshad.status.statusUpdated));
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to complete");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-typography-600">Loading...</Text>
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View className="flex-1 bg-background-50">
        <View className="bg-brand-500 px-6 pt-16 pb-6">
          <HStack className="items-center" space="md">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <Heading size="lg" className="text-typography-white">
              {getText(t.parshad.issueDetail.title)}
            </Heading>
          </HStack>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={48} className="text-error-500 mb-4" />
          <Text className="text-error-700 text-center">{error || "Issue not found"}</Text>
          <Pressable
            onPress={fetchIssue}
            className="mt-4 bg-primary-500 rounded-lg px-6 py-3"
          >
            <Text className="text-typography-white">{getText(t.actions.tryAgain)}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const Icon = getIssueTypeIcon(issue.issue_type);
  const statusColors = getStatusColor(issue.status);

  // New flow: Parshad can only acknowledge and review (PWD workers handle the actual work)
  const canAcknowledge = issue.status === "assigned";
  const canReview = issue.status === "pwd_completed";

  return (
    <View className="flex-1 bg-background-50">
      {/* Header */}
      <View className="bg-brand-500 px-6 pt-16 pb-6">
        <HStack className="items-center" space="md">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Heading size="lg" className="text-typography-white flex-1">
            {getText(t.parshad.issueDetail.title)}
          </Heading>
        </HStack>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Issue Type Card */}
        <View className="px-4 -mt-4">
          <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
            <HStack className="items-center" space="md">
              <Box className="bg-primary-50 rounded-xl p-4">
                <Icon size={32} className="text-primary-600" />
              </Box>
              <VStack className="flex-1" space="xs">
                <Heading size="lg" className="text-typography-900">
                  {getIssueTypeLabel(issue.issue_type)}
                </Heading>
                <Box className={`px-3 py-1 rounded-full self-start ${statusColors.bg}`}>
                  <Text className={`text-sm font-medium ${statusColors.text}`}>
                    {getStatusLabel(issue.status)}
                  </Text>
                </Box>
              </VStack>
            </HStack>
          </Box>
        </View>

        {/* Description */}
        <View className="px-4 mt-4">
          <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
            <Heading size="sm" className="text-typography-700 mb-2">
              {getText(t.form.description)}
            </Heading>
            <Text className="text-typography-600">{issue.description}</Text>
          </Box>
        </View>

        {/* Reporter Info */}
        {issue.reporter && (
          <View className="px-4 mt-4">
            <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
              <HStack className="items-center" space="md">
                <Box className="bg-info-50 rounded-full p-3">
                  <User size={20} className="text-info-600" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-typography-500 text-sm">
                    {getText(t.parshad.issueDetail.reportedBy)}
                  </Text>
                  <Text className="text-typography-900 font-medium">
                    {issue.reporter.name}
                  </Text>
                  <Text className="text-typography-400 text-xs">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </View>
        )}

        {/* Assignment Notes */}
        {issue.assignment_notes && (
          <View className="px-4 mt-4">
            <Box className="bg-warning-50 rounded-2xl p-4 border border-warning-200">
              <Heading size="sm" className="text-warning-700 mb-2">
                {getText(t.parshad.issueDetail.assignmentNotes)}
              </Heading>
              <Text className="text-warning-800">{issue.assignment_notes}</Text>
            </Box>
          </View>
        )}

        {/* Progress Notes */}
        {issue.progress_notes && (
          <View className="px-4 mt-4">
            <Box className="bg-info-50 rounded-2xl p-4 border border-info-200">
              <Heading size="sm" className="text-info-700 mb-2">
                {getText(t.parshad.issueDetail.progressNotes)}
              </Heading>
              <Text className="text-info-800">{issue.progress_notes}</Text>
            </Box>
          </View>
        )}

        {/* PWD Completion Info (shown when work is completed) */}
        {issue.completion_description && (
          <View className="px-4 mt-4">
            <Box className="bg-success-50 rounded-2xl p-4 border border-success-200">
              <Heading size="sm" className="text-success-700 mb-2">
                {getText(t.pwd.status.completionDescription)}
              </Heading>
              <Text className="text-success-800 mb-3">{issue.completion_description}</Text>
              
              {issue.completed_by_name && (
                <HStack className="items-center mb-2" space="sm">
                  <User size={16} className="text-success-600" />
                  <Text className="text-success-700 text-sm">
                    {getText(t.pwd.status.completedBy)}: {issue.completed_by_name}
                  </Text>
                </HStack>
              )}
              
              {issue.completed_at && (
                <HStack className="items-center" space="sm">
                  <Clock size={16} className="text-success-600" />
                  <Text className="text-success-700 text-sm">
                    {getText(t.pwd.status.completedAt)}: {new Date(issue.completed_at).toLocaleDateString()}
                  </Text>
                </HStack>
              )}
              
              {issue.completion_photo_url && (
                <View className="mt-3 rounded-xl overflow-hidden border border-success-200">
                  <Image
                    source={{ uri: issue.completion_photo_url }}
                    style={{ width: '100%', height: 200 }}
                    resizeMode="cover"
                  />
                </View>
              )}
            </Box>
          </View>
        )}

        {/* Attached Photos */}
        {issue.photos && issue.photos.length > 0 && (
          <View className="px-4 mt-4">
            <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
              <Heading size="sm" className="text-typography-700 mb-3">
                {getText(t.reportDetail.attachedPhotos)}
              </Heading>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <HStack space="sm">
                  {issue.photos.map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      className="w-24 h-24 rounded-xl"
                      resizeMode="cover"
                    />
                  ))}
                </HStack>
              </ScrollView>
            </Box>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!showUpdateForm && (canAcknowledge || canReview) && (
        <View className="absolute bottom-0 left-0 right-0 bg-background-0 border-t border-outline-100 px-4 py-4 pb-8">
          {canAcknowledge && (
            <Button
              onPress={handleAcknowledge}
              isDisabled={isActionLoading}
              className="bg-info-600"
              size="lg"
            >
              <HStack className="items-center" space="sm">
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Clock size={20} color="#fff" />
                    <ButtonText>{getText(t.parshad.issues.acknowledge)}</ButtonText>
                  </>
                )}
              </HStack>
            </Button>
          )}

          {canReview && (
            <Button
              onPress={handleReviewAndClose}
              isDisabled={isActionLoading}
              className="bg-success-600"
              size="lg"
            >
              <HStack className="items-center" space="sm">
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <ButtonText>{getText(t.parshad.issues.reviewAndClose)}</ButtonText>
                  </>
                )}
              </HStack>
            </Button>
          )}
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
          >
            {/* Camera Controls */}
            <View className="absolute top-16 left-0 right-0 px-6">
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                className="bg-black/50 rounded-full p-3 self-start"
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="absolute bottom-12 left-0 right-0 px-6">
              <HStack className="justify-center items-center" space="xl">
                {/* Flip Camera */}
                <TouchableOpacity
                  onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
                  className="bg-white/20 rounded-full p-4"
                >
                  <RefreshCw size={24} color="#fff" />
                </TouchableOpacity>

                {/* Capture Button */}
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="bg-white rounded-full p-6 border-4 border-primary-500"
                >
                  <Camera size={32} className="text-primary-600" />
                </TouchableOpacity>

                {/* Placeholder for symmetry */}
                <View className="w-14" />
              </HStack>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
};

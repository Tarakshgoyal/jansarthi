import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
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
  HardHat,
  MapPin,
  PlayCircle,
  RefreshCw,
  Trash2,
  User,
  X,
  Zap,
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

export const PWDIssueDetail: React.FC = () => {
  const { t, getText } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [issue, setIssue] = useState<ParshadIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For work completion with notes
  const [workNotes, setWorkNotes] = useState("");
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
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
      const foundIssue = await apiService.getPWDIssueDetail(parseInt(id));
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
      case "parshad_acknowledged":
      case "parshad_check":
        return { bg: "bg-warning-100", text: "text-warning-700" };
      case "pwd_working":
      case "started_working":
        return { bg: "bg-primary-100", text: "text-primary-700" };
      case "pwd_completed":
        return { bg: "bg-info-100", text: "text-info-700" };
      case "parshad_reviewed":
      case "finished_work":
        return { bg: "bg-success-100", text: "text-success-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "parshad_acknowledged":
      case "parshad_check":
        return getText(t.pwd.status.pendingWork);
      case "pwd_working":
      case "started_working":
        return getText(t.pwd.status.inProgress);
      case "pwd_completed":
        return getText(t.pwd.status.pendingReview);
      case "parshad_reviewed":
      case "finished_work":
        return getText(t.pwd.status.completed);
      default:
        return status;
    }
  };

  const handleStartWork = async () => {
    if (!issue) return;

    Alert.alert(
      getText(t.pwd.issues.startWork),
      getText(t.pwd.status.startWorkConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.pwd.issues.startWork),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await apiService.pwdStartWork(issue.id);
              await fetchIssue();
              Alert.alert("Success", getText(t.pwd.status.statusUpdated));
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

  const handleCompleteWork = async () => {
    if (!issue) return;

    Alert.alert(
      getText(t.pwd.issues.completeWork),
      getText(t.pwd.status.completeWorkConfirm),
      [
        { text: getText(t.actions.cancel), style: "cancel" },
        {
          text: getText(t.pwd.issues.completeWork),
          onPress: async () => {
            try {
              setIsActionLoading(true);
              await apiService.pwdCompleteWork(issue.id, workNotes || undefined);
              setWorkNotes("");
              setSelectedPhotos([]);
              setShowCompletionForm(false);
              await fetchIssue();
              Alert.alert("Success", getText(t.pwd.status.statusUpdated));
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to complete work");
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
        <ActivityIndicator size="large" color="#d97706" />
        <Text className="mt-4 text-typography-600">Loading...</Text>
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View className="flex-1 bg-background-50">
        <View className="bg-amber-600 px-6 pt-16 pb-6">
          <HStack className="items-center" space="md">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <Heading size="lg" className="text-typography-white">
              {getText(t.pwd.issueDetail.title)}
            </Heading>
          </HStack>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={48} className="text-error-500 mb-4" />
          <Text className="text-error-700 text-center">{error || "Issue not found"}</Text>
          <Pressable
            onPress={fetchIssue}
            className="mt-4 bg-amber-600 rounded-lg px-6 py-3"
          >
            <Text className="text-typography-white">{getText(t.actions.tryAgain)}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const Icon = getIssueTypeIcon(issue.issue_type);
  const statusColors = getStatusColor(issue.status);

  const canStartWork = issue.status === "parshad_acknowledged" || issue.status === "parshad_check";
  const canCompleteWork = issue.status === "pwd_working" || issue.status === "started_working";
  const isCompleted = issue.status === "pwd_completed" || issue.status === "parshad_reviewed" || issue.status === "finished_work";

  return (
    <View className="flex-1 bg-background-50">
      {/* Header */}
      <View className="bg-amber-600 px-6 pt-16 pb-6">
        <HStack className="items-center" space="md">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Heading size="lg" className="text-typography-white flex-1">
            {getText(t.pwd.issueDetail.title)}
          </Heading>
        </HStack>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Issue Type Card */}
        <View className="px-4 -mt-4">
          <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
            <HStack className="items-center" space="md">
              <Box className="bg-amber-50 rounded-xl p-4">
                <Icon size={32} className="text-amber-600" />
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

        {/* Parshad Info */}
        {issue.assigned_parshad && (
          <View className="px-4 mt-4">
            <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
              <HStack className="items-center" space="md">
                <Box className="bg-brand-50 rounded-full p-3">
                  <User size={20} className="text-brand-600" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-typography-500 text-sm">
                    {getText(t.pwd.issueDetail.parshad)}
                  </Text>
                  <Text className="text-typography-900 font-medium">
                    {issue.assigned_parshad.name}
                  </Text>
                  {issue.assigned_parshad.village_name && (
                    <Text className="text-typography-400 text-xs">
                      {issue.assigned_parshad.village_name}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          </View>
        )}

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
                    {getText(t.pwd.issueDetail.reportedBy)}
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

        {/* Progress Notes */}
        {issue.progress_notes && (
          <View className="px-4 mt-4">
            <Box className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <Heading size="sm" className="text-amber-700 mb-2">
                {getText(t.pwd.issueDetail.progressNotes)}
              </Heading>
              <Text className="text-amber-800">{issue.progress_notes}</Text>
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

        {/* Work Completion Form */}
        {showCompletionForm && canCompleteWork && (
          <View className="px-4 mt-4">
            <Box className="bg-background-0 rounded-2xl p-4 border border-outline-100">
              <Heading size="md" className="text-typography-900 mb-4">
                {getText(t.pwd.issues.completeWork)}
              </Heading>

              {/* Work Notes */}
              <VStack space="xs" className="mb-4">
                <Text className="text-typography-700 font-medium">
                  {getText(t.pwd.issueDetail.workNotes)}
                </Text>
                <Textarea>
                  <TextareaInput
                    placeholder={getText(t.pwd.issueDetail.workNotesPlaceholder)}
                    value={workNotes}
                    onChangeText={setWorkNotes}
                    className="bg-background-50"
                  />
                </Textarea>
              </VStack>

              {/* Photo Attachment (optional) */}
              <VStack space="sm" className="mb-4">
                <Text className="text-typography-700 font-medium">
                  {getText(t.pwd.issueDetail.attachPhotos)}
                </Text>
                <Text className="text-typography-500 text-sm">
                  {getText(t.pwd.issueDetail.attachPhotosDesc)}
                </Text>

                {/* Selected Photos */}
                {selectedPhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack space="sm" className="py-2">
                      {selectedPhotos.map((uri, index) => (
                        <View key={index} className="relative">
                          <Image
                            source={{ uri }}
                            className="w-20 h-20 rounded-xl"
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => handleRemovePhoto(index)}
                            className="absolute -top-2 -right-2 bg-error-500 rounded-full p-1"
                          >
                            <X size={14} color="#fff" />
                          </Pressable>
                        </View>
                      ))}
                    </HStack>
                  </ScrollView>
                )}

                {selectedPhotos.length < 5 && (
                  <Pressable
                    onPress={openCamera}
                    className="bg-amber-50 rounded-xl p-4 items-center"
                  >
                    <Camera size={24} className="text-amber-600 mb-2" />
                    <Text className="text-amber-600 text-sm">{getText(t.camera.takePhoto)}</Text>
                  </Pressable>
                )}
              </VStack>

              {/* Submit Button */}
              <Button
                onPress={handleCompleteWork}
                isDisabled={isActionLoading}
                className="bg-success-600"
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ButtonText>{getText(t.pwd.issues.completeWork)}</ButtonText>
                )}
              </Button>

              {/* Cancel */}
              <Pressable
                onPress={() => {
                  setShowCompletionForm(false);
                  setSelectedPhotos([]);
                  setWorkNotes("");
                }}
                className="mt-3"
              >
                <Text className="text-typography-500 text-center">
                  {getText(t.actions.cancel)}
                </Text>
              </Pressable>
            </Box>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!showCompletionForm && (canStartWork || canCompleteWork) && (
        <View className="absolute bottom-0 left-0 right-0 bg-background-0 border-t border-outline-100 px-4 py-4 pb-8">
          {canStartWork && (
            <Button
              onPress={handleStartWork}
              isDisabled={isActionLoading}
              className="bg-amber-600"
              size="lg"
            >
              <HStack className="items-center" space="sm">
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <PlayCircle size={20} color="#fff" />
                    <ButtonText>{getText(t.pwd.issues.startWork)}</ButtonText>
                  </>
                )}
              </HStack>
            </Button>
          )}

          {canCompleteWork && (
            <Button
              onPress={() => setShowCompletionForm(true)}
              isDisabled={isActionLoading}
              className="bg-success-600"
              size="lg"
            >
              <HStack className="items-center" space="sm">
                <CheckCircle size={20} color="#fff" />
                <ButtonText>{getText(t.pwd.issues.completeWork)}</ButtonText>
              </HStack>
            </Button>
          )}
        </View>
      )}

      {/* Completed Status */}
      {isCompleted && (
        <View className="absolute bottom-0 left-0 right-0 bg-success-50 border-t border-success-200 px-4 py-4 pb-8">
          <HStack className="items-center justify-center" space="sm">
            <CheckCircle size={24} className="text-success-600" />
            <Text className="text-success-700 font-medium text-center">
              {issue.status === "pwd_completed" 
                ? getText(t.pwd.status.awaitingReview)
                : getText(t.pwd.status.issueResolved)}
            </Text>
          </HStack>
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
                  className="bg-white rounded-full p-6 border-4 border-amber-500"
                >
                  <Camera size={32} className="text-amber-600" />
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

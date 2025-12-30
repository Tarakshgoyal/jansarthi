import { useLanguage } from "@/contexts/LanguageContext";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { RotateCcw } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Alert, Modal, TouchableOpacity } from "react-native";
import { Box } from "./ui/box";
import { Button, ButtonIcon, ButtonText } from "./ui/button";
import { HStack } from "./ui/hstack";
import { Icon } from "./ui/icon";
import { Image } from "./ui/image";
import { Pressable } from "./ui/pressable";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";

interface PhotoCaptureProps {
  maxPhotos?: number;
  onPhotosChange: (photos: string[]) => void;
}

/**
 * PhotoCapture Component
 * Allows users to capture photos using the device camera
 * and attach them to issue reports
 */
const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  maxPhotos = 3,
  onPhotosChange,
}) => {
  const { getText, t } = useLanguage();
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  // Handle taking a picture
  const takePicture = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        if (photo && photo.uri) {
          const newPhotos = [...photos, photo.uri];
          setPhotos(newPhotos);
          onPhotosChange(newPhotos);
          setShowCamera(false);
        }
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to capture photo. Please try again.", [
          { text: "OK" },
        ]);
      }
    }
  };

  // Handle removing a photo
  const removePhoto = (index: number): void => {
    Alert.alert(
      getText(t.camera.removePhoto),
      "Are you sure you want to remove this photo?",
      [
        {
          text: getText(t.actions.cancel),
          style: "cancel",
        },
        {
          text: getText(t.actions.delete),
          style: "destructive",
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
            onPhotosChange(newPhotos);
          },
        },
      ]
    );
  };

  // Toggle camera facing
  const toggleCameraFacing = (): void => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Open camera
  const openCamera = (): void => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        getText(t.camera.maxPhotosReached),
        `You can only attach up to ${maxPhotos} photos.`,
        [{ text: "OK" }]
      );
      return;
    }
    setShowCamera(true);
  };

  // Close camera
  const closeCamera = (): void => {
    setShowCamera(false);
  };

  // Check if permission is loading
  if (!permission) {
    return (
      <VStack className="bg-background-50 p-4 rounded-lg" space="md">
        <Text size="sm" className="text-typography-500">
          Loading camera...
        </Text>
      </VStack>
    );
  }

  // Show permission request UI
  if (!permission.granted) {
    return (
      <VStack className="bg-background-50 p-4 rounded-lg" space="md">
        <VStack space="sm">
          <Text size="md" className="text-typography-700 font-bold">
            {getText(t.camera.attachPhotos)}
          </Text>
          <Text size="sm" className="text-typography-500">
            {getText(t.camera.cameraPermission)}
          </Text>
        </VStack>
        <Button
          action="primary"
          size="md"
          onPress={requestPermission}
          className="w-full rounded-md"
        >
          <ButtonText>{getText(t.camera.grantPermission)}</ButtonText>
        </Button>
      </VStack>
    );
  }

  return (
    <VStack space="md">
      {/* Header */}
      <VStack space="xs">
        <Text size="md" className="text-typography-700 font-medium">
          {getText(t.camera.attachPhotos)}
        </Text>
        <Text size="sm" className="text-typography-500">
          {getText(t.camera.attachPhotosDesc)}
        </Text>
      </VStack>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <HStack space="md" className="flex-wrap">
          {photos.map((photo, index) => (
            <Box
              key={index}
              className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-outline-200"
            >
              <Image
                source={{ uri: photo }}
                alt={`Photo ${index + 1}`}
                className="w-full h-full"
                resizeMode="cover"
              />
              {/* Remove Button */}
              <Pressable
                onPress={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-error-500 rounded-full p-1"
              >
                <Icon
                  as={() => (
                    <Text className="text-white text-xs font-bold">✕</Text>
                  )}
                  size="xs"
                  className="text-white"
                />
              </Pressable>
            </Box>
          ))}
        </HStack>
      )}

      {/* Add Photo Button */}
      {photos.length < maxPhotos && (
        <Button
          action="secondary"
          variant="outline"
          size="md"
          onPress={openCamera}
          className="w-full"
        >
          <ButtonText>
            {photos.length === 0
              ? getText(t.camera.takePhoto)
              : getText(t.camera.addPhoto)}
          </ButtonText>
        </Button>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCamera}
      >
        <Box className="flex-1 bg-black">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            mirror={facing === "front"}
          >
            {/* Camera Controls Overlay */}
            <VStack className="flex-1 justify-between">
              {/* Top Bar */}
              <HStack className="justify-between items-center p-4 pt-12 bg-black/30">
                <Button
                  action="secondary"
                  variant="solid"
                  size="sm"
                  onPress={closeCamera}
                  className="bg-white/20"
                >
                  <ButtonText className="text-white">
                    {getText(t.actions.cancel)}
                  </ButtonText>
                </Button>
                <Text className="text-white font-medium">
                  {photos.length + 1} / {maxPhotos}
                </Text>
              </HStack>

              {/* Bottom Controls */}
              <HStack className="justify-around items-center p-8 bg-black/30">
                {/* Spacer */}
                <Box className="w-16" />

                {/* Capture Button */}
                <TouchableOpacity
                  onPress={takePicture}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/30 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Box className="w-16 h-16 rounded-full bg-white" />
                </TouchableOpacity>

                {/* Flip Camera Button */}
                <Button
                  action="secondary"
                  variant="solid"
                  size="md"
                  onPress={toggleCameraFacing}
                  className="bg-white/20 w-16 h-16 rounded-full"
                >
                  <ButtonIcon as={() => <Text className="text-2xl"><RotateCcw/></Text>} />
                </Button>
              </HStack>
            </VStack>
          </CameraView>
        </Box>
      </Modal>
    </VStack>
  );
};

export default PhotoCapture;

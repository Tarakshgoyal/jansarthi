import { Ward } from "@/config/wards";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiService } from "@/services/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";
import LocationMap from "./LocationMap";
import PhotoCapture from "./PhotoCapture";
import { Button, ButtonText } from "./ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "./ui/form-control";
import { Text } from "./ui/text";
import { Textarea, TextareaInput } from "./ui/textarea";
import { VStack } from "./ui/vstack";

interface WaterIssueProps {
  // Props will be added later
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const WaterIssue: React.FC<WaterIssueProps> = () => {
  const { getText, t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wardError, setWardError] = useState<string | null>(null);

  const handleLocationChange = (coords: LocationCoords) => {
    setLocation(coords);
    console.log("Water Issue Location:", coords);
  };

  const handlePhotosChange = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    console.log("Water Issue Photos:", newPhotos);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    setWardError(null);
    console.log("Water Issue Ward:", ward);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setWardError(null);

      // Validate form
      if (!description.trim()) {
        setError(language === "hi" ? "कृपया विवरण प्रदान करें" : "Please provide a description");
        return;
      }

      if (!location) {
        setError(language === "hi" ? "कृपया मानचित्र पर स्थान चुनें" : "Please select a location on the map");
        return;
      }

      if (!selectedWard) {
        setWardError(language === "hi" ? "कृपया अपना वार्ड चुनें" : "Please select your ward");
        return;
      }

      setIsSubmitting(true);

      // Prepare photos for upload
      const photoData = photos.map((uri, index) => ({
        uri,
        name: `water_issue_${Date.now()}_${index}.jpg`,
        type: 'image/jpeg',
      }));

      // Create issue via API
      const issue = await apiService.createIssue({
        issue_type: 'water',
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        ward_id: selectedWard.id,
        ward_name: language === "hi" ? selectedWard.nameHindi : selectedWard.name,
        photos: photoData.length > 0 ? photoData : undefined,
      });

      console.log("Water issue created successfully:", issue);

      // Show success message
      Alert.alert(
        "Success",
        "Water issue reported successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setDescription("");
      setPhotos([]);
      setSelectedWard(null);
    } catch (err) {
      console.error("Failed to submit water issue:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit issue";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background-50">
      <VStack className="flex-1 p-4" space="2xl">
        {/* Map Component */}
        <VStack space="sm">
          <LocationMap height={300} onLocationChange={handleLocationChange} />
        </VStack>

        {/* Issue Details Form */}
        <VStack space="md">
          {/* Description Field */}
          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText className="text-typography-700 font-bold">
                {getText(t.form.description)}
              </FormControlLabelText>
            </FormControlLabel>
            <Textarea size="md" className="min-h-32 bg-white">
              <TextareaInput
                placeholder={getText(t.form.descriptionPlaceholder)}
                value={description}
                onChangeText={setDescription}
                className="text-typography-900"
                placeholderTextColor="#0000"
              />
            </Textarea>
          </FormControl>
        </VStack>

        {/* Photo Capture Component */}
        <PhotoCapture maxPhotos={3} onPhotosChange={handlePhotosChange} />

        {/* Error Message */}
        {error && (
          <Text className="text-red-500 text-center">{error}</Text>
        )}

        {/* Submit Button */}
        <Button
          action="primary"
          size="lg"
          onPress={handleSubmit}
          isDisabled={isSubmitting}
          className="w-full rounded-md"
        >
          <ButtonText>
            {isSubmitting ? "Submitting..." : getText(t.actions.submit)}
          </ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
};

export default WaterIssue;

import { useLanguage } from "@/contexts/LanguageContext";
import { getWardMapUrl, Ward, WARDS } from "@/config/wards";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  Modal,
  TouchableOpacity,
  View,
  Linking,
  TextInput,
} from "react-native";
import { Box } from "./ui/box";
import { Button, ButtonText } from "./ui/button";
import { Heading } from "./ui/heading";
import { HStack } from "./ui/hstack";
import { Pressable } from "./ui/pressable";
import { Text } from "./ui/text";
import { VStack } from "./ui/vstack";
import {
  ChevronDown,
  MapPin,
  Phone,
  Search,
  User,
  X,
  Map,
} from "lucide-react-native";

interface WardSelectorProps {
  selectedWard: Ward | null;
  onWardSelect: (ward: Ward) => void;
  error?: string;
}

/**
 * WardSelector Component
 * A dropdown/modal selector for Dehradun wards with search functionality
 */
const WardSelector: React.FC<WardSelectorProps> = ({
  selectedWard,
  onWardSelect,
  error,
}) => {
  const { getText, language } = useLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWards = useMemo(() => {
    if (!searchQuery.trim()) {
      return WARDS;
    }
    const query = searchQuery.toLowerCase();
    return WARDS.filter(
      (ward) =>
        ward.name.toLowerCase().includes(query) ||
        ward.nameHindi.includes(searchQuery) ||
        ward.id.toString() === query
    );
  }, [searchQuery]);

  const getWardDisplayName = (ward: Ward) => {
    return language === "hi" ? ward.nameHindi : ward.name;
  };

  const handleSelectWard = (ward: Ward) => {
    onWardSelect(ward);
    setIsModalVisible(false);
    setSearchQuery("");
  };

  const handleViewMap = (ward: Ward) => {
    const mapUrl = getWardMapUrl(ward.id);
    Linking.openURL(mapUrl);
  };

  const handleCallParshad = (ward: Ward) => {
    if (ward.phone) {
      Linking.openURL(`tel:${ward.phone}`);
    }
  };

  const renderWardItem = ({ item }: { item: Ward }) => (
    <Pressable
      onPress={() => handleSelectWard(item)}
      className="bg-background-0 border border-outline-100 rounded-xl p-4 mb-3"
    >
      <HStack className="justify-between items-start">
        <VStack className="flex-1" space="xs">
          <HStack className="items-center" space="sm">
            <Box className="bg-primary-100 rounded-full px-2 py-1">
              <Text className="text-primary-700 text-xs font-bold">
                #{item.id}
              </Text>
            </Box>
            <Text className="text-typography-900 font-semibold flex-1">
              {getWardDisplayName(item)}
            </Text>
          </HStack>

          <HStack className="items-center" space="xs">
            <User size={14} className="text-typography-500" />
            <Text className="text-typography-600 text-sm" numberOfLines={1}>
              {item.parshadName}
            </Text>
          </HStack>

          <HStack className="items-center" space="xs">
            <MapPin size={14} className="text-typography-400" />
            <Text
              className="text-typography-500 text-xs flex-1"
              numberOfLines={1}
            >
              {item.address}
            </Text>
          </HStack>
        </VStack>

        <HStack space="sm">
          {/* View Map Button */}
          <TouchableOpacity
            onPress={() => handleViewMap(item)}
            className="bg-info-50 rounded-full p-2"
          >
            <Map size={18} className="text-info-600" />
          </TouchableOpacity>

          {/* Call Button */}
          {item.phone && (
            <TouchableOpacity
              onPress={() => handleCallParshad(item)}
              className="bg-success-50 rounded-full p-2"
            >
              <Phone size={18} className="text-success-600" />
            </TouchableOpacity>
          )}
        </HStack>
      </HStack>
    </Pressable>
  );

  return (
    <VStack space="sm">
      {/* Label */}
      <Text className="text-typography-700 font-bold">
        {language === "hi" ? "वार्ड चुनें" : "Select Ward"} *
      </Text>

      {/* Selector Button */}
      <Pressable
        onPress={() => setIsModalVisible(true)}
        className={`bg-white border ${
          error ? "border-error-500" : "border-outline-200"
        } rounded-xl p-4`}
      >
        <HStack className="justify-between items-center">
          {selectedWard ? (
            <HStack className="items-center flex-1" space="sm">
              <Box className="bg-primary-100 rounded-full px-2 py-1">
                <Text className="text-primary-700 text-xs font-bold">
                  #{selectedWard.id}
                </Text>
              </Box>
              <VStack className="flex-1">
                <Text className="text-typography-900 font-medium">
                  {getWardDisplayName(selectedWard)}
                </Text>
                <Text className="text-typography-500 text-xs" numberOfLines={1}>
                  {selectedWard.parshadName}
                </Text>
              </VStack>
            </HStack>
          ) : (
            <Text className="text-typography-400">
              {language === "hi" ? "अपना वार्ड चुनें..." : "Select your ward..."}
            </Text>
          )}
          <ChevronDown size={20} className="text-typography-400" />
        </HStack>
      </Pressable>

      {/* Error Message */}
      {error && <Text className="text-error-500 text-sm">{error}</Text>}

      {/* Selected Ward Info */}
      {selectedWard && (
        <Box className="bg-primary-50 rounded-xl p-3 mt-1">
          <HStack className="justify-between items-center">
            <VStack>
              <Text className="text-primary-800 text-sm font-medium">
                {language === "hi" ? "पार्षद" : "Parshad"}: {selectedWard.parshadName}
              </Text>
              {selectedWard.phone && (
                <Text className="text-primary-600 text-xs">
                  📞 {selectedWard.phone}
                </Text>
              )}
            </VStack>
            <TouchableOpacity
              onPress={() => handleViewMap(selectedWard)}
              className="bg-primary-100 rounded-lg px-3 py-2"
            >
              <HStack className="items-center" space="xs">
                <Map size={14} className="text-primary-700" />
                <Text className="text-primary-700 text-xs font-medium">
                  {language === "hi" ? "नक्शा देखें" : "View Map"}
                </Text>
              </HStack>
            </TouchableOpacity>
          </HStack>
        </Box>
      )}

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-background-50">
          {/* Header */}
          <View className="bg-brand-500 px-6 pt-16 pb-6">
            <HStack className="justify-between items-center">
              <Heading size="xl" className="text-typography-white">
                {language === "hi" ? "वार्ड चुनें" : "Select Ward"}
              </Heading>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setSearchQuery("");
                }}
                className="bg-white/20 rounded-full p-2"
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </HStack>

            {/* Search Bar */}
            <View className="mt-4 bg-white rounded-xl flex-row items-center px-4 py-3">
              <Search size={20} className="text-typography-400" />
              <TextInput
                placeholder={
                  language === "hi"
                    ? "वार्ड का नाम या नंबर खोजें..."
                    : "Search ward name or number..."
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 py-1 text-typography-900"
                placeholderTextColor="#9ca3af"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} className="text-typography-400" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ward List */}
          <FlatList
            data={filteredWards}
            renderItem={renderWardItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Box className="items-center py-10">
                <Text className="text-typography-500">
                  {language === "hi"
                    ? "कोई वार्ड नहीं मिला"
                    : "No wards found"}
                </Text>
              </Box>
            }
          />
        </View>
      </Modal>
    </VStack>
  );
};

export default WardSelector;

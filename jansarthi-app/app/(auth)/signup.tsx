import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

export default function SignupScreen() {
  const { signup, isLoading, error, clearError } = useAuth();
  const { t, getText } = useLanguage();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSignup = async () => {
    try {
      clearError();
      setLocalError('');

      // Basic validation
      if (!name.trim()) {
        setLocalError(getText(t.auth.signup.enterName));
        return;
      }
      if (!mobileNumber.trim()) {
        setLocalError(getText(t.auth.signup.enterMobileNumber));
        return;
      }

      // Clean and format phone number with country code
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      // Remove leading 91 if user entered it
      const digits = cleanNumber.startsWith('91') && cleanNumber.length > 10
        ? cleanNumber.slice(2)
        : cleanNumber;

      if (digits.length !== 10) {
        setLocalError(getText(t.auth.login.enterValidMobileNumber));
        return;
      }

      const fullMobileNumber = `+91${digits}`;

      // Send OTP
      const response = await signup({
        name: name.trim(),
        mobile_number: fullMobileNumber,
      });

      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          mobile_number: fullMobileNumber,
          expires_in: String(response?.expires_in_minutes || 5),
          flow: 'signup',
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <View className="flex-1 bg-brand-500">
      {/* Header Section with Brand Color */}
      <View className="pt-16 pb-8 px-6">
        {/* Language Switcher */}
        <View className="absolute top-12 right-6 z-10">
          <LanguageSwitcher />
        </View>

        <VStack space="md" className="items-center mt-20">
          <Heading size='5xl' className='text-typography-white text-center font-bold'>{getText(t.appName)}</Heading>
          <Heading size="2xl" className="text-typography-white text-center font-bold">
            {getText(t.auth.signup.title)}
          </Heading>
          <Text size="md" className="text-typography-white text-center opacity-90">
            {getText(t.auth.signup.subtitle)}
          </Text>
        </VStack>
      </View>

      {/* Content Card */}
      <View className="flex-1 bg-background-0 rounded-t-3xl px-6 pt-8">
        <VStack space="lg" className="flex-1">
          <FormControl isInvalid={!!localError || !!error}>
            <VStack space="md">
              <Input
                variant="outline"
                size="lg"
                className="bg-background-50 border-outline-200"
              >
                <InputField
                  placeholder={getText(t.auth.signup.fullNamePlaceholder)}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setLocalError('');
                    clearError();
                  }}
                  autoFocus
                  className="text-typography-900"
                />
              </Input>

              <View className="flex-row">
                
                <Input
                  size="lg"
                  className="flex-1 bg-background-50"
                >
                  <View className="bg-brand-400 border-outline-200 h-12 px-4 justify-center">
                  <Text className="text-typography-900 font-medium">+91</Text>
                </View>
                  <InputField
                    placeholder={getText(t.auth.login.mobileNumberPlaceholder)}
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={(text) => {
                      setMobileNumber(text);
                      setLocalError('');
                      clearError();
                    }}
                    className="text-typography-900"
                  />
                </Input>
              </View>

              {(localError || error) && (
                <Text size="sm" className="text-error-500">
                  {localError || error}
                </Text>
              )}
            </VStack>
          </FormControl>

          <Button
            size="lg"
            onPress={handleSignup}
            isDisabled={isLoading}
            className="bg-brand-500 rounded-lg shadow-sm"
          >
            <ButtonText className="text-typography-white font-semibold">
              {isLoading ? getText(t.auth.signup.creatingAccount) : getText(t.auth.signup.signUp)}
            </ButtonText>
          </Button>

          <View className="flex-row justify-center items-center mt-2">
            <Text size="sm" className="text-typography-500">
              {getText(t.auth.signup.alreadyHaveAccount)}{' '}
            </Text>
            <Button
              variant="link"
              size="sm"
              onPress={() => router.back()}
            >
              <ButtonText className="text-brand-500 font-semibold">
                {getText(t.auth.signup.login)}
              </ButtonText>
            </Button>
          </View>
        </VStack>
      </View>
    </View>
  );
}

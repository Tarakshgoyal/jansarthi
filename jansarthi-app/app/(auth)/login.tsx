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

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const { t, getText } = useLanguage();
  const [mobileNumber, setMobileNumber] = useState('');
  const [localError, setLocalError] = useState('');


  const handleLogin = async () => {
    try {
      clearError();
      setLocalError('');

      // Basic validation
      if (!mobileNumber.trim()) {
        setLocalError(getText(t.auth.login.enterMobileNumber));
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
      const response = await login({ mobile_number: fullMobileNumber });

      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          mobile_number: fullMobileNumber,
          expires_in: String(response?.expires_in_minutes || 5),
          flow: 'login',
        },
      });
    } catch (err) {
      console.error('Login error:', err);
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
            {getText(t.auth.login.title)}
          </Heading>
          <Text size="md" className="text-typography-white text-center opacity-90">
            {getText(t.auth.login.subtitle)}
          </Text>
        </VStack>
      </View>

      {/* Content Card */}
      <View className="flex-1 bg-background-0 rounded-t-3xl px-6 pt-8">
        <VStack space="lg" className="flex-1">
          <FormControl isInvalid={!!localError || !!error}>
            <VStack space="sm">
              <View className="flex-row">
                <Input 
                  size="lg"
                  className="flex-1 bg-background-50  h-12"
                >
                   <View className="bg-brand-400 h-12 px-4 justify-center">
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
                    autoFocus
                    className="text-typography-900"
                    maxLength={10}
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
            onPress={handleLogin}
            isDisabled={isLoading}
            className="bg-brand-500 rounded-lg shadow-sm"
          >
            <ButtonText className="text-typography-white font-semibold">
              {isLoading ? getText(t.auth.login.sendingOtp) : getText(t.actions.next)}
            </ButtonText>
          </Button>

          <View className="flex-row justify-center items-center mt-2">
            <Text size="sm" className="text-typography-500">
              {getText(t.auth.login.dontHaveAccount)}{' '}
            </Text>
            <Button
              variant="link"
              size="sm"
                onPress={() => router.push('/(auth)/signup')}
            >
              <ButtonText className="text-brand-500 font-semibold">
                {getText(t.auth.login.signUp)}
              </ButtonText>
            </Button>
          </View>
        </VStack>
      </View>
    </View>
  );
}

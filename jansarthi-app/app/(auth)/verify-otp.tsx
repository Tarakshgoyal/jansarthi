import { Button, ButtonText } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

export default function VerifyOTPScreen() {
  const { verifyOTP, resendOTP, isLoading, error, clearError } = useAuth();
  const { getText, t } = useLanguage();
  const params = useLocalSearchParams<{
    mobile_number: string;
    expires_in: string;
    flow: 'login' | 'signup';
  }>();

  const [otpCode, setOtpCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for each OTP input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    
    const newDigits = [...otpDigits];
    newDigits[index] = digit.slice(-1); // Only take last digit
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));
    setLocalError('');
    clearError();

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace - move to previous input
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    // Start countdown timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    try {
      clearError();
      setLocalError('');

      // Basic validation
      if (!otpCode.trim()) {
        setLocalError(getText(t.auth.verifyOtp.enterOtp));
        return;
      }
      if (otpCode.length !== 6) {
        setLocalError(getText(t.auth.verifyOtp.otpMustBe6Digits));
        return;
      }

      // Verify OTP
      await verifyOTP({
        mobile_number: params.mobile_number,
        otp_code: otpCode,
      });

      // Navigate to home screen after successful verification
      router.replace('/(app)');
    } catch (err) {
      console.error('OTP verification error:', err);
    }
  };

  const handleResendOTP = async () => {
    try {
      clearError();
      setLocalError('');
      
      await resendOTP(params.mobile_number);
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      setOtpCode('');
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      console.error('Resend OTP error:', err);
    }
  };

  return (
    <View className="flex-1 bg-brand-500">
      {/* Header Section with Brand Color */}
      <View className="pt-16 pb-8 px-6">
        <VStack space="md" className="items-center mt-8">
          <Heading size="3xl" className="text-typography-white text-center font-bold">
            {getText(t.auth.verifyOtp.title)}
          </Heading>
          <Text size="md" className="text-typography-white text-center opacity-90">
            {getText(t.auth.verifyOtp.subtitle)}
          </Text>
          <Text size="lg" className="text-typography-white font-semibold text-center">
            {params.mobile_number}
          </Text>
          <Text size="sm" className="text-typography-white text-center opacity-80 mt-2">
            {getText(t.auth.verifyOtp.otpExpiresIn)} {params.expires_in} {getText(t.auth.verifyOtp.minutes)}
          </Text>
        </VStack>
      </View>

      {/* Content Card */}
      <View className="flex-1 bg-background-0 rounded-t-3xl px-6 pt-8">
        <VStack space="lg" className="flex-1">
          <FormControl isInvalid={!!localError || !!error}>
            <VStack space="sm">
              {/* OTP Input Boxes */}
              <HStack space="sm" className="justify-center">
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={index === 0}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl bg-background-0 text-typography-900 ${
                      digit ? 'border-brand-500' : 'border-outline-200'
                    }`}
                    selectionColor="#16a34a"
                  />
                ))}
              </HStack>
              {(localError || error) && (
                <Text size="sm" className="text-error-500 text-center">
                  {localError || error}
                </Text>
              )}
            </VStack>
          </FormControl>

          <Button
            size="lg"
            onPress={handleVerifyOTP}
            isDisabled={isLoading || otpCode.length !== 6}
            className="bg-brand-500 rounded-lg shadow-sm"
          >
            <ButtonText className="text-typography-white font-semibold">
              {isLoading ? getText(t.auth.verifyOtp.verifying) : getText(t.auth.verifyOtp.verifyOtp)}
            </ButtonText>
          </Button>

          <VStack space="sm" className="items-center mt-4">
            {!canResend ? (
              <Text size="sm" className="text-typography-500">
                {getText(t.auth.verifyOtp.resendOtpIn)} {resendTimer}s
              </Text>
            ) : (
              <Button
                variant="link"
                size="sm"
                onPress={handleResendOTP}
                isDisabled={isLoading}
              >
                <ButtonText className="text-brand-500 font-semibold">
                  {getText(t.auth.verifyOtp.resendOtp)}
                </ButtonText>
              </Button>
            )}
          </VStack>

          <Button
            variant="outline"
            size="md"
            onPress={() => router.back()}
            className="mt-4 border-outline-200"
          >
            <ButtonText className="text-typography-900">
              {getText(t.auth.verifyOtp.changeNumber)}
            </ButtonText>
          </Button>
        </VStack>
      </View>
    </View>
  );
}

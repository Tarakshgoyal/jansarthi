"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginPWD, verifyOTP } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Add +91 prefix if not present
      const fullPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/^91/, "")}`;
      await loginPWD(fullPhone);
      setPhone(fullPhone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await verifyOTP(phone, otp);
      
      if (response.user.role !== "pwd_worker") {
        setError("Only PWD Workers can access this dashboard");
        return;
      }

      login(response.access_token, response.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">PWD</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            PWD Admin Dashboard
          </CardTitle>
          <CardDescription className="text-gray-600">
            जनसार्थी - Public Works Department Portal
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-500">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone.replace(/^\+?91/, "")}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="rounded-l-none"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || phone.length !== 10}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  required
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  OTP sent to {phone}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                disabled={isLoading}
              >
                Change Phone Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

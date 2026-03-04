import React, { createContext, useContext, useEffect, useState } from "react";

const OTP_API_URL = "/api/otp";

interface AuthContextType {
  isAuthenticated: boolean;
  adminName: string;
  otpPending: boolean;
  pendingEmail: string;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    reason?: "missing_fields" | "missing_config" | "invalid_credentials" | "otp_send_failed";
  }>;
  requestOtp: () => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

const ADMIN_CREDENTIALS = {
  username: readEnv(import.meta.env.VITE_ADMIN_USERNAME) || (import.meta.env.DEV ? "admin" : ""),
  password: readEnv(import.meta.env.VITE_ADMIN_PASSWORD) || (import.meta.env.DEV ? "admin123" : ""),
  name: readEnv(import.meta.env.VITE_ADMIN_NAME) || "Administrator",
  otpEmail: readEnv(import.meta.env.VITE_OTP_EMAIL),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [otpPending, setOtpPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const storedAuth = localStorage.getItem("admin_auth");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setAdminName(ADMIN_CREDENTIALS.name);
    }
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{
    success: boolean;
    reason?: "missing_fields" | "missing_config" | "invalid_credentials" | "otp_send_failed";
  }> => {
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) return { success: false, reason: "missing_fields" };
    if (!ADMIN_CREDENTIALS.username || !ADMIN_CREDENTIALS.password) {
      return { success: false, reason: "missing_config" };
    }

    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
      setOtpPending(true);
      setPendingEmail(ADMIN_CREDENTIALS.otpEmail || "your registered email");

      const otpSent = await requestOtp();
      if (!otpSent) {
        setOtpPending(false);
        setPendingEmail("");
        return { success: false, reason: "otp_send_failed" };
      }

      return { success: true };
    }

    return { success: false, reason: "invalid_credentials" };
  };

  const requestOtp = async (): Promise<boolean> => {
    try {
      const emailQuery = ADMIN_CREDENTIALS.otpEmail
        ? `&email=${encodeURIComponent(ADMIN_CREDENTIALS.otpEmail)}`
        : "";
      const res = await fetch(`${OTP_API_URL}?action=sendOtp${emailQuery}`);
      const data = await res.json();
      return data?.success === true;
    } catch (err) {
      console.error("requestOtp error:", err);
      return false;
    }
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    try {
      const res = await fetch(`${OTP_API_URL}?action=verifyOtp&otp=${encodeURIComponent(otp)}`);
      const data = await res.json();

      if (data?.success === true) {
        setIsAuthenticated(true);
        setAdminName(ADMIN_CREDENTIALS.name);
        setOtpPending(false);
        localStorage.setItem("admin_auth", "true");
        return true;
      }

      return false;
    } catch (err) {
      console.error("verifyOtp error:", err);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminName("");
    setOtpPending(false);
    setPendingEmail("");
    localStorage.removeItem("admin_auth");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        adminName,
        otpPending,
        pendingEmail,
        login,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

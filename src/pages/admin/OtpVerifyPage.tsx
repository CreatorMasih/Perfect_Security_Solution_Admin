import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, otpPending, pendingEmail, verifyOtp, requestOtp } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // If otp not pending, redirect login
  if (!otpPending) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const ok = await verifyOtp(otp.trim());

    if (ok) {
      toast.success("OTP verified successfully!");
      navigate("/admin");
    } else {
      toast.error("Invalid / Expired OTP");
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    // const ok = await requestOtp(pendingEmail);
const ok = await requestOtp();

    if (ok) toast.success("OTP resent!");
    else toast.error("Failed to resend OTP");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground">Verify OTP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          OTP sent to <span className="font-medium text-foreground">{pendingEmail}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              maxLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={handleResend}>
            Resend OTP
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerifyPage;

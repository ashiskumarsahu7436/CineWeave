import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<'options' | 'email' | 'otp'>('options');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { toast } = useToast();

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/auth/email/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      return res.json();
    },
    onSuccess: () => {
      setMode('otp');
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code (or enter any code for now)",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, firstName, lastName }),
      });
      if (!res.ok) throw new Error('Failed to verify OTP');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Account created successfully",
      });
      window.location.href = '/';
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setMode('options');
      setStep('email');
      setEmail('');
      setOtp('');
      setFirstName('');
      setLastName('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'options' && 'Welcome to CineWeave'}
            {mode === 'email' && 'Sign up with Email'}
            {mode === 'otp' && 'Enter OTP'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'options' && 'Sign in to unlock personalized features'}
            {mode === 'email' && 'Enter your email to receive a verification code'}
            {mode === 'otp' && 'Enter the OTP sent to your email (any code works for now)'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'options' && (
          <div className="space-y-3 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-google-signup"
            >
              Sign in with Google
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => setMode('email')}
              data-testid="button-email-signup"
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign up with Email
            </Button>
          </div>
        )}

        {mode === 'email' && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name (Optional)</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMode('options')}
              >
                Back
              </Button>
              <Button
                className="w-full"
                onClick={() => sendOtpMutation.mutate(email)}
                disabled={!email || sendOtpMutation.isPending}
              >
                {sendOtpMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'otp' && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter any code"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('email');
                  setStep('email');
                }}
              >
                Back
              </Button>
              <Button
                className="w-full"
                onClick={() => verifyOtpMutation.mutate()}
                disabled={!otp || verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & Sign Up'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

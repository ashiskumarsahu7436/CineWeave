import { Button } from "@/components/ui/button";
import { Play, Video, Zap, Shield, Mail } from "lucide-react";
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

export default function Landing() {
  const [showEmailSignup, setShowEmailSignup] = useState(false);
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">CineWeave</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Your Videos, Your Way
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience video streaming with powerful personalization. Block unwanted content, 
            organize your subscriptions, and enjoy a truly customized viewing experience.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-google-signup"
            >
              Sign up with Google
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowEmailSignup(true)}
              data-testid="button-email-signup"
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign up with Email
            </Button>
          </div>
        </section>

        <Dialog open={showEmailSignup} onOpenChange={setShowEmailSignup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{step === 'email' ? 'Sign up with Email' : 'Enter OTP'}</DialogTitle>
              <DialogDescription>
                {step === 'email' 
                  ? 'Enter your email to receive a verification code'
                  : 'Enter the OTP sent to your email (any code works for now)'}
              </DialogDescription>
            </DialogHeader>

            {step === 'email' ? (
              <div className="space-y-4">
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
                <Button 
                  className="w-full" 
                  onClick={() => sendOtpMutation.mutate(email)}
                  disabled={!email || sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter any code"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => verifyOtpMutation.mutate()}
                  disabled={!otp || verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & Sign Up'}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep('email')}
                >
                  Back
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <section className="py-20 grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personal Mode</h3>
            <p className="text-muted-foreground">
              Toggle to see only videos from channels you subscribe to. No algorithms, no distractions.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Control</h3>
            <p className="text-muted-foreground">
              Permanently block channels and never see their content again. Full control over what you watch.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Spaces</h3>
            <p className="text-muted-foreground">
              Organize subscriptions into custom collections. Create spaces for gaming, tech, entertainment, and more.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

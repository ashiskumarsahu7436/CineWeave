import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Feedback() {
  const { toast } = useToast();
  const [type, setType] = useState<string>("");
  const [message, setMessage] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/feedback', {
        type: type || 'other',
        message: message.trim(),
      });
    },
    onSuccess: () => {
      toast({ title: 'Thanks for your feedback!', description: "We've received your message." });
      setMessage("");
      setType("");
    },
    onError: () => {
      toast({ title: 'Could not send feedback', description: 'Please try again.', variant: 'destructive' });
    },
  });

  const isValid = message.trim().length >= 5;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Send Feedback
        </h1>
        <p className="text-muted-foreground mt-1">Help us improve CineWeave</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>We'd love to hear from you!</CardTitle>
          <CardDescription>Your feedback helps us make CineWeave better for everyone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="feedback-type" data-testid="select-feedback-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your Feedback</Label>
            <Textarea
              id="feedback-message"
              placeholder="Tell us what you think..."
              className="min-h-[150px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="input-feedback-message"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => submitMutation.mutate()}
            disabled={!isValid || submitMutation.isPending}
            data-testid="button-submit-feedback"
          >
            {submitMutation.isPending ? 'Sending…' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>By submitting feedback, you agree to our terms of service and privacy policy.</p>
      </div>
    </div>
  );
}

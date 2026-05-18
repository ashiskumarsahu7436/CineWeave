import { useState } from "react";
import { Mail, MessageSquare, BookOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const channels = [
  { icon: BookOpen, title: "Help Center", description: "Browse articles and guides to find answers instantly.", action: "Visit Help Center", href: "/help" },
  { icon: MessageSquare, title: "Community Forum", description: "Ask questions and get help from other CineWeave users.", action: "Open Forum", href: "#" },
  { icon: AlertTriangle, title: "Report a Problem", description: "Report a bug, abusive content, or a safety concern.", action: "Submit Report", href: "#" },
  { icon: Mail, title: "Email Support", description: "Send us a detailed message and we'll get back to you.", action: "support@cineweave.com", href: "mailto:support@cineweave.com" },
];

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setName(""); setEmail(""); setSubject(""); setMessage("");
      toast({ title: "Message sent!", description: "We'll get back to you within 1–2 business days." });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground">
          We're here to help. Choose the option that best fits your needs.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardContent className="p-5">
                <Icon className="h-7 w-7 text-primary mb-2" />
                <h3 className="font-semibold mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                <a href={c.href}>
                  <Button variant="outline" size="sm" data-testid={`button-${c.title.toLowerCase().replace(/ /g, '-')}`}>
                    {c.action}
                  </Button>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Send Us a Message</h2>
        <p className="text-sm text-muted-foreground">Response time: 1–2 business days</p>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required data-testid="input-contact-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required data-testid="input-contact-email" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" required data-testid="input-contact-subject" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue or question in detail..." rows={5} required data-testid="input-contact-message" />
          </div>
          <Button type="submit" disabled={sending} data-testid="button-send-message">
            {sending ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </div>

      {/* Business inquiries */}
      <div className="border-t pt-6 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Business & Partnership Inquiries</p>
        <p>partnerships@cineweave.com</p>
        <p className="font-medium text-foreground mt-3">Press & Media</p>
        <p>press@cineweave.com</p>
      </div>
    </div>
  );
}

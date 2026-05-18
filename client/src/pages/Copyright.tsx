import { ShieldAlert, FileText, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  { step: "1", title: "Identify the content", description: "Find the specific video or content on CineWeave that you believe infringes your copyright." },
  { step: "2", title: "Complete the DMCA form", description: "Fill out our copyright takedown request form with details about your original work and the infringing content." },
  { step: "3", title: "Submit your claim", description: "Submit the form along with a signed statement of good faith and your contact information." },
  { step: "4", title: "We review & act", description: "Our team reviews your claim within 5–7 business days. If valid, the content is removed and the uploader is notified." },
];

export default function Copyright() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Copyright</h1>
        <p className="text-muted-foreground">
          CineWeave respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA) and equivalent laws worldwide.
        </p>
      </div>

      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <ShieldAlert className="h-7 w-7 text-primary mb-2" />
            <h3 className="font-semibold mb-1">We take copyright seriously</h3>
            <p className="text-sm text-muted-foreground">All uploaded content must be owned by the uploader or used with proper rights. Repeated violations result in account termination.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <FileText className="h-7 w-7 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Takedown requests</h3>
            <p className="text-sm text-muted-foreground">Rights holders can submit DMCA takedown notices. We review every valid claim and act swiftly to protect creators.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Clock className="h-7 w-7 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Fast resolution</h3>
            <p className="text-sm text-muted-foreground">We aim to process all valid copyright claims within 5–7 business days of receipt.</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Policy */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Content Ownership Policy</h2>
        <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
          <p>When you upload a video to CineWeave, you confirm that you own all rights to the content — including video, audio, and any third-party materials appearing in it. By uploading, you grant CineWeave a worldwide, non-exclusive, royalty-free license to host, display, and distribute your content on the platform.</p>
          <p>You retain full ownership of your content. You may delete it at any time, which will also revoke our license to distribute it. CineWeave does not claim ownership over any user-uploaded content.</p>
          <p>Using copyrighted music, clips, or images without permission may result in your video being removed, muted, or monetized by the rights holder through our Content ID system.</p>
        </div>
      </div>

      {/* How to File */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How to File a Copyright Takedown</h2>
        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <Button data-testid="button-submit-dmca">Submit DMCA Takedown Request</Button>
        </div>
      </div>

      {/* Counter-Notification */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Counter-Notification</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you believe your content was removed incorrectly, you may submit a counter-notification. This involves providing a sworn statement that the content was removed as a result of mistake or misidentification, along with your contact details and consent to jurisdiction.
        </p>
        <Button variant="outline" data-testid="button-counter-notification">Submit Counter-Notification</Button>
      </div>

      {/* Contact */}
      <div className="border-t pt-6 text-sm text-muted-foreground space-y-1">
        <p><strong className="text-foreground">Copyright Agent:</strong> CineWeave Copyright Team</p>
        <p><strong className="text-foreground">Email:</strong> copyright@cineweave.com</p>
        <p><strong className="text-foreground">Mailing Address:</strong> CineWeave Pvt. Ltd., Legal Dept., Bengaluru, KA 560001, India</p>
      </div>
    </div>
  );
}

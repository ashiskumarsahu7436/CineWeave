const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly (name, email, profile photo), information we receive automatically when you use the Service (IP address, device type, browser, watch history, search queries, interactions), and information from third parties (OAuth providers like Google). We collect only what is necessary to provide and improve the Service.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to: (a) provide, maintain, and improve the Service; (b) personalize your experience and recommendations; (c) process transactions and send related information; (d) send notices, updates, and promotional communications (you may opt out); (e) respond to comments and questions; (f) monitor and analyze usage patterns; and (g) detect and prevent fraud, abuse, and security threats.`,
  },
  {
    title: "3. Information Sharing",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share information with: (a) service providers who assist in our operations under confidentiality agreements; (b) business partners with your consent; (c) law enforcement when required by law; or (d) in connection with a merger or acquisition. Aggregated, non-personally identifiable data may be shared publicly.`,
  },
  {
    title: "4. Watch History & Personalization",
    content: `We use your watch history, search queries, and interactions to power recommendations. You can pause watch history, clear it at any time, or turn off personalization entirely in Settings → Watch History. Even with history paused, you can still use all features of the Service.`,
  },
  {
    title: "5. Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze usage patterns. Essential cookies are necessary for the Service to function. Analytics cookies help us understand how the Service is used. You can control cookies through your browser settings, though disabling them may affect some features.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide services. You may delete your account at any time, which will result in the deletion of your personal data within 30 days, except where retention is required by law. Watch history, liked videos, and playlists are deleted immediately upon account deletion.`,
  },
  {
    title: "7. Your Rights",
    content: `Depending on your location, you may have the right to: (a) access the personal data we hold about you; (b) correct inaccurate data; (c) request deletion of your data; (d) restrict or object to processing; (e) data portability; and (f) withdraw consent. To exercise these rights, contact privacy@cineweave.com. We will respond within 30 days.`,
  },
  {
    title: "8. Data Security",
    content: `We implement industry-standard security measures including TLS encryption in transit, encryption at rest for sensitive data, regular security audits, and access controls. However, no method of internet transmission is 100% secure. We promptly notify affected users in the event of a security breach as required by applicable law.`,
  },
  {
    title: "9. Children's Privacy",
    content: `The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly. If you believe a child has provided us with personal information, please contact us at privacy@cineweave.com.`,
  },
  {
    title: "10. International Transfers",
    content: `Your information may be transferred to and processed in countries other than India, including countries that may not have the same data protection laws. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses approved by relevant regulatory bodies.`,
  },
  {
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice on the Service. Your continued use after changes constitutes your acceptance of the updated policy. The date at the top of this page indicates when the policy was last revised.`,
  },
  {
    title: "12. Contact Us",
    content: `For privacy-related questions, requests, or complaints, contact our Data Protection Officer at privacy@cineweave.com or write to: CineWeave Pvt. Ltd., DPO Office, Bengaluru, Karnataka 560001, India.`,
  },
];

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 1, 2025</p>
        <p className="text-muted-foreground mt-3">
          Your privacy matters to us. This policy explains what data we collect, why we collect it, and how you can control it.
        </p>
      </div>

      <div className="space-y-7">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>© 2025 CineWeave Pvt. Ltd. All rights reserved.</p>
        <p className="mt-1">Privacy inquiries: privacy@cineweave.com</p>
      </div>
    </div>
  );
}

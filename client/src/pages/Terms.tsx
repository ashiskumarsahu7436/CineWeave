const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using CineWeave ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service. We reserve the right to modify these Terms at any time. Continued use after changes constitutes your acceptance of the revised Terms.`,
  },
  {
    title: "2. Eligibility",
    content: `The Service is intended for users who are at least 13 years of age. By using the Service, you represent and warrant that you are at least 13 years old. Users under 18 must have the consent of a parent or legal guardian. CineWeave reserves the right to suspend or terminate accounts of users who violate this requirement.`,
  },
  {
    title: "3. Your Account",
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at security@cineweave.com of any unauthorized use of your account. CineWeave cannot be held liable for any loss arising from unauthorized use of your account. You may not use another user's account without their express permission.`,
  },
  {
    title: "4. Content You Upload",
    content: `You retain all rights to content you upload to the Service. By uploading content, you grant CineWeave a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, use, reproduce, modify, distribute, and display your content for the purpose of operating and improving the Service. You represent and warrant that you own or have the necessary rights to the content you upload and that it does not violate these Terms, applicable law, or the rights of any third party.`,
  },
  {
    title: "5. Prohibited Content & Conduct",
    content: `You agree not to upload, post, or transmit content that: (a) infringes any patent, trademark, trade secret, copyright, or other proprietary right; (b) is unlawful, harmful, threatening, abusive, harassing, defamatory, or obscene; (c) constitutes unsolicited commercial messages (spam); (d) contains malicious code or software; (e) promotes violence, discrimination, or illegal activity; or (f) violates any applicable local, national, or international law.`,
  },
  {
    title: "6. Intellectual Property",
    content: `The Service and its original content, features, and functionality (excluding user-uploaded content) are and will remain the exclusive property of CineWeave Pvt. Ltd. and its licensors. Our trademarks, logos, and trade dress may not be used in connection with any product or service without the prior written consent of CineWeave. All feedback you provide about the Service is owned by CineWeave and may be used without compensation to you.`,
  },
  {
    title: "7. Privacy",
    content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated by reference into these Terms. Please review our Privacy Policy, which describes the information we collect, how we use it, and your rights regarding that information.`,
  },
  {
    title: "8. Termination",
    content: `We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service ceases immediately. Provisions of the Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`,
  },
  {
    title: "9. Disclaimer of Warranties",
    content: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. CineWeave does not warrant that the Service will be error-free, uninterrupted, or free of viruses or other harmful components.`,
  },
  {
    title: "10. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, CineWeave Pvt. Ltd. and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of the Service.`,
  },
  {
    title: "11. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of Karnataka, India, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.`,
  },
  {
    title: "12. Contact",
    content: `If you have any questions about these Terms, please contact us at legal@cineweave.com or write to: CineWeave Pvt. Ltd., Legal Department, Bengaluru, Karnataka 560001, India.`,
  },
];

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 1, 2025</p>
        <p className="text-muted-foreground mt-3">
          Please read these Terms of Service carefully before using CineWeave. They govern your access to and use of the platform.
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
        <p className="mt-1">For legal inquiries: legal@cineweave.com</p>
      </div>
    </div>
  );
}

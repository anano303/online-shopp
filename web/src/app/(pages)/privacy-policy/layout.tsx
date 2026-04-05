import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "კონფიდენციალურობის პოლიტიკა - ცამეტი | Privacy Policy",
  description:
    "გაეცანით ცამეტის კონფიდენციალურობის პოლიტიკას. როგორ ვიყენებთ და ვიცავთ თქვენს პირად ინფორმაციას. GDPR შესაბამისი მონაცემთა დაცვის პოლიტიკა. Privacy Policy - ცამეტი data protection.",
  keywords: [
    "კონფიდენციალურობის პოლიტიკა",
    "მონაცემთა დაცვა",
    "პირადი ინფორმაცია",
    "უსაფრთხოება",
    "GDPR",
    "ცამეტი",
    "Tsamerti",
    "privacy policy",
    "data protection",
    "personal information",
    "security",
    "privacy",
    "terms",
    "conditions",
  ],
  authors: [{ name: "ცამეტი" }],
  creator: "ცამეტი",
  publisher: "ცამეტი",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "კონფიდენციალურობის პოლიტიკა - ცამეტი | Privacy Policy",
    description:
      "გაეცანით ცამეტის კონფიდენციალურობის პოლიტიკას. როგორ ვიყენებთ და ვიცავთ თქვენს პირად ინფორმაციას.",
    url: "https://13.online.ge/privacy-policy",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი კონფიდენციალურობის პოლიტიკა",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "კონფიდენციალურობის პოლიტიკა - ცამეტი",
    description:
      "გაეცანით ცამეტის კონფიდენციალურობის პოლიტიკას. როგორ ვიყენებთ და ვიცავთ თქვენს პირად ინფორმაციას.",
    images: ["/api/logo"],
  },
  alternates: {
    canonical: "https://13.online.ge/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

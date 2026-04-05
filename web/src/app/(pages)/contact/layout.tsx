import { Metadata } from "next";

export const metadata: Metadata = {
  title: "კონტაქტი - დაგვიკავშირდით | ცამეტი",
  description:
    "დაგვიკავშირდით ნებისმიერი შეკითხვის შემთხვევაში. ცამეტის გუნდი მზადაა დაგეხმაროთ მამაკაცების კლასიკური ტანსაცმლის შერჩევაში. მისამართი, ტელეფონი, ელფოსტა. Contact us for any questions.",
  keywords: [
    "კონტაქტი",
    "დაგვიკავშირდით",
    "ცამეტი კონტაქტი",
    "მისამართი",
    "ტელეფონი",
    "ელფოსტა",
    "მხარდაჭერა",
    "დახმარება",
    "contact",
    "get in touch",
    "Tsamerti contact",
    "address",
    "phone",
    "email",
    "support",
    "help",
    "Georgia",
    "Tbilisi",
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
    title: "კონტაქტი - დაგვიკავშირდით | ცამეტი",
    description:
      "დაგვიკავშირდით ნებისმიერი შეკითხვის შემთხვევაში. ცამეტის გუნდი მზადაა დაგეხმაროთ მამაკაცების კლასიკური ტანსაცმლის შერჩევაში.",
    url: "https://13.online.ge/contact",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი კონტაქტი",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "კონტაქტი - დაგვიკავშირდით | ცამეტი",
    description:
      "დაგვიკავშირდით ნებისმიერი შეკითხვის შემთხვევაში. ცამეტის გუნდი მზადაა დაგეხმაროთ.",
    images: ["/api/logo"],
  },
  alternates: {
    canonical: "https://13.online.ge/contact",
  },
  other: {
    "geo.region": "GE",
    "geo.placename": "Tbilisi, Georgia",
    "geo.position": "41.7151;44.8271",
    ICBM: "41.7151, 44.8271",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

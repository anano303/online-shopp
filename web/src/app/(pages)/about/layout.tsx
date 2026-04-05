import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ჩვენს შესახებ - ცამეტის გუნდი და ისტორია | ცამეტი",
  description:
    "გაიცანით ცამეტის გუნდი და ჩვენი ისტორია, ვინ ვართ ჩვენ და რას გთავაზობთ. ვართ მამაკაცების კლასიკური ტანსაცმლის ლიდერი საქართველოში. Meet Tsamerti team and our story.",
  keywords: [
    "ჩვენს შესახებ",
    "ცამეტი გუნდი",
    "ისტორია",
    "მისია",
    "ვისიონი",
    "ცამეტი",
    "საქართველო",
    "about us",
    "Tsamerti team",
    "history",
    "mission",
    "vision",
    "Georgia",
    "men's clothing store",
    "classic fashion",
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
    title: "ჩვენს შესახებ - ცამეტის გუნდი და ისტორია | ცამეტი",
    description:
      "გაიცანით ცამეტის გუნდი და ჩვენი ისტორია, ვინ ვართ ჩვენ და რას გთავაზობთ. ვართ მამაკაცების კლასიკური ტანსაცმლის ლიდერი საქართველოში.",
    url: "https://13.online.ge/about",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი გუნდი",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ჩვენს შესახებ - ცამეტის გუნდი და ისტორია | ცამეტი",
    description:
      "გაიცანით ცამეტის გუნდი და ჩვენი ისტორია, ვინ ვართ ჩვენ და რას გთავაზობთ.",
    images: ["/api/logo"],
  },
  alternates: {
    canonical: "https://13.online.ge/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

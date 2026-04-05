import type { Metadata } from "next";
import "./globals.css";
import "../styles/performance.css";
import { Providers } from "./providers";
// import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";

import { satoshi } from "./(pages)/fonts";
import Footer from "@/components/footer/footer";
import { LanguageProvider } from "@/hooks/LanguageContext";
import Header from "@/components/header/header";
import MessengerChatWrapper from "@/components/MessengerChat/MessengerChatWrapper";
import { CartProvider } from "@/modules/cart/context/cart-context";
import { CheckoutProvider } from "@/modules/checkout/context/checkout-context";
import { FloatingCart } from "@/components/FloatingCart/FloatingCart";
import {
  organizationSchema,
  websiteSchema,
  storeSchema,
} from "@/lib/structured-data";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ToastRenderer } from "@/components/toast-renderer";
import { ThemeInitializer } from "@/components/theme/ThemeInitializer";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_CLIENT_URL || "https://13.online.ge",
  ),
  title: "ცამეტი - მამაკაცების კლასიკური ტანსაცმლის მაღაზია საქართველოში",
  description:
    "მამაკაცების კლასიკური ტანსაცმელი - კოსტიუმები, პერანგები, ქურთუკები და აქსესუარები. ხარისხი, სტილი, ელეგანტურობა. Men's classic clothing store in Georgia",
  keywords: [
    "მამაკაცების ტანსაცმელი",
    "კლასიკური ტანსაცმელი",
    "კოსტიუმები",
    "პერანგები",
    "ქურთუკები",
    "მაღაზია",
    "ცამეტი",
    "საქართველო",
    "men's clothing",
    "classic fashion",
    "suits",
    "store",
    "Georgia",
    "formal wear",
    "menswear",
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
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    "google-site-verification":
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "", // backup
    "geo.region": "GE",
    "geo.placename": "Georgia",
    "geo.position": "41.7151;44.8271", // თბილისის კოორდინატები
    ICBM: "41.7151, 44.8271",
  },
  openGraph: {
    type: "website",
    locale: "ka_GE",
    url: "https://13.online.ge/",
    siteName: "ცამეტი",
    title: "ცამეტი - მამაკაცების კლასიკური ტანსაცმლის მაღაზია საქართველოში",
    description:
      "მამაკაცების კლასიკური ტანსაცმელი - ხარისხი, სტილი, ელეგანტურობა",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი - მამაკაცების კლასიკური ტანსაცმლის მაღაზია",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ცამეტი - მამაკაცების კლასიკური ტანსაცმლის მაღაზია",
    description:
      "მამაკაცების კლასიკური ტანსაცმლის საუკეთესო არჩევანი საქართველოში",
    images: ["/api/logo"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-color-mode="dark" suppressHydrationWarning>
      <head>
        {/* Blocking color-mode script — runs before first paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("site-color-mode-v1");if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-color-mode",m)}else{document.documentElement.setAttribute("data-color-mode","dark")}}catch(e){document.documentElement.setAttribute("data-color-mode","dark")}})()`,
          }}
        />
        {/* Favicon links */}
        <link rel="icon" href="/api/logo" />
        <link rel="apple-touch-icon" href="/api/logo" />
        <link rel="shortcut icon" href="/api/logo" />
        <meta name="msapplication-TileImage" content="/api/logo" />
        {/* Facebook SDK - temporarily disabled to fix chat button */}
        {/* <script
          async
          defer
          crossOrigin="anonymous"
          src={`https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v13.0&appid=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&autoLogAppEvents=1`}
        /> */}
        {/* Remove the problematic prefetch links */}
        {/* Add Google Fonts link */}
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        /> */}
      </head>
      <body
        className={`${satoshi.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
        style={{ maxWidth: "100vw" }}
      >
        {/* <LandingPage /> */}
        <Providers>
          <ThemeInitializer />
          <AuthProvider>
            <CartProvider>
              <CheckoutProvider>
                <LanguageProvider>
                  <Header />
                  {children}
                  <Footer />
                  <FloatingCart />
                  <ToastRenderer />
                  <MessengerChatWrapper />
                </LanguageProvider>
              </CheckoutProvider>
            </CartProvider>
          </AuthProvider>
        </Providers>

        {/* Google Analytics */}
        <GoogleAnalytics />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(storeSchema),
          }}
        />
      </body>
    </html>
  );
}

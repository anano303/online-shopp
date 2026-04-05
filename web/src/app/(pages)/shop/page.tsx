import { Suspense } from "react";
import ShopContent from "./ShopContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "მაღაზია - მამაკაცების კლასიკური ტანსაცმელი | ცამეტი",
  description:
    "დაათვალიერეთ მამაკაცების კლასიკური ტანსაცმლის ფართო არჩევანი ცამეტის მაღაზიაში. კოსტიუმები, პერანგები, ქურთუკები. ხარისხიანი პროდუქტები, საუკეთესო ფასები საქართველოში. Shop men's classic clothing at Tsamerti.",
  keywords: [
    "მაღაზია",
    "მამაკაცების ტანსაცმელი",
    "კლასიკური ტანსაცმელი",
    "პროდუქტები",
    "ცამეტი",
    "კოსტიუმები",
    "shop",
    "men's clothing",
    "classic fashion",
    "products",
    "Georgia",
    "formal wear",
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
    title: "მაღაზია - მამაკაცების კლასიკური ტანსაცმელი | ცამეტი",
    description:
      "დაათვალიერეთ მამაკაცების კლასიკური ტანსაცმლის ფართო არჩევანი ცამეტის მაღაზიაში. ხარისხიანი პროდუქტები, საუკეთესო ფასები საქართველოში.",
    url: "https://13.online.ge/shop",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი მაღაზია",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "მაღაზია - მამაკაცების კლასიკური ტანსაცმელი | ცამეტი",
    description:
      "დაათვალიერეთ მამაკაცების კლასიკური ტანსაცმლის ფართო არჩევანი ცამეტის მაღაზიაში.",
    images: ["/api/logo"],
  },
  alternates: {
    canonical: "https://13.online.ge/shop",
  },
};

const ShopPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ShopContent />
      </Suspense>
    </div>
  );
};

export default ShopPage;

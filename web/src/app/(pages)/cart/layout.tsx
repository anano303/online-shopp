import { Metadata } from "next";

export const metadata: Metadata = {
  title: "კალათა - ცამეტი | Shopping Cart",
  description:
    "თქვენი საყიდლების კალათა ცამეტიში. დაათვალიერეთ შერჩეული პროდუქტები და განაგრძეთ შეძენა. Your shopping cart at ცამეტი. Review selected products and proceed to checkout.",
  keywords: [
    "კალათა",
    "საყიდლები",
    "შეძენა",
    "შეკვეთა",
    "ცამეტი",
    "shopping cart",
    "cart",
    "purchase",
    "checkout",
    "order",
    "buy",
    "selected items",
  ],
  authors: [{ name: "ცამეტი" }],
  creator: "ცამეტი",
  publisher: "ცამეტი",
  robots: {
    index: false, // კალათა private page-ია
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "კალათა - ცამეტი | Shopping Cart",
    description:
      "თქვენი საყიდლების კალათა ცამეტიში. დაათვალიერეთ შერჩეული პროდუქტები და განაგრძეთ შეძენა.",
    url: "https://13.online.ge/cart",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი კალათა",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "კალათა - ცამეტი",
    description: "თქვენი საყიდლების კალათა ცამეტიში.",
    images: ["/api/logo"],
  },
  alternates: {
    canonical: "https://13.online.ge/cart",
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

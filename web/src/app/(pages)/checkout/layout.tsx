import { Metadata } from "next";

export const metadata: Metadata = {
  title: "გადახდა | ცამეტი - Checkout",
  description:
    "უსაფრთხო გადახდა ცამეტიში. ონლაინ შეკვეთის დასრულება. Secure checkout. Complete your online order.",
  keywords: [
    "გადახდა",
    "შეკვეთა",
    "ონლაინ შეკვეთა",
    "უსაფრთხო გადახდა",
    "შეკვეთის დასრულება",
    "checkout",
    "payment",
    "online order",
    "secure payment",
    "order completion",
    "men's clothing checkout",
    "ონლაინ მაღაზია",
    "e-commerce checkout",
  ],
  openGraph: {
    title: "გადახდა | ცამეტი - Checkout",
    description: "უსაფრთხო გადახდა ცამეტიში. ონლაინ შეკვეთის დასრულება",
    type: "website",
    url: "/checkout",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი - Checkout",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "გადახდა | ცამეტი - Checkout",
    description: "უსაფრთხო გადახდა ცამეტიში. ონლაინ შეკვეთის დასრულება",
    images: ["/api/logo"],
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  alternates: {
    canonical: "/checkout",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

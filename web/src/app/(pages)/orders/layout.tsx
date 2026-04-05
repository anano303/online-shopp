import { Metadata } from "next";

export const metadata: Metadata = {
  title: "შეკვეთები | ცამეტი - Orders",
  description:
    "თქვენი შეკვეთების მდგომარეობა და დეტალები. შეკვეთების ისტორია. Your order status and details. Order history.",
  keywords: [
    "შეკვეთები",
    "შეკვეთის მდგომარეობა",
    "შეკვეთის დეტალები",
    "შეკვეთების ისტორია",
    "orders",
    "order status",
    "order details",
    "order history",
    "order tracking",
    "my orders",
    "შეკვეთის ტრეკინგი",
    "delivery status",
    "მიწოდების სტატუსი",
  ],
  openGraph: {
    title: "შეკვეთები | ცამეტი - Orders",
    description:
      "თქვენი შეკვეთების მდგომარეობა და დეტალები. შეკვეთების ისტორია",
    type: "website",
    url: "/orders",
    siteName: "ცამეტი",
    images: [
      {
        url: "/api/logo",
        width: 1200,
        height: 630,
        alt: "ცამეტი - Orders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "შეკვეთები | ცამეტი - Orders",
    description:
      "თქვენი შეკვეთების მდგომარეობა და დეტალები. შეკვეთების ისტორია",
    images: ["/api/logo"],
  },
  robots: {
    index: false,
    follow: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  alternates: {
    canonical: "/orders",
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

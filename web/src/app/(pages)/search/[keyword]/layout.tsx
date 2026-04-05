import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ keyword: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ keyword: string }>;
}): Promise<Metadata> {
  const { keyword } = await params;

  const decodedKeyword = decodeURIComponent(keyword || "");

  return {
    title: `ძიება: ${decodedKeyword} - ცამეტი | Search: ${decodedKeyword}`,
    description: `ძიების შედეგები "${decodedKeyword}" - მამაკაცების კლასიკური ტანსაცმელი ცამეტიში. Search results for "${decodedKeyword}" - men's classic clothing at Tsamerti.`,
    keywords: [
      decodedKeyword,
      "ძიება",
      "მამაკაცების ტანსაცმელი",
      "კლასიკური ტანსაცმელი",
      "კოსტიუმები",
      "პროდუქტები",
      "ცამეტი",
      "search",
      "men's clothing",
      "classic fashion",
      "products",
      "find",
      "results",
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
      title: `ძიება: ${decodedKeyword} - ცამეტი`,
      description: `ძიების შედეგები "${decodedKeyword}" - მამაკაცების კლასიკური ტანსაცმელი ცამეტიში.`,
      url: `https://13.online.ge/search/${encodeURIComponent(decodedKeyword)}`,
      siteName: "ცამეტი",
      images: [
        {
          url: "/api/logo",
          width: 1200,
          height: 630,
          alt: `ცამეტი ძიება - ${decodedKeyword}`,
        },
      ],
      locale: "ka_GE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `ძიება: ${decodedKeyword} - ცამეტი`,
      description: `ძიების შედეგები "${decodedKeyword}" - მამაკაცების კლასიკური ტანსაცმელი ცამეტიში.`,
      images: ["/api/logo"],
    },
    alternates: {
      canonical: `https://13.online.ge/search/${encodeURIComponent(
        decodedKeyword,
      )}`,
    },
  };
}

export default function SearchLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

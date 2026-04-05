import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetails } from "@/modules/products/components/product-details";
import { Product } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || "https://13.ge";

async function fetchProduct(id: string): Promise<Product | null> {
  if (!API_BASE_URL) {
    console.error("NEXT_PUBLIC_API_URL is not defined");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch product", error);
    return null;
  }
}

function buildAbsoluteImageUrl(image?: string) {
  if (!image) return undefined;
  try {
    return new URL(image).toString();
  } catch {
    return new URL(image, CLIENT_BASE_URL).toString();
  }
}

type ProductRouteParams = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: ProductRouteParams;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProduct(resolvedParams.id);

  if (!product) {
    return {
      title: "Product Not Found | 13",
      description: "The requested product could not be found.",
      alternates: {
        canonical: `${CLIENT_BASE_URL}/products/${resolvedParams.id}`,
      },
    };
  }

  const title = `${product.name}${
    product.brand ? ` - ${product.brand}` : ""
  } | 13`;

  let description =
    product.description?.slice(0, 160) ||
    `${product.name}${product.brand ? ` by ${product.brand}` : ""}`;

  if (product.hashtags && product.hashtags.length > 0) {
    const hashtagText = product.hashtags
      .map((tag: string) => `#${tag}`)
      .join(" ");
    description = `${description} ${hashtagText}`.slice(0, 160);
  }

  const categoryKeywords: string[] = [];
  if (typeof product.mainCategory === "object" && product.mainCategory?.name) {
    categoryKeywords.push(product.mainCategory.name);
  }
  if (typeof product.subCategory === "object" && product.subCategory?.name) {
    categoryKeywords.push(product.subCategory.name);
  }

  const keywords = [
    product.name,
    product.brand,
    ...categoryKeywords,
    ...(product.hashtags || []),
    "13",
  ]
    .filter(Boolean)
    .join(", ");

  const imageUrl = buildAbsoluteImageUrl(product.images?.[0]);

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ]
        : undefined,
      type: "website",
      locale: "ka_GE",
      siteName: "13",
      url: `${CLIENT_BASE_URL}/products/${resolvedParams.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    alternates: {
      canonical: `${CLIENT_BASE_URL}/products/${resolvedParams.id}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: ProductRouteParams;
}) {
  const resolvedParams = await params;
  const product = await fetchProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="Container">
      <ProductDetails product={product} />
    </div>
  );
}

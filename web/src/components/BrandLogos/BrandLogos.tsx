"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import "./BrandLogos.css";
import noPhoto from "../../assets/nophoto.webp";
import { Product } from "@/types";
import { useLanguage } from "@/hooks/LanguageContext";

const isCloudinaryImage = (src: string) =>
  src.includes("cloudinary") || src.includes("res.cloudinary.com");

interface Brand {
  name: string;
  logo?: string;
  products?: number;
}

const fallbackBrands = [
  "Remington",
  "Winchester",
  "Smith & Wesson",
  "Beretta",
  "Browning",
  "Glock",
  "Mossberg",
  "Savage Arms",
  "Ruger",
  "Sig Sauer",
];

const BrandLogos = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { t } = useLanguage();

  const { data: productData, isLoading } = useQuery({
    queryKey: ["brandProductsData"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth("/products?limit=50&page=1");
        if (!response.ok) return { items: [] };
        return response.json();
      } catch {
        return { items: [] };
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (productData?.items?.length) {
      const brandMap = new Map<string, Brand>();

      productData.items.forEach((product: Product) => {
        if (product.brand) {
          const current = brandMap.get(product.brand) || {
            name: product.brand,
            products: 0,
          };

          if (product.brandLogo && !current.logo) {
            brandMap.set(product.brand, {
              ...current,
              logo: product.brandLogo,
              products: (current.products || 0) + 1,
            });
          } else if (
            !current.logo &&
            product.images &&
            product.images.length > 0
          ) {
            brandMap.set(product.brand, {
              ...current,
              logo: product.images[0],
              products: (current.products || 0) + 1,
            });
          } else {
            brandMap.set(product.brand, {
              ...current,
              products: (current.products || 0) + 1,
            });
          }
        }
      });

      if (brandMap.size < 5) {
        fallbackBrands.forEach((name) => {
          if (!brandMap.has(name)) {
            brandMap.set(name, { name, products: 0 });
          }
        });
      }

      setBrands(
        Array.from(brandMap.values())
          .sort((a, b) => (b.products || 0) - (a.products || 0))
          .slice(0, 10),
      );
    } else if (!isLoading) {
      setBrands(fallbackBrands.map((name) => ({ name })));
    }
  }, [productData, isLoading]);

  const getBrandUrl = (name: string) =>
    `/shop?brand=${encodeURIComponent(name)}`;

  const renderLogo = (brand: Brand) => {
    const src = brand.logo || noPhoto.src;
    if (isCloudinaryImage(src)) {
      return (
        <img
          src={src}
          alt={`${brand.name}`}
          className="bl-logo-img"
        />
      );
    }
    return (
      <Image
        src={src}
        alt={`${brand.name}`}
        width={80}
        height={48}
        className="bl-logo-img"
      />
    );
  };

  if (isLoading) {
    return (
      <section className="bl-section">
        <div className="bl-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bl-card bl-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!brands.length) return null;

  return (
    <section className="bl-section">
      <div className="bl-header">
        <span className="bl-badge">{t("brand.ourPartners")}</span>
      </div>

      <div className="bl-grid">
        {brands.map((brand, i) => (
          <Link
            key={brand.name + i}
            href={getBrandUrl(brand.name)}
            className="bl-card"
          >
            <div className="bl-logo-box">{renderLogo(brand)}</div>
            <span className="bl-name">{brand.name}</span>
            {brand.products ? (
              <span className="bl-count">
                {brand.products} {brand.products === 1 ? "item" : "items"}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandLogos;

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import "./BrandLogos.css";
import noPhoto from "../../assets/nophoto.webp";
import { Product } from "@/types";
import { useLanguage } from "@/hooks/LanguageContext";

// Helper function to check if image is from Cloudinary
const isCloudinaryImage = (src: string) =>
  src.includes("cloudinary") || src.includes("res.cloudinary.com");

// Type for brand data
interface Brand {
  name: string;
  logo?: string;
  products?: number;
}

// Fallback brand logos for brands without images
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
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const { t } = useLanguage();

  // Fetch product data directly without relying on a separate brands endpoint
  const { data: productData, isLoading } = useQuery({
    queryKey: ["brandProductsData"],
    queryFn: async () => {
      try {
        // Get a sample of products to extract brand info
        const response = await fetchWithAuth("/products?limit=50&page=1");
        if (!response.ok) {
          return { items: [] };
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch products for brand logos:", err);
        return { items: [] };
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Process brands data when products data is available
  useEffect(() => {
    if (productData?.items?.length) {
      const brandMap = new Map<string, Brand>();

      // Process products to extract brands and logos
      productData.items.forEach((product: Product) => {
        if (product.brand) {
          const currentBrand = brandMap.get(product.brand) || {
            name: product.brand,
            products: 0,
          };

          // Use brandLogo if available, otherwise use first product image
          if (product.brandLogo && !currentBrand.logo) {
            brandMap.set(product.brand, {
              ...currentBrand,
              logo: product.brandLogo,
              products: (currentBrand.products || 0) + 1,
            });
          } else if (
            !currentBrand.logo &&
            product.images &&
            product.images.length > 0
          ) {
            brandMap.set(product.brand, {
              ...currentBrand,
              logo: product.images[0],
              products: (currentBrand.products || 0) + 1,
            });
          } else {
            // Just increment product count
            brandMap.set(product.brand, {
              ...currentBrand,
              products: (currentBrand.products || 0) + 1,
            });
          }
        }
      });

      // Add fallback brands if we don't have enough
      if (brandMap.size < 5) {
        fallbackBrands.forEach((brandName) => {
          if (!brandMap.has(brandName)) {
            brandMap.set(brandName, { name: brandName, products: 0 });
          }
        });
      }

      // Convert map to array and sort by product count
      const brandsArray = Array.from(brandMap.values())
        .sort((a, b) => (b.products || 0) - (a.products || 0))
        .slice(0, 10); // Limit to top 10 brands

      setBrands(brandsArray);
    } else if (
      !isLoading &&
      (!productData || !productData.items || productData.items.length === 0)
    ) {
      // If no products found, use fallback brands
      const fallbackBrandsArray = fallbackBrands.map((name) => ({ name }));
      setBrands(fallbackBrandsArray);
    }
  }, [productData, isLoading]);

  // Pause animation on hover
  const pauseAnimation = () => setIsAnimationPaused(true);
  const resumeAnimation = () => setIsAnimationPaused(false);

  // Generate brand URL
  const getBrandUrl = (brandName: string) => {
    return `/shop?brand=${encodeURIComponent(brandName)}`;
  };

  // Observer for animation
  useEffect(() => {
    // Create intersection observer to start animation when in view
    if (typeof window !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate");
            } else {
              entry.target.classList.remove("animate");
            }
          });
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        if (containerRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          observer.unobserve(containerRef.current);
        }
      };
    }
  }, []);

  return (
    <div className="brand-logos-section">
      <div className="brand-logos-header">
        <h2 className="brand-logos-title">{t("brand.ourPartners")}</h2>
        <div className="brand-logos-subtitle">
          {t("brand.brandSubtitle")}
          {/* მაღალი ხარისხის ნადირობის აღჭურვილობა წამყვანი ბრენდებისგან */}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`brand-logos-container ${isAnimationPaused ? "paused" : ""}`}
        onMouseEnter={pauseAnimation}
        onMouseLeave={resumeAnimation}
      >
        {isLoading ? (
          <div className="brand-logos-loading">ბრენდების ჩატვირთვა...</div>
        ) : brands.length > 0 ? (
          <div className="brand-logos-slider">
            {/* First set of logos */}
            {brands.map((brand, index) => (
              <Link
                key={`brand-${index}`}
                href={getBrandUrl(brand.name)}
                className="brand-logo-item"
              >
                <div className="brand-logo-wrapper">
                  {isCloudinaryImage(brand.logo || noPhoto.src) ? (
                    <img
                      src={brand.logo || noPhoto.src}
                      alt={`${brand.name} logo`}
                      className="brand-logo-image"
                      style={{
                        width: "120px",
                        height: "60px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Image
                      src={brand.logo || noPhoto.src}
                      alt={`${brand.name} logo`}
                      width={120}
                      height={60}
                      className="brand-logo-image"
                    />
                  )}
                </div>
                <div className="brand-name">{brand.name}</div>
              </Link>
            ))}

            {/* Duplicate set for seamless loop */}
            {brands.map((brand, index) => (
              <Link
                key={`brand-duplicate-${index}`}
                href={getBrandUrl(brand.name)}
                className="brand-logo-item"
              >
                <div className="brand-logo-wrapper">
                  {isCloudinaryImage(brand.logo || noPhoto.src) ? (
                    <img
                      src={brand.logo || noPhoto.src}
                      alt={`${brand.name} logo`}
                      className="brand-logo-image"
                      style={{
                        width: "120px",
                        height: "60px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Image
                      src={brand.logo || noPhoto.src}
                      alt={`${brand.name} logo`}
                      width={120}
                      height={60}
                      className="brand-logo-image"
                    />
                  )}
                </div>
                <div className="brand-name">{brand.name}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brand-logos-loading">ბრენდები ვერ მოიძებნა</div>
        )}
      </div>
    </div>
  );
};

export default BrandLogos;

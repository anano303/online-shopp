"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react"; // Added X icon for close button
import { motion, AnimatePresence } from "framer-motion";
import "./productDetails.css";
import "./videoTabs.css"; // Import new tabs styles
import { Product } from "@/types";
import { ShareButtons } from "@/components/share-buttons/share-buttons";
import { useLanguage } from "@/hooks/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Color, AgeGroupItem } from "@/types";

import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { ProductCard } from "./product-card";
import { useCart } from "@/modules/cart/context/cart-context";
import { ReviewForm } from "./review-form";
import { ProductReviews } from "./product-reviews";
import ProductSchema from "@/components/ProductSchema";

// Custom AddToCartButton component that uses the cart context
function AddToCartButton({
  productId,
  countInStock = 0,
  className = "",
  selectedSize = "",
  selectedColor = "",
  selectedAgeGroup = "",
  quantity = 1,
  disabled = false,
  price, // Add price parameter
}: {
  productId: string;
  countInStock?: number;
  className?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedAgeGroup?: string;
  quantity?: number;
  disabled?: boolean;
  price?: number; // Add price parameter type
}) {
  const [pending, setPending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const handleClick = async () => {
    setPending(true);
    try {
      // Add variant info including ageGroup if available
      await addToCart(
        productId,
        quantity,
        selectedSize,
        selectedColor,
        selectedAgeGroup,
        price, // Pass the discounted price
      );

      // მხოლოდ წარმატებული დამატების შემდეგ ვაჩვენოთ success message
      // თუ addToCart error-ს მისცემს (არაავტორიზებული), ეს კოდი არ შესრულდება
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Add to cart error:", error);

      // არ ვაჩვენოთ error toast არაავტორიზებული მომხმარებლისთვის
      // რადგან ისედაც redirect მოხდება
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage !== "User not authenticated") {
        toast({
          title: t("product.errorTitle"),
          description:
            error instanceof Error
              ? error.message
              : t("product.addToCartError"),
          variant: "destructive",
        });
      }
    } finally {
      setPending(false);
    }
  };

  if (countInStock === 0 || disabled) {
    return (
      <button
        className={`add-to-cart-button out-of-stock ${className}`}
        disabled
      >
        {t("shop.outOfStock") || "არ არის მარაგში"}
      </button>
    );
  }
  return (
    <>
      {/* Success Message */}
      {showSuccessMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            fontSize: "16px",
            fontWeight: "500",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          ✅ {t("product.addToCartSuccess")}
        </div>
      )}

      <button
        className={`add-to-cart-button ${className}`}
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          t("cart.addToCart") || "კალათაში დამატება"
        )}
      </button>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

// Similar Products Component
function SimilarProducts({
  currentProductId,
  subCategoryId,
}: {
  currentProductId: string;
  subCategoryId: string;
}) {
  const { t } = useLanguage();

  // Fetch products filtered by subcategory using the same API as the shop page
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["similarProducts", subCategoryId],
    queryFn: async () => {
      try {
        if (!subCategoryId) {
          return { items: [] };
        }

        // Use the same getProducts API that the shop page uses
        const searchParams = new URLSearchParams({
          page: "1",
          limit: "10", // Fetch more than 3 in case current product is included
          subCategory: subCategoryId,
        });

        const response = await fetchWithAuth(
          `/products?${searchParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching similar products:", error);
        return { items: [] };
      }
    },
    enabled: !!subCategoryId, // Only run query if subCategoryId exists
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Filter out current product and take only 3
  const allProducts = productsResponse?.items || [];
  const similarProducts = allProducts
    .filter((product: Product) => product._id !== currentProductId)
    .slice(0, 3);

  // Don't render if loading
  if (isLoading) {
    return (
      <div className="similar-products-section">
        <h2 className="similar-products-title">
          {t("product.similarProducts")}
        </h2>
        <div className="similar-products-loading">
          <p>{t("shop.loading")}</p>
        </div>
      </div>
    );
  }

  // Don't render if no subcategory or no similar products found
  if (!subCategoryId || similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="similar-products-section">
      <h2 className="similar-products-title">{t("product.similarProducts")}</h2>{" "}
      <div className="similar-products-grid">
        {similarProducts.map((product: Product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "description" | "video" | "delivery"
  >("description"); // Active tab state

  // Debug: Check what fields the product has
  console.log("Product data:", {
    hasVideoDescription: !!product.videoDescription,
    hasDeliveryTerms: !!product.deliveryTerms,
    hasDeliveryTermsEn: !!product.deliveryTermsEn,
    videoDescription: product.videoDescription?.substring(0, 50),
  });

  const { data: availableColors = [] } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth("/categories/attributes/colors");
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
  // Fetch all age groups for proper nameEn support
  const { data: availableAgeGroups = [] } = useQuery<AgeGroupItem[]>({
    queryKey: ["ageGroups"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth(
          "/categories/attributes/age-groups",
        );
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
  // Get localized color name based on current language
  const getLocalizedColorName = (colorName: string): string => {
    if (language === "en") {
      // Find the color in availableColors to get its English name
      const colorObj = availableColors.find(
        (color) => color.name === colorName,
      );
      return colorObj?.nameEn || colorName;
    }
    return colorName;
  };

  // Get localized age group name based on current language
  const getLocalizedAgeGroupName = (ageGroupName: string): string => {
    if (language === "en") {
      // Find the age group in availableAgeGroups to get its English name
      const ageGroupObj = availableAgeGroups.find(
        (ageGroup) => ageGroup.name === ageGroupName,
      );
      return ageGroupObj?.nameEn || ageGroupName;
    }
    return ageGroupName;
  };

  // Check if product has active discount
  const hasActiveDiscount = () => {
    if (!product.discountPercentage || product.discountPercentage <= 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If no start/end dates specified, discount is always active
    if (!product.discountStartDate && !product.discountEndDate) {
      return true;
    }

    // Check date range if specified
    const startDate = product.discountStartDate
      ? new Date(product.discountStartDate)
      : null;
    const endDate = product.discountEndDate
      ? new Date(product.discountEndDate)
      : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const isAfterStart = !startDate || today >= startDate;
    const isBeforeEnd = !endDate || today <= endDate;

    return isAfterStart && isBeforeEnd;
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!hasActiveDiscount()) return product.price;
    const discountAmount = (product.price * product.discountPercentage!) / 100;
    return product.price - discountAmount;
  };

  const isDiscounted = hasActiveDiscount();
  const finalPrice = calculateDiscountedPrice();

  const availableQuantity = useMemo(() => {
    // Calculate available quantity based on selected attributes
    let stock = product.countInStock || 0;

    // If product has variants, adjust stock based on selected attributes
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) =>
          (!v.size || v.size === selectedSize) &&
          (!v.color || v.color === selectedColor) &&
          (!v.ageGroup || v.ageGroup === selectedAgeGroup),
      );
      stock = variant ? variant.stock : 0;
    }

    return stock;
  }, [selectedSize, selectedColor, selectedAgeGroup, product]);

  const { t, language } = useLanguage();

  // Display name and description based on selected language
  const displayName =
    language === "en" && product.nameEn ? product.nameEn : product.name;

  const displayDescription =
    language === "en" && product.descriptionEn
      ? product.descriptionEn
      : product.description;
  const isOutOfStock = availableQuantity === 0;

  // Initialize default selections based on product data
  useEffect(() => {
    // Set default size if sizes array exists
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }

    // Set default color if colors array exists
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }

    // Set default age group if ageGroups array exists
    if (product.ageGroups && product.ageGroups.length > 0) {
      setSelectedAgeGroup(product.ageGroups[0]);
    }
  }, [product]);

  // Function to open fullscreen image
  const openFullscreen = () => {
    setIsFullscreenOpen(true);
  };

  // Function to close fullscreen image
  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
  };

  return (
    <div className="container">
      {/* SEO Product Schema */}
      <ProductSchema product={product} productId={product._id} />

      <div className="grid">
        {/* Left Column - Thumbnails */}
        <div className="thumbnail-container">
          {product.images.map((image, index) => (
            <motion.button
              key={image}
              onClick={() => setCurrentImageIndex(index)}
              className={`thumbnail ${
                index === currentImageIndex ? "active" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src={image}
                alt={`${displayName} view ${index + 1}`}
                fill
                className="object-cover"
              />
            </motion.button>
          ))}
        </div>

        {/* Center Column - Main Image */}
        <div className="image-section">
          <div className="image-container">
            {/* Navigation arrows - only show if more than 1 image */}
            {product.images.length > 1 && (
              <>
                <button
                  className="image-nav-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? product.images.length - 1 : prev - 1,
                    );
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className="image-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === product.images.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="image-wrapper"
                onClick={openFullscreen} // Add click handler to open fullscreen
              >
                <Image
                  src={product.images[currentImageIndex]}
                  alt={displayName}
                  fill
                  quality={90}
                  priority
                  className="details-image"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="product-info-details">
          <h1 className="product-title">{displayName}</h1>{" "}
          <div className="price-section">
            {isDiscounted ? (
              <div className="price-container">
                {product.discountPercentage && (
                  <span className="detl-discount-badge">
                    -{product.discountPercentage}% OFF
                  </span>
                )}
                <span className="original-price-details">
                  {product.price.toFixed(2)}{" "}
                  {language === "en" ? "GEL" : "ლარი"}
                </span>
                <span className="price discounted-price-details">
                  {finalPrice.toFixed(2)} {language === "en" ? "GEL" : "ლარი"}
                </span>
              </div>
            ) : (
              <span className="price">
                {product.price.toFixed(2)} {language === "en" ? "GEL" : "ლარი"}
              </span>
            )}
          </div>
          <ShareButtons
            url={typeof window !== "undefined" ? window.location.href : ""}
            title={`Check out ${displayName} by ${product.brand} on 13`}
          />
          {!isOutOfStock && (
            <div className="product-options-container">
              {" "}
              {/* Age Group Selector - only show if product has age groups */}
              {product.ageGroups && product.ageGroups.length > 0 && (
                <div className="select-container">
                  <select
                    className="option-select"
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                    disabled={isOutOfStock || product.ageGroups.length === 0}
                  >
                    {" "}
                    <option value="">{t("product.selectAgeGroup")}</option>
                    {product.ageGroups.map((ageGroup) => (
                      <option key={ageGroup} value={ageGroup}>
                        {getLocalizedAgeGroupName(ageGroup)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Size Selector - only show if product has sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="select-container">
                  {" "}
                  <select
                    className="option-select"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={isOutOfStock || product.sizes.length === 0}
                  >
                    {" "}
                    <option value="">{t("product.selectSize")}</option>
                    {product.sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}{" "}
              {/* Color selector - only show if product has colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="select-container">
                  {" "}
                  <select
                    className="option-select2"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={isOutOfStock || product.colors.length === 0}
                  >
                    {" "}
                    <option value="">{t("product.selectColor")}</option>
                    {product.colors.map((color) => (
                      <option key={color} value={color}>
                        {getLocalizedColorName(color)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Quantity Selector */}
              {availableQuantity > 0 && (
                <div className="select-container">
                  <select
                    className="option-select"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={availableQuantity <= 0}
                  >
                    {Array.from(
                      { length: availableQuantity },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Stock Status */}
              {availableQuantity <= 0 && (
                <div className="out-of-stock-message">
                  {t("shop.outOfStock") || "არ არის მარაგში"}
                </div>
              )}
            </div>
          )}
          {/* New Tabs UI with Description, Delivery Terms, and Video */}
          <div className="tabs">
            {/* Tab controls */}
            <div className="tabs-list">
              <button
                className={`tabs-trigger ${
                  activeTab === "description" ? "active" : ""
                }`}
                onClick={() => setActiveTab("description")}
              >
                {t("product.details") || "აღწერა"}
              </button>

              {(product.deliveryTerms || product.deliveryTermsEn) && (
                <button
                  className={`tabs-trigger ${
                    activeTab === "delivery" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("delivery")}
                >
                  {language === "en" ? "Delivery Terms" : "მიწოდების პირობები"}
                </button>
              )}

              {product.videoDescription && (
                <button
                  className={`tabs-trigger ${
                    activeTab === "video" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("video")}
                >
                  {language === "en" ? "Video" : "ვიდეო"}
                </button>
              )}
            </div>

            {/* Tab content */}
            <div
              className={`tab-content ${
                activeTab === "description" ? "active" : ""
              }`}
            >
              <p className="product-description">{displayDescription}</p>
            </div>

            {/* Delivery Terms Tab */}
            {(product.deliveryTerms || product.deliveryTermsEn) && (
              <div
                className={`tab-content ${
                  activeTab === "delivery" ? "active" : ""
                }`}
              >
                <p className="product-description">
                  {language === "en" && product.deliveryTermsEn
                    ? product.deliveryTermsEn
                    : product.deliveryTerms}
                </p>
              </div>
            )}

            {product.videoDescription && (
              <div
                className={`tab-content ${
                  activeTab === "video" ? "active" : ""
                }`}
              >
                <div className="video-container">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.videoDescription,
                    }}
                  />
                </div>
              </div>
            )}

            <AddToCartButton
              productId={product._id}
              countInStock={availableQuantity}
              className="custom-style-2"
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              selectedAgeGroup={selectedAgeGroup}
              quantity={quantity}
              price={finalPrice}
              disabled={
                availableQuantity <= 0 ||
                (product.sizes && product.sizes.length > 0 && !selectedSize) ||
                (product.colors &&
                  product.colors.length > 0 &&
                  !selectedColor) ||
                (product.ageGroups &&
                  product.ageGroups.length > 0 &&
                  !selectedAgeGroup)
              }
            />
          </div>
          {/* Fullscreen Image Modal */}
          {isFullscreenOpen && (
            <div className="fullscreen-modal" onClick={closeFullscreen}>
              <button
                className="fullscreen-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFullscreen();
                }}
              >
                <X />
              </button>
              <div
                className="fullscreen-image-container"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={product.images[currentImageIndex]}
                  alt={displayName}
                  width={1200}
                  height={1200}
                  quality={100}
                  className="fullscreen-image"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="reviews-section">
        <h2 className="reviews-title">Customer Reviews</h2>

        {/* Product Reviews */}
        <ProductReviews product={product} />

        {/* Review Form */}
        <div className="review-form-container">
          <h3 className="review-form-title">Write a Review</h3>
          <ReviewForm
            productId={product._id}
            onSuccess={() => {
              // Optionally refresh the product data to show new review
              window.location.reload();
            }}
          />
        </div>
      </div>

      {/* Similar Products Section */}
      <SimilarProducts
        currentProductId={product._id}
        subCategoryId={
          typeof product.subCategory === "string"
            ? product.subCategory
            : product.subCategory?.id || product.subCategory?._id || ""
        }
      />
    </div>
  );
}

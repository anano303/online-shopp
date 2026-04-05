"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "./TopItems.css";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Product } from "@/types";
import LoadingAnim from "../loadingAnim/loadingAnim";
import { ProductCard } from "@/modules/products/components/product-card";
import { useLanguage } from "@/hooks/LanguageContext";

const AUTO_SCROLL_SPEED = 1; // pixels per frame
const AUTO_SCROLL_INTERVAL = 30; // ms between frames (~33fps)
const ARROW_SCROLL_AMOUNT = 320; // pixels per arrow click

const TopItems: React.FC = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const isUserScrollingRef = useRef(false);

  const { data: discountedProducts, isLoading } = useQuery({
    queryKey: ["discountedProducts"],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: "1",
        limit: "100",
        discounted: "true",
        sortBy: "discountPercentage",
        sortDirection: "desc",
      });
      const response = await fetchWithAuth(
        `/products?${searchParams.toString()}`,
      );
      const data = await response.json();
      const products = data.items || data.products || [];
      return products.slice(0, 6);
    },
    refetchOnWindowFocus: false,
  });

  // Arrow click handlers
  const scrollLeft = useCallback(() => {
    gridRef.current?.scrollBy({
      left: -ARROW_SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  const scrollRight = useCallback(() => {
    gridRef.current?.scrollBy({
      left: ARROW_SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    const el = gridRef.current;
    if (!el || !discountedProducts?.length) return;

    const tick = () => {
      if (isHoveringRef.current || isUserScrollingRef.current) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = 0; // loop back to start
      } else {
        el.scrollLeft += AUTO_SCROLL_SPEED;
      }
    };

    autoScrollRef.current = setInterval(tick, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [discountedProducts]);

  // Pause auto-scroll on hover
  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
  }, []);
  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
  }, []);

  // Handle scroll event
  useEffect(() => {
    const gridElement = gridRef.current;

    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        isUserScrollingRef.current = false;
      }, 1000);
    };

    // Pause auto-scroll while user is manually scrolling (touch/wheel)
    const handleUserScrollStart = () => {
      isUserScrollingRef.current = true;
    };

    if (gridElement) {
      gridElement.addEventListener("scroll", handleScroll);
      gridElement.addEventListener("wheel", handleUserScrollStart, {
        passive: true,
      });
      gridElement.addEventListener("touchstart", handleUserScrollStart, {
        passive: true,
      });
    }

    return () => {
      if (gridElement) {
        gridElement.removeEventListener("scroll", handleScroll);
        gridElement.removeEventListener("wheel", handleUserScrollStart);
        gridElement.removeEventListener("touchstart", handleUserScrollStart);
      }
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="top-items-container loading">
        <LoadingAnim />
      </div>
    );
  }

  return (
    <div
      className="top-items-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="top-items-title-container">
        <h2 className="top-items-title">
          {t("navigation.discounted") || "ფასდაკლებული პროდუქტები"}
        </h2>
      </div>

      <div className="top-items-scroll-wrapper">
        {/* Left arrow */}
        <button
          className="top-items-arrow top-items-arrow-left"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          &#8249;
        </button>

        <div
          ref={gridRef}
          className={`top-items-grid ${isScrolling ? "scrolling" : ""}`}
        >
          {discountedProducts?.map((product: Product, index: number) => (
            <div
              key={product._id}
              className={`product-card-wrapper ${
                index === 0 ? "first-product" : ""
              }`}
              style={index === 0 ? { paddingLeft: "5px" } : {}}
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* View All button as last item in the scroll */}
          {discountedProducts && discountedProducts.length > 0 && (
            <div className="view-all-scroll-item">
              <Link
                href="/shop?discounted=true"
                className="view-all-scroll-button"
              >
                <span className="view-all-text">{t("shop.seeAll")}</span>
                <span className="arrow-icon">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <button
          className="top-items-arrow top-items-arrow-right"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
};

export default TopItems;

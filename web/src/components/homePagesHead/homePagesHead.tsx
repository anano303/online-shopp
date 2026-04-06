"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/LanguageContext";
import { fetchActiveBanners } from "@/lib/banner-api";
import { Banner } from "@/types/banner";
import "./homePagesHead.css";

const HomePagesHead = () => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        setIsLoading(true);
        const activeBanners = await fetchActiveBanners();
        setBanners(activeBanners);
      } catch (error) {
        console.error("Error loading banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Auto-advance banners every 5 seconds (pause on hover)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const nextBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    setCurrentBannerIndex(
      (prev) => (prev - 1 + banners.length) % banners.length,
    );
  }, [banners.length]);

  const goToBanner = useCallback((index: number) => {
    setCurrentBannerIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (banners.length <= 1) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          prevBanner();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextBanner();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextBanner, prevBanner, banners.length]);

  const currentBanner = banners[currentBannerIndex];

  // Preload the banner image if available
  useEffect(() => {
    if (!currentBanner?.imageUrl) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = currentBanner.imageUrl;
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [currentBanner]);

  const backgroundStyle =
    !isLoading && currentBanner && currentBanner.imageUrl
      ? {
          backgroundImage: `var(--hero-overlay), url(${currentBanner.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
        }
      : {
          backgroundColor: "var(--bg-surface-2)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: isLoading ? 0.5 : 1,
        };

  return (
    <div className="home-pages-head">
      <div
        className="rifle-banner"
        style={backgroundStyle}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Banner content: title + CTA centered vertically */}
        {currentBanner && (
          <div className="banner-content">
            <h1 className="banner-title">
              {language === "en" ? currentBanner.titleEn : currentBanner.title}
            </h1>
            {currentBanner.buttonText && currentBanner.buttonLink && (
              <Link href={currentBanner.buttonLink} className="banner-cta-btn">
                <span className="btn-text">
                  {language === "en"
                    ? currentBanner.buttonTextEn
                    : currentBanner.buttonText}
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Carousel navigation */}
        {banners.length > 1 && (
          <>
            <button
              className="carousel-btn prev-btn"
              onClick={prevBanner}
              aria-label="Previous banner"
            >
              &#8249;
            </button>
            <button
              className="carousel-btn next-btn"
              onClick={nextBanner}
              aria-label="Next banner"
            >
              &#8250;
            </button>

            <div className="carousel-indicators">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${
                    index === currentBannerIndex ? "active" : ""
                  }`}
                  onClick={() => goToBanner(index)}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePagesHead;

"use client";

import { useEffect, useRef, useState } from "react";
import HomePagesHead from "@/components/homePagesHead/homePagesHead";
import HomePageShop from "@/components/homePageShop/homePageShop";
import HuntingBanner from "@/components/huntingBanner/hunting-banner";
import TopItems from "@/components/TopItems/TopItems";
import BrandLogos from "@/components/BrandLogos/BrandLogos";
import "../utils/scroll-animations.css";
import "../utils/scroll-performance.css";

const Home = () => {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check for user's motion preference from system settings only
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setReducedMotion(prefersReducedMotion);

    // Disable scroll animations completely to prevent scroll interference
    // All sections will be visible by default
    sectionsRef.current.forEach((section) => {
      if (section) {
        section.classList.add("reveal-visible");
      }
    });

    // No scroll event listeners needed since animations are disabled
  }, []);

  return (
    <div
      style={{ maxWidth: "100vw", overflowX: "hidden" }}
      className={reducedMotion ? "reduced-motion" : ""}
    >
      <div className="section-wrapper">
        <HomePagesHead />
      </div>

      <div
        className="section-wrapper reveal-section"
        ref={(el) => {
          sectionsRef.current[0] = el;
        }}
      >
        <TopItems />
      </div>

      <div className="section-wrapper">
        <HuntingBanner />
      </div>

      <div
        className="section-wrapper reveal-section"
        ref={(el) => {
          sectionsRef.current[1] = el;
        }}
      >
        <HomePageShop />
      </div>

      <div
        className="section-wrapper reveal-section"
        ref={(el) => {
          sectionsRef.current[2] = el;
        }}
      >
        <BrandLogos />
      </div>
    </div>
  );
};

export default Home;

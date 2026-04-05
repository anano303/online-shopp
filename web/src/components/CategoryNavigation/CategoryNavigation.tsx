"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories } from "@/app/(pages)/admin/categories/hook/use-categories";
import { useLanguage } from "@/hooks/LanguageContext";
import { devLog } from "@/utils/logger";
import "./CategoryNavigation.css";

// Function to get category-specific icon - now uses icon from category if available
const getCategoryIcon = (category: any) => {
  devLog("getCategoryIcon called with:", category);
  devLog("Has icon?", category.icon);

  // Use category icon if available (from API)
  if (category.icon) {
    devLog("Using API icon:", category.icon);
    return category.icon;
  }

  // Fallback to name-based icons for backwards compatibility
  devLog("Using fallback icon for:", category.name);
  const name = category.name?.toLowerCase() || "";

  if (
    name.includes("ნადირობა") ||
    name.includes("hunting") ||
    name.includes("rifle")
  ) {
    return "/gun.png";
  } else if (
    name.includes("საბრძოლო") ||
    name.includes("ammunition") ||
    name.includes("ammo")
  ) {
    return "/gun.png";
  } else if (
    name.includes("დასვენება") ||
    name.includes("camping") ||
    name.includes("camp")
  ) {
    return "/camping.png";
  } else if (
    name.includes("თევზაობა") ||
    name.includes("fishing") ||
    name.includes("fish")
  ) {
    return "/fish.png";
  } else if (
    name.includes("ტანსაცმელი") ||
    name.includes("clothing") ||
    name.includes("clothes")
  ) {
    return "/clothes.png";
  } else if (
    name.includes("აქსესუარები") ||
    name.includes("accessories") ||
    name.includes("gear")
  ) {
    return "/clothes.png";
  } else {
    return "/clothes.png"; // Default icon
  }
};

const CategoryNavigation = () => {
  const { data: categories } = useCategories(false);
  const { language } = useLanguage();

  // Track touch/scroll state to distinguish between scroll and click
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // If no categories from API, don't show anything
  if (!categories || categories.length === 0) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    startXRef.current =
      e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="category-navigation">
      <div
        className="category-scroll-container"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {categories.map((category) => {
          const href = `/shop?mainCategory=${category.id}`;

          return (
            <Link key={category.id} href={href} className="main-category-item">
              <div className="category-icon">
                <Image
                  src={getCategoryIcon(category)}
                  alt={category.name}
                  width={24}
                  height={24}
                  className="icon"
                />
              </div>
              <span className="category-text">
                {language === "en"
                  ? category.nameEn || category.name
                  : category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNavigation;

"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useCategories } from "@/app/(pages)/admin/categories/hook/use-categories";
import { useLanguage } from "@/hooks/LanguageContext";
import "./CategoryNavigation.css";

// Returns emoji icon based on category name
const getCategoryEmoji = (category: any): string => {
  // Use emoji from API if it looks like one (short, non-URL string)
  if (
    category.icon &&
    !category.icon.startsWith("/") &&
    !category.icon.startsWith("http")
  ) {
    return category.icon;
  }

  const name = (category.name || "").toLowerCase();

  if (
    name.includes("ნადირობა") ||
    name.includes("hunting") ||
    name.includes("rifle")
  )
    return "🎯";
  if (
    name.includes("საბრძოლო") ||
    name.includes("ammunition") ||
    name.includes("ammo")
  )
    return "💥";
  if (
    name.includes("დასვენება") ||
    name.includes("camping") ||
    name.includes("camp")
  )
    return "⛺";
  if (
    name.includes("თევზაობა") ||
    name.includes("fishing") ||
    name.includes("fish")
  )
    return "🎣";
  if (
    name.includes("ტანსაცმელი") ||
    name.includes("clothing") ||
    name.includes("clothes")
  )
    return "👕";
  if (
    name.includes("ფეხსაცმელი") ||
    name.includes("footwear") ||
    name.includes("shoe")
  )
    return "👟";
  if (
    name.includes("საცურაო") ||
    name.includes("swim") ||
    name.includes("water")
  )
    return "🏊";
  if (
    name.includes("აქსესუარები") ||
    name.includes("accessories") ||
    name.includes("gear")
  )
    return "🎒";
  if (name.includes("სპორტი") || name.includes("sport")) return "⚽";
  if (name.includes("ელექტრო") || name.includes("electronic")) return "⚡";
  if (name.includes("სახლი") || name.includes("home")) return "🏠";

  return "🛒";
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
              <span className="category-icon" aria-hidden="true">
                {getCategoryEmoji(category)}
              </span>
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

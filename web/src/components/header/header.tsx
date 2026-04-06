"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CartIcon } from "@/modules/cart/components/cart-icon";
import "./header.scss";
import UserMenu from "./user-menu";
import { LanguageSwitcher } from "@/components/language-switcher/language-switcher";
import { useLanguage } from "@/hooks/LanguageContext";
import { Home, ShoppingBag, Star, X, Mail, Menu } from "lucide-react";
import SearchBox from "../SearchBox/search-box";
import { ColorModeToggle } from "@/components/theme/ColorModeToggle";
import CategoryNavigation from "@/components/CategoryNavigation/CategoryNavigation";

export default function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t } = useLanguage();

  const toggleNav = () => {
    setIsNavOpen((prevState) => !prevState);
  };

  return (
    <>
      <header
        className={`header wireframe-style ${
          isNavOpen ? "mobile-nav-active" : ""
        }`}
      >
        {/* Top bar: logo, search, controls */}
        <div className="header-container">
          <div className="logo-container">
            <Link href="/" className="brand-wordmark" aria-label="Online Shop">
              <span className="brand-main">online shop</span>
              <span className="brand-sub">curated essentials</span>
            </Link>
          </div>

          <div className="search-container">
            <div className="search-box">
              <SearchBox />
            </div>
          </div>

          <div className="desktop-controls">
            <CartIcon />
            <UserMenu />
            <ColorModeToggle />
            <LanguageSwitcher />
          </div>

          {/* Mobile burger button */}
          <button className="mobile-nav-btn" onClick={toggleNav} aria-label="Toggle menu">
            {isNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Desktop navigation bar below header */}
        <nav className="desktop-nav">
          <div className="desktop-nav-inner">
            <Link href="/" className="desktop-nav-link">
              <Home size={16} />
              <span>{t("navigation.home")}</span>
            </Link>
            <Link href="/shop?page=1" className="desktop-nav-link">
              <ShoppingBag size={16} />
              <span>{t("navigation.shop")}</span>
            </Link>
            <Link href="/about" className="desktop-nav-link">
              <Star size={16} />
              <span>{t("navigation.about")}</span>
            </Link>
            <Link href="/contact" className="desktop-nav-link">
              <Mail size={16} />
              <span>{t("navigation.contact")}</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Category navigation strip below header */}
      <CategoryNavigation />

      {/* Mobile side navigation */}
      <nav className={`side-nav ${isNavOpen ? "open" : ""}`}>
        <div className="side-nav-header">
          <div className="nav-user">
            <UserMenu onNavigate={() => setIsNavOpen(false)} />
          </div>
          <div className="language-switcher-container">
            <ColorModeToggle />
            <LanguageSwitcher />
          </div>
          <button className="nav-close-btn" onClick={toggleNav}>
            <X size={20} />
          </button>
        </div>

        <ul className="side-nav-links">
          <li className="nav-item">
            <Link
              href="/"
              className="nav-link"
              onClick={() => setIsNavOpen(false)}
            >
              <Home size={20} className="nav-icon" />
              <span>{t("navigation.home")}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/shop?page=1"
              className="nav-link"
              onClick={() => setIsNavOpen(false)}
            >
              <ShoppingBag size={20} className="nav-icon" />
              <span>{t("navigation.shop")}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/about"
              className="nav-link"
              onClick={() => setIsNavOpen(false)}
            >
              <Star size={20} className="nav-icon" />
              <span>{t("navigation.about")}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/contact"
              className="nav-link"
              onClick={() => setIsNavOpen(false)}
            >
              <Mail size={20} className="nav-icon" />
              <span>{t("navigation.contact")}</span>
            </Link>
          </li>
        </ul>

        <div className="side-nav-footer">
          <div className="side-nav-actions">
            <CartIcon onNavigate={() => setIsNavOpen(false)} />
          </div>
        </div>
      </nav>

      {/* Overlay for side navigation */}
      {isNavOpen && (
        <div className="side-nav-overlay" onClick={toggleNav}></div>
      )}
    </>
  );
}

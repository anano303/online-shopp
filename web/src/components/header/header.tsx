"use client";

import React, { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo/Logo";
import { CartIcon } from "@/modules/cart/components/cart-icon";
import "./header.scss";
import UserMenu from "./user-menu";
import { LanguageSwitcher } from "@/components/language-switcher/language-switcher";
import { useLanguage } from "@/hooks/LanguageContext";
import { Home, ShoppingBag, Star, X, Mail } from "lucide-react";
import SearchBox from "../SearchBox/search-box";

export default function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t } = useLanguage();

  const toggleNav = () => {
    setIsNavOpen((prevState) => !prevState);
  };

  return (
    <header
      className={`header wireframe-style ${
        isNavOpen ? "mobile-nav-active" : ""
      }`}
    >
      <div className="header-container">
        <div className="logo-container">
          <Logo
            width={120}
            height={50}
            className="header-logo"
            showEdit
            linkTo="/"
          />
        </div>

        <div className="search-container">
          <div className="search-box">
            <SearchBox />
          </div>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="mobile-nav-btn" onClick={toggleNav}>
          {isNavOpen ? (
            <X className="nav-close-icon" size={24} />
          ) : (
            <span className="hamburger-icon">☰</span>
          )}
        </div>

        {/* New side navigation menu with your original links */}
        <nav className={`side-nav ${isNavOpen ? "open" : ""}`}>
          <div className="side-nav-header">
            <div className="nav-user">
              <UserMenu onNavigate={() => setIsNavOpen(false)} />
            </div>
            <div className="language-switcher-container">
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

        {/* Keep your original nav for reference, but hidden via CSS */}
        <nav className="main-nav">
          <ul>
            <li>
              <Link
                href="/"
                className="nav-link"
                onClick={() => setIsNavOpen(false)}
              >
                <Home size={16} className="nav-icon" />
                <span>{t("navigation.home")}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/shop?page=1"
                className="nav-link"
                onClick={() => setIsNavOpen(false)}
              >
                <ShoppingBag size={16} className="nav-icon" />
                <span>{t("navigation.shop")}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="nav-link"
                onClick={() => setIsNavOpen(false)}
              >
                <Star size={16} className="nav-icon" />
                <span>{t("navigation.about")}</span>
              </Link>
            </li>

            <li className="mobile-menu-user-actions">
              <div className="user-menu">
                <UserMenu onNavigate={() => setIsNavOpen(false)} />
              </div>
              <CartIcon onNavigate={() => setIsNavOpen(false)} />
              <div className="language-switcher-container">
                <LanguageSwitcher />
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

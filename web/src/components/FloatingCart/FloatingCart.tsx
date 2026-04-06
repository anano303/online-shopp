"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/modules/cart/context/cart-context";
import { useLanguage } from "@/hooks/LanguageContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CartItem } from "@/types/cart";
import "./FloatingCart.css";

// Helper function to check if image is from Cloudinary
const isCloudinaryImage = (src: string | undefined) =>
  src && (src.includes("cloudinary") || src.includes("res.cloudinary.com"));

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, updateQuantity, totalItems } = useCart();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Drag functionality states
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [position, setPosition] = useState(() => {
    // Load saved position from localStorage or use default
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("floating-cart-position");
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { bottom: 120, left: 20 };
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("floating-cart-position", JSON.stringify(position));
  }, [position]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    // Calculate offset from click point to button position
    setDragOffset({
      x: e.clientX - position.left,
      y: e.clientY - (window.innerHeight - position.bottom - 60),
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setHasDragged(true);

    // New position based on mouse position minus offset
    const newLeft = e.clientX - dragOffset.x;
    const newTop = e.clientY - dragOffset.y;

    // Constrain to viewport
    const left = Math.max(0, Math.min(window.innerWidth - 60, newLeft));
    const bottom = Math.max(
      0,
      Math.min(window.innerHeight - 60, window.innerHeight - newTop - 60),
    );

    setPosition({ bottom, left });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    const touch = e.touches[0];
    // Calculate offset from touch point to button position
    setDragOffset({
      x: touch.clientX - position.left,
      y: touch.clientY - (window.innerHeight - position.bottom - 60),
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setHasDragged(true);

    const touch = e.touches[0];
    // New position based on touch position minus offset
    const newLeft = touch.clientX - dragOffset.x;
    const newTop = touch.clientY - dragOffset.y;

    // Constrain to viewport
    const left = Math.max(0, Math.min(window.innerWidth - 60, newLeft));
    const bottom = Math.max(
      0,
      Math.min(window.innerHeight - 60, window.innerHeight - newTop - 60),
    );

    setPosition({ bottom, left });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Click handler - only open if not dragging
  const handleClick = () => {
    if (!hasDragged) {
      setIsOpen(!isOpen);
    }
  };

  // Calculate total price from items
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const handleGoToCart = () => {
    router.push("/cart");
    setIsOpen(false);
  };

  const handleGoToCheckout = () => {
    router.push("/checkout/shipping");
    setIsOpen(false);
  };

  const getLocalizedName = (item: CartItem) => {
    return language === "en" && item.nameEn ? item.nameEn : item.name;
  };

  if (totalItems === 0) {
    return null; // დავმალოთ თუ კალათი ცარიელია
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div
        ref={buttonRef}
        className={`floating-cart-button ${isOpen ? "open" : ""} ${
          isDragging ? "dragging" : ""
        }`}
        style={{
          bottom: `${position.bottom}px`,
          left: `${position.left}px`,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title={t("cart.dragToMove") || "გადაიტანეთ სხვა ადგილზე"}
      >
        <ShoppingCart size={20} />
        {totalItems > 0 && <div className="cart-badge">{totalItems}</div>}
      </div>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="floating-cart-backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Content */}
          <div className="floating-cart-content">
            <div className="cart-header">
              <h3>{t("cart.yourCart")}</h3>
              <button className="cart-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cart-items-list">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.size || ""}-${
                    item.color || ""
                  }-${item.ageGroup || ""}-${index}`}
                  className="cart-item-mini"
                >
                  <div className="item-image">
                    {item.image ? (
                      isCloudinaryImage(item.image) ? (
                        <img
                          src={item.image}
                          alt={getLocalizedName(item)}
                          className="item-img"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Image
                          src={item.image}
                          alt={getLocalizedName(item)}
                          width={50}
                          height={50}
                          className="item-img"
                        />
                      )
                    ) : (
                      <div
                        className="item-img-placeholder"
                        style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor: "var(--bg-surface-3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "12px",
                          }}
                        >
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="item-details">
                    <div className="item-name">{getLocalizedName(item)}</div>
                    <div className="item-price">
                      {item.price ? `${item.price.toFixed(2)} ₾` : "N/A"}
                    </div>

                    {/* Quantity Controls */}
                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.qty - 1,
                            item.size,
                            item.color,
                            item.ageGroup,
                          )
                        }
                        disabled={item.qty <= 1}
                        className="qty-btn"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="quantity">{item.qty}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.qty + 1,
                            item.size,
                            item.color,
                            item.ageGroup,
                          )
                        }
                        className="qty-btn"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    className="remove-item"
                    onClick={() =>
                      removeItem(
                        item.productId,
                        item.size,
                        item.color,
                        item.ageGroup,
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="total-price">
                <strong>
                  {t("cart.total")}: {totalPrice.toFixed(2)} ₾
                </strong>
              </div>

              <div className="cart-actions">
                <button className="cart-btn view-cart" onClick={handleGoToCart}>
                  {t("cart.viewCart")}
                </button>
                <button
                  className="cart-btn checkout"
                  onClick={handleGoToCheckout}
                >
                  {t("cart.checkout")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useCart } from "../context/cart-context";
import { CartEmpty } from "./cart-empty";
import { CartItem } from "./cart-item";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useUser } from "@/modules/auth/hooks/use-user";
import { useEffect } from "react";
import "./cart-page.css";
import { Color } from "@/types";

export function CartPage() {
  const { items, loading } = useCart();
  const router = useRouter();
  const { t, language } = useLanguage(); // Added language here
  const { user } = useUser();

  // Fetch all colors for proper nameEn support
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
  }); // Get localized color name based on current language (exact same logic as product-details.tsx)
  const getLocalizedColorName = (colorName: string): string => {
    if (language === "en") {
      // Find the color in availableColors to get its English name
      const colorObj = availableColors.find(
        (color) => color.name === colorName
      );
      return colorObj?.nameEn || colorName;
    }
    return colorName;
  };

  if (loading) {
    return <div>{t("shop.loading")}</div>;
  }

  if (items.length === 0) {
    return <CartEmpty />;
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (!user) {
      // თუ მომხმარებელი არაა ავტორიზებული, გადავიყვანოთ ლოგინზე
      router.push("/login?redirect=/checkout/shipping");
      return;
    }
    router.push("/checkout/shipping");
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">{t("cart.yourCart")}</h1>
        <p className="cart-items-count">
          {items.length} {t("cart.items")}
        </p>
      </div>

      <div className="cart-content">
        {" "}
        <div className="cart-items">
          {items.map((item) => {
            return (
              <CartItem
                key={`${item.productId}-${item.color ?? "c"}-${
                  item.size ?? "s"
                }-${item.ageGroup ?? "a"}`}
                item={item}
                getLocalizedColorName={getLocalizedColorName}
              />
            );
          })}
        </div>
        <div className="order-summary">
          <div className="summary-card">
            <h2 className="summary-title">{t("cart.checkout")}</h2>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">{t("cart.total")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <hr className="separator" />
              <div className="summary-row total">
                <span>{t("cart.totalCost")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <button className="checkout-button" onClick={handleCheckout}>
                {t("cart.checkout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

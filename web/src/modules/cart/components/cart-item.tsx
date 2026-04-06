import { CartItem as CartItemType } from "@/types/cart";
import { useCart } from "../context/cart-context";
import { useLanguage } from "@/hooks/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Color, AgeGroupItem, ProductVariant } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import "./cart-item.css";

// Helper function to check if image is from Cloudinary
const isCloudinaryImage = (src: string | undefined) =>
  src && (src.includes("cloudinary") || src.includes("res.cloudinary.com"));

interface CartItemProps {
  item: CartItemType;
  getLocalizedColorName?: (colorName: string) => string;
}

export function CartItem({
  item,
  getLocalizedColorName: propGetLocalizedColorName,
}: CartItemProps) {
  const { updateQuantity, removeItem, addToCart } = useCart();
  const { t, language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editSize, setEditSize] = useState(item.size || "");
  const [editColor, setEditColor] = useState(item.color || "");
  const [editAgeGroup, setEditAgeGroup] = useState(item.ageGroup || "");

  // Fetch all colors for proper nameEn support (only if not provided via props)
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
    enabled: !propGetLocalizedColorName, // Only fetch if not provided via props
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

  // Fetch product variants when editing
  const { data: productData } = useQuery<{
    variants?: ProductVariant[];
    sizes?: string[];
    colors?: string[];
    ageGroups?: string[];
  }>({
    queryKey: ["product-variants", item.productId],
    queryFn: async () => {
      const response = await fetchWithAuth(`/products/${item.productId}`);
      if (!response.ok) return {};
      return response.json();
    },
    enabled: isEditing,
    retry: 1,
    refetchOnWindowFocus: false,
  }); // Get localized color name based on current language (exact same logic as product-details.tsx)
  const getLocalizedColorName =
    propGetLocalizedColorName ||
    ((colorName: string): string => {
      if (language === "en") {
        // Find the color in availableColors to get its English name
        const colorObj = availableColors.find(
          (color) => color.name === colorName,
        );
        return colorObj?.nameEn || colorName;
      }
      return colorName;
    });
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

  // Display name based on selected language
  const displayName =
    language === "en" && item.nameEn ? item.nameEn : item.name;

  // Function to handle quantity updates with variant information
  const handleQuantityUpdate = (qty: number) => {
    updateQuantity(item.productId, qty, item.size, item.color, item.ageGroup);
  };

  // Function to handle item removal with variant information
  const handleRemoveItem = () => {
    removeItem(item.productId, item.size, item.color, item.ageGroup);
  };

  // Get available options from product variants
  const getAvailableOptions = () => {
    const variants = productData?.variants || [];
    const sizes = new Set<string>();
    const colors = new Set<string>();
    const ageGroups = new Set<string>();

    variants.forEach((v) => {
      if (v.size) sizes.add(v.size);
      if (v.color) colors.add(v.color);
      if (v.ageGroup) ageGroups.add(v.ageGroup);
    });

    // Also use product-level arrays if available
    if (productData?.sizes) productData.sizes.forEach((s) => sizes.add(s));
    if (productData?.colors) productData.colors.forEach((c) => colors.add(c));
    if (productData?.ageGroups)
      productData.ageGroups.forEach((a) => ageGroups.add(a));

    return {
      sizes: Array.from(sizes),
      colors: Array.from(colors),
      ageGroups: Array.from(ageGroups),
    };
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditSize(item.size || "");
      setEditColor(item.color || "");
      setEditAgeGroup(item.ageGroup || "");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    const sizeChanged = editSize !== (item.size || "");
    const colorChanged = editColor !== (item.color || "");
    const ageGroupChanged = editAgeGroup !== (item.ageGroup || "");

    if (!sizeChanged && !colorChanged && !ageGroupChanged) {
      setIsEditing(false);
      return;
    }

    // Remove old item and add new one with updated attributes
    await removeItem(item.productId, item.size, item.color, item.ageGroup);
    await addToCart(
      item.productId,
      item.qty,
      editSize || undefined,
      editColor || undefined,
      editAgeGroup || undefined,
      item.price,
    );
    setIsEditing(false);
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.image ? (
          isCloudinaryImage(item.image) ? (
            <img
              src={item.image}
              alt={displayName}
              className="object-cover rounded-md"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Image
              src={item.image}
              alt={displayName}
              fill
              className="object-cover rounded-md"
            />
          )
        ) : (
          <div
            className="cart-item-image-placeholder"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "var(--bg-surface-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.375rem",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              No Image
            </span>
          </div>
        )}
      </div>
      <div className="cart-item-details">
        <div className="cart-item-info">
          <Link href={`/products/${item.productId}`} className="cart-item-name">
            {displayName}
          </Link>
          <p className="cart-item-price">
            {item.price ? formatPrice(item.price) : "N/A"}
          </p>{" "}
          {/* Display variant information if available */}
          {(item.size || item.color || item.ageGroup) && !isEditing && (
            <div className="cart-item-variants">
              {item.size && (
                <span className="variant-tag">
                  {t("cart.size")}: {item.size}
                </span>
              )}
              {item.color && (
                <span className="variant-tag">
                  {t("cart.color")}: {getLocalizedColorName(item.color)}
                </span>
              )}
              {item.ageGroup && (
                <span className="variant-tag">
                  {t("cart.age")}: {getLocalizedAgeGroupName(item.ageGroup)}
                </span>
              )}
              <button
                className="variant-edit-btn"
                onClick={handleEditToggle}
                title={language === "ge" ? "შეცვლა" : "Edit"}
              >
                ✎
              </button>
            </div>
          )}
          {/* Editing variant attributes */}
          {isEditing && (
            <div className="cart-item-edit-variants">
              {(() => {
                const options = getAvailableOptions();
                return (
                  <>
                    {options.sizes.length > 0 && (
                      <div className="edit-variant-field">
                        <label>{t("cart.size")}</label>
                        <select
                          value={editSize}
                          onChange={(e) => setEditSize(e.target.value)}
                        >
                          {options.sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {options.colors.length > 0 && (
                      <div className="edit-variant-field">
                        <label>{t("cart.color")}</label>
                        <select
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                        >
                          {options.colors.map((c) => (
                            <option key={c} value={c}>
                              {getLocalizedColorName(c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {options.ageGroups.length > 0 && (
                      <div className="edit-variant-field">
                        <label>{t("cart.age")}</label>
                        <select
                          value={editAgeGroup}
                          onChange={(e) => setEditAgeGroup(e.target.value)}
                        >
                          {options.ageGroups.map((a) => (
                            <option key={a} value={a}>
                              {getLocalizedAgeGroupName(a)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="edit-variant-actions">
                      <button
                        className="edit-save-btn"
                        onClick={handleSaveEdit}
                      >
                        {language === "ge" ? "შენახვა" : "Save"}
                      </button>
                      <button
                        className="edit-cancel-btn"
                        onClick={handleEditToggle}
                      >
                        {language === "ge" ? "გაუქმება" : "Cancel"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <div className="cart-item-actions">
          <div className="cart-item-quantity">
            <select
              value={item.qty.toString()}
              onChange={(e) => handleQuantityUpdate(Number(e.target.value))}
            >
              {[...Array(item.countInStock)].map((_, i) => (
                <option key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="cart-item-total">
            <span className="cart-item-total-price">
              {item.price ? formatPrice(item.price * item.qty) : "N/A"}
            </span>
            <button onClick={handleRemoveItem} className="remove-button">
              {t("cart.remove")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

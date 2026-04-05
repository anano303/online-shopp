"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/LanguageContext";
import "./ProductCard.css";
import { useCart } from "@/modules/cart/context/cart-context";

interface AddToCartButtonProps {
  productId: string;
  countInStock: number;
  className?: string;
  price?: number;
}

export function AddToCartButton({
  productId,
  countInStock,
  className,
  price,
}: AddToCartButtonProps) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const quantity = 1;

  const isOutOfStock = countInStock === 0;

  const handleAddToCart = async () => {
    setLoading(true);
    toast({
      title: t("cart.addingToCart"),
      description: t("cart.pleaseWait"),
    });

    try {
      await addItem(productId, quantity, price);
    } catch (error) {
      console.log(error);
      toast({
        title: t("cart.error"),
        description: t("cart.failedToAdd"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const increaseQuantity = () => {
  //   if (quantity < countInStock) setQuantity(quantity + 1);
  // };

  // const decreaseQuantity = () => {
  //   if (quantity > 1) setQuantity(quantity - 1);
  // };

  return (
    <div className="cart-actions">
      <button
        className={`addButtonCart ${className}`}
        disabled={isOutOfStock || loading}
        onClick={handleAddToCart}
        title={isOutOfStock ? t("cart.outOfStock") : t("cart.addToCart")}
      >
        {loading ? (
          <div className="cart-loading-spinner" />
        ) : (
          <ShoppingCart size={20} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

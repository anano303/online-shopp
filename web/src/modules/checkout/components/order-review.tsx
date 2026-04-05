"use client";

import { useCheckout } from "../context/checkout-context";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
// import { TAX_RATE } from "@/config/constants";
import { useLanguage } from "@/hooks/LanguageContext";
import { useUser } from "@/modules/auth/hooks/use-user";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./order-review.css";
import { useCart } from "@/modules/cart/context/cart-context";

export function OrderReview() {
  const {
    shippingAddress: shippingDetails,
    paymentMethod,
    isLoaded: isCheckoutLoaded,
  } = useCheckout();
  const { items, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { user, isLoading } = useUser();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated and auth state is loaded
  useEffect(() => {
    if (!isMounted || isLoading) return;
    if (!user) {
      router.push("/login?redirect=/checkout/review");
    }
  }, [user, isLoading, isMounted, router]);

  // Redirect to shipping if no shipping details after checkout is loaded
  useEffect(() => {
    if (!isMounted || !isCheckoutLoaded) return;
    if (!shippingDetails) {
      router.push("/checkout/shipping");
    }
  }, [shippingDetails, isCheckoutLoaded, isMounted, router]);

  // Calculate shipping price based on city and delivery type
  const calculateShippingPrice = (): number => {
    // თვითგატანისას მიწოდება უფასოა
    if (shippingDetails?.deliveryType === "pickup") {
      return 0;
    }

    if (!shippingDetails?.city) return 15; // Default to regional price
    const city = shippingDetails.city.toLowerCase().trim();
    // Check if it's Tbilisi (Georgian or English, any case/format)
    const tbilisiVariants = [
      "თბილისი",
      "tbilisi",
      "tibilisi",
      "tbilissi",
      "თბილისსი",
      "თბილისისი",
    ];
    if (tbilisiVariants.some((variant) => city.includes(variant))) {
      return 8;
    }
    return 15; // All other regions
  };

  const itemsPrice = items.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );
  const shippingPrice: number = calculateShippingPrice();
  // const taxPrice = Number((itemsPrice * TAX_RATE).toFixed(2));
  const taxPrice = 0; // საკომისიო დროებით გამორთული
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  // Helper to check for duplicate order submission
  const checkDuplicateOrder = (): boolean => {
    try {
      const lastOrderData = localStorage.getItem("tsamerti_last_order");
      if (lastOrderData) {
        const {
          totalPrice: lastTotal,
          timestamp,
          productIds,
        } = JSON.parse(lastOrderData);
        const currentProductIds = items
          .map((i) => i.productId)
          .sort()
          .join(",");
        const timeDiff = Date.now() - timestamp;

        // If same products and total within last 2 minutes, it's likely a duplicate
        if (
          lastTotal === totalPrice &&
          productIds === currentProductIds &&
          timeDiff < 2 * 60 * 1000
        ) {
          return true;
        }
      }
    } catch (e) {
      console.error("Error checking duplicate order:", e);
    }
    return false;
  };

  const saveOrderAttempt = () => {
    try {
      localStorage.setItem(
        "tsamerti_last_order",
        JSON.stringify({
          totalPrice,
          timestamp: Date.now(),
          productIds: items
            .map((i) => i.productId)
            .sort()
            .join(","),
        }),
      );
    } catch (e) {
      console.error("Error saving order attempt:", e);
    }
  };

  const handlePlaceOrder = async () => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login?redirect=/checkout/review");
      return;
    }

    if (isPlacingOrder) return; // Prevent double submission

    // Check for duplicate order attempt
    if (checkDuplicateOrder()) {
      toast({
        title: t("checkout.duplicateOrder") || "შეკვეთა უკვე გაიგზავნა",
        description:
          t("checkout.duplicateOrderDescription") ||
          "გთხოვთ დაელოდოთ ან შეამოწმოთ თქვენი შეკვეთები",
        variant: "destructive",
      });
      router.push("/profile/orders");
      return;
    }

    setIsPlacingOrder(true);
    saveOrderAttempt(); // Save attempt to prevent duplicates

    try {
      const orderItems = items.map((item) => ({
        name: item.name,
        nameEn: item.nameEn,
        qty: item.qty,
        image: item.image,
        price: item.price,
        productId: item.productId,
        size: item.size,
        color: item.color,
        ageGroup: item.ageGroup,
      }));

      const response = await apiClient.post("/orders", {
        orderItems,
        shippingDetails,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      await clearCart();
      const nextOrderIdentifier =
        response.data.orderNumber || response.data._id;
      router.push(`/orders/${nextOrderIdentifier}`);
    } catch (error) {
      console.log(error);

      // Check if it's a 401 authentication error
      if (
        (error as { response?: { status?: number } })?.response?.status === 401
      ) {
        toast({
          title: t("auth.authenticationRequired"),
          description: t("auth.pleaseLogin"),
          variant: "destructive",
        });
        router.push("/login?redirect=/checkout/review");
        return;
      }

      toast({
        title: t("checkout.errorPlacingOrder"),
        description: t("checkout.pleaseTryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Don't render if not authenticated or checkout not loaded
  if (!isMounted || isLoading || !isCheckoutLoaded) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!shippingDetails) {
    return null;
  }

  return (
    <div className="order-review-grid">
      <div className="order-details col-span-8 space-y-6">
        {/* Shipping Address */}
        <div className="card p-6">
          <h2 className="section-title">{t("checkout.shipping")}</h2>
          <p className="address-details">
            <strong>{t("checkout.address")}: </strong>
            {shippingDetails?.address}, {shippingDetails?.city},{" "}
            {shippingDetails?.postalCode}, {shippingDetails?.country}
          </p>
          <p className="address-details">
            <strong>{t("checkout.phone")}: </strong>
            {shippingDetails?.phoneNumber}
          </p>
        </div>

        {/* Payment Method */}
        <div className="card p-6">
          <h2 className="section-title">{t("checkout.payment")}</h2>
          <p className="payment-method">
            <strong>{t("checkout.method")}: </strong>
            {paymentMethod}
          </p>
        </div>

        {/* Order Items */}
        <div className="card p-6">
          <h2 className="section-title">{t("checkout.orderItems")}</h2>
          <div className="order-items space-y-4">
            {items.map((item) => {
              // Display name based on selected language
              const displayName =
                language === "en" && item.nameEn ? item.nameEn : item.name;

              return (
                <div
                  key={`${item.productId}-${item.color ?? "c"}-${
                    item.size ?? "s"
                  }-${item.ageGroup ?? "a"}`}
                  className="order-item flex items-center space-x-4"
                >
                  <div className="image-container relative h-20 w-20">
                    <Image
                      src={item.image}
                      alt={displayName}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="order-item-details flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="item-name font-medium hover:underline"
                    >
                      {displayName}
                    </Link>
                    <p className="item-price text-sm text-muted-foreground">
                      {item.qty} x {item.price} ₾ = {item.qty * item.price} ₾
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="order-summary col-span-4">
        <div className="card p-6">
          <h2 className="section-title">{t("checkout.orderSummary")}</h2>
          <div className="summary-details space-y-4">
            <div className="summary-row flex justify-between">
              <span className="summary-label text-muted-foreground">
                {t("checkout.items")}
              </span>
              <span>{itemsPrice.toFixed(2)} ₾</span>
            </div>
            <div className="summary-row flex justify-between">
              <span className="summary-label text-muted-foreground">
                {t("checkout.shippingCost")}
              </span>
              <span>{shippingPrice.toFixed(2)} ₾</span>
            </div>
            {/* დღგ/საკომისიო დროებით გამორთული
            <div className="summary-row flex justify-between">
              <span className="summary-label text-muted-foreground">
                {t("checkout.tax")}
              </span>
              <span>{taxPrice.toFixed(2)} ₾</span>
            </div>
            */}
            <div className="separator" />
            <div className="summary-row flex justify-between font-medium">
              <span>{t("checkout.total")}</span>
              <span>{totalPrice.toFixed(2)} ₾</span>
            </div>
            <button
              className={`place-order-button w-full ${
                isPlacingOrder ? "loading" : ""
              }`}
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <span className="spinner"></span>
                  {t("checkout.placingOrder")}
                </>
              ) : (
                t("checkout.placeOrder")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

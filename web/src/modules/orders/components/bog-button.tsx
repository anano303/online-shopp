import React, { useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { useLanguage } from "@/hooks/LanguageContext";

interface BOGButtonProps {
  orderId: string;
  amount: number;
  orderNumber?: string;
}

export function BOGButton({ orderId, amount, orderNumber }: BOGButtonProps) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBOGPayment = async () => {
    if (isProcessing) return; // Prevent double submission

    setIsProcessing(true);

    try {
      const token = getAccessToken();

      // Get order details first with authentication
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!orderResponse.ok) {
        throw new Error(`Failed to fetch order: ${orderResponse.status}`);
      }

      const order = await orderResponse.json();

      const friendlyOrderNumber =
        orderNumber || order.orderNumber || order.externalOrderId || orderId;
      const canonicalOrderId = friendlyOrderNumber || orderId;

      // Prepare redirect URLs with canonical and fallback IDs
      const queryParams = new URLSearchParams({ orderId: canonicalOrderId });
      if (friendlyOrderNumber && orderId && friendlyOrderNumber !== orderId) {
        queryParams.set("dbId", orderId);
      }

      const successUrl = `${
        window.location.origin
      }/checkout/success?${queryParams.toString()}`;
      const failUrl = `${
        window.location.origin
      }/checkout/fail?${queryParams.toString()}`;

      // Create payment request
      const paymentData = {
        customer: {
          firstName: order.shippingAddress?.firstName || "Customer",
          lastName: order.shippingAddress?.lastName || "Customer",
          personalId: order.shippingAddress?.personalId || "",
          address: order.shippingAddress?.address || "",
          phoneNumber: order.shippingAddress?.phoneNumber || "",
          email: order.user?.email || "",
        },
        product: {
          productName: `Order #${orderId}`,
          productId: orderId,
          unitPrice: amount,
          quantity: 1,
          totalPrice: amount,
        },
        successUrl,
        failUrl,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/bog/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        },
      );

      if (!response.ok) {
        throw new Error("Payment initiation failed");
      }

      const result = await response.json();

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error("No redirect URL provided");
      }
    } catch (error) {
      console.error("BOG Payment Error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleBOGPayment}
      disabled={isProcessing}
      style={{
        width: "100%",
        padding: "1rem 1.5rem",
        background: "var(--color-primary-gradient)",
        color: "#fff",
        border: "none",
        borderRadius: "0.625rem",
        cursor: isProcessing ? "not-allowed" : "pointer",
        opacity: isProcessing ? 0.7 : 1,
        transition: "all 250ms ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.625rem",
        fontFamily: "inherit",
        fontSize: "1.05rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        boxShadow: "0 6px 20px rgba(var(--color-primary-rgb), 0.35)",
      }}
      onMouseEnter={(e) => {
        if (!isProcessing) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 10px 28px rgba(var(--color-primary-rgb), 0.45)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 6px 20px rgba(var(--color-primary-rgb), 0.35)";
      }}
    >
      {isProcessing ? (
        <span
          style={{
            width: 18,
            height: 18,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : (
        <svg viewBox="0 0 24 24" fill="#fff" width={22} height={22}>
          <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12zm-8-1h2v-4h4v-2h-4V7h-2v4H8v2h4v4z" />
        </svg>
      )}
      <span>
        {isProcessing ? t("order.processing") : t("order.paymentButton")}
      </span>
      <span style={{ marginLeft: "auto", fontSize: "1.1rem" }}>
        {amount.toFixed(2)} ₾
      </span>
    </button>
  );
}

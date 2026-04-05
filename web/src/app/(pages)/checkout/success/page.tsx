"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Order } from "@/types/order";
import "./page.css";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [queryParams, setQueryParams] = useState<{
    orderId: string | null;
    dbId: string | null;
  } | null>(null);

  useEffect(() => {
    setQueryParams({
      orderId: searchParams.get("orderId"),
      dbId: searchParams.get("dbId"),
    });
  }, [searchParams]);

  const orderIdentifier = queryParams?.orderId || queryParams?.dbId || null;

  const {
    data: order,
    isLoading: isLoadingOrder,
    isError,
  } = useQuery<Order>({
    queryKey: ["checkout-success-order", orderIdentifier],
    enabled: Boolean(orderIdentifier),
    queryFn: async () => {
      if (!orderIdentifier) {
        throw new Error("Order ID is required");
      }
      const response = await fetchWithAuth(`/orders/${orderIdentifier}`);
      return response.json();
    },
    retry: 1,
  });

  const displayOrderNumber =
    order?.orderNumber ||
    queryParams?.orderId ||
    order?.externalOrderId ||
    order?._id ||
    queryParams?.dbId;

  const linkIdentifier =
    order?.orderNumber ||
    queryParams?.orderId ||
    order?._id ||
    queryParams?.dbId ||
    null;

  const orderDetailsHref = linkIdentifier
    ? `/orders/${linkIdentifier}`
    : undefined;

  const showQueryInitialized = Boolean(queryParams);

  return (
    <div className="checkout-success-container">
      <div className="heartLast">
        <div className="success-card">
          {/* <Image src="/heartLast.png" alt="heartLogo" className="heartLast" width={500} height={700}/> */}

          <h1 className="success-title">გადახდა წარმატებით დასრულდა!</h1>
          <div className="success-icon-container">
            <div className="success-icon">✓</div>
          </div>

          <p className="success-description"> მადლობა შეძენისთვის ! </p>

          {(displayOrderNumber || orderIdentifier) && (
            <div className="order-info">
              <p className="order-info-text">
                <span className="order-info-label">შეკვეთის ნომერი:</span>{" "}
                {!showQueryInitialized || isLoadingOrder
                  ? "იტვირთება..."
                  : displayOrderNumber}
              </p>
              {isError && (
                <p className="order-info-text order-info-hint">
                  დროებით ვაჩვენებთ ტექნიკურ ნომერს. დეტალურად იხილე ჩემი
                  შეკვეთებში.
                </p>
              )}
            </div>
          )}

          <div className="buttons-container">
            {orderDetailsHref && showQueryInitialized && (
              <Link href={orderDetailsHref} className="btn-primary">
                შეკვეთის დეტალების ნახვა
              </Link>
            )}

            <Link href="/shop" className="btn-secondary">
              სხვა პროდუქტების ნახვა
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "./page.css";

function CheckoutFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const handleRetryPayment = () => {
    if (orderIdentifier) {
      router.push(`/orders/${orderIdentifier}`);
    } else {
      router.push("/cart");
    }
  };

  return (
    <div className="checkout-fail-container">
      <div className="fail-card">
        <div className="fail-icon-container">
          <svg
            className="fail-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="fail-title">გადახდა ვერ შესრულდა</h1>

        <p className="fail-description">
          გადახდის პროცესში რაღაც ხარვეზი მოხდა. გთხოვთ სცადოთ ხელახლა ან
          დაგვიკავშირდით მხარდაჭერის სამსახურთან.
        </p>

        {(queryParams?.orderId || queryParams?.dbId) && (
          <div className="order-info">
            <p className="order-info-text">
              <span className="order-info-label">შეკვეთის ნომერი:</span>{" "}
              {queryParams?.orderId || queryParams?.dbId}
            </p>
          </div>
        )}

        <div className="buttons-container">
          <button onClick={handleRetryPayment} className="btn-primary">
            ხელახლა ცდა
          </button>

          <Link href="/cart" className="btn-secondary">
            კალათაში დაბრუნება
          </Link>

          <Link href="/products" className="btn-secondary">
            სხვა პროდუქტების ნახვა
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutFailContent />
    </Suspense>
  );
}

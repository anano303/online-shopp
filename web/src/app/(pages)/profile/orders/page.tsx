import { OrdersClient } from "./orders-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order History | Soul Art",
  description: "View your order history",
};

export default function OrdersPage() {
  return (
    <div
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      <OrdersClient />
    </div>
  );
}

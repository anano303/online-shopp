"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Order } from "@/types/order";
// import "./ordersList.css";
import HeartLoading from "@/components/HeartLoading/HeartLoading";
import "./ordersList.css";

export function OrdersList() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, orderNumberFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8",
      });

      if (orderNumberFilter.trim()) {
        params.set("orderNumber", orderNumberFilter.trim());
      }

      const response = await fetchWithAuth(`/orders?${params.toString()}`);
      const data = await response.json();
      console.log("Orders data:", data);
      const items = Array.isArray(data) ? data : [];
      return {
        items,
        pages: orderNumberFilter ? 1 : Math.ceil(items.length / 8),
      };
    },
  });

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setOrderNumberFilter(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setOrderNumberFilter("");
  };

  if (isLoading) {
    return (
      <div className="orders-container">{<HeartLoading size="medium" />}</div>
    );
  }

  const orders = data?.items || [];
  const totalPages = orderNumberFilter ? 1 : data?.pages || 0;
  console.log("Rendered orders:", orders);

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1 className="orders-title">Orders</h1>
      </div>
      <div className="orders-toolbar">
        <form className="orders-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by order number (SHOP#####)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
          {orderNumberFilter && (
            <button type="button" onClick={handleClearSearch}>
              Clear
            </button>
          )}
        </form>
      </div>
      {!orders || orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>USER</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  {/* <th>DELIVERY TYPE</th> */}
                  <th>PAID</th>
                  <th>DELIVERED</th>
                  <th className="orders-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order) => {
                  const orderDisplayNumber =
                    order.orderNumber || order.externalOrderId || order._id;

                  return (
                    <tr key={order._id}>
                      <td>#{orderDisplayNumber}</td>
                      <td>{order.user?.email || "წაშლილი მომხმარებელი"}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{order.totalPrice.toFixed(2)}₾</td>
                      {/* <td>
                    {order.orderItems.some(item => 
                      item.product && String(item.product.deliveryType) === "SELLER"
                    ) ? (
                      <span className="delivery-badge seller">
                        <Store className="icon" />
                        აგზავნის ავტორი
                        {order.orderItems
                          .filter(item => item.product && String(item.product.deliveryType) === "SELLER")
                          .map(item => (
                            item.product?.minDeliveryDays && item.product?.maxDeliveryDays ? (
                              <span className="delivery-time" key={item._id}>
                                {item.product.minDeliveryDays}-{item.product.maxDeliveryDays} დღე
                              </span>
                            ) : null
                          ))}
                      </span>
                    ) : (
                      // <span className="delivery-badge store">
                      //   <Truck className="icon" />
                      //   ცამეტის კურიერი
                      // </span>
                    )}
                  </td> */}
                      <td>
                        {order.status === "cancelled" ? (
                          <span className="status-badge cancelled">
                            <XCircle className="icon" />
                            Cancelled
                          </span>
                        ) : order.status === "paid" || order.isPaid ? (
                          <span className="status-badge success">
                            <CheckCircle2 className="icon" />
                            {order.paidAt &&
                              new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="status-badge error">
                            <XCircle className="icon" />
                            Not Paid
                          </span>
                        )}
                      </td>
                      <td>
                        {order.isDelivered ? (
                          <span className="status-badge success">
                            <CheckCircle2 className="icon" />
                            {order.deliveredAt &&
                              new Date(order.deliveredAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="status-badge error">
                            <XCircle className="icon" />
                            Not Delivered
                          </span>
                        )}
                      </td>
                      <td className="orders-actions">
                        <Link
                          href={`/admin/orders/${
                            order.orderNumber ||
                            order._id ||
                            order.externalOrderId
                          }`}
                          className="view-link"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

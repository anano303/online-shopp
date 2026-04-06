import { CheckoutSteps } from "@/modules/checkout/components/checkout-steps";
import { OrderReview } from "@/modules/checkout/components/order-review";

export default function ReviewPage() {
  return (
    <div className="Container">
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1rem" }}
      >
        <CheckoutSteps currentStep={3} />
        <OrderReview />
      </div>
    </div>
  );
}

import { CheckoutSteps } from "@/modules/checkout/components/checkout-steps";
import { ShippingForm } from "@/modules/checkout/components/shipping-form";

export default function ShippingPage() {
  return (
    <div className="Container">
      <div
        style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1rem" }}
      >
        <CheckoutSteps currentStep={2} />
        <ShippingForm />
      </div>
    </div>
  );
}

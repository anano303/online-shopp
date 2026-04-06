"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useCheckout } from "../context/checkout-context";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/modules/auth/hooks/use-user";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/LanguageContext";
// import { FaPaypal } from "react-icons/fa";
// import { CreditCard } from "lucide-react";
import "./payment-form.css";

const formSchema = z.object({
  paymentMethod: z.enum(["PayPal", "Stripe", "BOG"], {
    required_error: "Please select a payment method.",
  }),
});

export function PaymentForm() {
  const { setPaymentMethod } = useCheckout();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useUser();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated and auth state is loaded
  useEffect(() => {
    if (!isMounted || isLoading) return;
    if (!user) {
      router.push("/login?redirect=/checkout/payment");
    }
  }, [user, isLoading, isMounted, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "BOG",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login?redirect=/checkout/payment");
      return;
    }

    try {
      const response = await apiClient.post("/cart/payment", {
        paymentMethod: values.paymentMethod,
      });
      const paymentMethod = response.data;
      console.log(paymentMethod);
      setPaymentMethod(paymentMethod);
      router.push("/checkout/review");
    } catch (error) {
      console.log(error);

      // Check if it's a 401 authentication error
      if ((error as any)?.response?.status === 401) {
        toast({
          title: t("auth.authenticationRequired"),
          description: t("auth.pleaseLogin"),
          variant: "destructive",
        });
        router.push("/login?redirect=/checkout/payment");
        return;
      }

      toast({
        title: t("checkout.errorSavingPayment"),
        description: t("checkout.pleaseTryAgain"),
        variant: "destructive",
      });
    }
  }

  // Don't render form if not authenticated
  if (!isMounted || isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="payment-card">
      <div className="payment-header">
        <h1 className="payment-title">
          {t("checkout.paymentMethod")}
        </h1>
        <p className="payment-subtitle">
          {t("checkout.choosePaymentMethod")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="payment-form">
        <div className="payment-options">
          <label htmlFor="BOG" className="payment-option-label">
            <input
              type="radio"
              value="BOG"
              id="BOG"
              className="payment-radio-hidden"
              {...form.register("paymentMethod")}
            />
            <div className="payment-option-content">
              <svg viewBox="0 0 24 24" fill="green" width="24" height="24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="payment-option-text">
                {t("checkout.cardPayment")}
              </span>
            </div>
          </label>
        </div>

        <button type="submit" className="payment-submit-btn">
          {t("checkout.continueToReview")}
        </button>
      </form>
    </div>
  );
}

"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CHECKOUT_STORAGE_KEY = "tsamerti_checkout_data";

interface CheckoutContextType {
  shippingAddress: ShippingAddress | null;
  paymentMethod: string | null;
  isLoaded: boolean;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentMethod: (method: string) => void;
  clearCheckout: () => void;
}

interface ShippingAddress {
  deliveryType?: "pickup" | "delivery";
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

interface CheckoutStorageData {
  shippingAddress: ShippingAddress | null;
  paymentMethod: string | null;
  timestamp: number;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

// localStorage helper functions
const saveToStorage = (data: CheckoutStorageData) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving checkout data to localStorage:", error);
    }
  }
};

const clearStorage = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing checkout data from localStorage:", error);
    }
  }
};

// Get initial values from localStorage synchronously
const getInitialCheckoutData = (): CheckoutStorageData | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as CheckoutStorageData;
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp < ONE_DAY) {
        return data;
      } else {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("Error loading initial checkout data:", error);
  }
  return null;
};

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  // Start with null to avoid hydration mismatch
  const [shippingAddress, setShippingAddressState] =
    useState<ShippingAddress | null>(null);
  const [paymentMethod, setPaymentMethodState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount - this runs only on client
  useEffect(() => {
    const stored = getInitialCheckoutData();
    if (stored) {
      if (stored.shippingAddress) {
        setShippingAddressState(stored.shippingAddress);
      }
      if (stored.paymentMethod) {
        setPaymentMethodState(stored.paymentMethod);
      }
    }
    // Use microtask to ensure state updates are flushed before marking initialized
    Promise.resolve().then(() => {
      setIsInitialized(true);
    });
  }, []);

  const setShippingAddress = (address: ShippingAddress) => {
    setShippingAddressState(address);
    // Save immediately to localStorage for navigation resilience
    saveToStorage({
      shippingAddress: address,
      paymentMethod,
      timestamp: Date.now(),
    });
  };

  const setPaymentMethod = (method: string) => {
    setPaymentMethodState(method);
    // Save immediately to localStorage for navigation resilience
    saveToStorage({
      shippingAddress,
      paymentMethod: method,
      timestamp: Date.now(),
    });
  };

  const clearCheckout = () => {
    setShippingAddressState(null);
    setPaymentMethodState(null);
    clearStorage();
  };

  return (
    <CheckoutContext.Provider
      value={{
        shippingAddress,
        paymentMethod,
        isLoaded: isInitialized,
        setShippingAddress,
        setPaymentMethod,
        clearCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}

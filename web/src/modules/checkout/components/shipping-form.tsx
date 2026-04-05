"use client";

import { useForm, Controller } from "react-hook-form";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCheckout } from "../context/checkout-context";
import { getCountries } from "@/lib/countries";
import { useUser } from "@/modules/auth/hooks/use-user";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SavedAddress } from "@/types";

import "./shipping-form.css";

interface ShippingFormData {
  deliveryType: "pickup" | "delivery";
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  saveAddress?: boolean;
  addressLabel?: string;
}

export function ShippingForm() {
  const { setShippingAddress, setPaymentMethod } = useCheckout();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useUser();
  const { t, language } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isNewAddress, setIsNewAddress] = useState(false);
  const queryClient = useQueryClient();

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery<SavedAddress[]>({
    queryKey: ["userAddresses"],
    queryFn: async () => {
      const response = await apiClient.get("/users/addresses/my");
      return response.data;
    },
    enabled: !!user,
  });

  // Mutation for saving new address
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: {
      label: string;
      address: string;
      city: string;
      postalCode?: string;
      country: string;
      phoneNumber: string;
    }) => {
      const response = await apiClient.post("/users/addresses", addressData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast({
        title: language === "ge" ? "მისამართი შენახულია" : "Address saved",
        description:
          language === "ge"
            ? "მისამართი დაემატა თქვენს პროფილში"
            : "Address has been added to your profile",
      });
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to login if not authenticated and auth state is loaded
  useEffect(() => {
    if (!isMounted || isLoading) return;
    if (!user) {
      router.push("/login?redirect=/checkout/shipping");
    }
  }, [user, isLoading, isMounted, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
  } = useForm<ShippingFormData>({
    defaultValues: {
      deliveryType: "delivery",
    },
  });

  const deliveryType = watch("deliveryType");
  // const saveAddress = watch("saveAddress");

  // Handle saved address selection
  const handleSavedAddressSelect = (addressId: string) => {
    if (addressId === "new") {
      setIsNewAddress(true);
      setSelectedAddressId("");
      // Clear form for new address
      setValue("address", "");
      setValue("city", "");
      setValue("postalCode", "");
      setValue("country", "");
      setValue("phoneNumber", "");
      setValue("saveAddress", true);
      return;
    }

    setIsNewAddress(false);
    setSelectedAddressId(addressId);
    setValue("saveAddress", false);

    if (addressId === "") return;

    const address = savedAddresses.find((a) => a.id === addressId);
    if (address) {
      setValue("address", address.address);
      setValue("city", address.city);
      setValue("postalCode", address.postalCode || "");
      setValue("country", address.country);
      setValue("phoneNumber", address.phoneNumber);
    }
  };

  // Auto-select default address on load
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find((a) => a.isDefault);
      if (defaultAddress) {
        handleSavedAddressSelect(defaultAddress.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const onSubmit = async (data: ShippingFormData) => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login?redirect=/checkout/shipping");
      return;
    }

    try {
      // Save new address to profile if checkbox is checked
      if (
        data.saveAddress &&
        isNewAddress &&
        data.deliveryType === "delivery"
      ) {
        await saveAddressMutation.mutateAsync({
          label:
            data.addressLabel ||
            (language === "ge" ? "ახალი მისამართი" : "New Address"),
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
          phoneNumber: data.phoneNumber,
        });
      }

      // Get shipping data based on selection
      let shippingData;

      if (data.deliveryType === "pickup") {
        // თვითგატანა
        shippingData = {
          deliveryType: "pickup",
          address:
            "თვითგატანა - თბილისი,ვასილ კაკაბაძის ქ. N8, სამუშაო დღეებში 20:00-დან 22:00-მდე",
          city: "თბილისი",
          country: "GE",
          phoneNumber: data.phoneNumber,
        };
      } else if (!isNewAddress && selectedAddressId) {
        // შენახული მისამართი
        const selectedAddr = savedAddresses.find(
          (a) => a.id === selectedAddressId,
        );
        if (selectedAddr) {
          shippingData = {
            deliveryType: "delivery",
            address: selectedAddr.address,
            city: selectedAddr.city,
            postalCode: selectedAddr.postalCode || "",
            country: selectedAddr.country,
            phoneNumber: selectedAddr.phoneNumber,
          };
        } else {
          throw new Error("Selected address not found");
        }
      } else {
        // ახალი მისამართი
        shippingData = {
          deliveryType: "delivery",
          address: data.address,
          city: data.city,
          postalCode: data.postalCode || "",
          country: data.country,
          phoneNumber: data.phoneNumber,
        };
      }

      const response = await apiClient.post("/cart/shipping", shippingData);
      const shippingAddress = response.data;
      setShippingAddress(shippingAddress);

      // Auto-set payment method to BOG
      setPaymentMethod("BOG");

      // Go directly to review
      router.push("/checkout/review");
    } catch (error) {
      console.log(error);

      // Check if it's a 401 authentication error
      if ((error as { response?: { status?: number } })?.response?.status === 401) {
        toast({
          title: t("auth.authenticationRequired"),
          description: t("auth.pleaseLogin"),
          variant: "destructive",
        });
        router.push("/login?redirect=/checkout/shipping");
        return;
      }

      toast({
        title: t("checkout.errorSavingShipping"),
        description: t("checkout.pleaseTryAgain"),
        variant: "destructive",
      });
    }
  };

  // Don't render form if not authenticated
  if (!isMounted || isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="shipping-form-card">
      <div className="shipping-form-header">
        <h1>{t("checkout.shippingAddress")}</h1>
        <p>{t("checkout.enterShippingDetails")}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="shipping-form">
        {/* მიტანის ტიპის არჩევა */}
        <div className="shipping-form-field delivery-type-field">
          <label>
            {language === "ge" ? "მიტანის მეთოდი" : "Delivery Method"}
          </label>
          <div className="delivery-type-options">
            <label
              className={`delivery-type-option ${
                deliveryType === "delivery" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                value="delivery"
                {...register("deliveryType")}
              />
              <div className="delivery-type-content">
                <span className="delivery-type-icon">🚚</span>
                <div className="delivery-type-info">
                  <span className="delivery-type-title">
                    {language === "ge" ? "მიტანა მისამართზე" : "Home Delivery"}
                  </span>
                  <span className="delivery-type-desc">
                    {language === "ge"
                      ? "თბილისი - 8₾, რეგიონები - 15₾"
                      : "Tbilisi - 8₾, Regions - 15₾"}
                  </span>
                </div>
              </div>
            </label>
            <label
              className={`delivery-type-option ${
                deliveryType === "pickup" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                value="pickup"
                {...register("deliveryType")}
              />
              <div className="delivery-type-content">
                <span className="delivery-type-icon">🏪</span>
                <div className="delivery-type-info">
                  <span className="delivery-type-title">
                    {language === "ge" ? "თვითგატანა" : "Self Pickup"}
                  </span>
                  <span className="delivery-type-desc">
                    {language === "ge" ? "უფასო" : "Free"}
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* თვითგატანის მისამართი */}
        {deliveryType === "pickup" && (
          <div className="pickup-address-info">
            <h3>
              {language === "ge" ? "📍 გატანის მისამართი" : "📍 Pickup Address"}
            </h3>
            <p>
              <strong>{language === "ge" ? "მისამართი:" : "Address:"}</strong>{" "}
              თბილისი, ვასილ კაკაბაძის ქ. N8
            </p>
            <p>
              <strong>
                {language === "ge" ? "სამუშაო საათები:" : "Working Hours:"}
              </strong>{" "}
              სამუშაო დღეებში 20:00 - 22:00
            </p>
            <p>
              <strong>{language === "ge" ? "ტელეფონი:" : "Phone:"}</strong> +995
              574150531
            </p>
          </div>
        )}

        {/* მიტანის ფორმა - მხოლოდ თუ მიტანაა არჩეული */}
        {deliveryType === "delivery" && (
          <>
            {/* Saved Addresses Dropdown */}
            <div className="shipping-form-field saved-address-field">
              <label htmlFor="savedAddress">
                {language === "ge" ? "მისამართი" : "Address"}
              </label>
              <select
                id="savedAddress"
                value={isNewAddress ? "new" : selectedAddressId}
                onChange={(e) => handleSavedAddressSelect(e.target.value)}
                className="saved-address-select"
              >
                {savedAddresses.length > 0 && (
                  <option value="">
                    {language === "ge"
                      ? "აირჩიეთ შენახული მისამართი..."
                      : "Select a saved address..."}
                  </option>
                )}
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label} - {addr.address}, {addr.city}
                    {addr.isDefault
                      ? language === "ge"
                        ? " (ძირითადი)"
                        : " (Default)"
                      : ""}
                  </option>
                ))}
                <option value="new">
                  ➕{" "}
                  {language === "ge"
                    ? "ახალი მისამართის დამატება"
                    : "Add new address"}
                </option>
              </select>
            </div>

            {/* Show form fields only for new address or if no address selected */}
            {(isNewAddress ||
              savedAddresses.length === 0 ||
              !selectedAddressId) && (
              <>
                {/* Address Label - only for new address */}
                {isNewAddress && (
                  <div className="shipping-form-field">
                    <label htmlFor="addressLabel">
                      {language === "ge"
                        ? "მისამართის სახელი"
                        : "Address Label"}
                    </label>
                    <input
                      id="addressLabel"
                      {...register("addressLabel")}
                      placeholder={
                        language === "ge"
                          ? "მაგ: სახლი, ოფისი..."
                          : "e.g: Home, Office..."
                      }
                    />
                  </div>
                )}

                <div className="shipping-form-field">
                  <label htmlFor="address">{t("checkout.streetAddress")}</label>
                  <input
                    id="address"
                    {...register("address", {
                      required:
                        deliveryType === "delivery"
                          ? t("checkout.addressRequired")
                          : false,
                    })}
                    placeholder={t("checkout.addressPlaceholder")}
                  />
                  {errors.address && (
                    <p className="error-text">{errors.address.message}</p>
                  )}
                </div>

                <div className="shipping-form-field">
                  <label htmlFor="city">{t("checkout.city")}</label>
                  <input
                    id="city"
                    {...register("city", {
                      required:
                        deliveryType === "delivery"
                          ? t("checkout.cityRequired")
                          : false,
                    })}
                    placeholder={t("checkout.cityPlaceholder")}
                  />
                  {errors.city && (
                    <p className="error-text">{errors.city.message}</p>
                  )}
                  <p className="shipping-info-text">
                    {language === "ge"
                      ? "მიწოდება: თბილისი - 8₾, რეგიონები - 15₾"
                      : "Delivery: Tbilisi - 8₾, Regions - 15₾"}
                  </p>
                </div>

                <div className="shipping-form-field">
                  <label htmlFor="postalCode">{t("checkout.postalCode")}</label>
                  <input
                    id="postalCode"
                    {...register("postalCode")}
                    placeholder={t("checkout.postalCodePlaceholder")}
                  />
                  {errors.postalCode && (
                    <p className="error-text">{errors.postalCode.message}</p>
                  )}
                </div>

                <div className="shipping-form-field">
                  <label htmlFor="country">{t("checkout.country")}</label>
                  <Controller
                    name="country"
                    control={control}
                    defaultValue=""
                    rules={{
                      required:
                        deliveryType === "delivery"
                          ? t("checkout.countryRequired")
                          : false,
                    }}
                    render={({ field }) => (
                      <select {...field}>
                        <option value="" disabled>
                          {t("checkout.selectCountry")}
                        </option>
                        {getCountries().map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.country && (
                    <p className="error-text">{errors.country.message}</p>
                  )}
                </div>

                {/* Save Address Checkbox - only for new address */}
                {isNewAddress && (
                  <div className="shipping-form-field save-address-field">
                    <label className="checkbox-label">
                      <input type="checkbox" {...register("saveAddress")} />
                      <span>
                        {language === "ge"
                          ? "შევინახო ეს მისამართი მომავალი შეკვეთებისთვის"
                          : "Save this address for future orders"}
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Show selected address summary if not new */}
            {!isNewAddress &&
              selectedAddressId &&
              savedAddresses.length > 0 && (
                <div className="selected-address-summary">
                  {(() => {
                    const addr = savedAddresses.find(
                      (a) => a.id === selectedAddressId,
                    );
                    if (!addr) return null;
                    return (
                      <>
                        <p>
                          <strong>{addr.label}</strong>
                        </p>
                        <p>{addr.address}</p>
                        <p>
                          {addr.city}, {addr.country}
                        </p>
                        <p>{addr.phoneNumber}</p>
                      </>
                    );
                  })()}
                </div>
              )}
          </>
        )}

        {/* ტელეფონი - ორივე შემთხვევაში საჭიროა */}
        {(deliveryType === "pickup" ||
          isNewAddress ||
          savedAddresses.length === 0 ||
          !selectedAddressId) && (
          <div className="shipping-form-field">
            <label htmlFor="phoneNumber">{t("checkout.phoneNumber")}</label>
            <input
              id="phoneNumber"
              type="tel"
              {...register("phoneNumber", {
                required: t("checkout.phoneNumberRequired"),
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: t("checkout.validPhoneNumber"),
                },
              })}
              placeholder={t("checkout.phoneNumberPlaceholder")}
            />
            {errors.phoneNumber && (
              <p className="error-text">{errors.phoneNumber.message}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="shipping-form-button"
          disabled={isSubmitting}
        >
          {t("checkout.continueToPayment")}
        </button>
      </form>
    </div>
  );
}

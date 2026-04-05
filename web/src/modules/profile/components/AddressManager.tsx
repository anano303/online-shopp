"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/LanguageContext";
import { SavedAddress } from "@/types";
import { MapPin, Plus, Edit2, Trash2, Star, X } from "lucide-react";
import "./AddressManager.css";

interface AddressFormData {
  label: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  phoneNumber: string;
  isDefault?: boolean;
}

export function AddressManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );
  const [formData, setFormData] = useState<AddressFormData>({
    label: "",
    address: "",
    city: "",
    postalCode: "",
    country: "GE",
    phoneNumber: "",
    isDefault: false,
  });

  const { data: addresses = [], isLoading } = useQuery<SavedAddress[]>({
    queryKey: ["userAddresses"],
    queryFn: async () => {
      const response = await apiClient.get("/users/addresses/my");
      return response.data;
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiClient.post("/users/addresses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      resetForm();
      toast({
        title: language === "ge" ? "მისამართი დაემატა" : "Address added",
        description:
          language === "ge"
            ? "მისამართი წარმატებით დაემატა"
            : "Address successfully added",
      });
    },
    onError: () => {
      toast({
        title: language === "ge" ? "შეცდომა" : "Error",
        description:
          language === "ge"
            ? "მისამართის დამატება ვერ მოხერხდა"
            : "Failed to add address",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      const response = await apiClient.put(`/users/addresses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      resetForm();
      toast({
        title: language === "ge" ? "მისამართი განახლდა" : "Address updated",
        description:
          language === "ge"
            ? "მისამართი წარმატებით განახლდა"
            : "Address successfully updated",
      });
    },
    onError: () => {
      toast({
        title: language === "ge" ? "შეცდომა" : "Error",
        description:
          language === "ge"
            ? "მისამართის განახლება ვერ მოხერხდა"
            : "Failed to update address",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/users/addresses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: language === "ge" ? "მისამართი წაიშალა" : "Address deleted",
        description:
          language === "ge"
            ? "მისამართი წარმატებით წაიშალა"
            : "Address successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "ge" ? "შეცდომა" : "Error",
        description:
          language === "ge"
            ? "მისამართის წაშლა ვერ მოხერხდა"
            : "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/users/addresses/${id}/default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: language === "ge" ? "ძირითადი მისამართი" : "Default address",
        description:
          language === "ge"
            ? "ძირითადი მისამართი განახლდა"
            : "Default address updated",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      label: "",
      address: "",
      city: "",
      postalCode: "",
      country: "GE",
      phoneNumber: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setIsFormOpen(false);
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode || "",
      country: address.country,
      phoneNumber: address.phoneNumber,
      isDefault: address.isDefault,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      addAddressMutation.mutate(formData);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="address-loading">
        {language === "ge" ? "იტვირთება..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="address-manager">
      <div className="address-header">
        <h2>
          <MapPin size={24} />
          {language === "ge" ? "ჩემი მისამართები" : "My Addresses"}
        </h2>
        {!isFormOpen && (
          <button
            className="add-address-btn"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={18} />
            {language === "ge" ? "დამატება" : "Add"}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="address-form-container">
          <div className="form-header">
            <h3>
              {editingAddress
                ? language === "ge"
                  ? "მისამართის რედაქტირება"
                  : "Edit Address"
                : language === "ge"
                  ? "ახალი მისამართი"
                  : "New Address"}
            </h3>
            <button className="close-btn" onClick={resetForm}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="address-form">
            <div className="form-row">
              <div className="form-field">
                <label>{language === "ge" ? "სახელწოდება" : "Label"}</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder={
                    language === "ge"
                      ? "მაგ: სახლი, ოფისი"
                      : "e.g., Home, Office"
                  }
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <label>{language === "ge" ? "მისამართი" : "Address"}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={
                  language === "ge"
                    ? "ქუჩა, სახლი, ბინა"
                    : "Street, building, apartment"
                }
                required
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>{language === "ge" ? "ქალაქი" : "City"}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-field">
                <label>
                  {language === "ge" ? "საფოსტო კოდი" : "Postal Code"}
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-field">
              <label>{language === "ge" ? "ტელეფონი" : "Phone"}</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+995"
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                {language === "ge" ? "გაუქმება" : "Cancel"}
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={
                  addAddressMutation.isPending ||
                  updateAddressMutation.isPending
                }
              >
                {addAddressMutation.isPending || updateAddressMutation.isPending
                  ? language === "ge"
                    ? "შენახვა..."
                    : "Saving..."
                  : language === "ge"
                    ? "შენახვა"
                    : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="addresses-list">
        {addresses.length === 0 ? (
          <div className="no-addresses">
            <MapPin size={48} />
            <p>
              {language === "ge"
                ? "მისამართები არ არის დამატებული"
                : "No addresses added"}
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`address-card ${address.isDefault ? "default" : ""}`}
            >
              <div className="address-info">
                <div className="address-label">
                  {address.isDefault && (
                    <Star size={16} className="default-star" />
                  )}
                  <span>{address.label}</span>
                </div>
                <p className="address-text">{address.address}</p>
                <p className="address-city">
                  {address.city}, {address.country}
                </p>
                <p className="address-phone">{address.phoneNumber}</p>
              </div>
              <div className="address-actions">
                {!address.isDefault && (
                  <button
                    className="action-btn default-btn"
                    onClick={() => setDefaultMutation.mutate(address.id)}
                    title={
                      language === "ge"
                        ? "ძირითადად დაყენება"
                        : "Set as default"
                    }
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(address)}
                  title={language === "ge" ? "რედაქტირება" : "Edit"}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => deleteAddressMutation.mutate(address.id)}
                  title={language === "ge" ? "წაშლა" : "Delete"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

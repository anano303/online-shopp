"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Role } from "@/types/role";
import { User, SavedAddress } from "@/types";
import { Pencil, Trash2, Plus, MapPin } from "lucide-react";
import "./edit-user.css";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    address: "",
    city: "",
    postalCode: "",
    country: "საქართველო",
    phoneNumber: "",
    isDefault: false,
  });

  const userId = params?.id ? (params.id as string) : "";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth(`/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Failed to fetch user",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const response = await fetchWithAuth(`/users/${userId}/addresses`);
        const data = await response.json();
        setAddresses(Array.isArray(data) ? data : []);
      } catch {
        setAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (userId) fetchAddresses();
  }, [userId]);

  const resetAddressForm = () => {
    setAddressForm({
      label: "",
      address: "",
      city: "",
      postalCode: "",
      country: "საქართველო",
      phoneNumber: "",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setAddressForm({
      label: addr.label,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode || "",
      country: addr.country,
      phoneNumber: addr.phoneNumber,
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddressId) {
        await fetchWithAuth(
          `/users/${userId}/addresses/${editingAddressId}`,
          {
            method: "PUT",
            body: JSON.stringify(addressForm),
          }
        );
      } else {
        await fetchWithAuth(`/users/${userId}/addresses`, {
          method: "POST",
          body: JSON.stringify(addressForm),
        });
      }
      // Refresh addresses
      const response = await fetchWithAuth(`/users/${userId}/addresses`);
      const data = await response.json();
      setAddresses(Array.isArray(data) ? data : []);
      resetAddressForm();
      toast({
        title: "წარმატება",
        description: editingAddressId
          ? "მისამართი განახლდა"
          : "მისამართი დაემატა",
      });
    } catch {
      toast({
        title: "შეცდომა",
        description: "მისამართის შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("ნამდვილად წაშალოთ ეს მისამართი?")) return;
    try {
      await fetchWithAuth(`/users/${userId}/addresses/${addressId}`, {
        method: "DELETE",
      });
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      toast({
        title: "წარმატება",
        description: "მისამართი წაიშალა",
      });
    } catch {
      toast({
        title: "შეცდომა",
        description: "მისამართის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      // Only include password if it was provided
      const updateData = {
        name: user.name,
        email: user.email,
        role: user.role,
        ...(password && { password }),
      };

      await fetchWithAuth(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      router.push("/admin/users");
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="edit-user-container">
      <h1>Edit User</h1>
      <form onSubmit={handleSubmit} className="edit-user-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <select
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value as Role })}
          >
            <option value={Role.User}>User</option>
            <option value={Role.Admin}>Admin</option>
            <option value={Role.Seller}>Seller</option>
          </select>
        </div>

        {!showPasswordField ? (
          <div className="form-action">
            <button
              type="button"
              onClick={() => setShowPasswordField(true)}
              className="password-button"
            >
              Change Password
            </button>
          </div>
        ) : (
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => {
                setShowPasswordField(false);
                setPassword("");
              }}
              className="cancel-password-button"
            >
              Cancel Password Change
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-button">
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Address Management Section */}
      <div className="addresses-section">
        <div className="addresses-header">
          <h2>
            <MapPin size={20} />
            მისამართები
          </h2>
          <button
            className="add-address-btn"
            onClick={() => {
              resetAddressForm();
              setShowAddressForm(true);
            }}
          >
            <Plus size={16} />
            დამატება
          </button>
        </div>

        {loadingAddresses ? (
          <p className="addresses-loading">იტვირთება...</p>
        ) : addresses.length === 0 && !showAddressForm ? (
          <p className="addresses-empty">მისამართები არ არის დამატებული</p>
        ) : (
          <div className="addresses-list">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`address-card ${addr.isDefault ? "default" : ""}`}
              >
                <div className="address-card-header">
                  <span className="address-label">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="default-badge">ძირითადი</span>
                    )}
                  </span>
                  <div className="address-card-actions">
                    <button
                      className="addr-edit-btn"
                      onClick={() => handleEditAddress(addr)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="addr-delete-btn"
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="address-text">
                  {addr.address}, {addr.city}
                  {addr.postalCode ? `, ${addr.postalCode}` : ""},{" "}
                  {addr.country}
                </p>
                <p className="address-phone">{addr.phoneNumber}</p>
              </div>
            ))}
          </div>
        )}

        {showAddressForm && (
          <div className="address-form">
            <h3>{editingAddressId ? "მისამართის რედაქტირება" : "ახალი მისამართი"}</h3>
            <div className="address-form-fields">
              <div className="address-form-row">
                <div className="address-form-field">
                  <label>სახელი (ლეიბლი)</label>
                  <input
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, label: e.target.value }))
                    }
                    placeholder="მაგ: სახლი, ოფისი"
                  />
                </div>
                <div className="address-form-field">
                  <label>ტელეფონი</label>
                  <input
                    value={addressForm.phoneNumber}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="+995..."
                  />
                </div>
              </div>
              <div className="address-form-field">
                <label>მისამართი</label>
                <input
                  value={addressForm.address}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
              <div className="address-form-row">
                <div className="address-form-field">
                  <label>ქალაქი</label>
                  <input
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
                <div className="address-form-field">
                  <label>საფოსტო კოდი</label>
                  <input
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        postalCode: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="address-form-field">
                  <label>ქვეყანა</label>
                  <input
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, country: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="address-default-check">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      isDefault: e.target.checked,
                    }))
                  }
                />
                ძირითადი მისამართი
              </label>
            </div>
            <div className="address-form-actions">
              <button className="save-button" onClick={handleSaveAddress}>
                {editingAddressId ? "განახლება" : "დამატება"}
              </button>
              <button className="cancel-button" onClick={resetAddressForm}>
                გაუქმება
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

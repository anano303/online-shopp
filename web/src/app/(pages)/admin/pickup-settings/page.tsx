"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/modules/auth/hooks/use-user";
import { MapPin, Save } from "lucide-react";
import "./pickup-settings.css";

interface PickupSettings {
  address: string;
  city: string;
  workingHours: string;
  phone: string;
}

export default function PickupSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PickupSettings>({
    address: "",
    city: "",
    workingHours: "",
    phone: "",
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login?redirect=/admin/pickup-settings");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth("/settings/pickup");
        const data = await res.json();
        setForm({
          address: data.address || "",
          city: data.city || "",
          workingHours: data.workingHours || "",
          phone: data.phone || "",
        });
      } catch {
        // defaults will be used
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchWithAuth("/settings/pickup", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast({
        title: "წარმატება",
        description: "თვითგატანის მისამართი განახლდა",
      });
    } catch {
      toast({
        title: "შეცდომა",
        description: "შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="pickup-settings-container">
        <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          იტვირთება...
        </p>
      </div>
    );
  }

  return (
    <div className="pickup-settings-container">
      <div className="pickup-settings-header">
        <h1>
          <MapPin size={24} />
          თვითგატანის მისამართი
        </h1>
        <p>აქ შეგიძლიათ შეცვალოთ თვითგატანის მისამართი, რომელიც მომხმარებლებს ჩეკაუთში უჩანთ</p>
      </div>

      <div className="pickup-settings-card">
        <div className="pickup-field">
          <label>მისამართი</label>
          <input
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="მაგ: თბილისი, ვასილ კაკაბაძის ქ. N8"
          />
        </div>

        <div className="pickup-field">
          <label>ქალაქი</label>
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="მაგ: თბილისი"
          />
        </div>

        <div className="pickup-field">
          <label>სამუშაო საათები</label>
          <input
            value={form.workingHours}
            onChange={(e) =>
              setForm((p) => ({ ...p, workingHours: e.target.value }))
            }
            placeholder="მაგ: სამუშაო დღეებში 20:00 - 22:00"
          />
        </div>

        <div className="pickup-field">
          <label>ტელეფონი</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="მაგ: +995 574150531"
          />
        </div>

        <button
          className="pickup-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? "ინახება..." : "შენახვა"}
        </button>
      </div>
    </div>
  );
}

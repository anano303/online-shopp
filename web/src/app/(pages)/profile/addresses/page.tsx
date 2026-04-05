"use client";

import { AddressManager } from "@/modules/profile/components/AddressManager";
import { useLanguage } from "@/hooks/LanguageContext";
import "./addresses.css";

export default function AddressesPage() {
  const { language } = useLanguage();

  return (
    <div className="addresses-page">
      <div className="addresses-header">
        <h1>{language === "ge" ? "ჩემი მისამართები" : "My Addresses"}</h1>
        <p>
          {language === "ge"
            ? "მართეთ თქვენი მიწოდების მისამართები"
            : "Manage your delivery addresses"}
        </p>
      </div>
      <AddressManager />
    </div>
  );
}

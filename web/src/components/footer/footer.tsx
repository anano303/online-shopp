"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo/Logo";
import { Pencil, Check, X } from "lucide-react";
import { useLanguage } from "@/hooks/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types/role";
import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./footer.css";

interface FooterSettings {
  address: string;
  addressEn: string;
  email: string;
  phone: string;
  facebookUrl: string;
  instagramUrl: string;
}

function EditableField({
  value,
  fieldKey,
  isAdmin,
  onSave,
  className,
  as: Tag = "span",
}: {
  value: string;
  fieldKey: string;
  isAdmin: boolean;
  onSave: (key: string, value: string) => void;
  className?: string;
  as?: "span" | "p";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (draft.trim() && draft !== value) {
      onSave(fieldKey, draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <span className="editable-field-editing">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="editable-field-input"
        />
        <button
          onClick={handleSave}
          className="editable-field-btn save"
          title="შენახვა"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="editable-field-btn cancel"
          title="გაუქმება"
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <Tag className={className}>
      {value}
      {isAdmin && (
        <button
          onClick={() => setEditing(true)}
          className="editable-field-pencil"
          title="რედაქტირება"
        >
          <Pencil size={13} />
        </button>
      )}
    </Tag>
  );
}

export default function Footer() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && user?.role === Role.Admin;

  const { data: settings } = useQuery<FooterSettings>({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/footer");
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FooterSettings>) => {
      const res = await apiClient.put("/settings/footer", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["footer-settings"], data);
    },
  });

  const handleSave = (key: string, value: string) => {
    updateMutation.mutate({ [key]: value });
  };

  const address =
    (language === "en" ? settings?.addressEn : settings?.address) ||
    (language === "en"
      ? "Address: Tbilisi, Georgia"
      : "მისამართი: თბილისი, საქართველო");
  const email = settings?.email || "kakhaber.shop13@gmail.com";
  const phone = settings?.phone || "+995 574150531";
  const addressFieldKey = language === "en" ? "addressEn" : "address";

  if (!mounted) return null;

  return (
    <footer className="site-footer">
      <div className="footer-wrapper">
        <div className="footer-content">
          <div className="footer-navigation">
            <div className="footer-links">
              <Link href="/" className="footer-link">
                {t("navigation.homePage")}
              </Link>
              <Link href="/shop" className="footer-link">
                {t("navigation.shop")}
              </Link>
              <Link href="/about" className="footer-link">
                {t("navigation.about")}
              </Link>
              <Link href="/contact" className="footer-link">
                {t("navigation.contact")}
              </Link>
              <Link
                href="/privacy-policy"
                className="footer-link footer-policy-link"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/terms-and-conditions"
                className="footer-link footer-policy-link"
              >
                {t("footer.terms")}
              </Link>
              <Link
                href="/return-policy"
                className="footer-link footer-policy-link"
              >
                {t("footer.returnPolicy")}
              </Link>
            </div>
          </div>
          <div className="footer-logo">
            <Logo width={160} height={70} className="footer-logo-image" />
          </div>
          <div className="footer-info">
            <div className="contact-info">
              <address className="footer-contact">
                <div className="top-contacts">
                  <EditableField
                    value={address}
                    fieldKey={addressFieldKey}
                    isAdmin={isAdmin}
                    onSave={handleSave}
                    as="p"
                  />
                  <EditableField
                    value={email}
                    fieldKey="email"
                    isAdmin={isAdmin}
                    onSave={handleSave}
                    as="p"
                  />
                </div>
                <EditableField
                  value={phone}
                  fieldKey="phone"
                  isAdmin={isAdmin}
                  onSave={handleSave}
                  className="bottom-contact"
                  as="p"
                />
              </address>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright">
            Created by{" "}
            <a
              href="https://bestsoft.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="bestsoft-link"
            >
              BESTSOFT.GE
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

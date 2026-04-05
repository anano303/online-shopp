"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";
import { Upload, X } from "lucide-react";
import "./LogoUploadModal.css";

interface LogoUploadModalProps {
  currentLightLogo?: string;
  currentDarkLogo?: string;
  onClose: () => void;
}

const DEFAULT_LOGO = "/favicon.svg";

export default function LogoUploadModal({
  currentLightLogo,
  currentDarkLogo,
  onClose,
}: LogoUploadModalProps) {
  const queryClient = useQueryClient();
  const lightInputRef = useRef<HTMLInputElement>(null);
  const darkInputRef = useRef<HTMLInputElement>(null);

  const [lightPreview, setLightPreview] = useState(
    currentLightLogo || DEFAULT_LOGO,
  );
  const [darkPreview, setDarkPreview] = useState(
    currentDarkLogo || currentLightLogo || DEFAULT_LOGO,
  );
  const [useSame, setUseSame] = useState(!currentDarkLogo);
  const [uploading, setUploading] = useState<"light" | "dark" | null>(null);

  const handleUpload = async (file: File, mode: "light" | "dark") => {
    setUploading(mode);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings/logo/upload?mode=${mode}`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        const field = mode === "dark" ? "logoUrlDark" : "logoUrl";
        queryClient.setQueryData(
          ["footer-settings"],
          (old: Record<string, unknown> | undefined) => ({
            ...old,
            [field]: data.url,
          }),
        );
        if (mode === "light") {
          setLightPreview(data.url);
          if (useSame) {
            setDarkPreview(data.url);
            // Copy light logo URL to dark field
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/footer`, {
              method: "PUT",
              body: JSON.stringify({ logoUrlDark: data.url }),
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            });
            queryClient.setQueryData(
              ["footer-settings"],
              (old: Record<string, unknown> | undefined) => ({
                ...old,
                logoUrlDark: data.url,
              }),
            );
          }
        } else {
          setDarkPreview(data.url);
        }
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "light" | "dark",
  ) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, mode);
    e.target.value = "";
  };

  const handleUseSameToggle = async () => {
    const newValue = !useSame;
    setUseSame(newValue);
    if (newValue && lightPreview !== DEFAULT_LOGO) {
      // Copy light logo to dark
      const token = getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/footer`, {
        method: "PUT",
        body: JSON.stringify({ logoUrlDark: lightPreview }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      setDarkPreview(lightPreview);
      queryClient.setQueryData(
        ["footer-settings"],
        (old: Record<string, unknown> | undefined) => ({
          ...old,
          logoUrlDark: lightPreview,
        }),
      );
    }
  };

  return (
    <div className="logo-modal-overlay" onClick={onClose}>
      <div className="logo-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="logo-modal-header">
          <h3 className="logo-modal-title">ლოგოს მართვა</h3>
          <button className="logo-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="logo-modal-body">
          {/* Light mode logo */}
          <div className="logo-upload-section">
            <label className="logo-upload-label">☀️ ლაით მოდის ლოგო</label>
            <div className="logo-upload-area">
              <div className="logo-preview-box light-preview">
                <Image
                  src={lightPreview}
                  alt="Light mode logo"
                  width={160}
                  height={60}
                  unoptimized
                  className="logo-preview-img"
                />
              </div>
              <button
                className="logo-upload-btn"
                onClick={() => lightInputRef.current?.click()}
                disabled={uploading === "light"}
              >
                <Upload size={16} />
                {uploading === "light" ? "იტვირთება..." : "ატვირთვა"}
              </button>
              <input
                ref={lightInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "light")}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Same logo checkbox */}
          <div className="logo-same-check">
            <label className="logo-checkbox-label">
              <input
                type="checkbox"
                checked={useSame}
                onChange={handleUseSameToggle}
              />
              <span>ორივესთვის იგივე ლოგო</span>
            </label>
          </div>

          {/* Dark mode logo */}
          <div
            className={`logo-upload-section ${useSame ? "logo-section-disabled" : ""}`}
          >
            <label className="logo-upload-label">🌙 დარქ მოდის ლოგო</label>
            <div className="logo-upload-area">
              <div className="logo-preview-box dark-preview">
                <Image
                  src={darkPreview}
                  alt="Dark mode logo"
                  width={160}
                  height={60}
                  unoptimized
                  className="logo-preview-img"
                />
              </div>
              <button
                className="logo-upload-btn"
                onClick={() => darkInputRef.current?.click()}
                disabled={useSame || uploading === "dark"}
              >
                <Upload size={16} />
                {uploading === "dark" ? "იტვირთება..." : "ატვირთვა"}
              </button>
              <input
                ref={darkInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "dark")}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

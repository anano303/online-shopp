"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { getUserData } from "@/lib/auth";
import { Role } from "@/types/role";
import { Pencil } from "lucide-react";
import LogoUploadModal from "./LogoUploadModal";
import "./Logo.css";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  showEdit?: boolean;
  linkTo?: string;
}

const DEFAULT_LOGO = "/favicon.svg";

export default function Logo({
  width = 140,
  height = 50,
  className = "",
  showEdit = false,
  linkTo,
}: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveUser = user ?? getUserData();
  const isAdmin = mounted && effectiveUser?.role === Role.Admin;

  const { data: settings } = useQuery<{
    logoUrl?: string;
    logoUrlDark?: string;
  }>({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/footer");
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Detect user's color scheme preference
  const [prefersDark, setPrefersDark] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const lightLogo = settings?.logoUrl || DEFAULT_LOGO;
  const darkLogo = settings?.logoUrlDark || lightLogo;
  const logoUrl = prefersDark ? darkLogo : lightLogo;

  const logoContent = (
    <span className={`logo-wrapper ${className}`}>
      <Image
        src={logoUrl}
        alt="13 - ცამეტი"
        width={width}
        height={height}
        className="logo-image"
        priority
        unoptimized={logoUrl.includes("cloudinary") || logoUrl.endsWith(".svg")}
      />
      {isAdmin && showEdit && (
        <button
          className="logo-edit-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalOpen(true);
          }}
          title="ლოგოს შეცვლა"
        >
          <Pencil size={12} />
        </button>
      )}
    </span>
  );

  return (
    <>
      {linkTo ? <Link href={linkTo}>{logoContent}</Link> : logoContent}
      {modalOpen && (
        <LogoUploadModal
          currentLightLogo={settings?.logoUrl}
          currentDarkLogo={settings?.logoUrlDark}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

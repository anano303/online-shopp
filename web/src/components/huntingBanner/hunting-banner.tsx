"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/hooks/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types/role";
import { Pencil, Upload, Loader2 } from "lucide-react";
import { Banner, BannerType } from "@/types/banner";
import {
  getHuntingBanners,
  createBanner,
  updateBanner,
} from "@/modules/admin/api/banner";
import "./hunting-banner.css";

// Banner form data type (for modal)
interface BannerFormData {
  title: string;
  titleEn: string;
  buttonText: string;
  buttonTextEn: string;
  buttonLink: string;
  imageUrl: string;
}

// Banner edit modal component
const BannerEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  bannerId: string | null;
  bannerIndex: number;
  currentData: BannerFormData;
  onSave: (data: BannerFormData, file?: File) => Promise<void>;
  isSaving: boolean;
}> = ({
  isOpen,
  onClose,
  bannerId,
  bannerIndex,
  currentData,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState(currentData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(currentData);
    setPreviewUrl(currentData.imageUrl || "");
    setSelectedFile(null);
  }, [currentData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await onSave(formData, selectedFile || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="banner-edit-overlay" onClick={onClose}>
      <div className="banner-edit-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {bannerId
            ? `ბანერის რედაქტირება #${bannerIndex + 1}`
            : "ახალი ბანერი"}
        </h3>
        <div className="banner-edit-form">
          <label>
            სათაური (ქართ):
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </label>
          <label>
            სათაური (ინგ):
            <input
              type="text"
              value={formData.titleEn}
              onChange={(e) =>
                setFormData({ ...formData, titleEn: e.target.value })
              }
            />
          </label>
          <label>
            ღილაკის ტექსტი (ქართ):
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) =>
                setFormData({ ...formData, buttonText: e.target.value })
              }
            />
          </label>
          <label>
            ღილაკის ტექსტი (ინგ):
            <input
              type="text"
              value={formData.buttonTextEn}
              onChange={(e) =>
                setFormData({ ...formData, buttonTextEn: e.target.value })
              }
            />
          </label>
          <label>
            ლინკი:
            <input
              type="text"
              value={formData.buttonLink}
              onChange={(e) =>
                setFormData({ ...formData, buttonLink: e.target.value })
              }
            />
          </label>
          <label>
            სურათის URL:
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                setPreviewUrl(e.target.value);
                setSelectedFile(null);
              }}
              placeholder="მაგ: https://example.com/image.jpg"
            />
          </label>

          <div className="banner-image-upload-section">
            <span className="upload-divider">ან</span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="banner-upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              <Upload size={16} /> სურათის არჩევა
            </button>
          </div>

          {previewUrl && (
            <div className="banner-image-preview">
              <p>სურათის Preview:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                  borderRadius: "4px",
                  border: "1px solid var(--border-light)",
                }}
              />
            </div>
          )}
        </div>
        <div className="banner-edit-actions">
          <button
            className="banner-edit-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            გაუქმება
          </button>
          <button
            className="banner-edit-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="spin-icon" /> ინახება...
              </>
            ) : (
              "შენახვა"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HuntingBanner: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.Admin;
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBannerIndex, setEditingBannerIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Banner data from database
  const [banners, setBanners] = useState<Banner[]>([]);

  // Load hunting banners from API
  const loadBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getHuntingBanners();
      if (result.success && result.data) {
        setBanners(result.data);
      }
    } catch (error) {
      console.error("Error loading hunting banners:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // Get banner data from database only
  const getBannerData = (
    index: number
  ): (BannerFormData & { _id?: string }) | null => {
    if (banners[index]) {
      return {
        _id: banners[index]._id,
        title: banners[index].title,
        titleEn: banners[index].titleEn,
        buttonText: banners[index].buttonText,
        buttonTextEn: banners[index].buttonTextEn,
        buttonLink: banners[index].buttonLink,
        imageUrl: banners[index].imageUrl,
      };
    }
    return null;
  };

  const handleSaveBanner = async (
    index: number,
    data: BannerFormData,
    file?: File
  ) => {
    setIsSaving(true);
    try {
      const banner = banners[index];

      // Remove _id from data if present (should not be sent to API)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...bannerDataWithoutId } = data as BannerFormData & {
        _id?: string;
      };

      if (banner) {
        // Update existing banner
        const result = await updateBanner(
          banner._id,
          bannerDataWithoutId,
          file
        );
        if (result.success) {
          await loadBanners();
          setEditModalOpen(false);
        } else {
          alert(result.error || "ბანერის განახლება ვერ მოხერხდა");
        }
      } else {
        // Create new hunting banner
        const result = await createBanner(
          {
            ...bannerDataWithoutId,
            isActive: true,
            sortOrder: index,
            type: BannerType.HUNTING,
          },
          file
        );
        if (result.success) {
          await loadBanners();
          setEditModalOpen(false);
        } else {
          alert(result.error || "ბანერის შექმნა ვერ მოხერხდა");
        }
      }
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("ბანერის შენახვა ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (index: number) => {
    setEditingBannerIndex(index);
    setEditModalOpen(true);
  };

  useEffect(() => {
    // Function to check if an element is in viewport
    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top <=
          (window.innerHeight || document.documentElement.clientHeight) *
            0.85 && rect.bottom >= 0
      );
    };

    const checkScroll = () => {
      contentRefs.current.forEach((element) => {
        if (element && isInViewport(element)) {
          element.classList.add("active");
        }
      });
    };

    setTimeout(checkScroll, 300);

    const handleScroll = () => {
      checkScroll();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("load", checkScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("load", checkScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="hunting-banner-container">
        <div className="hunting-banner-loading">
          <Loader2 size={32} className="spin-icon" />
        </div>
      </div>
    );
  }

  // თუ ბანერები არ არის ბაზაში, არაფერი არ გამოჩნდეს
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="hunting-banner-container">
      {/* Banner Edit Modal */}
      {editModalOpen && getBannerData(editingBannerIndex) && (
        <BannerEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          bannerId={banners[editingBannerIndex]?._id || null}
          bannerIndex={editingBannerIndex}
          currentData={getBannerData(editingBannerIndex)!}
          onSave={(data, file) =>
            handleSaveBanner(editingBannerIndex, data, file)
          }
          isSaving={isSaving}
        />
      )}

      {/* ბანერები დინამიურად ბაზიდან */}
      {banners.map((banner, index) => {
        // თუ ლუწი ინდექსია (0, 2, 4...) - სურათი მარჯვნივ
        // თუ კენტი ინდექსია (1, 3, 5...) - footer style (background image)
        const isFooterStyle = index % 2 === 1;

        if (isFooterStyle) {
          return (
            <div
              key={banner._id}
              className="hunting-banner-footer reveal"
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              style={{
                position: "relative",
                backgroundImage: banner.imageUrl
                  ? `url(${banner.imageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {isAdmin && (
                <button
                  className="admin-edit-button"
                  onClick={() => handleEditClick(index)}
                  title="ბანერის რედაქტირება"
                >
                  <Pencil size={16} />
                </button>
              )}
              <h2>{language === "ge" ? banner.title : banner.titleEn}</h2>
              <Link href={banner.buttonLink} className="hunting-banner-button">
                {language === "ge" ? banner.buttonText : banner.buttonTextEn}
              </Link>
            </div>
          );
        }

        // სურათიანი ბანერი
        const imageOnLeft = index > 0 && index % 4 === 2; // 2, 6, 10...

        return (
          <div
            key={banner._id}
            className="hunting-banner-content reveal"
            ref={(el) => {
              contentRefs.current[index] = el;
            }}
            style={{ position: "relative" }}
          >
            {isAdmin && (
              <button
                className="admin-edit-button"
                onClick={() => handleEditClick(index)}
                title="ბანერის რედაქტირება"
              >
                <Pencil size={16} />
              </button>
            )}
            {imageOnLeft && (
              <div className="hunting-banner-image">
                <Image
                  src={banner.imageUrl || "/placeholder.png"}
                  alt={language === "ge" ? "სანადირო იარაღი" : "Hunting Weapon"}
                  width={500}
                  height={300}
                  unoptimized
                  style={{ objectFit: "cover", display: "block" }}
                />
              </div>
            )}
            <div className="hunting-banner-text">
              <h2>{language === "ge" ? banner.title : banner.titleEn}</h2>
              <Link href={banner.buttonLink} className="hunting-banner-button">
                {language === "ge" ? banner.buttonText : banner.buttonTextEn}
              </Link>
            </div>
            {!imageOnLeft && (
              <div className="hunting-banner-image">
                <Image
                  src={banner.imageUrl || "/placeholder.png"}
                  alt={language === "ge" ? "სანადირო იარაღი" : "Hunting Weapon"}
                  width={500}
                  height={300}
                  priority={index === 0}
                  unoptimized
                  style={{ objectFit: "cover", display: "block" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HuntingBanner;

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import "./about.css";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/LanguageContext";
import { Role } from "@/types/role";
import { apiClient } from "@/lib/api-client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Plus, Trash2, Camera } from "lucide-react";

interface AboutSection {
  text: string;
  textEn: string;
  type: "normal" | "highlight" | "quote" | "final";
}

interface TeamMember {
  name: string;
  nameEn: string;
  position: string;
  positionEn: string;
  bio: string;
  bioEn: string;
  image: string;
}

interface AboutPageData {
  title: string;
  titleEn: string;
  sections: AboutSection[];
  ctaText: string;
  ctaTextEn: string;
  teamTitle: string;
  teamTitleEn: string;
  teamMembers: TeamMember[];
}

interface SubCategory {
  id: string;
  _id?: string;
  name: string;
  nameEn?: string;
}

function EditableText({
  value,
  onSave,
  multiline = false,
  className,
}: {
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    if (draft.trim() && draft !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCancel();
    if (e.key === "Enter" && !multiline) handleSave();
  };

  if (editing) {
    return (
      <span className="about-edit-wrap">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="about-edit-textarea"
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="about-edit-input"
          />
        )}
        <span className="about-edit-actions">
          <button
            onClick={handleSave}
            className="about-edit-btn about-save"
            title="შენახვა"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="about-edit-btn about-cancel"
            title="გაუქმება"
          >
            <X size={16} />
          </button>
        </span>
      </span>
    );
  }

  return (
    <span className={className}>
      <button
        onClick={() => setEditing(true)}
        className="about-pencil-btn"
        title="რედაქტირება"
      >
        <Pencil size={13} />
      </button>
    </span>
  );
}

export default function AboutPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && user?.role === Role.Admin;
  const isEn = language === "en";

  const { data: aboutData } = useQuery<AboutPageData>({
    queryKey: ["about-page"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/about");
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: subcategories = [] } = useQuery<SubCategory[]>({
    queryKey: ["about-subcategories"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth(
          "/subcategories?includeInactive=false&withProducts=true",
        );
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AboutPageData>) => {
      const res = await apiClient.put("/settings/about", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["about-page"], data);
    },
  });

  const handleFieldUpdate = (field: keyof AboutPageData, value: string) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleSectionTextUpdate = (index: number, value: string) => {
    if (!aboutData) return;
    const updated = [...aboutData.sections];
    const field = isEn ? "textEn" : "text";
    updated[index] = { ...updated[index], [field]: value };
    updateMutation.mutate({ sections: updated });
  };

  const handleSectionTypeToggle = (index: number) => {
    if (!aboutData) return;
    const types: AboutSection["type"][] = [
      "normal",
      "highlight",
      "quote",
      "final",
    ];
    const current = aboutData.sections[index].type;
    const nextIdx = (types.indexOf(current) + 1) % types.length;
    const updated = [...aboutData.sections];
    updated[index] = { ...updated[index], type: types[nextIdx] };
    updateMutation.mutate({ sections: updated });
  };

  const handleAddSection = () => {
    const updated = [
      ...(aboutData?.sections || []),
      {
        text: "ახალი სექცია...",
        textEn: "New section...",
        type: "normal" as const,
      },
    ];
    updateMutation.mutate({ sections: updated });
  };

  const handleDeleteSection = (index: number) => {
    if (!aboutData) return;
    const updated = aboutData.sections.filter((_, i) => i !== index);
    updateMutation.mutate({ sections: updated });
  };

  // Team member handlers
  const handleTeamMemberUpdate = (
    index: number,
    field: keyof TeamMember,
    value: string,
  ) => {
    if (!aboutData) return;
    const updated = [...aboutData.teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    updateMutation.mutate({ teamMembers: updated });
  };

  const handleAddTeamMember = () => {
    const updated = [
      ...(aboutData?.teamMembers || []),
      {
        name: "სახელი გვარი",
        nameEn: "First Last",
        position: "თანამდებობა",
        positionEn: "Position",
        bio: "ბიოგრაფია...",
        bioEn: "Bio...",
        image: "",
      },
    ];
    updateMutation.mutate({ teamMembers: updated });
  };

  const handleDeleteTeamMember = (index: number) => {
    if (!aboutData) return;
    const updated = aboutData.teamMembers.filter((_, i) => i !== index);
    updateMutation.mutate({ teamMembers: updated });
  };

  const handleTeamImageUpload = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.post(
        "/settings/about/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (!aboutData) return;
      const updated = [...aboutData.teamMembers];
      updated[index] = { ...updated[index], image: res.data.url };
      updateMutation.mutate({ teamMembers: updated });
    } catch (e) {
      console.error("Image upload failed:", e);
    }
  };

  const title =
    (isEn ? aboutData?.titleEn : aboutData?.title) ||
    (isEn ? "About Us" : "ჩვენს შესახებ");
  const sections = aboutData?.sections || [];
  const ctaText =
    (isEn ? aboutData?.ctaTextEn : aboutData?.ctaText) ||
    (isEn
      ? "Visit our store and discover quality style!"
      : "ეწვიეთ ჩვენს მაღაზიას და აღმოაჩინეთ ხარისხიანი სტილი!");
  const teamTitle =
    (isEn ? aboutData?.teamTitleEn : aboutData?.teamTitle) ||
    (isEn ? "Meet Our Team" : "გაიცანით ჩვენი გუნდი");
  const teamMembers = aboutData?.teamMembers || [];

  const titleField = isEn ? "titleEn" : "title";
  const ctaField = isEn ? "ctaTextEn" : "ctaText";
  const teamTitleField = isEn ? "teamTitleEn" : "teamTitle";

  const typeLabels: Record<AboutSection["type"], string> = {
    normal: "ჩვეულ.",
    highlight: "გამორჩ.",
    quote: "ციტატა",
    final: "ფინალი",
  };

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1 className="about-title">
          {title}
          {isAdmin && (
            <EditableText
              value={title}
              onSave={(val) =>
                handleFieldUpdate(titleField as keyof AboutPageData, val)
              }
            />
          )}
        </h1>
      </div>

      <div className="about-container">
        <div className="about-content">
          {sections.map((section, idx) => {
            const sectionText = isEn
              ? section.textEn || section.text
              : section.text;

            if (section.type === "quote") {
              return (
                <div key={idx} className="about-section">
                  <div className="about-quote">&ldquo;{sectionText}&rdquo;</div>
                  {isAdmin && (
                    <div className="about-section-admin">
                      <EditableText
                        value={sectionText}
                        onSave={(val) => handleSectionTextUpdate(idx, val)}
                      />
                      <button
                        className="about-type-toggle"
                        onClick={() => handleSectionTypeToggle(idx)}
                        title={typeLabels[section.type]}
                      >
                        {typeLabels[section.type]}
                      </button>
                      <button
                        className="about-delete-btn"
                        onClick={() => handleDeleteSection(idx)}
                        title="წაშლა"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            const sectionClass =
              section.type === "highlight"
                ? "about-section about-highlight"
                : section.type === "final"
                  ? "about-section about-final"
                  : "about-section";

            return (
              <div className={sectionClass} key={idx}>
                <p className="about-description">{sectionText}</p>
                {isAdmin && (
                  <div className="about-section-admin">
                    <EditableText
                      value={sectionText}
                      onSave={(val) => handleSectionTextUpdate(idx, val)}
                      multiline
                    />
                    <button
                      className="about-type-toggle"
                      onClick={() => handleSectionTypeToggle(idx)}
                      title={typeLabels[section.type]}
                    >
                      {typeLabels[section.type]}
                    </button>
                    <button
                      className="about-delete-btn"
                      onClick={() => handleDeleteSection(idx)}
                      title="წაშლა"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="about-cta">
            <p className="about-cta-text">
              {ctaText}
              {isAdmin && (
                <EditableText
                  value={ctaText}
                  onSave={(val) =>
                    handleFieldUpdate(ctaField as keyof AboutPageData, val)
                  }
                />
              )}
            </p>
            <Link href="/shop" className="about-button about-shop-button">
              {isEn ? "Browse Our Products" : "დაათვალიერეთ ჩვენი პროდუქტები"}
            </Link>
          </div>

          {subcategories.length > 0 && (
            <div className="about-section">
              <h2 className="about-subtitle">
                {isEn ? "Our Assortment" : "ჩვენი ასორტიმენტი"}
              </h2>
              <ul className="about-categories">
                {subcategories.map((subcat) => (
                  <li key={subcat.id || subcat._id}>
                    <Link href={`/shop?subCategory=${subcat.id || subcat._id}`}>
                      {isEn && subcat.nameEn ? subcat.nameEn : subcat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <button
              className="about-add-section-btn"
              onClick={handleAddSection}
            >
              <Plus size={18} /> სექციის დამატება
            </button>
          )}
        </div>

        <h3
          className="about-subtitle"
          style={{ textAlign: "center", marginTop: "3rem" }}
        >
          {teamTitle}
          {isAdmin && (
            <EditableText
              value={teamTitle}
              onSave={(val) =>
                handleFieldUpdate(teamTitleField as keyof AboutPageData, val)
              }
            />
          )}
        </h3>

        <div className="team-members">
          {teamMembers.map((member, idx) => {
            const memberName = isEn
              ? member.nameEn || member.name
              : member.name;
            const memberPosition = isEn
              ? member.positionEn || member.position
              : member.position;
            const memberBio = isEn
              ? member.bioEn || member.bio
              : member.bio;
            const nameField = isEn ? "nameEn" : "name";
            const positionField = isEn ? "positionEn" : "position";
            const bioField = isEn ? "bioEn" : "bio";

            return (
              <div className="team-member" key={idx}>
                {isAdmin && (
                  <button
                    className="team-member-delete"
                    onClick={() => handleDeleteTeamMember(idx)}
                    title="წაშლა"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="team-member-photo">
                  <div className="photo-placeholder">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={memberName}
                        width={300}
                        height={300}
                        className="team-member-img"
                        unoptimized
                      />
                    ) : (
                      <Image
                        src="/irakli.jpg"
                        alt={memberName}
                        width={300}
                        height={300}
                      />
                    )}
                  </div>
                  {isAdmin && (
                    <>
                      <button
                        className="team-upload-btn"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        title="სურათის შეცვლა"
                      >
                        <Camera size={18} />
                      </button>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[idx] = el;
                        }}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleTeamImageUpload(file, idx);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>
                <h3 className="team-member-name">
                  {memberName}
                  {isAdmin && (
                    <EditableText
                      value={memberName}
                      onSave={(val) =>
                        handleTeamMemberUpdate(
                          idx,
                          nameField as keyof TeamMember,
                          val,
                        )
                      }
                    />
                  )}
                </h3>
                <p className="team-member-position">
                  {memberPosition}
                  {isAdmin && (
                    <EditableText
                      value={memberPosition}
                      onSave={(val) =>
                        handleTeamMemberUpdate(
                          idx,
                          positionField as keyof TeamMember,
                          val,
                        )
                      }
                    />
                  )}
                </p>
                <p className="team-member-bio">
                  {memberBio}
                  {isAdmin && (
                    <EditableText
                      value={memberBio}
                      onSave={(val) =>
                        handleTeamMemberUpdate(
                          idx,
                          bioField as keyof TeamMember,
                          val,
                        )
                      }
                      multiline
                    />
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <button
            className="about-add-section-btn"
            onClick={handleAddTeamMember}
            style={{ marginTop: "1.5rem" }}
          >
            <Plus size={18} /> გუნდის წევრის დამატება
          </button>
        )}
      </div>
    </div>
  );
}

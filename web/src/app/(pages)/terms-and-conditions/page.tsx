"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/hooks/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types/role";
import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import "./terms-and-conditions.css";

interface TermsSection {
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  type: "paragraph" | "list";
}

interface TermsData {
  sections: TermsSection[];
  effectiveDate: string;
  effectiveDateEn: string;
}

function EditableText({
  value,
  onSave,
  multiline = false,
}: {
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
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
      <div className="pp-edit-wrap">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pp-edit-textarea"
            rows={5}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pp-edit-input"
          />
        )}
        <div className="pp-edit-actions">
          <button
            onClick={handleSave}
            className="pp-edit-btn pp-save"
            title="შენახვა"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="pp-edit-btn pp-cancel"
            title="გაუქმება"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <span>
      <button
        onClick={() => setEditing(true)}
        className="pp-pencil-btn"
        title="რედაქტირება"
      >
        <Pencil size={13} />
      </button>
    </span>
  );
}

export default function TermsAndConditions() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && user?.role === Role.Admin;

  const { data: terms } = useQuery<TermsData>({
    queryKey: ["terms-conditions"],
    queryFn: async () => {
      const res = await apiClient.get("/settings/terms-conditions");
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TermsData>) => {
      const res = await apiClient.put("/settings/terms-conditions", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["terms-conditions"], data);
    },
  });

  const handleSectionUpdate = (
    index: number,
    field: keyof TermsSection,
    value: string,
  ) => {
    if (!terms) return;
    const updated = [...terms.sections];
    updated[index] = { ...updated[index], [field]: value };
    updateMutation.mutate({ sections: updated });
  };

  const handleAddSection = () => {
    const updated = [
      ...(terms?.sections || []),
      {
        title: "ახალი სექცია",
        titleEn: "New Section",
        content: "ტექსტი...",
        contentEn: "Content...",
        type: "paragraph" as const,
      },
    ];
    updateMutation.mutate({ sections: updated });
  };

  const handleDeleteSection = (index: number) => {
    if (!terms) return;
    const updated = terms.sections.filter((_, i) => i !== index);
    updateMutation.mutate({ sections: updated });
  };

  const handleToggleType = (index: number) => {
    if (!terms) return;
    const updated = [...terms.sections];
    updated[index] = {
      ...updated[index],
      type: updated[index].type === "list" ? "paragraph" : "list",
    };
    updateMutation.mutate({ sections: updated });
  };

  const sections = terms?.sections || [];
  const effectiveDate = terms?.effectiveDate || "20 ნოემბერი, 2025";
  const effectiveDateEn = terms?.effectiveDateEn || "November 20, 2025";

  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1 className="terms-title">
          {language === "en" ? "Terms and Conditions" : "წესები და პირობები"}
        </h1>

        {sections.map((section, idx) => {
          const title = language === "en" ? section.titleEn : section.title;
          const content =
            language === "en" ? section.contentEn : section.content;
          const titleField = language === "en" ? "titleEn" : "title";
          const contentField = language === "en" ? "contentEn" : "content";

          return (
            <div className="terms-section" key={idx}>
              <div className="pp-section-header">
                <h2>{title}</h2>
                {isAdmin && (
                  <div className="pp-section-admin">
                    <EditableText
                      value={title}
                      onSave={(val) =>
                        handleSectionUpdate(idx, titleField, val)
                      }
                    />
                    <button
                      className="pp-type-toggle"
                      onClick={() => handleToggleType(idx)}
                      title={section.type === "list" ? "პარაგრაფად" : "სიით"}
                    >
                      {section.type === "list" ? "¶" : "•"}
                    </button>
                    <button
                      className="pp-delete-btn"
                      onClick={() => handleDeleteSection(idx)}
                      title="წაშლა"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {section.type === "list" ? (
                <ul>
                  {content.split("\n").map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                content
                  .split("\n")
                  .map((paragraph, i) => <p key={i}>{paragraph}</p>)
              )}
              {isAdmin && (
                <EditableText
                  value={content}
                  onSave={(val) => handleSectionUpdate(idx, contentField, val)}
                  multiline
                />
              )}
            </div>
          );
        })}

        <div className="effective-date">
          <p>
            <strong>
              {language === "en"
                ? `Last Updated: ${effectiveDateEn}`
                : `ბოლო განახლება: ${effectiveDate}`}
            </strong>
          </p>
          {isAdmin && (
            <EditableText
              value={language === "en" ? effectiveDateEn : effectiveDate}
              onSave={(val) =>
                updateMutation.mutate(
                  language === "en"
                    ? { effectiveDateEn: val }
                    : { effectiveDate: val },
                )
              }
            />
          )}
        </div>

        {isAdmin && (
          <button className="pp-add-section-btn" onClick={handleAddSection}>
            <Plus size={18} /> სექციის დამატება
          </button>
        )}
      </div>
    </div>
  );
}

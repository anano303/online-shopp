"use client";

import { useState } from "react";
import "./contact.css";
import { useLanguage } from "@/hooks/LanguageContext";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? "" : t("contact.nameRequired"),
      email: formData.email ? "" : t("contact.emailRequired"),
      subject: formData.subject ? "" : t("contact.subjectRequired"),
      message: formData.message ? "" : t("contact.messageRequired"),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetchWithAuth("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error sending contact form:", error);
      setSubmitError(t("contact.sendError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="contact-container">
        <div className="success-message">
          <h2>{t("contact.successTitle")}</h2>
          <p>{t("contact.successMessage")}</p>
          <button
            className="form-button"
            onClick={() => setSubmitSuccess(false)}
          >
            {t("contact.sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-container">
      <h1 className="contact-title">{t("contact.title")}</h1>
      <p className="contact-description">{t("contact.description")}</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">{t("contact.name")}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("contact.namePlaceholder")}
            className={`form-input ${errors.name ? "error-border" : ""}`}
            disabled={isSubmitting}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="email">{t("contact.email")}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("contact.emailPlaceholder")}
            className={`form-input ${errors.email ? "error-border" : ""}`}
            disabled={isSubmitting}
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="subject">{t("contact.subject")}</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder={t("contact.subjectPlaceholder")}
            className={`form-input ${errors.subject ? "error-border" : ""}`}
            disabled={isSubmitting}
          />
          {errors.subject && <p className="form-error">{errors.subject}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="message">{t("contact.message")}</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder={t("contact.messagePlaceholder")}
            className={`form-textarea ${errors.message ? "error-border" : ""}`}
            disabled={isSubmitting}
          ></textarea>
          {errors.message && <p className="form-error">{errors.message}</p>}
        </div>
        {submitError && (
          <p className="form-error submit-error">{submitError}</p>
        )}
        <button type="submit" className="form-button" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              {t("contact.sending")}
            </>
          ) : (
            t("contact.send")
          )}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaCheck } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { useRegister } from "../hooks/use-auth";
import "./register-form.css";
import { useLanguage } from "@/hooks/LanguageContext";

// Import the schema directly from validation.ts
import { registerSchema, type RegisterSchema } from "../validation";

export function RegisterForm() {
  const { t } = useLanguage();
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );

  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setRegistrationError(null);

    // Extract only the data needed for backend (exclude policy acceptances)
    const registerData = {
      name: data.name,
      email: data.email,
      password: data.password,
    };

    interface RegisterUserOptions {
      onSuccess: () => void;
      onError: (error: { message?: string }) => void;
    }

    registerUser(registerData, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({
          title: t("auth.registrationSuccessful"),
          description: t("auth.accountCreatedSuccessfully"),
          variant: "default",
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      },
      onError: (error: { message?: string }) => {
        // Map common error messages to translation keys
        let errorMessage = error.message || t("auth.registrationFailed");

        // Check if it's a common backend error and translate it
        if (
          errorMessage === "ეს ელ-ფოსტა უკვე რეგისტრირებულია" ||
          errorMessage === "This email is already registered" ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("duplicate") ||
          errorMessage === "Failed to create user"
        ) {
          errorMessage = t("auth.emailAlreadyExists");
        } else if (
          errorMessage.includes("invalid email") ||
          errorMessage.includes("არასწორი ელ-ფოსტის ფორმატი")
        ) {
          errorMessage = t("auth.emailInvalid");
        } else if (
          errorMessage.includes("password") ||
          errorMessage.includes("პაროლი")
        ) {
          errorMessage = t("auth.passwordMinLength");
        } else if (
          errorMessage.includes("Bad Request") ||
          errorMessage.includes("მონაცემები არასწორია")
        ) {
          errorMessage = t("auth.invalidData");
        }

        setRegistrationError(errorMessage);
        toast({
          title: t("auth.registrationFailed"),
          description: errorMessage,
          variant: "destructive",
        });
        // Don't redirect on error - stay on register page to show error
      },
    } as RegisterUserOptions);
  };

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  if (isSuccess) {
    return (
      <div className="register-content">
        <div className="register-success">
          <div className="register-success-icon">
            <FaCheck />
          </div>
          <h3 className="register-success-title">
            {t("auth.registrationSuccessful")}
          </h3>
          <p className="register-success-text">
            {t("auth.accountCreatedSuccessfully")}
          </p>
          <p className="register-success-text">
            {t("auth.redirectingToLogin")}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="register-content">
      <h1 className="register-title">{t("auth.register")}</h1>

      {registrationError && (
        <div className="register-error-message">{registrationError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="register-form">
        <div className="register-field">
          <input
            id="name"
            type="text"
            placeholder={t("auth.name")}
            {...register("name")}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        <div className="register-field">
          <input
            id="email"
            type="email"
            placeholder={t("auth.email")}
            {...register("email")}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div className="register-field">
          <input
            id="password"
            type="password"
            placeholder={t("auth.password")}
            {...register("password")}
          />
          {errors.password && (
            <p className="error-text">{errors.password.message}</p>
          )}
        </div>

        <div className="register-field privacy-field">
          <label className="privacy-checkbox-label">
            <input
              type="checkbox"
              {...register("acceptPrivacyPolicy")}
              className="privacy-checkbox"
            />
            <span className="privacy-text">
              {t("auth.agreeToPrivacyPolicy")}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="privacy-link"
              >
                {t("auth.privacyPolicy")}
              </Link>
            </span>
          </label>
          {errors.acceptPrivacyPolicy && (
            <p className="error-text">{errors.acceptPrivacyPolicy.message}</p>
          )}
        </div>

        <div className="register-field privacy-field">
          <label className="privacy-checkbox-label">
            <input
              type="checkbox"
              {...register("acceptTermsAndConditions")}
              className="privacy-checkbox"
            />
            <span className="privacy-text">
              {t("auth.agreeToTermsAndConditions")}
              <Link
                href="/terms-and-conditions"
                target="_blank"
                className="privacy-link"
              >
                {t("auth.termsAndConditions")}
              </Link>
            </span>
          </label>
          {errors.acceptTermsAndConditions && (
            <p className="error-text">
              {errors.acceptTermsAndConditions.message}
            </p>
          )}
        </div>

        <div className="register-field privacy-field">
          <label className="privacy-checkbox-label">
            <input
              type="checkbox"
              {...register("acceptReturnPolicy")}
              className="privacy-checkbox"
            />
            <span className="privacy-text">
              {t("auth.agreeToReturnPolicy")}
              <Link
                href="/return-policy"
                target="_blank"
                className="privacy-link"
              >
                {t("auth.returnPolicy")}
              </Link>
            </span>
          </label>
          {errors.acceptReturnPolicy && (
            <p className="error-text">{errors.acceptReturnPolicy.message}</p>
          )}
        </div>

        <button type="submit" className="register-button" disabled={isPending}>
          {isPending ? (
            <>
              <span className="register-loading"></span>
              {t("auth.registerButton")}...
            </>
          ) : (
            t("auth.registerButton")
          )}
        </button>
      </form>

      <div className="register-divider">
        <span>{t("auth.orContinueWith")}</span>
      </div>

      <div className="social-login">
        <button
          className="social-button google-button"
          onClick={handleGoogleAuth}
        >
          <div className="google-icon">
            <FaGoogle />
          </div>
          <span>
            <span className="google-brand">
              <span className="google-blue">G</span>
              <span className="google-red">o</span>
              <span className="google-yellow">o</span>
              <span className="google-blue">g</span>
              <span className="google-green">l</span>
              <span className="google-red">e</span>
            </span>
          </span>
        </button>
      </div>

      <div className="login-prompt">
        {t("auth.alreadyHaveAccount")}
        <Link href="/login" className="login-link">
          {t("auth.login")}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin } from "../hooks/use-auth";
import { FaGoogle } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import "./login-form.css";
import { useLanguage } from "@/hooks/LanguageContext";

export function LoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";
  const router = useRouter();

  const [loginError, setLoginError] = useState<string | null>(null);

  const { mutate: loginUser, isPending } = useLogin();

  // Create schema with translated error messages
  const schema = z.object({
    email: z
      .string()
      .min(1, t("auth.emailRequired"))
      .email(t("auth.emailInvalid")),
    password: z
      .string()
      .min(1, t("auth.passwordRequired"))
      .min(6, t("auth.passwordMinLength")),
  });

  type LoginFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);

    loginUser(data, {
      onSuccess: () => {
        toast({
          title: t("auth.loginSuccess"),
          description: t("auth.welcomeBack"),
          variant: "default",
        });
        router.push(redirect);
      },
      onError: (error: { message?: string }) => {
        // Map common error messages to translation keys
        let errorMessage = error.message || t("auth.loginFailed");

        // Check if it's a common backend error and translate it
        if (
          errorMessage === "არასწორი მეილი ან პაროლი" ||
          errorMessage === "Invalid email or password" ||
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          errorMessage = t("auth.invalidCredentials");
        }

        setLoginError(errorMessage);
        toast({
          title: t("auth.loginFailed"),
          description: errorMessage,
          variant: "destructive",
        });
        // Don't redirect on error - stay on login page to show error
      },
    });
  };
  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };
  return (
    <div className="login-content">
      <h1 className="login-title">{t("auth.login")}</h1>

      {loginError && <div className="login-error">{loginError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="login-form">
        <div className="login-field">
          <input
            id="email"
            type="email"
            placeholder={t("auth.email")}
            {...register("email")}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div className="login-field">
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

        <div className="checkbox-container">
          <div></div>
          <Link href="/forgot-password" className="forgot-password">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <button type="submit" className="login-button" disabled={isPending}>
          {isPending ? `${t("auth.loginButton")}...` : t("auth.loginButton")}
        </button>
      </form>

      <div className="login-divider">
        <span>{t("auth.orContinueWith")} </span>
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

      <div className="register-prompt">
        <Link href="/register" className="register-link">
          {t("auth.createAccount")}
        </Link>
        {t("auth.dontHaveAccount")}
      </div>
    </div>
  );
}

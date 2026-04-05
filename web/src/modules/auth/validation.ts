import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  acceptPrivacyPolicy: z.boolean().refine((val) => val === true, {
    message: "კონფიდენციალურობის პოლიტიკაზე თანხმობა აუცილებელია",
  }),
  acceptTermsAndConditions: z.boolean().refine((val) => val === true, {
    message: "წესებსა და პირობებზე თანხმობა აუცილებელია",
  }),
  acceptReturnPolicy: z.boolean().refine((val) => val === true, {
    message: "დაბრუნების პოლიტიკაზე თანხმობა აუცილებელია",
  }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginSchema = z.infer<typeof loginSchema>;

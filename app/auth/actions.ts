"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut as authSignOut } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb/mongodb";
import { User } from "@/lib/models/User";
// import { seedSampleDataForCurrentUser } from "@/lib/seed/sample-data";

// ──────────────────────────────────────────────────────────────────────────
// Sign out
// ──────────────────────────────────────────────────────────────────────────

export async function signOut() {
  await authSignOut({ redirectTo: "/login" });
}

// ──────────────────────────────────────────────────────────────────────────
// Sign up
// ──────────────────────────────────────────────────────────────────────────

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).max(80).optional(),
});

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signupAction(
  _prevState: SignupResult | null,
  formData: FormData
): Promise<SignupResult> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { email, password, name } = parsed.data;

  try {
    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { ok: false, error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      email,
      passwordHash,
      name,
    });
  } catch (err) {
    console.error("[signupAction] User creation failed:", err);
    return { ok: false, error: "Could not create account. Please try again." };
  }

  // Auto-login after successful signup. signIn() throws a redirect on success.
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
    }
    throw err; // re-throw the redirect
  }

  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────
// Log in
// ──────────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "Invalid email or password" };
      }
      return { ok: false, error: "Could not sign in. Please try again." };
    }
    throw err; // re-throw the redirect
  }

  return { ok: true };
}

// export async function seedDataForNewUser() {
//   try {
//     const result = await seedSampleDataForCurrentUser();
//     return { success: true, ...result };
//   } catch (error) {
//     console.error("Failed to seed sample data:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }
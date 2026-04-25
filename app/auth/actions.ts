"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seedSampleDataForCurrentUser } from "@/lib/seed/sample-data";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function seedDataForNewUser() {
  try {
    const result = await seedSampleDataForCurrentUser();
    return { success: true, ...result };
  } catch (error) {
    console.error("Failed to seed sample data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

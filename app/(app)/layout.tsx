import { Sidebar } from "@/components/layout/sidebar";
import { ChatbotWidget } from "@/components/chat/chatbot-widget";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email ?? null} />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
      <ChatbotWidget />
    </div>
  );
}

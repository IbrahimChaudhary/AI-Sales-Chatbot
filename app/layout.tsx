import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatbotWidget } from "@/components/chat/chatbot-widget";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Sales Dashboard",
  description: "AI-powered sales analytics and forecasting dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto lg:ml-64">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
        <ChatbotWidget />
        <Toaster />
      </body>
    </html>
  );
}

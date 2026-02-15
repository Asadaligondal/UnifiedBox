import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unified Inbox | Manage Instantly & PlusVibe Replies",
  description: "Aggregate and manage all inbound replies from Instantly and PlusVibe campaigns in one unified inbox. AI-assisted responses, team workflows, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-[#fafafa] text-[#37352f] antialiased">
        <AuthProvider>
          <ToastProvider>
            <ProtectedRoute>{children}</ProtectedRoute>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

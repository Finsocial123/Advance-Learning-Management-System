import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnHub — LMS",
  description: "A modern learning management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <AppProviders>
          <Navbar />
          <div className="mx-auto flex w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
            <Sidebar className="hidden lg:flex sticky top-24 h-[calc(100vh-7rem)]" />
            <main className="min-w-0 flex-1 py-2 sm:py-4">{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3800,
              style: {
                background: "rgba(15, 17, 26, 0.96)",
                color: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "14px",
                padding: "12px 14px",
                fontSize: "0.9rem",
                boxShadow: "0 18px 60px -30px rgba(0,0,0,0.9)",
                backdropFilter: "blur(16px)",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#07130c",
                },
              },
              error: {
                iconTheme: {
                  primary: "#fb7185",
                  secondary: "#16070b",
                },
              },
            }}
          />
        </AppProviders>
      </body>
    </html>
  );
}

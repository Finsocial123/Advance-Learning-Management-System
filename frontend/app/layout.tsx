import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "LearnHub — LMS",
  description: "A modern learning management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-violet-500/30 selection:text-violet-200 p-4">
        <Navbar />
        <div className="max-w-360 mx-auto flex p-4">
          <Sidebar className="hidden lg:flex sticky top-16 h-[calc(100vh-64px)]" />
          <main className="flex-1 w-full px-4 sm:px-8 py-8">
            {children}
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#121214",
              color: "#fafafa",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1rem",
              padding: "12px 16px",
              fontSize: "0.9rem",
            },
            success: {
              iconTheme: {
                primary: "#a78bfa",
                secondary: "#121214",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
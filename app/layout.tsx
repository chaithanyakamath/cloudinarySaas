import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Cloudinary AI SaaS Studio",
  description: "AI-Powered Video & Image Transformation SaaS Platform",
};

export default function RootLayout(
  {children,}: Readonly<{children: React.ReactNode;}>)
 {
  return (
    <html lang="en" data-theme="dark" className={outfit.variable}>
      <body className="bg-base-300 text-base-content antialiased min-h-screen">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

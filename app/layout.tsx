import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOLUSHOP | Boutique e-commerce",
  description: "Boutique e-commerce moderne pour produits premium et commandes en ligne.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  const headerUser = currentUser
    ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role }
    : null;

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <CartProvider>
          <div className="min-h-screen">
            <Header user={headerUser} />
            <main>{children}</main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}

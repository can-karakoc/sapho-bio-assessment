import type { Metadata } from "next";
import { Roboto_Mono, Inter, Archivo } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { SessionActivityProvider } from "@/lib/context/SessionActivityContext";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-aspekta", // Using as Aspekta fallback
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sapho Engage",
  description:
    "AI-assisted LinkedIn engagement for Sapho Bio's biotech marketing team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoMono.variable} ${inter.variable} ${archivo.variable} font-sans`}
      >
        <AppProvider>
          <SessionActivityProvider>{children}</SessionActivityProvider>
        </AppProvider>
      </body>
    </html>
  );
}

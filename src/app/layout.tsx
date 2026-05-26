import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-family", // maps directly to our CSS variable
});

export const metadata: Metadata = {
  title: "Lucas Viana | Desenvolvedor & Designer UI",
  description: "Sou desenvolvedor e designer UI apaixonado por transformar ideias em produtos digitais que realmente funcionam na prática. Especialista em SaaS B2B, full-stack, IA e no-code.",
  keywords: "sites, web, desenvolvimento, frontend, lucas viana, programador, lucasdev, front-end, website, portfólio, bubble, supabase, nextjs",
  authors: [{ name: "Lucas Viana" }],
  creator: "Lucas Viana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={cn("dark", plusJakartaSans.variable, "font-sans", geist.variable)}>
      <head>
        {/* FontAwesome for Premium Icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

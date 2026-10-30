import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist, VT323, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PREBOOT_SCRIPT } from "./_portfolio/motion";
import { InlineScript } from "./_portfolio/InlineScript";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

// Terminal theme fonts for the public portfolio (exposed as CSS variables only)
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

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
    <html lang="pt-br" suppressHydrationWarning className={cn(plusJakartaSans.variable, "font-sans", geist.variable, vt323.variable, jetbrainsMono.variable)}>
      <head>
        {/* Portfolio: sets html[data-motion] / html[data-boot] before first paint */}
        <InlineScript id="lv-preboot" html={PREBOOT_SCRIPT} />
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

import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";
import { AuthProvider } from "@/context/AuthContext";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrialSync — The Operating System for Clinical Trials",
  description: "TrialSync coordinates Evidence, Protocol Design, Statistical, and Regulatory agents in a single tamper-evident workspace. Context never dies between teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('trialsync-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`
        }} suppressHydrationWarning />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/components/GameContext";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jb = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb" });

export const metadata: Metadata = { title: "TickGuessr", description: "Minecraft animated texture tick memorization trainer." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jb.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
        <GameProvider>
          <Header />
          {children}
          <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 font-mono">
            Minecraft animated texture tick memorization trainer. Not affiliated with Mojang or Microsoft.
          </footer>
        </GameProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyVault — tvoje studijní knihovna",
  description: "Soukromá knihovna učebnic a studijních materiálů."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}

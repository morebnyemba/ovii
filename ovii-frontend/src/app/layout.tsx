import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ovii",
  description: "Ovii - Digital Banking for Everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

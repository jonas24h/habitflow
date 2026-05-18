import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HabitFlow",
  description: "Minimal Habit Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
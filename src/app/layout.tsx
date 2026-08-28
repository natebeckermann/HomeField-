import type { Metadata } from "next";
import "./globals.css";
import "./live.css";

export const metadata: Metadata = {
  title: "HomeField",
  description: "Your teams. Your leagues. Your field.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Marketing Performance Intelligence Dashboard",
  description: "Meta + Shopify ROI dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

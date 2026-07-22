import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasklist — Personal Backlog",
  description: "Kanban board to manage your personal backlog",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

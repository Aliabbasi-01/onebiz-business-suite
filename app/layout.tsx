
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import WorkspaceShell from "../components/WorkspaceShell";

export const metadata: Metadata = {
  title: "OneBiz | Business Management System",
  description: "One platform for every business.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}

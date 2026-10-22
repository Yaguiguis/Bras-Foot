import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRAS FOOT",
  description: "Assuma o comando. Construa sua história no futebol.",
  applicationName: "BRAS FOOT",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

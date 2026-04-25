import type { Metadata } from "next";
import { Montserrat, Fira_Code } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NYU Maxxxxing",
  description:
    "Your NYU campus companion — find study spaces, trade items, and connect with peer mentors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${firaCode.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

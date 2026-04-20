import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppShell from "./components/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ML Viz - Interactive Machine Learning Visualizations",
  description: "Interactive visualizations for understanding neural networks, backpropagation, gradient descent, and transformers through hands-on exploration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ fontSize: '16px' }}
    >
      <body style={{ height: '100%', width: '100%', margin: 0, overflow: 'hidden' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

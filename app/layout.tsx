import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formula Graph — type a formula, get a graph",
  description:
    "A fast, free, no-signup graph plotter for educators and content creators. Type a formula, get a beautiful graph. Share by link.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Formula Graph",
    description: "Type a formula, get a graph. Share by link.",
    type: "website",
    images: ["/og"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formula Graph",
    description: "Type a formula, get a graph.",
    images: ["/og"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = localStorage.getItem('theme');
                  if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

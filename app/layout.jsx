import "./globals.css";

export const metadata = {
  title: "GitHub Maxxing — Maximize Your GitHub Profile",
  description:
    "Analyze your GitHub profile. Get a score. Fix what's holding you back.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}

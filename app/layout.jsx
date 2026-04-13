import "./globals.css";

export const metadata = {
  title: "Roast My GitHub 🔥",
  description: "Enter your GitHub. Leave with your feelings hurt.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

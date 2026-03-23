import "./globals.css";

export const metadata = {
  title: "PI360 - Dashboard",
  description: "Unified Affiliate + EMR prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: "PI360 - Login",
  description: "PI360 Login",
};

export default function AuthLayout({
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
      <body style={{ background: "var(--bg)" }}>
        <style>{`
          :root {
            --bg: #fbf7f1;
            --bg2: #fff7ee;
            --text: #1e2430;
            --brand: #2f6fec;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
            color: var(--text);
          }

          body {
            background:
              radial-gradient(1200px 700px at 20% -10%, rgba(47, 111, 236, 0.10), transparent 60%),
              radial-gradient(900px 600px at 95% 10%, rgba(240, 165, 0, 0.10), transparent 55%),
              linear-gradient(180deg, var(--bg), var(--bg2));
            overflow: hidden;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}

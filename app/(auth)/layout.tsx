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
    <div
      style={{
        background:
          "radial-gradient(1200px 700px at 20% -10%, rgba(47, 111, 236, 0.10), transparent 60%), radial-gradient(900px 600px at 95% 10%, rgba(240, 165, 0, 0.10), transparent 55%), linear-gradient(180deg, #fbf7f1, #fff7ee)",
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        color: "#1e2430",
      }}
    >
      {children}
    </div>
  );
}

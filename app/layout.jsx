// app/layout.jsx
export const metadata = {
  title: "充電樁預約系統",
  description: "一週七天晚上時段預約",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <head />
      <body>{children}</body>
    </html>
  );
}

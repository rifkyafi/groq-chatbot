import "./globals.css";
import Providers from "./Providers";

export const metadata = {
  title: "GroqChat",
  description: "Chatbot powered by Groq AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
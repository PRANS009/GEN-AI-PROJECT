import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { brand } from "@/config/studio";
import { account, isAdminUser } from "@/server/auth";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: brand,
  description: "A workspace for learning databases and exploring SQL.",
};
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await account();
  const isAdmin = await isAdminUser(user);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('studio-theme')||'light'}catch{}",
          }}
        />
      </head>
      <body>
        <Shell signedIn={!!user} isAdmin={isAdmin}>{children}</Shell>
      </body>
    </html>
  );
}

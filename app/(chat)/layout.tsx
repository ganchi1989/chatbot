import { ClerkLoaded } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@clerk/nextjs/server";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = false;
  console.log(session);
  return (
    <ClerkLoaded>
      <>
        {/* <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        /> */}
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.userId} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </>
    </ClerkLoaded>
  );
}

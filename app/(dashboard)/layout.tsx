import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "./_components/dashboard-header";
import { AppSidebar } from "./_components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="">
      <AppSidebar />
      <SidebarInset>
        {/* Solid, non-transparent, sticky header */}
        <DashboardHeader />
        <main className="flex-1 p-6 bg-background text-foreground">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

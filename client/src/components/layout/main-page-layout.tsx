import { ReactNode } from "react";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/landing/site-footer";

interface MainPageLayoutProps {
  children: ReactNode;
}

export default function MainPageLayout({ children }: MainPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SiteHeader />
      <main className="flex-grow w-full">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

import type { ReactNode } from "react";
import { FeatureRoute } from "@/components/feature-route";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { EarnProvider } from "@/components/earn-provider";
import "./earn.css";
import "./detail.css";

export default function EarnVaultsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <FeatureRoute feature="earnVaults"><EarnProvider>
    <div className="trade-app-shell min-h-screen">
      <AppHeader activeItem="Earn" />
      {children}
      <AppFooter />
    </div>
  </EarnProvider></FeatureRoute>;
}

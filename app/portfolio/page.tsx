import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PortfolioWorkspace } from "@/components/portfolio-workspace";

export const metadata: Metadata = { title: "Portfolio | Lumix", description: "Your trading history and recorded realized P&L on Stellar testnet." };

export default function PortfolioPage() {
  return <div className="trade-app-shell portfolio-shell">
    <AppHeader activeItem="Portfolio" />
    <main className="portfolio-page trade-container"><PortfolioWorkspace /></main>
    <AppFooter />
  </div>;
}

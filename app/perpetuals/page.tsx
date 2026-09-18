import type { Metadata } from "next";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { PerpetualsWorkspace } from "@/components/perpetuals-workspace";

export const metadata: Metadata = {
  title: "Perpetuals | Lumix",
  description: "Explore leveraged perpetual markets with inspectable risk controls.",
};

export default function PerpetualsPage() {
  return (
    <div className="trade-app-shell min-h-screen">
      <AppHeader activeItem="Perpetuals" />
      <main className="perpetuals-page trade-container">
        <PerpetualsWorkspace />
      </main>
      <AppFooter />
    </div>
  );
}

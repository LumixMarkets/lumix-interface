import type { Metadata } from "next";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { OptionsWorkspace } from "@/components/options-workspace";

export const metadata: Metadata = {
  title: "Options | Lumix",
  description: "Explore standardized crypto options across expiration dates and strikes.",
};

export default function OptionsPage() {
  return (
    <div className="trade-app-shell min-h-screen">
      <AppHeader activeItem="Options" />
      <main className="options-page trade-container">
        <OptionsWorkspace />
      </main>
      <AppFooter />
    </div>
  );
}

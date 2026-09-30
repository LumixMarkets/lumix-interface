import type { Metadata } from "next";
import { EarnWorkspace } from "@/components/earn-workspace";

export const metadata: Metadata = {
  title: "Earn | Lumix",
  description: "Explore pools and manage asset deposits in Lumix.",
};

export default function EarnVaultsPage() {
  return (
    <main className="trade-container earn-page"><EarnWorkspace /></main>
  );
}

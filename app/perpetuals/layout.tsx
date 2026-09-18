import type { ReactNode } from "react";
import { FeatureRoute } from "@/components/feature-route";

export default function PerpetualsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <FeatureRoute feature="perpetuals">{children}</FeatureRoute>;
}

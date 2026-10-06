import type { ReactNode } from "react";
import { FeatureRoute } from "@/components/feature-route";

export default function SpotLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <FeatureRoute feature="spot">{children}</FeatureRoute>;
}

import type { ReactNode } from "react";
import { FeatureRoute } from "@/components/feature-route";

export default function OptionsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <FeatureRoute feature="options">{children}</FeatureRoute>;
}

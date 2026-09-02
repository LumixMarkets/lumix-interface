import type { ReactNode } from "react";
import { ComingSoonPage } from "./app-status-page";
import { FEATURES, type FeatureId } from "./app-routes";

export function FeatureRoute({ feature, children }: { feature: FeatureId; children: ReactNode }) {
  if (FEATURES[feature].comingSoon) return <ComingSoonPage feature={feature} />;
  return children;
}

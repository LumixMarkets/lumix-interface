import { notFound } from "next/navigation";
import { ComingSoonPage } from "./app-status-page";
import { FEATURES, type FeatureId } from "./app-routes";

export function FeatureCatchAll({ feature }: { feature: FeatureId }) {
  if (!FEATURES[feature].comingSoon) notFound();
  return <ComingSoonPage feature={feature} />;
}

import { notFound } from "next/navigation";
import { ComingSoonPage } from "@/components/app-status-page";
import { FEATURES, type FeatureId } from "@/components/app-routes";

export default async function UnmatchedRoute({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const route = `/${slug[0] ?? ""}`;
  const match = (Object.entries(FEATURES) as Array<[FeatureId, (typeof FEATURES)[FeatureId]]>)
    .find(([, configuration]) => configuration.route === route);

  if (match?.[1].comingSoon) return <ComingSoonPage feature={match[0]} />;
  notFound();
}

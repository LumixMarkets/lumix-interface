import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createInitialEarnState } from "@/components/earn-model";
import { EarnPoolDetail } from "@/components/earn-pool-detail";

const pools = createInitialEarnState().pools;
type Props = { params: Promise<{ poolId: string }> };

export function generateStaticParams() { return pools.map((pool) => ({ poolId: pool.id })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { poolId } = await params;
  const pool = pools.find((candidate) => candidate.id === poolId);
  return { title: pool ? `${pool.assets.join(" / ")} | Earn | Lumix` : "Pool not found | Lumix" };
}

export default async function EarnPoolPage({ params }: Props) {
  const { poolId } = await params;
  if (!pools.some((pool) => pool.id === poolId)) notFound();
  return <main className="trade-container earn-page earn-detail-page"><EarnPoolDetail key={poolId} poolId={poolId} /></main>;
}

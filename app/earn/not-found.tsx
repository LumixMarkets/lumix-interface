import Link from "next/link";

export default function EarnPoolNotFound() {
  return <main className="trade-container earn-page earn-not-found">
    <h1>Pool not found</h1><p>This pool is unavailable. Explore the available pools on Earn.</p>
    <Link className="trade-button trade-button--secondary" href="/earn">Back to Earn</Link>
  </main>;
}

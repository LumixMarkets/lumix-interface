"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "./icon";
import { useEarn } from "./earn-provider";
import { useWallet } from "./wallet-provider";
import { EarnAprText } from "./earn-controls";
import { earnAccountUrl } from "./earn-account-link";
import { EarnPairIcons, EarnTokenIcon } from "./earn-token-icon";
import { EarnPoolChart } from "./earn-pool-chart";
import { EarnTradePanel } from "./earn-trade-panel";
import { EARN_ASSETS, earnComposition, formatEarnAmount, formatEarnApr, formatEarnUsd, type EarnPool } from "./earn-model";
import { earnPoolStatistics, earnRecentActivity, formatEarnTimestamp, shortEarnAccount } from "./earn-detail-model";

function EarnPoolStats({ pool }: { pool: EarnPool }) {
  const id = useId();
  const stats = earnPoolStatistics(pool);
  const composition = earnComposition(pool);
  return <section className="trade-panel earn-stats-panel" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>Pool statistics</h2>
    <dl className="earn-pool-statistics">
      <div><dt>Total deposits</dt><dd data-testid="pool-total">{formatEarnUsd(stats.deposits)}</dd></div>
      <div><dt><EarnAprText label="Est. fee APR" /></dt><dd>{formatEarnApr(pool.aprBps)}</dd></div>
      <div><dt>24h trading volume</dt><dd data-testid="pool-volume">{formatEarnUsd(stats.volume24h)}</dd></div>
      <div><dt>24h fees</dt><dd data-testid="pool-fees">{formatEarnUsd(stats.fees24h)}</dd></div>
    </dl>
    <div className="earn-pool-balances"><h3>Asset balances</h3>
      <div className="earn-composition-bar" role="img" aria-label={composition.map((part) => `${part.asset} ${part.percent.toFixed(2)}% of pool value`).join(", ")}>
        {composition.map((part) => <span key={part.asset} style={{ flexGrow: part.percent }} data-percent={part.percent} />)}
      </div>
      <dl className="earn-composition-records">{composition.map((part) => <div key={part.asset}>
        <dt><EarnTokenIcon asset={part.asset} /><span>{part.asset}<small>{part.percent.toFixed(2)}% of pool value</small></span></dt>
        <dd data-testid={`pool-balance-${part.asset}`}>{formatEarnAmount(part.amount, part.asset)} {part.asset}<small>{formatEarnUsd(part.value)}</small></dd>
      </div>)}</dl>
    </div>
    <section className="earn-pool-description" aria-labelledby={`${id}-description`}>
      <h3 id={`${id}-description`}>Description</h3>
      <p>The {pool.assets.join(" / ")} pool contains {pool.assets.map((asset) => EARN_ASSETS[asset].name === asset ? asset : `${EARN_ASSETS[asset].name} (${asset})`).join(" and ")} to support perpetual trading. Participants who supply these assets earn a share of the pool’s trading fees.</p>
    </section>
  </section>;
}

function EarnRecentTransactions({ pool }: { pool: EarnPool }) {
  const id = useId();
  const { actions, loading } = useEarn();
  const wallet = useWallet();
  const [limit, setLimit] = useState(8);
  const activity = earnRecentActivity(pool, actions);
  const visible = activity.slice(0, limit);
  return <section className="trade-panel earn-transactions" aria-labelledby={`${id}-title`} aria-busy={loading}>
    <div className="earn-transactions-heading"><h2 id={`${id}-title`}>Recent transactions</h2></div>
    <table className="earn-activity-table"><caption className="earn-sr-only">Recent pool buys and sells</caption>
      <thead><tr><th scope="col">Time</th><th scope="col">Action</th><th scope="col">Asset &amp; amount</th><th scope="col">USD value</th><th scope="col">Account</th></tr></thead>
      <tbody>{visible.map((row) => <tr key={row.id} data-activity={row.id}>
        <td data-label="Time"><time dateTime={new Date(row.time * 1000).toISOString()} title={`${formatEarnTimestamp(row.time)} UTC`}>{new Date(row.time * 1000).toISOString().slice(11, 16)}</time></td>
        <td data-label="Action"><span className={`earn-activity-action ${row.action === "Buy" ? "trade-positive" : "trade-negative"}`}>{row.action}</span></td>
        <td data-label="Asset & amount"><span className="earn-activity-asset"><EarnTokenIcon asset={row.asset} /><span>{formatEarnAmount(row.amount, row.asset)} {row.asset}</span></span></td>
        <td data-label="USD value" className="earn-activity-value">{formatEarnUsd(row.value)}</td>
        <td data-label="Account"><EarnActivityAccount account={row.yours ? wallet.isAuthenticated ? wallet.address ?? "" : "" : row.account} yours={row.yours && wallet.isAuthenticated} /></td>
      </tr>)}</tbody>
    </table>
    {visible.length < activity.length && <div className="earn-activity-more"><button type="button" className="trade-button trade-button--secondary trade-button--sm" disabled={loading} onClick={() => setLimit((current) => current + 8)}>Load more transactions<Icon name="chevron-down" size={14} /></button></div>}
  </section>;
}

function EarnActivityAccount({ account, yours }: { account: string; yours: boolean }) {
  const href = earnAccountUrl(account);
  const label = <>{yours ? "You · " : ""}{account ? shortEarnAccount(account) : "—"}</>;
  return href ? <a className="earn-activity-account" href={href} title={account} target="_blank" rel="noopener noreferrer"
    aria-label={`View account ${account} on Stellar Expert (opens in a new tab)`}>{label}</a> :
    <span className="earn-activity-account" title={account}>{label}</span>;
}

export function EarnPoolDetail({ poolId }: { poolId: string }) {
  const { state, actions, loading } = useEarn();
  const wallet = useWallet();
  const pool = state.pools.find((candidate) => candidate.id === poolId)!;
  return <>
    <nav className="earn-breadcrumb" aria-label="Breadcrumb"><Link href="/earn"><Icon name="arrow-down" size={14} className="earn-back-arrow" />Back to Earn</Link><Icon name="chevron-right" size={14} /><span>{pool.assets.join(" / ")}</span></nav>
    <header className="earn-detail-header earn-intro"><div className="earn-detail-identity"><EarnPairIcons assets={pool.assets} /><div><h1>{pool.assets.join(" / ")}</h1><p>Perpetual trading pool</p></div></div>
      <div className="earn-detail-header-actions"><a className="trade-button trade-button--secondary trade-button--sm earn-mobile-action" href="#pool-action">Buy / Sell<Icon name="chevron-down" size={14} /></a></div>
    </header>
    <div className="earn-detail-grid">
      <EarnPoolChart pool={pool} actions={actions} loading={loading} />
      <EarnTradePanel key={`${pool.id}-${wallet.isAuthenticated}`} pool={pool} />
      <EarnPoolStats pool={pool} />
      <EarnRecentTransactions pool={pool} />
    </div>
  </>;
}

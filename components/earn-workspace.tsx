"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AssetDropdown } from "./asset-dropdown";
import { Icon } from "./icon";
import { useWallet } from "./wallet-provider";
import { useEarn } from "./earn-provider";
import { EarnAprText, EarnMetricText, EarnTabs, EarnWalletPrompt, earnMetricHelp } from "./earn-controls";
import { EarnPairIcons } from "./earn-token-icon";
import {
  EARN_ASSETS, USD_SCALE, earnOverview, earnPoolValue, earnPositionValue,
  filterEarnPools, formatEarnApr, formatEarnPerformance, formatEarnUsd, formatEarnWholeUsd, type EarnPool, type EarnSort, type EarnState,
} from "./earn-model";

const ZERO = BigInt(0);
const POOL_BATCH_SIZE = 3;
type SortDirection = "asc" | "desc";
const SORT_OPTIONS: { value: EarnSort; label: string }[] = [
  { value: "deposits", label: "TVL" },
  { value: "apr", label: "Est. APR" },
  { value: "performance", label: "30D performance" },
  { value: "position", label: "Your deposit" },
];

function EarnOverview({ connected, loading, state }: { connected: boolean; loading: boolean; state: EarnState }) {
  if (!connected) return <EarnWalletPrompt />;
  const overview = earnOverview(state);
  const items = [
    { label: "Total TVL", testId: "total-deposits", value: overview.totalDeposits },
    { label: "Your deposited value", testId: "your-deposits", value: overview.yourDeposits },
    { label: "Your earned fees", testId: "earned-fees", value: overview.feesEarned },
  ];
  // Figures stay hidden until the restored session lands, so the overview never flashes default balances.
  return <div className="earn-overview" role="group" aria-label="Earn overview" aria-busy={loading}>
    <dl className="earn-overview-stats">
      {items.map((item) => <div key={item.testId}><dt>{item.label}</dt>
        <dd data-testid={item.testId}>{loading ? <><span className="trade-skeleton earn-overview-skeleton" aria-hidden="true">$0,000,000.00</span><span className="earn-sr-only">Loading</span></> : formatEarnUsd(item.value)}</dd>
      </div>)}
    </dl>
  </div>;
}

function EarnCompactSort({ sort, direction, onChange }: {
  sort: EarnSort; direction: SortDirection; onChange: (sort: EarnSort, direction: SortDirection) => void;
}) {
  const current = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];
  const descending = direction === "desc";
  return <div className="earn-list-sort">
    <AssetDropdown label="Sort by" value={sort} onChange={(next) => onChange(next, "desc")}
      className="earn-sort-trigger" menuClassName="earn-sort-menu" optionHeight={64}
      selectedContent={<span className="earn-sort-trigger-copy"><span>Sort by</span><strong>{current.label}</strong></span>}
      options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label, content: <span className="earn-sort-option">
        <strong>{option.label}</strong>{earnMetricHelp[option.value] && <span>{earnMetricHelp[option.value]}</span>}
      </span> }))} />
    <button type="button" className="earn-sort-direction" onClick={() => onChange(sort, descending ? "asc" : "desc")}
      aria-label={`Sort order: ${descending ? "high to low" : "low to high"}`}>
      <Icon name="arrow-down" size={16} className={`earn-sort-direction-icon ${direction}`} />
      <span aria-hidden="true">{descending ? "High to low" : "Low to high"}</span>
    </button>
  </div>;
}

function EarnSortHeader({ name, label, sort, direction, onSort }: {
  name: EarnSort; label: string; sort: EarnSort; direction: SortDirection; onSort: (sort: EarnSort) => void;
}) {
  const indicator = <span className="earn-sort-slot" aria-hidden="true">{sort === name && <Icon name="arrow-down" size={18} className={`earn-sort-arrow ${direction}`} />}</span>;
  return <th scope="col" aria-label={label} aria-sort={sort === name ? direction === "desc" ? "descending" : "ascending" : "none"}>
    <span className="earn-column-heading">{name === "apr" ? <EarnAprText label={label} indicator={indicator} onSort={() => onSort(name)} /> : name === "deposits" || name === "performance" ?
      <EarnMetricText label={label} indicator={indicator} onSort={() => onSort(name)} accessibleLabel={`Sort by ${label}`}
        className={name === "deposits" ? "earn-tvl-wrap" : "earn-performance-wrap"}
        explanation={earnMetricHelp[name] ?? ""} /> :
      <button className="earn-sort-button" type="button" onClick={() => onSort(name)} aria-label={`Sort by ${label.toLowerCase()}`}>
        {indicator}<span className="earn-column-label">{label}</span>
      </button>}
    </span>
  </th>;
}

function EarnPoolSkeleton({ state, pools }: { state: EarnState; pools: EarnPool[] }) {
  return pools.map((pool) => <tr key={pool.id} className="earn-skeleton-row" aria-hidden="true">
    <td className="earn-pool-rank"><span className="trade-skeleton">0</span></td>
    <td className="earn-pool-identity"><div className="earn-pool-name">
      <span className="earn-pair-icons"><span className="trade-skeleton earn-token-icon" /><span className="trade-skeleton earn-token-icon" /></span>
      <span className="earn-skeleton-name"><strong className="trade-skeleton">{pool.assets.join(" / ")}</strong><small className="trade-skeleton">{pool.assets.map((asset) => EARN_ASSETS[asset].name).join(" / ")}</small></span>
    </div></td>
    <td data-label="TVL"><span className="trade-skeleton earn-data">$0,000,000</span></td>
    <td data-label="Est. APR"><span className="trade-skeleton earn-data">0.00%</span></td>
    <td data-label="30D performance"><span className="trade-skeleton earn-data">+0.00%</span></td>
    <td data-label="Your deposit"><span className="trade-skeleton earn-data">$0,000</span>{(state.positions[pool.id]?.feesEarnedCents ?? ZERO) > ZERO && <small><span className="trade-skeleton">$00 fees earned</span></small>}</td>
  </tr>);
}

function EarnPoolRows({ state, pools, loading, connected }: {
  state: EarnState; pools: EarnPool[]; loading: boolean; connected: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(POOL_BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || visibleCount >= pools.length || !sentinelRef.current) return;
    let active = true;
    let timer: number | undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!active || timer !== undefined || !entries.some((entry) => entry.isIntersecting)) return;
      setLoadingMore(true);
      timer = window.setTimeout(() => {
        if (!active) return;
        setVisibleCount((count) => Math.min(count + POOL_BATCH_SIZE, pools.length));
        setLoadingMore(false);
      }, 700);
    }, { rootMargin: "0px 0px 160px 0px" });
    observer.observe(sentinelRef.current);
    return () => { active = false; observer.disconnect(); if (timer !== undefined) window.clearTimeout(timer); };
  }, [loading, pools.length, visibleCount]);

  const shown = loading ? [] : pools.slice(0, visibleCount);
  const skeletons = loading ? pools.slice(0, POOL_BATCH_SIZE) : loadingMore ? pools.slice(visibleCount, visibleCount + POOL_BATCH_SIZE) : [];
  return <tbody aria-busy={loading || loadingMore}>
    {shown.map((pool, index) => {
      const position = earnPositionValue(state, pool.id);
      const fees = (state.positions[pool.id]?.feesEarnedCents ?? ZERO) * USD_SCALE / BigInt(100);
      return <tr key={pool.id} data-pool={pool.id}>
        <td className="earn-pool-rank">{index + 1}</td>
        <td className="earn-pool-identity"><Link href={`/earn/${pool.id}`} className="earn-pool-name" aria-label={`View ${pool.assets.join(" / ")} pool`}>
          <EarnPairIcons assets={pool.assets} /><span><strong>{pool.assets.join(" / ")}</strong><small>{pool.assets.map((asset) => EARN_ASSETS[asset].name).join(" / ")}</small></span>
        </Link></td>
        <td data-label="TVL"><span className="earn-data">{formatEarnWholeUsd(earnPoolValue(pool))}</span></td>
        <td data-label="Est. APR"><span className="earn-data">{formatEarnApr(pool.aprBps)}</span></td>
        <td data-label="30D performance"><span className={`earn-data ${pool.performance30dBps < 0 ? "trade-negative" : "trade-positive"}`}>{formatEarnPerformance(pool.performance30dBps)}</span></td>
        <td data-label="Your deposit" className={!connected || position === ZERO ? "earn-zero-position" : ""}>
          <span className="earn-data">{connected ? formatEarnWholeUsd(position) : <><span aria-hidden="true">—</span><span className="earn-sr-only">Connect wallet to view your deposit</span></>}</span>
          {connected && fees > ZERO && <small>{formatEarnWholeUsd(fees)} fees earned</small>}
        </td>
      </tr>;
    })}
    <EarnPoolSkeleton state={state} pools={skeletons} />
    <tr className="earn-load-row"><td colSpan={6}><div ref={sentinelRef} className="earn-load-sentinel" role="status" aria-live="polite">
      <span className="earn-sr-only">{loading ? "Loading pools…" : loadingMore ? "Loading more pools…" : "Pools loaded."}</span>
    </div></td></tr>
  </tbody>;
}

export function EarnWorkspace() {
  const wallet = useWallet();
  const connected = wallet.isAuthenticated;
  const { state, loading, announcement, listView, setListView } = useEarn();
  const { tab, sort, direction } = listView;
  const listId = useId();
  const viewState = connected ? state : { ...state, positions: {} };
  const myPoolCount = connected ? state.pools.filter((pool) => earnPositionValue(state, pool.id) > ZERO).length : 0;
  const pools = filterEarnPools(viewState, { tab, query: "", asset: "All", sort, direction });
  function setTab(next: "all" | "mine") { setListView({ ...listView, tab: next }); }
  function sortBy(next: EarnSort) { setListView({ ...listView, sort: next, direction: sort === next && direction === "desc" ? "asc" : "desc" }); }
  function setSort(next: EarnSort, nextDirection: SortDirection) { setListView({ ...listView, sort: next, direction: nextDirection }); }

  return (
    <fieldset className="earn-workspace" disabled={loading} aria-busy={loading}>
      <legend className="earn-sr-only">Earn pools</legend>
      <div className="earn-intro"><div><h1>Earn</h1><p>Supply assets to pools and earn a share of trading fees.</p></div></div>
      <EarnOverview key={connected ? "connected" : "disconnected"} connected={connected} loading={loading} state={state} />
      <div className="trade-panel earn-pool-list">
        <div className="earn-list-top"><EarnTabs id={listId} label="Pool view" value={tab} onChange={setTab}
          options={[{ value: "all", label: <>All pools <span>{state.pools.length}</span></> }, { value: "mine", label: <>My deposits {connected && !loading && <span>{myPoolCount}</span>}</> }]} />
        </div>
        <div id={`${listId}-panel`} role="tabpanel" aria-labelledby={`${listId}-${tab}-tab`} aria-busy={loading}>
          {!connected && tab === "mine" ? <EarnWalletPrompt compact /> : loading || pools.length > 0 ? <>
          <EarnCompactSort sort={sort} direction={direction} onChange={setSort} />
          <table className="earn-pool-table">
            <caption className="earn-sr-only">Pools with TVL, estimated APR, 30-day performance, and your deposited assets</caption>
            <thead><tr><th scope="col" aria-label="Row number">#</th><th scope="col">Pool</th><EarnSortHeader name="deposits" label="TVL" sort={sort} direction={direction} onSort={sortBy} /><EarnSortHeader name="apr" label="Est. APR" sort={sort} direction={direction} onSort={sortBy} /><EarnSortHeader name="performance" label="30D performance" sort={sort} direction={direction} onSort={sortBy} /><EarnSortHeader name="position" label="Your deposit" sort={sort} direction={direction} onSort={sortBy} /></tr></thead>
            <EarnPoolRows key={`${tab}-${sort}-${direction}-${connected}`} state={viewState} pools={pools} loading={loading} connected={connected} />
          </table></> : <div className="earn-empty"><Icon name="portfolio" size={26} /><h2>No deposits yet</h2><p>Explore the pools and supply an asset to start a position.</p>
            <button type="button" className="trade-button trade-button--secondary" onClick={() => setTab("all")}>Explore pools</button>
          </div>}
        </div>
      </div>
      <div className="earn-page-status" role="status" aria-atomic="true">{connected && announcement && <p><Icon name="check" size={16} />{announcement}</p>}</div>
    </fieldset>
  );
}

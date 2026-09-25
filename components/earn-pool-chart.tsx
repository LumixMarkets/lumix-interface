"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, Time, UTCTimestamp } from "lightweight-charts";
import { EARN_RANGES, earnHistoryChange, earnPoolHistory, formatEarnTimestamp, type EarnHistoryPoint, type EarnRange } from "./earn-detail-model";
import { earnPoolValue, formatEarnUsd, type EarnAction, type EarnPool } from "./earn-model";

// TradingView Lightweight Charts™
// Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/
// The installed library allows disabling its logo when a public attribution link remains.

const chartUsd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const axisUsd = (value: number) => `$${(value / 1000000).toFixed(2)}M`;

export function EarnPoolChart({ pool, actions, loading }: { pool: EarnPool; actions: EarnAction[]; loading: boolean }) {
  const id = useId();
  const [range, setRange] = useState<EarnRange>("1W");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ point: EarnHistoryPoint; x: number; y: number } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const indexRef = useRef<number | null>(null);
  const points = useMemo(() => earnPoolHistory(pool, actions, range), [pool, actions, range]);
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);
  const change = earnHistoryChange(points);

  useEffect(() => {
    const host = hostRef.current;
    const frame = frameRef.current;
    if (!host || !frame) return;
    let active = true;
    let cleanup = () => {};
    let timer: number | undefined;
    void import("lightweight-charts").then(({ createChart, AreaSeries, ColorType, CrosshairMode, LineStyle }) => {
      if (!active) return;
      const tokens = () => getComputedStyle(document.documentElement);
      const token = (name: string) => tokens().getPropertyValue(name).trim();
      const colors = () => ({
        layout: { background: { type: ColorType.Solid, color: token("--trade-bg-surface") }, textColor: token("--trade-text-muted"), fontFamily: token("--trade-font-sans"), fontSize: 11, attributionLogo: false },
        grid: { vertLines: { visible: false }, horzLines: { color: token("--trade-border-subtle"), style: LineStyle.Dotted } },
      });
      const chart = createChart(host, {
        autoSize: true, ...colors(),
        rightPriceScale: { borderVisible: false, minimumWidth: 68, scaleMargins: { top: .15, bottom: .1 } },
        timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: 0, fixLeftEdge: true, fixRightEdge: true },
        crosshair: { mode: CrosshairMode.Magnet, vertLine: { color: token("--trade-text-disabled"), labelVisible: false }, horzLine: { color: token("--trade-text-disabled"), labelVisible: false } },
        handleScroll: false, handleScale: false,
        localization: { locale: "en-US", priceFormatter: axisUsd, timeFormatter: (time: Time) => formatEarnTimestamp(Number(time)) },
      });
      const series = chart.addSeries(AreaSeries, {
        lineColor: token("--trade-accent"), lineWidth: 2,
        topColor: "rgba(46, 92, 255, 0.16)", bottomColor: "rgba(46, 92, 255, 0)",
        priceLineVisible: false, lastValueVisible: false,
        crosshairMarkerRadius: 4, crosshairMarkerBorderWidth: 2,
        crosshairMarkerBackgroundColor: token("--trade-accent"), crosshairMarkerBorderColor: token("--trade-bg-surface"),
        priceFormat: { type: "custom", formatter: axisUsd, minMove: .01 },
      });
      chartRef.current = chart;
      seriesRef.current = series;
      const show = (point: EarnHistoryPoint, x: number, y: number) => setTip({
        point, x: Math.max(8, Math.min(frame.clientWidth - 208, x + 16)),
        y: Math.max(8, Math.min(frame.clientHeight - 80, y - 80)),
      });
      chart.subscribeCrosshairMove((event) => {
        if (!active) return;
        const value = event.seriesData.get(series);
        if (event.time && event.point && value && "value" in value) {
          show({ time: Number(event.time), value: value.value }, event.point.x, event.point.y);
        } else if (document.activeElement !== frame) setTip(null);
      });
      // A tap immediately inspects a point; vertical dragging still scrolls the page.
      const inspectTouch = (event: PointerEvent) => {
        if (event.pointerType !== "touch") return;
        const bounds = host.getBoundingClientRect();
        const logical = chart.timeScale().coordinateToLogical(event.clientX - bounds.left);
        if (logical === null) return;
        const data = pointsRef.current;
        const point = data[Math.max(0, Math.min(data.length - 1, Math.round(logical)))];
        chart.setCrosshairPosition(point.value, point.time as UTCTimestamp, series);
        show(point, event.clientX - bounds.left, event.clientY - bounds.top);
      };
      host.addEventListener("pointerdown", inspectTouch);
      host.addEventListener("pointermove", inspectTouch);
      const dismiss = (event: PointerEvent) => {
        if (event.target instanceof Node && !frame.contains(event.target)) { chart.clearCrosshairPosition(); setTip(null); }
      };
      document.addEventListener("pointerdown", dismiss);
      const resizeObserver = new ResizeObserver(() => setTip(null));
      resizeObserver.observe(frame);
      const themeObserver = new MutationObserver(() => {
        chart.applyOptions(colors());
        series.applyOptions({ lineColor: token("--trade-accent"), crosshairMarkerBorderColor: token("--trade-bg-surface") });
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      timer = window.setTimeout(() => { if (active) setReady(true); }, 500);
      cleanup = () => {
        themeObserver.disconnect();
        resizeObserver.disconnect(); document.removeEventListener("pointerdown", dismiss);
        host.removeEventListener("pointerdown", inspectTouch); host.removeEventListener("pointermove", inspectTouch);
        chart.remove(); chartRef.current = null; seriesRef.current = null;
      };
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; window.clearTimeout(timer); cleanup(); };
  }, []);

  useEffect(() => {
    if (!ready || !seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(points.map((point) => ({ ...point, time: point.time as UTCTimestamp })));
    chartRef.current.applyOptions({ timeScale: { timeVisible: range === "1D" } });
    chartRef.current.timeScale().fitContent();
    chartRef.current.clearCrosshairPosition();
    indexRef.current = null;
  }, [ready, points, range]);

  function inspectIndex(index: number) {
    const next = Math.max(0, Math.min(points.length - 1, index));
    indexRef.current = next;
    const point = points[next];
    chartRef.current?.setCrosshairPosition(point.value, point.time as UTCTimestamp, seriesRef.current!);
    setTip({ point, x: 8, y: 8 });
  }
  const busy = loading || !ready;
  return <section className="trade-panel earn-chart-panel" aria-labelledby={`${id}-heading`}>
    <div className="earn-chart-heading"><div><h2 id={`${id}-heading`}>Total deposits over time</h2>
      <p className="earn-chart-value">{formatEarnUsd(earnPoolValue(pool))}</p>
      <p className={`earn-chart-change ${change.change >= 0 ? "trade-positive" : "trade-negative"}`} aria-label={`Change over ${range}`}>
        {change.change >= 0 ? "+" : "−"}{chartUsd(Math.abs(change.change))} ({change.percent >= 0 ? "+" : ""}{change.percent.toFixed(2)}%)<span>over {range === "All" ? "all time" : range}</span>
      </p></div>
      <div className="trade-segmented earn-chart-ranges" role="group" aria-label="Chart time range">
        {EARN_RANGES.map((item) => <button key={item} type="button" aria-pressed={range === item} disabled={busy} onClick={() => { setRange(item); setTip(null); }}>{item}</button>)}
      </div>
    </div>
    <div className="earn-chart-frame" ref={frameRef} tabIndex={busy ? -1 : 0} role="group" aria-label="Interactive total deposits chart in USD"
      aria-describedby={`${id}-instructions`} aria-busy={busy} data-point-count={points.length} data-range={range}
      onFocus={() => { if (!busy) inspectIndex(points.length - 1); }} onBlur={() => { setTip(null); chartRef.current?.clearCrosshairPosition(); }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Escape") { setTip(null); chartRef.current?.clearCrosshairPosition(); return; }
        inspectIndex(event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : (indexRef.current ?? points.length - 1) + (event.key === "ArrowLeft" ? -1 : 1));
      }}>
      <div className="earn-chart-canvas" ref={hostRef} aria-hidden="true" />
      {busy && !failed && <div className="earn-chart-loading" role="status" aria-label="Loading pool chart"><span className="trade-skeleton" /><span className="trade-skeleton" /><span className="trade-skeleton" /></div>}
      {failed && <div className="earn-chart-unavailable"><p>Chart unavailable</p><span>Total deposits: {formatEarnUsd(earnPoolValue(pool))}. Refresh to try again.</span></div>}
      {!busy && tip && <div className="earn-chart-tooltip" role="tooltip" style={{ left: tip.x, top: tip.y }}><strong>{chartUsd(tip.point.value)}</strong><time dateTime={new Date(tip.point.time * 1000).toISOString()}>{formatEarnTimestamp(tip.point.time)} UTC</time></div>}
    </div>
    <p id={`${id}-instructions`} className="earn-sr-only">Hover or tap to inspect deposits. With keyboard focus, use left and right arrows, Home or End. Escape clears the tooltip.</p>
    <output className="earn-sr-only" aria-live="polite">{tip ? `${chartUsd(tip.point.value)}, ${formatEarnTimestamp(tip.point.time)} UTC` : `${points.length} hourly observations. Current deposits ${chartUsd(change.current)}.`}</output>
    <div className="earn-chart-credit"><a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" aria-label="TradingView Lightweight Charts™. Copyright (с) 2025 TradingView, Inc." title="TradingView Lightweight Charts™. Copyright (с) 2025 TradingView, Inc.">© 2025 TradingView</a></div>
  </section>;
}

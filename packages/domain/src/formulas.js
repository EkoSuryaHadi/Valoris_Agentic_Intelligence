const round6 = (value) => Math.round(value * 1_000_000) / 1_000_000;

export function calculateEvm({ bac, plannedProgress, actualProgress, actualCost }) {
  const pv = round6(bac * plannedProgress);
  const ev = round6(bac * actualProgress);
  const cv = round6(ev - actualCost);
  const sv = round6(ev - pv);
  return {
    pv, ev, ac: actualCost, cv, sv,
    cpi: actualCost === 0 ? null : round6(ev / actualCost),
    spi: pv === 0 ? null : round6(ev / pv),
  };
}

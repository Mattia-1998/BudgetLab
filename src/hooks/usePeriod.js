import { useState } from 'react';
import { startOfMonth, periodRange, shiftAnchor } from '../utils/finance';
import { formatPeriodLabel } from '../utils/format';

export default function usePeriod() {
  const [mode, setMode] = useState('month');
  const [anchor, setAnchor] = useState(() => startOfMonth(Date.now()));
  const [customStart, setCustomStart] = useState(() => startOfMonth(Date.now()));
  const [customEnd, setCustomEnd] = useState(() => startOfMonth(Date.now()));
  const [restore, setRestore] = useState(null);

  const period = { mode, anchor, customStart, customEnd };
  const range = periodRange(period);
  const startMs = range ? range.startMs : -Infinity;
  const endMs = range ? range.endMs : Infinity;
  const allActive = mode === 'all';
  const shiftable = mode !== 'all' && mode !== 'custom';

  const prev = () => { if (shiftable) setAnchor((a) => shiftAnchor(a, mode, -1)); };
  const next = () => { if (shiftable) setAnchor((a) => shiftAnchor(a, mode, 1)); };

  const toggleAll = () => {
    if (mode === 'all') {
      if (restore) { setMode(restore.mode); setAnchor(restore.anchor); }
      else setMode('month');
      setRestore(null);
    } else {
      setRestore({ mode, anchor });
      setMode('all');
    }
  };

  const applyPeriod = (nextPeriod) => {
    setMode(nextPeriod.mode);
    if (nextPeriod.anchor != null) setAnchor(nextPeriod.anchor);
    if (nextPeriod.customStart != null) setCustomStart(nextPeriod.customStart);
    if (nextPeriod.customEnd != null) setCustomEnd(nextPeriod.customEnd);
    setRestore(null);
  };

  const sideLabel = (dir) => (shiftable ? formatPeriodLabel({ ...period, anchor: shiftAnchor(anchor, mode, dir) }) : '');

  return { period, range, startMs, endMs, label: formatPeriodLabel(period), prevLabel: sideLabel(-1), nextLabel: sideLabel(1), allActive, shiftable, prev, next, toggleAll, applyPeriod };
}
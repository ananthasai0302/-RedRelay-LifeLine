import { createContext, useCallback, useEffect, useState } from 'react';
import { api } from './api';

export const MeCtx = createContext({ meId: null, setMeId() {} });

export const STEPS = ['Open / Broadcasted', 'Donors Responded', 'Fulfilled / In Transit', 'Closed'];
const IDX = { open: 0, responded: 1, fulfilled: 2, closed: 3 };

export function Stepper({ status }) {
  const at = IDX[status];
  return (
    <ol className="stepper">
      {STEPS.map((s, i) => (
        <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}><span className="dot" />{s}</li>
      ))}
    </ol>
  );
}

export function timeLeft(ts) {
  const m = Math.floor((ts - Date.now()) / 60000);
  if (m <= 0) return 'expired';
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m left` : `${m}m left`;
}

// fetch now, then keep refreshing so the feed feels live
export function usePoll(path, ms = 5000) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(
    () => api(path).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.message)),
    [path]
  );
  useEffect(() => {
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, ms]);
  return [data, err, load];
}

export const Field = ({ label, error, children }) => (
  <label className="field"><span>{label}</span>{children}{error && <small className="err">{error}</small>}</label>
);

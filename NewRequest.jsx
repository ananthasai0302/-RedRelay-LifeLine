import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Field } from '../ui.jsx';

export default function NewRequest() {
  const nav = useNavigate();
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState({ patientName: '', bloodGroup: 'B+', units: 2, hospitalId: 'apollo', hours: 4, doctorContact: '', reason: '' });
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('/meta').then(setMeta); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErrs({}); setMsg('');
    try {
      const r = await api('/requests', { method: 'POST', body: f });
      nav(`/request/${r.id}`);
    } catch (er) { setErrs(er.fields); setMsg(er.message); }
    setBusy(false);
  }
  if (!meta) return <p className="empty">Loading…</p>;
  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h1>Request blood</h1>
      <p className="hint">A doctor's contact is needed so donors know the request is real. It is never shown publicly.</p>
      <Field label="Patient name" error={errs.patientName}><input value={f.patientName} onChange={set('patientName')} /></Field>
      <div className="row">
        <Field label="Blood group needed" error={errs.bloodGroup}>
          <select value={f.bloodGroup} onChange={set('bloodGroup')}>{meta.groups.map((g) => <option key={g}>{g}</option>)}</select>
        </Field>
        <Field label="Units" error={errs.units}><input type="number" min="1" max="10" value={f.units} onChange={set('units')} /></Field>
        <Field label="Needed within (hours)" error={errs.hours}><input type="number" min="1" max="24" value={f.hours} onChange={set('hours')} /></Field>
      </div>
      <Field label="Hospital" error={errs.hospitalId}>
        <select value={f.hospitalId} onChange={set('hospitalId')}>{meta.hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
      </Field>
      <Field label="Doctor's phone number" error={errs.doctorContact}><input inputMode="tel" placeholder="+91 98765 43210" value={f.doctorContact} onChange={set('doctorContact')} /></Field>
      <Field label="Short note for donors (optional)"><input maxLength="140" placeholder="e.g. emergency surgery" value={f.reason} onChange={set('reason')} /></Field>
      {msg && <p className="err">{msg}</p>}
      <button className="btn red" disabled={busy}>{busy ? 'Sending…' : 'Send request to donors'}</button>
    </form>
  );
}

import { useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { Field, MeCtx } from '../ui.jsx';

function certificate(name, group) {
  const c = document.createElement('canvas');
  c.width = c.height = 1080;
  const x = c.getContext('2d');
  x.fillStyle = '#17202B'; x.fillRect(0, 0, 1080, 1080);
  x.fillStyle = '#C41230'; x.fillRect(0, 0, 1080, 28); x.fillRect(0, 1052, 1080, 28);
  x.textAlign = 'center'; x.fillStyle = '#fff';
  x.font = '700 40px Figtree, sans-serif'; x.fillText('RedRelay thanks', 540, 300);
  x.font = '800 96px "Bricolage Grotesque", sans-serif'; x.fillText(name, 540, 450);
  x.font = '500 38px Figtree, sans-serif'; x.fillText('for stepping up as a voluntary blood donor', 540, 540);
  x.fillText('and helping a family in an emergency.', 540, 590);
  x.fillStyle = '#C41230'; x.beginPath(); x.arc(540, 760, 90, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = '800 72px "Bricolage Grotesque", sans-serif'; x.fillText(group, 540, 786);
  x.font = '500 30px Figtree, sans-serif'; x.fillText(new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }), 540, 960);
  const a = document.createElement('a');
  a.download = 'redrelay-donor-certificate.png'; a.href = c.toDataURL('image/png'); a.click();
}

export default function Donors() {
  const { meId, setMeId } = useContext(MeCtx);
  const [meta, setMeta] = useState(null);
  const [list, setList] = useState([]);
  const [me, setMe] = useState(null);
  const [city, setCity] = useState('');
  const [group, setGroup] = useState('');
  const [f, setF] = useState({ name: '', phone: '', bloodGroup: 'O+', placeId: 'madhapur' });
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');

  const loadList = () => api(`/donors?city=${city}&group=${encodeURIComponent(group)}`).then(setList);
  useEffect(() => { api('/meta').then(setMeta); }, []);
  useEffect(() => { loadList(); }, [city, group, me]); // eslint-disable-line
  useEffect(() => { if (meId) api(`/donors/${meId}`).then(setMe).catch(() => setMe(null)); else setMe(null); }, [meId]);

  async function register(e) {
    e.preventDefault(); setErrs({}); setMsg('');
    try { const d = await api('/donors', { method: 'POST', body: f }); setMeId(d.id); setMsg('You are registered. Your number is never shown to anyone.'); }
    catch (er) { setErrs(er.fields); setMsg(er.message); }
  }
  async function toggle() {
    const d = await api(`/donors/${me.id}`, { method: 'PATCH', body: { available: !me.available } });
    setMe({ ...me, ...d });
  }
  if (!meta) return <p className="empty">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cities = [...new Set(meta.places.map((p) => p.city))];

  return (
    <div className="detail">
      <section className="panel">
        {me ? (
          <>
            <h1>Hi {me.name.split(' ')[0]}</h1>
            <p>{me.bloodGroup} donor in {me.locality}, {me.city}.</p>
            {me.locked
              ? <p className="note">You donated recently, so you're paused until {new Date(me.unlockOn).toLocaleDateString('en-IN')} (90 day recovery).</p>
              : <label className="switch"><input type="checkbox" checked={me.available} onChange={toggle} /> {me.available ? 'Available to donate' : 'Not available right now'}</label>}
            {me.lastDonation && <button className="btn" onClick={() => certificate(me.name, me.bloodGroup)}>Download my certificate</button>}
            <button className="btn sm" onClick={() => setMeId('')}>Switch to visitor</button>
          </>
        ) : (
          <form className="form" onSubmit={register} noValidate>
            <h1>Become a donor</h1>
            <p className="hint">Only your initials, blood group and locality are visible. Families reach you through the app, never by phone.</p>
            <Field label="Full name" error={errs.name}><input value={f.name} onChange={set('name')} /></Field>
            <Field label="Phone number (kept private)" error={errs.phone}><input inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
            <div className="row">
              <Field label="Blood group" error={errs.bloodGroup}><select value={f.bloodGroup} onChange={set('bloodGroup')}>{meta.groups.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Locality" error={errs.placeId}><select value={f.placeId} onChange={set('placeId')}>{meta.places.map((p) => <option key={p.id} value={p.id}>{p.name}, {p.city}</option>)}</select></Field>
            </div>
            {msg && <p className="err">{msg}</p>}
            <button className="btn red">Register as donor</button>
          </form>
        )}
        {me && msg && <p className="ok">{msg}</p>}
      </section>

      <section className="panel">
        <div className="row between"><h2>Donor registry ({list.length})</h2>
          <div className="row">
            <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City"><option value="">All cities</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Blood group"><option value="">All groups</option>{meta.groups.map((g) => <option key={g}>{g}</option>)}</select>
          </div></div>
        <ul className="donors">
          {list.map((d) => (
            <li key={d.id}><span className="bg sm">{d.bloodGroup}</span>
              <div><b>{d.initials}</b> <small>{d.locality}, {d.city}</small></div>
              <small>{d.locked ? 'Recovering' : d.available ? 'Available' : 'Unavailable'}</small></li>
          ))}
        </ul>
        {!list.length && <p className="empty">No donors match those filters.</p>}
      </section>
    </div>
  );
}

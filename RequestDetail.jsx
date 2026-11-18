import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { MeCtx, Stepper, timeLeft, usePoll } from '../ui.jsx';

function HospitalMap({ hospital, donors }) {
  const el = useRef(null);
  const key = donors.map((d) => d.id).join();
  useEffect(() => {
    const map = L.map(el.current).setView([hospital.lat, hospital.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    // circle markers on purpose: Leaflet's default pin images break under bundlers
    L.circleMarker([hospital.lat, hospital.lng], { radius: 11, color: '#C41230', fillOpacity: 0.9 }).addTo(map).bindPopup(hospital.name);
    donors.forEach((d) => L.circleMarker([d.lat, d.lng], { radius: 6, color: '#167A68', fillOpacity: 0.7 }).addTo(map).bindPopup(`${d.initials} · ${d.bloodGroup} · about ${d.etaMin} min away`));
    return () => map.remove();
  }, [hospital.id, key]); // eslint-disable-line
  return <div ref={el} className="map" />;
}

export default function RequestDetail() {
  const { id } = useParams();
  const { meId } = useContext(MeCtx);
  const [radius, setRadius] = useState(15);
  const [r, err, reload] = usePoll(`/requests/${id}?radius=${radius}`);
  const [note, setNote] = useState('');
  const [sms, setSms] = useState(false);
  const [units, setUnits] = useState(1);

  if (err && !r) return <p className="empty">{err}</p>;
  if (!r) return <p className="empty">Loading…</p>;
  const closed = r.status === 'closed';
  const iResponded = r.responderIds.includes(meId);

  async function act(path, body, ok) {
    setNote('');
    try { await api(path, { method: 'POST', body }); setNote(ok); reload(); } catch (e) { setNote(e.message); }
  }

  return (
    <div className="detail">
      <section className="panel">
        <div className="req-head"><span className="bg big">{r.bloodGroup}</span>
          <div><h1>{r.patientName}</h1><p>{r.hospital.name}</p></div></div>
        <Stepper status={r.status} />
        <p className="count"><b>{r.committed}</b> of {r.units} units committed <em>{closed ? (r.closedReason === 'received' ? 'Blood received. Thank you donors.' : 'Request expired') : timeLeft(r.expiresAt)}</em></p>
        <div className="bar"><i style={{ width: `${Math.min(100, (r.committed / r.units) * 100)}%` }} /></div>
        <p className="hint">Doctor contact on file: {r.doctorMasked}. Can be given by {r.compatibleGroups.join(', ')}.</p>
        {r.reason && <p>“{r.reason}”</p>}

        {!closed && (
          <div className="actions">
            {r.status !== 'fulfilled' && (meId ? (
              iResponded ? <p className="ok">You've committed to this request. Head to the hospital.</p> : <>
                {r.remaining > 1 && <select value={units} onChange={(e) => setUnits(+e.target.value)} aria-label="Units you can give">
                  {Array.from({ length: Math.min(r.remaining, 2) }, (_, i) => <option key={i} value={i + 1}>{i + 1} unit{i ? 's' : ''}</option>)}</select>}
                <button className="btn red" onClick={() => act(`/requests/${id}/respond`, { donorId: meId, units }, 'Thanks! The request now shows your commitment.')}>I can donate</button>
              </>
            ) : <p className="hint">Pick yourself under “Viewing as” (top right) or register on the Donors page to respond.</p>)}
            <button className="btn" onClick={() => confirm('Confirm the blood has been received? This closes the request.') && act(`/requests/${id}/received`, {}, 'Marked as received. Request closed.')}>Mark blood received</button>
          </div>
        )}
        {note && <p className="note" role="status">{note}</p>}
      </section>

      <section className="panel">
        <div className="row between">
          <h2>Compatible donors nearby ({r.eligible.length})</h2>
          <label className="radius">Within {radius} km
            <input type="range" min="2" max="50" value={radius} onChange={(e) => setRadius(+e.target.value)} /></label>
        </div>
        <HospitalMap hospital={r.hospital} donors={r.eligible} />
        <ul className="donors">
          {r.eligible.map((d) => (
            <li key={d.id}>
              <span className="bg sm">{d.bloodGroup}</span>
              <div><b>{d.initials}</b> <small>{d.locality}</small></div>
              <small>{d.distanceKm} km · ~{d.etaMin} min</small>
              {!closed && <button className="btn sm" onClick={() => act('/relay', { donorId: d.id }, `Relay ping sent to ${d.initials}. Their number stays hidden.`)}>Ping</button>}
            </li>
          ))}
        </ul>
        {!r.eligible.length && <p className="empty">No available compatible donors in {radius} km. Try a wider radius.</p>}
        {!closed && <button className="btn" onClick={() => setSms(!sms)}>{sms ? 'Hide' : 'Show'} SMS dispatch simulation</button>}
        {sms && <div className="sms">{r.eligible.map((d) => (
          <p key={d.id}><b>To {d.initials} ({d.locality}):</b> RedRelay SOS. {r.remaining} unit(s) of {r.bloodGroup} needed at {r.hospital.name}, about {d.etaMin} min from you. Open the app to respond.</p>))}</div>}
      </section>
    </div>
  );
}

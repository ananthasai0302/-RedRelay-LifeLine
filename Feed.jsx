import { Link } from 'react-router-dom';
import { Stepper, timeLeft, usePoll } from '../ui.jsx';

function Card({ r }) {
  const closed = r.status === 'closed';
  const urgent = !closed && r.status !== 'fulfilled' && r.expiresAt - Date.now() < 3 * 3600000;
  return (
    <Link to={`/request/${r.id}`} className={`req ${urgent ? 'urgent' : ''} ${closed ? 'closed' : ''}`}>
      <div className="req-head">
        <span className="bg">{r.bloodGroup}</span>
        <div>
          <h3>{r.patientName}</h3>
          <p>{r.hospital.name}</p>
        </div>
        {urgent && <span className="pulse" title="Urgent" />}
      </div>
      <div className="count"><b>{r.committed}</b> of {r.units} units committed <em>{closed ? (r.closedReason === 'received' ? 'blood received' : 'expired') : timeLeft(r.expiresAt)}</em></div>
      <div className="bar"><i style={{ width: `${Math.min(100, (r.committed / r.units) * 100)}%` }} /></div>
      <Stepper status={r.status} />
    </Link>
  );
}

export default function Feed() {
  const [reqs, err] = usePoll('/requests');
  if (err) return <p className="empty">Couldn't reach the server: {err}. Is the API running on port 5000?</p>;
  if (!reqs) return <p className="empty">Loading requests…</p>;
  const live = reqs.filter((r) => r.status !== 'closed');
  const done = reqs.filter((r) => r.status === 'closed');
  const need = live.filter((r) => r.status !== 'fulfilled').length;
  return (
    <>
      <section className="lead">
        <h1>{need ? `${need} ${need === 1 ? 'family needs' : 'families need'} blood right now` : 'No open requests right now'}</h1>
        <Link to="/sos" className="btn red">Post an emergency request</Link>
      </section>
      <div className="grid">{live.map((r) => <Card key={r.id} r={r} />)}</div>
      {!live.length && <p className="empty">Nothing urgent at the moment. New requests appear here the second they are posted.</p>}
      {done.length > 0 && <><h2 className="sub">Recently closed</h2><div className="grid">{done.map((r) => <Card key={r.id} r={r} />)}</div></>}
    </>
  );
}

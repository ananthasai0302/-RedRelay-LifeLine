import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { api } from './api';
import { MeCtx } from './ui.jsx';
import Feed from './pages/Feed.jsx';
import NewRequest from './pages/NewRequest.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Donors from './pages/Donors.jsx';

export default function App() {
  const [meId, setMeIdState] = useState(() => localStorage.getItem('rr_me') || '');
  const [donors, setDonors] = useState([]);
  const setMeId = (id) => { localStorage.setItem('rr_me', id); setMeIdState(id); };

  useEffect(() => { api('/donors').then(setDonors).catch(() => {}); }, [meId]);

  return (
    <MeCtx.Provider value={{ meId, setMeId }}>
      <header className="top">
        <Link to="/" className="brand">RedRelay</Link>
        <nav>
          <NavLink to="/" end>Live requests</NavLink>
          <NavLink to="/donors">Donors</NavLink>
          <NavLink to="/sos" className="sos-link">Request blood</NavLink>
        </nav>
        <label className="as">
          Viewing as
          <select value={meId} onChange={(e) => setMeId(e.target.value)}>
            <option value="">Visitor</option>
            {donors.map((d) => <option key={d.id} value={d.id}>{d.initials} ({d.bloodGroup}, {d.locality})</option>)}
          </select>
        </label>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/sos" element={<NewRequest />} />
          <Route path="/request/:id" element={<RequestDetail />} />
          <Route path="/donors" element={<Donors />} />
          <Route path="*" element={<p className="empty">That page doesn't exist. <Link to="/">Back to live requests</Link></p>} />
        </Routes>
      </main>
    </MeCtx.Provider>
  );
}

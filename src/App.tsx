/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import Search from './pages/Search';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import MyList from './pages/MyList';
import VIP from './pages/VIP';
import DubIndo from './pages/DubIndo';
import UserPage from './pages/User';
import SettingsPage from './pages/Settings';
import ReportIssuePage from './pages/ReportIssue';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/vip" element={<VIP />} />
        <Route path="/dubindo" element={<DubIndo />} />
        <Route path="/mylist" element={<MyList />} />
        <Route path="/report" element={<ReportIssuePage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

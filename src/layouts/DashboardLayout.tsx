import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout(){return <div className="app-shell"><Sidebar/><main className="main-area"><Header/><section className="page-container"><Outlet/></section></main></div>}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import { Dashboard, Planning, Costs, Infrastructure, Security, NetworkPage, Services } from './pages/Pages';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/planning" element={<Planning />} />
            <Route path="/dashboard/costs" element={<Costs />} />
            <Route path="/dashboard/infrastructure" element={<Infrastructure />} />
            <Route path="/dashboard/security" element={<Security />} />
            <Route path="/dashboard/network" element={<NetworkPage />} />
            <Route path="/dashboard/services" element={<Services />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
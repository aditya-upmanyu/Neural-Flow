import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import MonitoringPage from './pages/MonitoringPage';
import ComparisonPage from './pages/ComparisonPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import BharatBazaarPage from './pages/BharatBazaarPage';
import useWebSocket from './hooks/useWebSocket';
import useStore from './store/useStore';

export default function App() {
  // Initialize WebSocket connection
  useWebSocket();

  // Load settings from localStorage
  const loadSettings = useStore(state => state.loadSettings);
  const settings = useStore(state => state.settings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme attribute to root element so CSS variables respond
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '14px'
            },
            success: {
              iconTheme: {
                primary: 'var(--accent-success)',
                secondary: 'var(--bg-card)'
              }
            },
            error: {
              iconTheme: {
                primary: 'var(--accent-danger)',
                secondary: 'var(--bg-card)'
              }
            }
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
            <Route path="comparison" element={<ComparisonPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ai-insights" element={<AIInsightsPage />} />
            <Route path="bharatbazaar" element={<BharatBazaarPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

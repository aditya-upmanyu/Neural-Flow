// NeuralFlow V5 — Settings Page
import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function SettingsPage() {
  const settings       = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const saveSettings   = useStore(s => s.saveSettings);
  const resetSettings  = useStore(s => s.resetSettings);
  const [local, setLocal] = useState(settings);

  useEffect(() => { setLocal(settings); }, [settings]);

  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    updateSettings(local);
    saveSettings();
    document.documentElement.setAttribute('data-theme', local.theme);
    // Push relevant settings to backend so the AI engine uses them
    try {
      await fetchWithTimeout(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertThreshold:       local.alertThreshold,
          detectionSensitivity: local.detectionSensitivity,
          refreshIntervalSec:   local.refreshInterval,
          webhookUrl:           local.webhookUrl,
          slackNotifications:   local.slackNotifications,
        }),
      });
      toast.success('Settings saved');
    } catch {
      toast.success('Settings saved (backend offline)');
    }
  };

  const handleReset = () => {
    resetSettings();
    toast.success('Reset to defaults');
  };

  const handleTestWebhook = async () => {
    if (!local.webhookUrl) return toast.error('Enter a webhook URL first');
    toast.loading('Testing webhook…', { id: 'wh' });
    try {
      const r = await fetchWithTimeout(local.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true, source: 'NeuralFlow V5', ts: Date.now() }) });
      r.ok ? toast.success('Webhook OK', { id: 'wh' }) : toast.error('Webhook returned error', { id: 'wh' });
    } catch { toast.error('Webhook unreachable', { id: 'wh' }); }
  };

  const handleExportModel = async () => {
    try {
      const data = await fetchWithTimeout(`${API_URL}/api/model/export`).then(r => r.json());
      const url = URL.createObjectURL(new Blob([JSON.stringify(data.model, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'neuralflow_model.json'; a.click(); URL.revokeObjectURL(url);
      toast.success('Model exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: 840, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 5 }}>CONFIGURATION</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Settings</div>
      </div>

      <Section title="Appearance">
        <Row label="Theme" sub="Interface color scheme">
          <ToggleGroup value={local.theme} opts={[{v:'dark',l:'Dark'},{v:'light',l:'Light'}]} onChange={v=>set('theme',v)} />
        </Row>
      </Section>

      <Section title="Notifications">
        <Row label="Enable Toasts" sub="Show event notifications">
          <Toggle checked={local.notifications} onChange={v=>set('notifications',v)} />
        </Row>
        <Row label="Alert Sound" sub="Audio for critical alerts">
          <Toggle checked={local.alertSound} onChange={v=>set('alertSound',v)} />
        </Row>
      </Section>

      <Section title="Monitoring">
        <Row label="Alert Threshold" sub={`Trigger at ${local.alertThreshold}ms latency`}>
          <Slider value={local.alertThreshold} min={100} max={1000} step={50} onChange={v=>set('alertThreshold',v)} />
        </Row>
        <Row label="Refresh Interval" sub={`Broadcast every ${local.refreshInterval}s`}>
          <Slider value={local.refreshInterval} min={1} max={10} onChange={v=>set('refreshInterval',v)} />
        </Row>
      </Section>

      <Section title="AI Configuration">
        <Row label="Training Samples" sub={`${local.trainingSamples} samples`}>
          <Slider value={local.trainingSamples} min={100} max={1000} step={100} onChange={v=>set('trainingSamples',v)} />
        </Row>
        <Row label="Detection Sensitivity" sub="How aggressively AI flags anomalies">
          <ToggleGroup value={local.detectionSensitivity} opts={[{v:'LOW',l:'Low'},{v:'MEDIUM',l:'Med'},{v:'HIGH',l:'High'},{v:'PARANOID',l:'Max'}]} onChange={v=>set('detectionSensitivity',v)} />
        </Row>
        <Row label="Auto-Retrain" sub="Retrain model on new session data">
          <Toggle checked={local.autoRetrain} onChange={v=>set('autoRetrain',v)} />
        </Row>
        <Row label="Export Model" sub="Download neural network weights">
          <button onClick={handleExportModel} style={{ height: 32, padding: '0 14px', borderRadius: 6, background: 'var(--cyan)', color: '#020204', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
            💾 Export
          </button>
        </Row>
      </Section>

      <Section title="Integrations">
        <Row label="Webhook URL" sub="POST events to an external endpoint">
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input value={local.webhookUrl} onChange={e=>set('webhookUrl',e.target.value)} placeholder="https://…"
              style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: '0.78rem' }} />
            <button onClick={handleTestWebhook} style={{ height: 32, padding: '0 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--green)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Test</button>
          </div>
        </Row>
        <Row label="Cloudflare API Key" sub="DNS failover integration">
          <input type="password" value={local.cloudflareApiKey} onChange={e=>set('cloudflareApiKey',e.target.value)} placeholder="API key"
            style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontSize: '0.78rem' }} />
        </Row>
        <Row label="Slack Notifications" sub="Send alerts to Slack">
          <Toggle checked={local.slackNotifications} onChange={v=>set('slackNotifications',v)} />
        </Row>
      </Section>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
        <button onClick={handleReset} style={{ height: 38, padding: '0 20px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>↺ Reset</button>
        <button onClick={handleSave}  style={{ height: 38, padding: '0 24px', borderRadius: 7, background: 'var(--cyan)', border: 'none', color: '#020204', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,212,255,0.25)' }}>💾 Save Settings</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: '4px 18px 12px' }}>{children}</div>
    </motion.div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 20 }}>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer', transition: 'background 0.2s', background: checked ? 'var(--cyan)' : 'var(--bg-elevated)', border: `1px solid ${checked ? 'transparent' : 'var(--border-light)'}`, display: 'flex', alignItems: 'center', justifyContent: checked ? 'flex-end' : 'flex-start' }}>
      <motion.div layout style={{ width: 18, height: 18, borderRadius: '50%', background: checked ? '#020204' : 'var(--text-muted)' }} />
    </div>
  );
}

function Slider({ value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
      <input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--cyan)' }} />
      <span style={{ minWidth: 38, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{value}</span>
    </div>
  );
}

function ToggleGroup({ value, opts, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', padding: 3, borderRadius: 7, border: '1px solid var(--border)' }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{ height: 26, padding: '0 10px', borderRadius: 5, cursor: 'pointer', border: 'none', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s', background: value === o.v ? 'var(--cyan)' : 'transparent', color: value === o.v ? '#020204' : 'var(--text-muted)' }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// Centralized API/WS configuration for Local Development and Cloud Deployment (Render/Vercel/Heroku)
const isBrowser = typeof window !== 'undefined';
const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultProto = isBrowser && window.location.protocol === 'https:' ? 'https:' : 'http:';
const defaultWsProto = isBrowser && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const defaultHost = isBrowser ? window.location.host : 'localhost:3001';

// Handle Jest test environment where import.meta.env is undefined
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const API_URL = env.VITE_API_URL || (!isLocal && isBrowser ? `${defaultProto}//${defaultHost}` : 'http://localhost:3001');
export const WS_URL  = env.VITE_WS_URL  || (!isLocal && isBrowser ? `${defaultWsProto}//${defaultHost}` : 'ws://localhost:3001');
export const IS_LOCAL = isLocal;


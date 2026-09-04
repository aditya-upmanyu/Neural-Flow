// Zustand Store - Global State Management for NeuralFlow V5
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // System state
  mode: 'AI',                  // 'AI' | 'MANUAL'
  environment: 'INTERNAL',     // 'INTERNAL' | 'EXTERNAL'
  nodes: [],
  events: [],
  
  // Manual mode state
  manualModeState: {
    isActive: false,
    attackStartTime: null,
    elapsedTime: 0,
    failedRequests: 0,
    revenueLoss: 0
  },
  
  // AI state
  lastAIDecision: null,
  activePlaybook: null,
  lastIncidentReport: null,
  // Completed session snapshots for comparison page
  completedAISession: null,
  completedManualSession: null,
  
  // Incident Lifecycle state
  incident: {
    state: 'NORMAL',
    nodeId: null,
    targetNodeId: null,
    detectedLatency: 0,
    predictedBreach: null,
    cooldownExpiry: 0,
    verificationCount: 0
  },
  setIncident: (incident) => set({ incident }),

  // NFV5 Control Plane & Orchestrator State
  orchestratorStatus: null,
  activeIncidents: [],
  latestIncident: null,
  unsuitableNodes: [],
  adaptationHistory: [],
  setOrchestratorStatus: (status) => set({ orchestratorStatus: status }),
  setActiveIncidents: (incidents) => set({ activeIncidents: incidents || [] }),
  setLatestIncident: (incident) => set({ latestIncident: incident }),
  setUnsuitableNodes: (nodes) => set({ unsuitableNodes: nodes || [] }),
  setAdaptationHistory: (history) => set({ adaptationHistory: history || [] }),
  
  // Model performance
  modelPerformance: {
    isTrained: false,
    isTraining: false,
    trainingProgress: 0,
    accuracy: 0,
    predictionCount: 0,
    lastTrainingError: 0,
    trainingHistory: []
  },
  
  // Statistics
  stats: {
    attacksDetected: 0,
    attacksBlocked: 0,
    avgResponseTime: null, // null until first real AI decision — derived from actual decisions
    totalAIResponseMs: 0,
    predictions: {
      total: 0,
      correct: 0,
      falsePositives: 0
    }
  },

  // Server uptime (real, from serverStartTime)
  serverUptime: { seconds: 0, minutes: 0, hours: 0 },
  
  // Attack engine stats
  attackStats: {
    totalAttacks: 0,
    activeAttacks: 0,
    attacksByType: {},
    avgDuration: 0,
    lastAttackTime: null
  },
  
  // WebSocket connection
  wsConnected: false,
  
  // Settings
  settings: {
    theme: 'dark',
    notifications: true,
    alertSound: true,
    autoRefresh: true,
    refreshInterval: 2,
    alertThreshold: 500,
    trainingSamples: 500,
    detectionSensitivity: 'MEDIUM',
    autoRetrain: false,
    webhookUrl: '',
    cloudflareApiKey: '',
    slackNotifications: false
  },
  
  // Actions
  setMode: (mode) => set({ mode }),

  setEnvironment: (environment) => set({ environment }),
  
  setNodes: (nodes) => {
    const mapped = nodes.map(n => ({
      ...n,
      id: n.nodeId,
      healthScore: n.health,
      status: n.status ? n.status.toLowerCase() : 'healthy'
    }));
    set({ nodes: mapped });
  },
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 1000) // Keep last 1000
  })),
  
  setEvents: (events) => set({ events }),
  
  setManualModeState: (mms) => {
    set({ manualModeState: mms });
    if (mms && mms.completedSession) {
      set({ completedManualSession: mms.completedSession });
    }
  },

  setLastAIDecision: (decision) => {
    set({ lastAIDecision: decision });
    // Only update completedAISession when we receive a real decision (not on reset/null)
    if (decision && decision.responseTimeMs) {
      set({ completedAISession: {
        responseTimeMs:     decision.responseTimeMs,
        detectionTimestamp: decision.detectionTimestamp || null,
        actionTimestamp:    decision.actionTimestamp    || null,
        fromNodeId:         decision.fromNodeId,
        toNodeId:           decision.toNodeId,
        confidence:         decision.confidence,
        beforeWeights:      decision.beforeWeights || [],
        afterWeights:       decision.afterWeights  || [],
        estimatedSavings:   decision.estimatedSavings || 0,
        completedAt:        Date.now(),
      }});
    }
    // When decision is null (reset), do NOT overwrite completedAISession —
    // the comparison page still needs the last completed session data.
  },

  setLastIncidentReport: (report) => set({ lastIncidentReport: report }),

  setActivePlaybook: (playbook) => set({ activePlaybook: playbook }),

  // Clear all transient per-incident state on reset.
  // Preserves completedAISession / completedManualSession so the Comparison page
  // keeps its data across resets — judges can still review AI vs Manual results.
  resetTransientState: () => set(state => ({
    lastAIDecision: null,
    activePlaybook: null,
    // Keep completed sessions — comparison page needs them after reset
    // completedAISession: null,   ← intentionally NOT cleared
    // completedManualSession: null, ← intentionally NOT cleared
    incident: {
      state: 'NORMAL',
      nodeId: null,
      targetNodeId: null,
      detectedLatency: 0,
      predictedBreach: null,
      cooldownExpiry: 0,
      verificationCount: 0
    },
    manualModeState: {
      isActive: false,
      attackStartTime: null,
      elapsedTime: 0,
      failedRequests: 0,
      revenueLoss: 0,
      attackedNodeId: null
    },
    stats: {
      attacksDetected: 0,
      attacksBlocked: 0,
      avgResponseTime: null,
      totalAIResponseMs: 0,
      predictions: { total: 0, correct: 0, falsePositives: 0 }
    }
  })),  
  setModelPerformance: (performance) => set({ modelPerformance: performance }),
  
  setStats: (stats) => set({ stats }),
  setServerUptime: (serverUptime) => set({ serverUptime }),
  
  setAttackStats: (attackStats) => set({ attackStats }),
  
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  // Load settings from localStorage
  loadSettings: () => {
    try {
      const saved = localStorage.getItem('neuralflow_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        set({ settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
  
  // Save settings to localStorage
  saveSettings: () => {
    try {
      localStorage.setItem('neuralflow_settings', JSON.stringify(get().settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
  
  // Reset settings to default
  resetSettings: () => {
    const defaultSettings = {
      theme: 'dark',
      notifications: true,
      alertSound: true,
      autoRefresh: true,
      refreshInterval: 2,
      alertThreshold: 500,
      trainingSamples: 500,
      detectionSensitivity: 'MEDIUM',
      autoRetrain: false,
      webhookUrl: '',
      cloudflareApiKey: '',
      slackNotifications: false
    };
    set({ settings: defaultSettings });
    localStorage.removeItem('neuralflow_settings');
  },
  
  // Get node by ID
  getNodeById: (nodeId) => {
    return get().nodes.find(n => n.nodeId === nodeId);
  },
  
  // Get healthy nodes
  getHealthyNodes: () => {
    return get().nodes.filter(n => n.status === 'healthy');
  },
  
  // Get nodes under attack
  getNodesUnderAttack: () => {
    return get().nodes.filter(n => n.isUnderAttack);
  },
  
  // Get system health score
  getSystemHealthScore: () => {
    const nodes = get().nodes;
    if (nodes.length === 0) return 100;
    const avg = nodes.reduce((sum, n) => sum + n.health, 0) / nodes.length;
    return Math.round(avg);
  },
  
  // Get status summary
  getStatusSummary: () => {
    const nodes = get().nodes;
    return {
      healthy: nodes.filter(n => n.status === 'healthy').length,
      warning: nodes.filter(n => n.status === 'warning').length,
      critical: nodes.filter(n => n.status === 'critical').length,
      total: nodes.length
    };
  }
}));

export default useStore;

// Real Website Monitor - Monitors actual websites with HTTP requests
import axios from 'axios';

class RealWebsiteMonitor {
  constructor(nodeId, name, url, location) {
    this.nodeId = nodeId;
    this.name = name;
    this.url = url;
    this.location = location;
    
    // Metrics
    this.latency = 0;
    this.errorRate = 0;
    this.status = 'healthy';
    this.statusCode = 200;
    this.lastCheckTime = Date.now();
    
    // History for trends (keep last 20 checks)
    this.latencyHistory = [];
    this.errorHistory = [];
    this.requestCount = 0;
    this.failedRequests = 0;
    
    // Simulated metrics (estimated from real data)
    this.cpuUsage = 30;
    this.memoryUsage = 50;
    this.queueSize = 10;
    this.requestsPerSecond = 0;
    
    // Attack simulation state
    this.underAttack = false;
    this.attackType = null;
    this.attackIntensity = 0;
    this.attackStartTime = null;
    this.attackDuration = 0;
    
    console.log(`🌐 Monitoring: ${this.name} at ${this.url}`);
    
    // Start monitoring immediately
    this.checkHealth();
    
    // Continue checking every 2 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkHealth();
    }, 2000);
  }
  
  async checkHealth() {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(this.url, {
        timeout: 5000,  // 5 second timeout
        validateStatus: (status) => status < 500,  // Accept 2xx, 3xx, 4xx
        maxRedirects: 5
      });
      
      let latency = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 400;
      
      // Apply attack effects if under attack
      if (this.underAttack) {
        latency = this.applyAttackEffects(latency);
      }
      
      // Update metrics
      this.latency = latency;
      this.statusCode = response.status;
      this.requestCount++;
      
      if (!isHealthy) {
        this.failedRequests++;
      }
      
      // Calculate error rate
      this.errorRate = (this.failedRequests / this.requestCount) * 100;
      
      // Update history (keep last 20)
      this.latencyHistory.push(latency);
      if (this.latencyHistory.length > 20) {
        this.latencyHistory.shift();
      }
      
      this.errorHistory.push(isHealthy ? 0 : 1);
      if (this.errorHistory.length > 20) {
        this.errorHistory.shift();
      }
      
      // Estimate metrics from real latency
      this.cpuUsage = this.estimateCPUFromLatency(latency);
      this.memoryUsage = this.estimateMemoryFromErrors(this.errorRate);
      this.queueSize = this.estimateQueueFromLatency(latency);
      this.requestsPerSecond = this.requestCount / ((Date.now() - this.lastCheckTime) / 1000);
      
      // Determine status
      if (latency > 1000 || this.errorRate > 10) {
        this.status = 'critical';
      } else if (latency > 500 || this.errorRate > 5) {
        this.status = 'warning';
      } else {
        this.status = 'healthy';
      }
      
      console.log(`✅ ${this.name}: ${latency}ms, Status: ${response.status}, Error Rate: ${this.errorRate.toFixed(1)}%`);
      
    } catch (error) {
      let latency = Date.now() - startTime;
      
      // Apply attack effects if under attack
      if (this.underAttack) {
        latency = this.applyAttackEffects(latency);
      }
      
      // Update failure metrics
      this.latency = latency;
      this.statusCode = error.response?.status || 0;
      this.requestCount++;
      this.failedRequests++;
      this.errorRate = (this.failedRequests / this.requestCount) * 100;
      this.status = 'critical';
      
      console.error(`❌ ${this.name}: ${error.message}`);
    }
  }
  
  // Simulate attack effects on real latency
  applyAttackEffects(baseLatency) {
    const attackMultiplier = this.attackIntensity / 100;
    const elapsedTime = this.attackStartTime ? (Date.now() - this.attackStartTime) / 1000 : 0;
    
    switch (this.attackType) {
      case 'DDoS':
        // DDoS increases latency dramatically with high variance
        return baseLatency + (300 * attackMultiplier) + Math.random() * 250;
        
      case 'SlowLoris':
        // SlowLoris causes connection exhaustion - gradual latency increase
        // Connection slots fill over time, causing exponential slowdown
        const connectionExhaustion = Math.min(elapsedTime * 15, 400);
        return baseLatency + (200 * attackMultiplier) + connectionExhaustion + Math.random() * 100;
        
      case 'HTTPFlood':
        // HTTP Flood causes application-layer saturation
        // Legitimate-looking requests overwhelm processing capacity
        const appLayerLoad = 180 * attackMultiplier;
        return baseLatency + appLayerLoad + Math.random() * 150;
        
      case 'TrafficSpike':
        // Traffic spike causes bandwidth saturation
        return baseLatency + (150 * attackMultiplier) + Math.random() * 100;
        
      case 'MemoryLeak':
        // Memory leak causes gradual slowdown as garbage collection struggles
        return baseLatency + (elapsedTime * 20 * attackMultiplier);
        
      default:
        return baseLatency;
    }
  }
  
  // Start simulated attack (doesn't actually attack the website!)
  startAttack(attackType, intensity, duration) {
    this.underAttack = true;
    this.attackType = attackType;
    this.attackIntensity = intensity;
    this.attackStartTime = Date.now();
    this.attackDuration = duration;
    
    console.log(`🚨 Simulating ${attackType} attack on ${this.name} (${intensity}% intensity, ${duration}s duration)`);
    
    // Auto-end attack after duration
    setTimeout(() => {
      this.endAttack();
    }, duration * 1000);
  }
  
  endAttack() {
    console.log(`✅ Attack simulation ended on ${this.name} - entering recovery phase`);
    this.underAttack = false;
    this.attackType = null;
    this.attackIntensity = 0;
    this.attackStartTime = null;
    this.attackDuration = 0;
  }
  
  getState() {
    return {
      nodeId: this.nodeId,
      name: this.name,
      url: this.url,
      location: this.location,
      latency: Math.round(this.latency),
      errorRate: parseFloat(this.errorRate.toFixed(2)),
      status: this.status,
      statusCode: this.statusCode,
      requestCount: this.requestCount,
      failedRequests: this.failedRequests,
      
      // Estimated metrics for ML model
      cpuUsage: Math.round(this.cpuUsage),
      memoryUsage: Math.round(this.memoryUsage),
      queueSize: Math.round(this.queueSize),
      requestsPerSecond: Math.round(this.requestsPerSecond * 10) / 10,
      
      // Trends for prediction
      latencyTrend: this.calculateTrend(this.latencyHistory),
      errorTrend: this.calculateTrend(this.errorHistory),
      
      // Attack state
      underAttack: this.underAttack,
      attackType: this.attackType,
      attackIntensity: this.attackIntensity
    };
  }
  
  calculateTrend(history) {
    if (history.length < 10) return 0;
    
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (olderAvg === 0) return 0;
    
    // Return normalized trend (-1 to 1)
    const trend = (recentAvg - olderAvg) / olderAvg;
    return Math.max(-1, Math.min(1, trend));
  }
  
  // Estimate CPU based on latency (higher latency suggests higher CPU load)
  estimateCPUFromLatency(latency) {
    let baseCpu = Math.min(100, 20 + (latency / 10) + Math.random() * 15);
    
    if (this.underAttack) {
      const elapsedTime = (Date.now() - this.attackStartTime) / 1000;
      const attackMultiplier = this.attackIntensity / 100;
      
      switch (this.attackType) {
        case 'DDoS':
          // DDoS maxes out CPU with request flood
          return Math.min(98, 50 + (this.attackIntensity * 0.5) + Math.random() * 20);
          
        case 'SlowLoris':
          // SlowLoris gradually increases CPU as connections accumulate
          return Math.min(95, 40 + (elapsedTime * 5 * attackMultiplier) + Math.random() * 15);
          
        case 'HTTPFlood':
          // HTTP Flood causes high but oscillating CPU
          const oscillation = Math.sin(Date.now() / 1000) * 15;
          return Math.min(95, 50 + (30 * attackMultiplier) + oscillation);
          
        case 'MemoryLeak':
          // Memory leak causes CPU spikes during GC
          const gcSpikes = Math.random() > 0.7 ? 20 : 0;
          return Math.min(90, 40 + (elapsedTime * 3 * attackMultiplier) + gcSpikes);
          
        default:
          return Math.min(100, 50 + (this.attackIntensity * 0.5) + Math.random() * 20);
      }
    }
    
    return baseCpu;
  }
  
  // Estimate memory based on error rate
  estimateMemoryFromErrors(errorRate) {
    let baseMemory = Math.min(100, 40 + (errorRate * 3) + Math.random() * 15);
    
    if (this.underAttack) {
      const elapsedTime = (Date.now() - this.attackStartTime) / 1000;
      const attackMultiplier = this.attackIntensity / 100;
      
      switch (this.attackType) {
        case 'MemoryLeak':
          // Memory leak causes linear memory increase
          return Math.min(98, 50 + (elapsedTime * 2) + Math.random() * 10);
          
        case 'SlowLoris':
          // SlowLoris increases memory with open connections
          return Math.min(85, 45 + (elapsedTime * 1.5) + Math.random() * 10);
          
        case 'HTTPFlood':
          // HTTP Flood causes moderate memory pressure
          return Math.min(80, baseMemory + (25 * attackMultiplier));
          
        default:
          return baseMemory;
      }
    }
    
    return baseMemory;
  }
  
  // Estimate queue size based on latency
  estimateQueueFromLatency(latency) {
    if (this.underAttack) {
      return Math.floor(50 + (this.attackIntensity * 2) + Math.random() * 100);
    }
    return Math.floor((latency / 5) + Math.random() * 20);
  }
  
  // Cleanup on shutdown
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export default RealWebsiteMonitor;
export { RealWebsiteMonitor };

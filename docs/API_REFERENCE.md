# NeuralFlow V5 - API Reference

## Base URL

```
http://localhost:3001/api
```

## Authentication

Include API key in request headers (if configured):

```http
X-API-Key: your-api-key-here
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": 1706304000000
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "type": "ValidationError",
    "details": { ... }
  }
}
```

## Endpoints

### System

#### Health Check

```http
GET /api/health
```

**Description**: Check system health status

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": 1706304000000,
  "uptime": 3600,
  "version": "5.0.0"
}
```

#### System State

```http
GET /api/state
```

**Description**: Get comprehensive system state

**Response**:
```json
{
  "success": true,
  "nodes": [...],
  "mode": "AI",
  "environment": "INTERNAL",
  "incident": {...},
  "stats": {...},
  "modelPerformance": {...},
  "timestamp": 1706304000000
}
```

### Nodes

#### List All Nodes

```http
GET /api/nodes
```

**Description**: Get list of all monitored nodes

**Response**:
```json
[
  {
    "nodeId": 1,
    "name": "Testfire Bank",
    "port": 4001,
    "location": "US Server (Primary)",
    "status": "HEALTHY",
    "health": 95,
    "latency": 45,
    "cpuUsage": 25,
    "memoryUsage": 30,
    "requestsPerSecond": 12.5,
    "errorRate": 0.5,
    "traffic": 60,
    "isUnderAttack": false,
    "attackType": null
  }
]
```

#### Get Node Details

```http
GET /api/nodes/:nodeId/details
```

**Parameters**:
- `nodeId` (path, required): Node ID

**Response**:
```json
{
  "nodeId": 1,
  "name": "Testfire Bank",
  "metrics": {
    "health": 95,
    "latency": 45,
    "cpu": 25,
    "memory": 30
  },
  "latencyHistory": [
    { "timestamp": 1706304000000, "value": 45 },
    { "timestamp": 1706304002000, "value": 48 }
  ]
}
```

#### Get Node URL

```http
GET /api/nodes/:nodeId/url
```

**Parameters**:
- `nodeId` (path, required): Node ID

**Response**:
```json
{
  "nodeId": 1,
  "url": "http://demo.testfire.net"
}
```

### Control

#### Switch Mode

```http
POST /api/mode
```

**Description**: Switch between AI and Manual mode

**Request Body**:
```json
{
  "mode": "AI"
}
```

**Validation**:
- `mode`: enum ["AI", "Manual"], required

**Response**:
```json
{
  "success": true,
  "mode": "AI"
}
```

#### Switch Environment

```http
POST /api/environment
```

**Description**: Switch between Internal and External monitoring

**Request Body**:
```json
{
  "environment": "INTERNAL"
}
```

**Validation**:
- `environment`: enum ["INTERNAL", "EXTERNAL"], required

**Response**:
```json
{
  "success": true,
  "environment": "INTERNAL",
  "changed": true
}
```

#### Get Settings

```http
GET /api/settings
```

**Description**: Get current system settings

**Response**:
```json
{
  "success": true,
  "settings": {
    "alertThreshold": 300,
    "detectionSensitivity": 0.85,
    "refreshIntervalSec": 2,
    "webhookUrl": null,
    "slackNotifications": false
  }
}
```

#### Update Settings

```http
POST /api/settings
```

**Description**: Update system settings

**Request Body**:
```json
{
  "alertThreshold": 350,
  "detectionSensitivity": 0.9,
  "refreshIntervalSec": 3,
  "webhookUrl": "https://hooks.slack.com/...",
  "slackNotifications": true
}
```

**Validation**:
- `alertThreshold`: number, 50-2000
- `detectionSensitivity`: number, 0.1-1.0
- `refreshIntervalSec`: number, 1-60
- `webhookUrl`: string, max 500 chars, URL format
- `slackNotifications`: boolean

**Response**:
```json
{
  "success": true,
  "settings": {...}
}
```

### Attack Simulation

#### Start Attack

```http
POST /api/attack/start
```

**Description**: Start attack simulation on a node

**Request Body**:
```json
{
  "nodeId": 1,
  "intensity": 70,
  "attackType": "TrafficSpike",
  "duration": 30
}
```

**Validation**:
- `nodeId`: number, required, min 1
- `intensity`: number, required, 1-100
- `attackType`: enum ["TrafficSpike", "DDoS", "SlowLoris", "HTTPFlood", "MemoryLeak"]
- `duration`: number, 5-300 seconds

**Response**:
```json
{
  "success": true,
  "message": "Attack simulation started on Node 1",
  "attackId": "atk_1706304000",
  "estimatedDuration": 30
}
```

#### Stop Attack

```http
POST /api/attack/stop
```

**Description**: Stop all ongoing attack simulations

**Response**:
```json
{
  "success": true,
  "message": "All attack simulations stopped"
}
```

### Manual Control

#### Manual Reroute

```http
POST /api/manual/reroute
```

**Description**: Manually reroute traffic (Manual mode only)

**Request Body**:
```json
{
  "fromNodeId": 1,
  "toNodeId": 2,
  "reason": "Planned maintenance"
}
```

**Validation**:
- `fromNodeId`: number, required
- `toNodeId`: number, required
- `reason`: string, max 500 chars

**Response**:
```json
{
  "success": true,
  "message": "Manual reroute initiated"
}
```

#### Adjust Traffic

```http
POST /api/manual/traffic
```

**Description**: Manually adjust traffic distribution

**Request Body**:
```json
{
  "nodeId": 1,
  "traffic": 40
}
```

**Validation**:
- `nodeId`: number, required
- `traffic`: number, required, 0-100

**Response**:
```json
{
  "success": true,
  "message": "Traffic adjusted"
}
```

### AI Model

#### Get Model Performance

```http
GET /api/model/performance
```

**Description**: Get neural network performance metrics

**Response**:
```json
{
  "accuracy": 98.67,
  "precision": 100.0,
  "recall": 100.0,
  "f1Score": 100.0,
  "totalDecisions": 1250,
  "correctDecisions": 1234,
  "trainingDate": "2024-01-26T12:00:00Z"
}
```

#### Retrain Model

```http
POST /api/model/retrain
```

**Description**: Trigger neural network retraining

**Request Body** (optional):
```json
{
  "samples": 500,
  "epochs": 300
}
```

**Validation**:
- `samples`: number, 100-10000
- `epochs`: number, 10-1000

**Response**:
```json
{
  "success": true,
  "message": "Model retraining completed",
  "performance": {...}
}
```

#### Get Feature Importance

```http
GET /api/model/features
```

**Description**: Get feature importance scores

**Response**:
```json
{
  "features": {
    "latency": 0.28,
    "cpu": 0.22,
    "memory": 0.18,
    "errorRate": 0.15,
    "queue": 0.12,
    "traffic": 0.05
  }
}
```

### Receipts & Audit

#### Get Latest Receipt

```http
GET /api/receipts/latest
```

**Description**: Get the most recent decision receipt

**Response**:
```json
{
  "receiptId": "receipt_1706304000",
  "timestamp": 1706304000000,
  "decision": {
    "fromNodeId": 1,
    "toNodeId": 2,
    "confidence": 0.95,
    "reasons": [...]
  },
  "outcome": "VERIFICATION_PASSED",
  "verification": {...}
}
```

#### Get All Receipts

```http
GET /api/receipts?limit=20&offset=0
```

**Query Parameters**:
- `limit`: number, default 20, max 100
- `offset`: number, default 0

**Response**:
```json
{
  "receipts": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### Get Receipt by ID

```http
GET /api/receipts/:receiptId
```

**Parameters**:
- `receiptId` (path, required): Receipt ID

**Response**: Same as latest receipt

### Analytics

#### Get Summary

```http
GET /api/analytics/summary
```

**Description**: Get analytics summary

**Response**:
```json
{
  "success": true,
  "data": {
    "totalIncidents": 45,
    "resolvedIncidents": 42,
    "failedIncidents": 3,
    "averageResolutionTime": 4500,
    "totalReroutes": 38,
    "aiAccuracy": 98.5
  }
}
```

#### Get Incident History

```http
GET /api/analytics/incidents?from=timestamp&to=timestamp
```

**Query Parameters**:
- `from`: number, timestamp (optional)
- `to`: number, timestamp (optional)
- `limit`: number, default 50

**Response**:
```json
{
  "incidents": [
    {
      "id": "inc_1706304000",
      "detectedAt": 1706304000000,
      "resolvedAt": 1706304005000,
      "duration": 5000,
      "sourceNode": 1,
      "targetNode": 2,
      "outcome": "RESOLVED"
    }
  ]
}
```

### System Control

#### Reset System

```http
POST /api/reset
```

**Description**: Reset system to initial state

**Response**:
```json
{
  "success": true,
  "message": "System reset complete"
}
```

#### Run Benchmark

```http
POST /api/benchmark/run
```

**Description**: Run system benchmark

**Request Body**:
```json
{
  "duration": 60,
  "intensity": 80
}
```

**Validation**:
- `duration`: number, 5-300 seconds
- `intensity`: number, 1-100

**Response**:
```json
{
  "success": true,
  "benchmarkId": "bench_1706304000",
  "estimatedDuration": 60
}
```

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Events

#### `state_update`

Sent every 2 seconds with current system state.

```json
{
  "type": "state_update",
  "data": {
    "nodes": [...],
    "mode": "AI",
    "incident": {...}
  }
}
```

#### `incident_detected`

Sent when new incident is detected.

```json
{
  "type": "incident_detected",
  "data": {
    "incidentId": "inc_1706304000",
    "nodeId": 1,
    "severity": "CRITICAL"
  }
}
```

#### `reroute_initiated`

Sent when rerouting begins.

```json
{
  "type": "reroute_initiated",
  "data": {
    "fromNodeId": 1,
    "toNodeId": 2,
    "confidence": 0.95
  }
}
```

#### `verification_complete`

Sent when verification finishes.

```json
{
  "type": "verification_complete",
  "data": {
    "result": "VERIFICATION_PASSED",
    "improvements": {...}
  }
}
```

#### `mode_changed`

Sent when system mode changes.

```json
{
  "type": "mode_changed",
  "data": {
    "mode": "Manual"
  }
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Global | 100 req/min |
| API endpoints | 60 req/min |
| Attack simulation | 10 req/min |
| Model training | 5 req/min |

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Examples

### cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Get nodes
curl http://localhost:3001/api/nodes

# Start attack
curl -X POST http://localhost:3001/api/attack/start \
  -H "Content-Type: application/json" \
  -d '{"nodeId":1,"intensity":70}'

# Switch mode with API key
curl -X POST http://localhost:3001/api/mode \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"mode":"Manual"}'
```

### JavaScript

```javascript
// Fetch nodes
const response = await fetch('http://localhost:3001/api/nodes');
const nodes = await response.json();

// Start attack
const attack = await fetch('http://localhost:3001/api/attack/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    nodeId: 1,
    intensity: 70,
    attackType: 'TrafficSpike'
  })
});

// WebSocket connection
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Python

```python
import requests

# Get system state
response = requests.get('http://localhost:3001/api/state')
state = response.json()

# Start attack
attack = requests.post(
    'http://localhost:3001/api/attack/start',
    json={
        'nodeId': 1,
        'intensity': 70,
        'attackType': 'TrafficSpike'
    },
    headers={'X-API-Key': 'your-api-key'}
)
```

---

**API Version**: 5.0.0  
**Last Updated**: December 2024

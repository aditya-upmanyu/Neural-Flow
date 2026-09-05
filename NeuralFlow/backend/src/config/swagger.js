// backend/src/config/swagger.js
// OpenAPI/Swagger documentation configuration

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NeuralFlow V5 API',
    version: '5.0.0',
    description: 'AI-Powered Autonomous Infrastructure Resilience Platform API',
    contact: {
      name: 'NeuralFlow Team',
      email: 'support@neuralflow.io',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.neuralflow.io',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'System', description: 'System status and health endpoints' },
    { name: 'Nodes', description: 'Node management and monitoring' },
    { name: 'Attacks', description: 'Attack simulation and testing' },
    { name: 'AI', description: 'AI model and decision endpoints' },
    { name: 'Control', description: 'System control and configuration' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Receipts', description: 'Decision receipts and audit trail' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the system',
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'number', example: 1706304000000 },
                    uptime: { type: 'number', example: 3600 },
                    version: { type: 'string', example: '5.0.0' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/state': {
      get: {
        tags: ['System'],
        summary: 'Get current system state',
        description: 'Returns comprehensive system state including nodes, incidents, and AI status',
        responses: {
          200: {
            description: 'Current system state',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SystemState',
                },
              },
            },
          },
        },
      },
    },
    '/api/nodes': {
      get: {
        tags: ['Nodes'],
        summary: 'List all nodes',
        description: 'Returns a list of all monitored nodes with their current metrics',
        responses: {
          200: {
            description: 'List of nodes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Node',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/nodes/{nodeId}/details': {
      get: {
        tags: ['Nodes'],
        summary: 'Get node details',
        description: 'Returns detailed information about a specific node',
        parameters: [
          {
            in: 'path',
            name: 'nodeId',
            required: true,
            schema: { type: 'integer' },
            description: 'Node ID',
          },
        ],
        responses: {
          200: {
            description: 'Node details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NodeDetails',
                },
              },
            },
          },
          404: {
            description: 'Node not found',
          },
        },
      },
    },
    '/api/attack/start': {
      post: {
        tags: ['Attacks'],
        summary: 'Start attack simulation',
        description: 'Simulates an attack on a specific node for testing purposes',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nodeId', 'intensity'],
                properties: {
                  nodeId: {
                    type: 'integer',
                    minimum: 1,
                    example: 1,
                    description: 'Target node ID',
                  },
                  intensity: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    example: 70,
                    description: 'Attack intensity (1-100)',
                  },
                  attackType: {
                    type: 'string',
                    enum: ['TrafficSpike', 'DDoS', 'SlowLoris', 'HTTPFlood', 'MemoryLeak'],
                    example: 'TrafficSpike',
                    description: 'Type of attack to simulate',
                  },
                  duration: {
                    type: 'integer',
                    minimum: 5,
                    maximum: 300,
                    example: 30,
                    description: 'Attack duration in seconds',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Attack simulation started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    attackId: { type: 'string' },
                    estimatedDuration: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid request parameters',
          },
        },
      },
    },
    '/api/attack/stop': {
      post: {
        tags: ['Attacks'],
        summary: 'Stop attack simulation',
        description: 'Stops any ongoing attack simulations',
        responses: {
          200: {
            description: 'Attack simulation stopped',
          },
        },
      },
    },
    '/api/mode': {
      post: {
        tags: ['Control'],
        summary: 'Switch system mode',
        description: 'Switches between AI autonomous mode and Manual mode',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mode'],
                properties: {
                  mode: {
                    type: 'string',
                    enum: ['AI', 'Manual'],
                    example: 'AI',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Mode switched successfully',
          },
          400: {
            description: 'Invalid mode',
          },
        },
      },
    },
    '/api/environment': {
      post: {
        tags: ['Control'],
        summary: 'Switch environment',
        description: 'Switches between Internal and External monitoring environments',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['environment'],
                properties: {
                  environment: {
                    type: 'string',
                    enum: ['INTERNAL', 'EXTERNAL'],
                    example: 'INTERNAL',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Environment switched successfully',
          },
        },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Control'],
        summary: 'Get system settings',
        description: 'Returns current system configuration and settings',
        responses: {
          200: {
            description: 'Current settings',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Settings',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Control'],
        summary: 'Update system settings',
        description: 'Updates system configuration parameters',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Settings',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Settings updated successfully',
          },
        },
      },
    },
    '/api/receipts/latest': {
      get: {
        tags: ['Receipts'],
        summary: 'Get latest decision receipt',
        description: 'Returns the most recent AI decision receipt',
        responses: {
          200: {
            description: 'Latest decision receipt',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DecisionReceipt',
                },
              },
            },
          },
        },
      },
    },
    '/api/receipts': {
      get: {
        tags: ['Receipts'],
        summary: 'Get all decision receipts',
        description: 'Returns paginated list of all decision receipts',
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20 },
            description: 'Number of receipts to return',
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 },
            description: 'Offset for pagination',
          },
        ],
        responses: {
          200: {
            description: 'List of decision receipts',
          },
        },
      },
    },
    '/api/model/performance': {
      get: {
        tags: ['AI'],
        summary: 'Get AI model performance metrics',
        description: 'Returns current neural network performance statistics',
        responses: {
          200: {
            description: 'Model performance metrics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ModelPerformance',
                },
              },
            },
          },
        },
      },
    },
    '/api/model/retrain': {
      post: {
        tags: ['AI'],
        summary: 'Retrain AI model',
        description: 'Triggers a retraining of the neural network',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  samples: { type: 'integer', minimum: 100, maximum: 10000 },
                  epochs: { type: 'integer', minimum: 10, maximum: 1000 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Model retraining completed',
          },
        },
      },
    },
    '/api/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics summary',
        description: 'Returns comprehensive analytics and statistics',
        responses: {
          200: {
            description: 'Analytics summary',
          },
        },
      },
    },
    '/api/reset': {
      post: {
        tags: ['Control'],
        summary: 'Reset system',
        description: 'Resets the system to initial state',
        responses: {
          200: {
            description: 'System reset successfully',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Node: {
        type: 'object',
        properties: {
          nodeId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Testfire Bank' },
          port: { type: 'integer', example: 4001 },
          location: { type: 'string', example: 'US Server (Primary)' },
          status: { type: 'string', enum: ['HEALTHY', 'WARNING', 'CRITICAL'], example: 'HEALTHY' },
          health: { type: 'integer', minimum: 0, maximum: 100, example: 95 },
          latency: { type: 'number', example: 45 },
          cpuUsage: { type: 'number', example: 25 },
          memoryUsage: { type: 'number', example: 30 },
          requestsPerSecond: { type: 'number', example: 12.5 },
          errorRate: { type: 'number', example: 0.5 },
          traffic: { type: 'integer', minimum: 0, maximum: 100, example: 60 },
          isUnderAttack: { type: 'boolean', example: false },
          attackType: { type: 'string', nullable: true },
        },
      },
      NodeDetails: {
        allOf: [
          { $ref: '#/components/schemas/Node' },
          {
            type: 'object',
            properties: {
              latencyHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'number' },
                    value: { type: 'number' },
                  },
                },
              },
              metrics: {
                type: 'object',
                properties: {
                  cpu: { type: 'number' },
                  memory: { type: 'number' },
                  disk: { type: 'number' },
                  network: { type: 'number' },
                },
              },
            },
          },
        ],
      },
      SystemState: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          nodes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Node' },
          },
          mode: { type: 'string', enum: ['AI', 'Manual'] },
          environment: { type: 'string', enum: ['INTERNAL', 'EXTERNAL'] },
          incident: { $ref: '#/components/schemas/Incident' },
          stats: { $ref: '#/components/schemas/Stats' },
          modelPerformance: { $ref: '#/components/schemas/ModelPerformance' },
          timestamp: { type: 'number' },
        },
      },
      Incident: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          state: { type: 'string' },
          sourceNodeId: { type: 'integer' },
          targetNodeId: { type: 'integer' },
          confidence: { type: 'number' },
          detectedAt: { type: 'number' },
          resolvedAt: { type: 'number', nullable: true },
        },
      },
      DecisionReceipt: {
        type: 'object',
        properties: {
          receiptId: { type: 'string' },
          timestamp: { type: 'number' },
          decision: {
            type: 'object',
            properties: {
              fromNodeId: { type: 'integer' },
              toNodeId: { type: 'integer' },
              confidence: { type: 'number' },
              reasons: { type: 'array', items: { type: 'string' } },
            },
          },
          outcome: { type: 'string' },
          verification: { type: 'object' },
        },
      },
      ModelPerformance: {
        type: 'object',
        properties: {
          accuracy: { type: 'number', example: 98.5 },
          precision: { type: 'number', example: 99.2 },
          recall: { type: 'number', example: 98.8 },
          f1Score: { type: 'number', example: 99.0 },
          totalDecisions: { type: 'integer', example: 1250 },
          correctDecisions: { type: 'integer', example: 1231 },
        },
      },
      Settings: {
        type: 'object',
        properties: {
          alertThreshold: { type: 'number', example: 300 },
          detectionSensitivity: { type: 'number', example: 0.85 },
          refreshIntervalSec: { type: 'number', example: 2 },
          webhookUrl: { type: 'string', nullable: true },
          slackNotifications: { type: 'boolean', example: false },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          attacksDetected: { type: 'integer' },
          attacksBlocked: { type: 'integer' },
          totalReroutes: { type: 'integer' },
          avgResponseTime: { type: 'number' },
          uptime: { type: 'number' },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
};

export default swaggerDocument;

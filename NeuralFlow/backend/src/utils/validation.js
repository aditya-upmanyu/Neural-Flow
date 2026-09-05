// backend/src/utils/validation.js
// Request validation schemas for all API endpoints

export const schemas = {
  // Attack simulation
  startAttack: {
    nodeId: {
      required: true,
      type: 'number',
      min: 1,
      max: 10,
    },
    intensity: {
      required: true,
      type: 'number',
      min: 1,
      max: 100,
    },
    attackType: {
      required: false,
      type: 'enum',
      values: ['TrafficSpike', 'DDoS', 'SlowLoris', 'HTTPFlood', 'MemoryLeak'],
    },
    duration: {
      required: false,
      type: 'number',
      min: 5,
      max: 300,
    },
  },

  // Mode switch
  mode: {
    mode: {
      required: true,
      type: 'enum',
      values: ['AI', 'Manual'],
    },
  },

  // Environment switch
  environment: {
    environment: {
      required: true,
      type: 'enum',
      values: ['INTERNAL', 'EXTERNAL'],
    },
  },

  // Settings update
  settings: {
    alertThreshold: {
      required: false,
      type: 'number',
      min: 50,
      max: 2000,
    },
    detectionSensitivity: {
      required: false,
      type: 'number',
      min: 0.1,
      max: 1.0,
    },
    refreshIntervalSec: {
      required: false,
      type: 'number',
      min: 1,
      max: 60,
    },
    webhookUrl: {
      required: false,
      type: 'string',
      maxLength: 500,
      pattern: /^https?:\/\/.+/,
    },
    slackNotifications: {
      required: false,
      type: 'boolean',
    },
  },

  // Manual reroute
  manualReroute: {
    fromNodeId: {
      required: true,
      type: 'number',
      min: 1,
    },
    toNodeId: {
      required: true,
      type: 'number',
      min: 1,
    },
    reason: {
      required: false,
      type: 'string',
      maxLength: 500,
    },
  },

  // Traffic adjustment
  adjustTraffic: {
    nodeId: {
      required: true,
      type: 'number',
      min: 1,
    },
    traffic: {
      required: true,
      type: 'number',
      min: 0,
      max: 100,
    },
  },

  // Model retraining
  retrain: {
    samples: {
      required: false,
      type: 'number',
      min: 100,
      max: 10000,
    },
    epochs: {
      required: false,
      type: 'number',
      min: 10,
      max: 1000,
    },
  },

  // Benchmark
  benchmark: {
    duration: {
      required: false,
      type: 'number',
      min: 5,
      max: 300,
    },
    intensity: {
      required: false,
      type: 'number',
      min: 1,
      max: 100,
    },
  },

  // Webhook test
  webhookTest: {
    url: {
      required: true,
      type: 'string',
      maxLength: 500,
      pattern: /^https?:\/\/.+/,
    },
    payload: {
      required: false,
      type: 'object',
    },
  },
};

// Validation helper function
export function validateRequest(schema, data) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip further validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors[field] = `${field} must be a number`;
        continue;
      }

      if (rules.min !== undefined && num < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`;
      } else if (rules.max !== undefined && num > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`;
      }
    }

    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors[field] = `${field} must be a string`;
        continue;
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} has invalid format`;
      }
    }

    if (rules.type === 'enum') {
      if (!rules.values.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.values.join(', ')}`;
      }
    }

    if (rules.type === 'boolean') {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        errors[field] = `${field} must be a boolean`;
      }
    }

    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors[field] = `${field} must be an array`;
        continue;
      }

      if (rules.minItems && value.length < rules.minItems) {
        errors[field] = `${field} must have at least ${rules.minItems} items`;
      } else if (rules.maxItems && value.length > rules.maxItems) {
        errors[field] = `${field} must have at most ${rules.maxItems} items`;
      }
    }

    if (rules.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors[field] = `${field} must be an object`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Middleware factory for validation
export function validateMiddleware(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next();
    }

    const { valid, errors } = validateRequest(schema, req.body);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
}

export default {
  schemas,
  validateRequest,
  validateMiddleware,
};

// Central validation utility for NFV5 data contracts
// All external inputs and internal data structures must be validated

export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Validate object against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @param {string} context - Context for error messages
 * @returns {object} - Validated data
 * @throws {ValidationError}
 */
export function validate(data, schema, context = 'data') {
  if (!data || typeof data !== 'object') {
    throw new ValidationError(`${context} must be an object`, context, data);
  }

  const validated = {};
  const errors = [];

  // Check required fields
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${context}.${field} is required`);
      continue;
    }

    // Optional field not present - skip
    if (value === undefined || value === null) {
      if (rules.default !== undefined) {
        validated[field] = rules.default;
      }
      continue;
    }

    // Type check
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${context}.${field} must be type ${rules.type}, got ${actualType}`);
        continue;
      }
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${context}.${field} must be one of [${rules.enum.join(', ')}], got ${value}`);
      continue;
    }

    // Range check for numbers
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${context}.${field} must be >= ${rules.min}, got ${value}`);
        continue;
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${context}.${field} must be <= ${rules.max}, got ${value}`);
        continue;
      }
    }

    // String length check
    if (rules.type === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`${context}.${field} length must be >= ${rules.minLength}`);
        continue;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`${context}.${field} length must be <= ${rules.maxLength}`);
        continue;
      }
    }

    // Array validation
    if (rules.type === 'array' && rules.items) {
      try {
        validated[field] = value.map((item, idx) =>
          validate(item, rules.items, `${context}.${field}[${idx}]`)
        );
      } catch (err) {
        errors.push(err.message);
      }
      continue;
    }

    // Nested object validation
    if (rules.type === 'object' && rules.schema) {
      try {
        validated[field] = validate(value, rules.schema, `${context}.${field}`);
      } catch (err) {
        errors.push(err.message);
      }
      continue;
    }

    // Custom validator
    if (rules.validator) {
      try {
        if (!rules.validator(value)) {
          errors.push(`${context}.${field} failed custom validation`);
          continue;
        }
      } catch (err) {
        errors.push(`${context}.${field} validator threw error: ${err.message}`);
        continue;
      }
    }

    validated[field] = value;
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Validation failed for ${context}: ${errors.join('; ')}`,
      context,
      data
    );
  }

  return validated;
}

/**
 * Validate telemetry freshness
 * @param {number} timestamp - Telemetry timestamp
 * @param {number} maxAgeMs - Maximum allowed age in milliseconds
 * @returns {boolean}
 */
export function isFresh(timestamp, maxAgeMs = 5000) {
  return Date.now() - timestamp <= maxAgeMs;
}

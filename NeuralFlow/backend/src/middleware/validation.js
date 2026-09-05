// validation.js - Input validation middleware for API endpoints
// Prevents crashes and undefined behavior from invalid inputs

function validateMode(req, res, next) {
  const { mode } = req.body;
  const validModes = ['AI', 'MANUAL'];
  
  if (!mode || !validModes.includes(mode)) {
    return res.status(400).json({
      error: 'Invalid mode',
      message: `Mode must be one of: ${validModes.join(', ')}`,
      received: mode
    });
  }
  
  next();
}

function validateAttackParams(req, res, next) {
  const { nodeId, attackType, intensity } = req.body;
  
  // Validate required fields
  if (nodeId === undefined || nodeId === null) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'nodeId is required'
    });
  }
  
  if (!attackType) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'attackType is required'
    });
  }
  
  // Validate types and ranges
  if (typeof nodeId !== 'number' || nodeId < 1) {
    return res.status(400).json({
      error: 'Invalid nodeId',
      message: 'nodeId must be a positive number'
    });
  }
  
  const validAttackTypes = ['TrafficSpike', 'DDoS', 'MemoryLeak'];
  if (!validAttackTypes.includes(attackType)) {
    return res.status(400).json({
      error: 'Invalid attackType',
      message: `attackType must be one of: ${validAttackTypes.join(', ')}`
    });
  }
  
  if (intensity !== undefined) {
    if (typeof intensity !== 'number' || intensity < 1 || intensity > 10000) {
      return res.status(400).json({
        error: 'Invalid intensity',
        message: 'intensity must be a number between 1 and 10000'
      });
    }
  }
  
  next();
}

export { validateMode, validateAttackParams };

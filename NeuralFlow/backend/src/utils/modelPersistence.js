// backend/src/utils/modelPersistence.js
// Neural network model persistence and versioning

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../../models');
const CURRENT_MODEL_PATH = path.join(MODELS_DIR, 'current_model.json');
const MODEL_HISTORY_PATH = path.join(MODELS_DIR, 'model_history.json');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

/**
 * Save trained neural network model to disk
 */
export function saveModel(neuralAgent, metadata = {}) {
  try {
    const modelData = {
      version: metadata.version || '1.0.0',
      timestamp: Date.now(),
      architecture: {
        inputSize: neuralAgent.inputSize,
        hiddenSize: neuralAgent.hiddenSize,
        outputSize: neuralAgent.outputSize,
      },
      weights: {
        weightsInputHidden: Array.from(neuralAgent.weightsInputHidden),
        weightsHiddenOutput: Array.from(neuralAgent.weightsHiddenOutput),
        biasHidden: Array.from(neuralAgent.biasHidden),
        biasOutput: Array.from(neuralAgent.biasOutput),
      },
      performance: {
        accuracy: neuralAgent.accuracy,
        precision: neuralAgent.precision,
        recall: neuralAgent.recall,
        f1Score: neuralAgent.f1Score,
      },
      training: {
        epochs: metadata.epochs || 'unknown',
        samples: metadata.samples || 'unknown',
        learningRate: neuralAgent.learningRate,
        finalError: metadata.finalError || 'unknown',
      },
      metadata: {
        trainedAt: new Date().toISOString(),
        trainingDuration: metadata.duration || 'unknown',
        datasetSplit: metadata.datasetSplit || 'unknown',
      },
    };

    // Save current model
    fs.writeFileSync(CURRENT_MODEL_PATH, JSON.stringify(modelData, null, 2), 'utf8');

    // Update model history
    updateModelHistory(modelData);

    logger.info('Neural network model saved successfully', {
      component: 'ModelPersistence',
      data: {
        version: modelData.version,
        accuracy: modelData.performance.accuracy,
        path: CURRENT_MODEL_PATH,
      },
    });

    return { success: true, path: CURRENT_MODEL_PATH, version: modelData.version };
  } catch (error) {
    logger.logError('Failed to save neural network model', error, {
      component: 'ModelPersistence',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Load saved neural network model from disk
 */
export function loadModel() {
  try {
    if (!fs.existsSync(CURRENT_MODEL_PATH)) {
      logger.warn('No saved model found', {
        component: 'ModelPersistence',
        data: { path: CURRENT_MODEL_PATH },
      });
      return { success: false, error: 'No saved model found' };
    }

    const modelData = JSON.parse(fs.readFileSync(CURRENT_MODEL_PATH, 'utf8'));

    logger.info('Neural network model loaded successfully', {
      component: 'ModelPersistence',
      data: {
        version: modelData.version,
        accuracy: modelData.performance.accuracy,
        trainedAt: modelData.metadata.trainedAt,
      },
    });

    return { success: true, modelData };
  } catch (error) {
    logger.logError('Failed to load neural network model', error, {
      component: 'ModelPersistence',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Restore model weights to a NeuralAgent instance
 */
export function restoreModelWeights(neuralAgent, modelData) {
  try {
    // Validate architecture compatibility
    if (
      modelData.architecture.inputSize !== neuralAgent.inputSize ||
      modelData.architecture.hiddenSize !== neuralAgent.hiddenSize ||
      modelData.architecture.outputSize !== neuralAgent.outputSize
    ) {
      throw new Error('Model architecture mismatch');
    }

    // Restore weights
    neuralAgent.weightsInputHidden = Float64Array.from(modelData.weights.weightsInputHidden);
    neuralAgent.weightsHiddenOutput = Float64Array.from(modelData.weights.weightsHiddenOutput);
    neuralAgent.biasHidden = Float64Array.from(modelData.weights.biasHidden);
    neuralAgent.biasOutput = Float64Array.from(modelData.weights.biasOutput);

    // Restore performance metrics
    neuralAgent.accuracy = modelData.performance.accuracy;
    neuralAgent.precision = modelData.performance.precision;
    neuralAgent.recall = modelData.performance.recall;
    neuralAgent.f1Score = modelData.performance.f1Score;

    neuralAgent.isTrained = true;

    logger.info('Model weights restored to NeuralAgent', {
      component: 'ModelPersistence',
      data: {
        version: modelData.version,
        accuracy: modelData.performance.accuracy,
      },
    });

    return { success: true };
  } catch (error) {
    logger.logError('Failed to restore model weights', error, {
      component: 'ModelPersistence',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Update model history with new version
 */
function updateModelHistory(modelData) {
  try {
    let history = [];

    if (fs.existsSync(MODEL_HISTORY_PATH)) {
      history = JSON.parse(fs.readFileSync(MODEL_HISTORY_PATH, 'utf8'));
    }

    // Add new model to history
    history.push({
      version: modelData.version,
      timestamp: modelData.timestamp,
      accuracy: modelData.performance.accuracy,
      f1Score: modelData.performance.f1Score,
      trainedAt: modelData.metadata.trainedAt,
    });

    // Keep only last 20 models in history
    if (history.length > 20) {
      history = history.slice(-20);
    }

    fs.writeFileSync(MODEL_HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    logger.error('Failed to update model history', {
      component: 'ModelPersistence',
      error: error.message,
    });
  }
}

/**
 * Get model training history
 */
export function getModelHistory() {
  try {
    if (!fs.existsSync(MODEL_HISTORY_PATH)) {
      return { success: true, history: [] };
    }

    const history = JSON.parse(fs.readFileSync(MODEL_HISTORY_PATH, 'utf8'));
    return { success: true, history };
  } catch (error) {
    logger.logError('Failed to get model history', error, {
      component: 'ModelPersistence',
    });
    return { success: false, error: error.message, history: [] };
  }
}

/**
 * Export model for external use
 */
export function exportModel(format = 'json') {
  try {
    const { success, modelData } = loadModel();
    if (!success) {
      return { success: false, error: 'No model to export' };
    }

    const exportPath = path.join(MODELS_DIR, `export_${Date.now()}.${format}`);

    if (format === 'json') {
      fs.writeFileSync(exportPath, JSON.stringify(modelData, null, 2), 'utf8');
    } else {
      return { success: false, error: 'Unsupported export format' };
    }

    logger.info('Model exported successfully', {
      component: 'ModelPersistence',
      data: { path: exportPath, format },
    });

    return { success: true, path: exportPath };
  } catch (error) {
    logger.logError('Failed to export model', error, {
      component: 'ModelPersistence',
    });
    return { success: false, error: error.message };
  }
}

export default {
  saveModel,
  loadModel,
  restoreModelWeights,
  getModelHistory,
  exportModel,
};

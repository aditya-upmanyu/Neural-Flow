// agentML.js - Real Neural Network for Attack Prediction using Brain.js
// V4: Proper held-out test split with seeded PRNG for reproducibility
import brain from 'brain.js';

// Seeded PRNG (Linear Congruential Generator) for reproducible dataset splits
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

class NeuralAgent {
  constructor() {
    this.net = new brain.NeuralNetwork({
      hiddenLayers: [12, 8, 6],
      activation: 'leaky-relu',
      learningRate: 0.01
    });
    
    // V5: Model and dataset versioning
    this.modelVersion = 'NF-ML-v5-NFV5';
    this.datasetVersion = 'synthetic-v1';
    this.modelTimestamp = null;
    
    this.isTraining = false;
    this.isTrained = false;
    this.trainingProgress = 0;
    this.accuracy = 0;
    this.precision = 0;
    this.recall = 0;
    this.f1Score = 0;
    this.falsePositiveRate = 0;  // V4: FPR
    this.falseNegativeRate = 0;  // V4: FNR
    this.predictionCount = 0;
    this.correctPredictions = 0;
    this.lastTrainingError = 0;
    this.lastConfidence = 0; // V4: Store last prediction confidence for safety gate
    this.trainingHistory = []; // For loss curve visualization
    this.predictionHistory = []; // Last N predictions
    this.featureImportance = {}; // Cached feature importance
    
    // V4: Evaluation fields
    this.mlEvaluation = null; // Full held-out test evaluation object
    this.datasetSeed = 42;    // Reproducible seed
    this.confusionMatrix = {  // V4: Full confusion matrix
      truePositives: 0,
      trueNegatives: 0,
      falsePositives: 0,
      falseNegatives: 0
    };
    
    // V5: Abstention threshold for low-confidence predictions
    this.confidenceThreshold = 0.65; // Below this = ABSTAIN
    this.minAutonomousConfidence = 0.80; // For autonomous actions
    
    // V5: Real-world evaluation data store
    this.realWorldSamples = []; // Collected from realWebsiteMonitor
    this.realWorldEvaluation = null; // Separate evaluation on real data
    
    // V5: Baseline model for comparison
    this.baselineModel = null;
    this.baselineEvaluation = null;
    
    // V5: Calibration data
    this.calibrationData = null;
    
    // V5: Cross-validation results
    this.cvResults = null;
  }

  // Generate synthetic training data with seeded RNG for reproducibility
  // V5: FIXED - Decoupled feature generation from label to prevent feature leakage
  generateTrainingData(samples = 500, seed = 42) {
    const data = [];
    const rng = seededRandom(seed); // V4: Use seeded RNG instead of Math.random()
    
    for (let i = 0; i < samples; i++) {
      // Step 1: Generate base features INDEPENDENTLY (no label dependency)
      const baseLatency = rng(); // 0-1 range
      const baseError = rng(); // 0-1 range
      const baseQueue = rng(); // 0-1 range
      const baseCpu = rng(); // 0-1 range
      const baseMemory = rng() * 0.8 + 0.2; // 0.2-1.0 range
      const baseRps = rng(); // 0-1 range
      const timeOfDay = rng(); // 0-1 range
      
      // Step 2: Generate trend features based on base metrics, NOT on label
      // Trend should reflect recent changes, not future knowledge
      const latencyTrend = baseLatency > 0.5 ? baseLatency * 0.8 : baseLatency * 0.4;
      const errorTrend = baseError > 0.3 ? baseError * 0.7 : baseError * 0.3;
      
      // Step 3: Derive label from features (not the other way around)
      // Attack conditions: high latency + high errors + high queue/CPU
      const attackScore = (baseLatency * 0.3) + (baseError * 0.3) + (baseQueue * 0.2) + (baseCpu * 0.2);
      const isAttack = attackScore > 0.6; // Attack if composite score is high
      
      // Step 4: Add some noise to make it realistic (not perfectly correlated)
      const noise = (rng() - 0.5) * 0.1; // ±5% noise
      const finalLatency = Math.max(0, Math.min(1, baseLatency + noise));
      const finalError = Math.max(0, Math.min(1, baseError + noise));
      
      data.push({
        input: {
          latency: finalLatency,
          errorRate: finalError,
          queueSize: baseQueue,
          cpuUsage: baseCpu,
          memoryUsage: baseMemory,
          requestsPerSecond: baseRps,
          timeOfDay: timeOfDay,
          latencyTrend: latencyTrend,
          errorTrend: errorTrend
        },
        output: {
          normal: isAttack ? 0.1 : 0.9,
          warning: isAttack ? 0.2 : 0.1,
          critical: isAttack ? 0.7 : 0
        }
      });
    }
    
    return data;
  }

  // V4: Split dataset into train/val/test (70/15/15) with seeded shuffle
  generateSplitDataset(totalSamples = 500, seed = 42) {
    const rng = seededRandom(seed);
    
    // Generate full dataset
    const fullData = this.generateTrainingData(totalSamples, seed);
    
    // Shuffle using seeded RNG (Fisher-Yates shuffle)
    for (let i = fullData.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [fullData[i], fullData[j]] = [fullData[j], fullData[i]];
    }
    
    // Split: 70% train, 15% validation, 15% test
    const trainSize = Math.floor(totalSamples * 0.70);
    const valSize = Math.floor(totalSamples * 0.15);
    
    const trainSet = fullData.slice(0, trainSize);
    const valSet = fullData.slice(trainSize, trainSize + valSize);
    const testSet = fullData.slice(trainSize + valSize);
    
    return {
      trainSet,
      valSet,
      testSet,
      metadata: {
        totalSamples,
        seed,
        splits: { train: trainSize, val: valSize, test: testSet.length }
      }
    };
  }

  // V5: Train with proper train/val/test split - NEVER evaluate on training data
  async trainModel(samples = 500, iterations = 2000, seed = 42) {
    console.log(`🧠 [V5] Starting neural network training with ${samples} samples (seed: ${seed})...`);
    this.isTraining = true;
    this.trainingProgress = 0;
    this.trainingHistory = [];
    this.datasetSeed = seed;
    
    // Generate split dataset (70% train, 15% val, 15% test)
    const { trainSet, valSet, testSet, metadata } = this.generateSplitDataset(samples, seed);
    
    console.log(`📊 Dataset split - Train: ${trainSet.length}, Val: ${valSet.length}, Test: ${testSet.length} (HELD-OUT)`);
    
    return new Promise((resolve) => {
      // Train ONLY on trainSet - testSet never seen during training
      this.net.trainAsync(trainSet, {
        iterations: iterations,
        errorThresh: 0.005,
        log: true,
        logPeriod: 100,
        learningRate: 0.01,
        callback: (stats) => {
          this.trainingProgress = (stats.iterations / iterations) * 100;
          this.lastTrainingError = stats.error;
          this.trainingHistory.push({
            iteration: stats.iterations,
            error: stats.error
          });
          
          if (stats.iterations % 500 === 0) {
            console.log(`Training progress: ${this.trainingProgress.toFixed(1)}% - Error: ${stats.error.toFixed(6)}`);
          }
        }
      }).then(result => {
        this.isTraining = false;
        this.isTrained = true;
        this.trainingProgress = 100;
        this.modelTimestamp = Date.now(); // V5: Record when model was trained
        
        // V4: Calculate accuracy on HELD-OUT TEST SET (never seen during training)
        this.calculateAccuracy(testSet);
        
        // V5: Store full evaluation result with versioning
        this.mlEvaluation = {
          modelVersion: this.modelVersion, // V5: Use instance version
          datasetVersion: this.datasetVersion, // V5
          seed: seed,
          timestamp: new Date().toISOString(),
          timestampMs: this.modelTimestamp, // V5
          trainSamples: trainSet.length,
          validationSamples: valSet.length,
          testSamples: testSet.length,
          evaluationSet: 'HELD_OUT_TEST', // Critical label
          trainingIterations: iterations,
          finalTrainingError: result.error,
          
          // ═══════════════════════════════════════════════════════════════
          // ⚠️  [SYNTHETIC EVAL] CRITICAL DISCLOSURE
          // ═══════════════════════════════════════════════════════════════
          // This model is trained and evaluated on SYNTHETIC DATA ONLY.
          // 
          // Data Source: Programmatically generated with seeded PRNG
          // Feature Generation: Based on statistical distributions, not real traffic
          // Attack Scenarios: Simulated based on assumptions about attack patterns
          // 
          // LIMITATIONS:
          // 1. Real-world generalization is UNTESTED
          // 2. May not capture complex production failure modes
          // 3. Feature correlations are synthetic approximations
          // 4. No real adversarial testing performed
          // 
          // USE CASE: Demonstration and proof-of-concept only
          // PRODUCTION USE: Requires retraining on real telemetry data
          // ═══════════════════════════════════════════════════════════════
          SYNTHETIC_DATA_WARNING: {
            isSyntheticData: true,
            realWorldTested: false,
            warning: 'Model trained on synthetic data only. Real-world performance may differ significantly.',
            limitations: [
              'No real production traffic data used',
              'Feature distributions are statistical approximations',
              'Attack patterns based on assumptions not real observations',
              'Generalization to real systems is unverified'
            ],
            recommendation: 'Retrain on real telemetry for production deployment'
          },
          
          binaryEvaluation: {
            truePositives: this.confusionMatrix.truePositives,
            trueNegatives: this.confusionMatrix.trueNegatives,
            falsePositives: this.confusionMatrix.falsePositives,
            falseNegatives: this.confusionMatrix.falseNegatives,
            accuracy: this.accuracy,
            precision: this.precision,
            recall: this.recall,
            f1: this.f1Score,
            falsePositiveRate: this.falsePositiveRate,
            falseNegativeRate: this.falseNegativeRate,
            confusionMatrix: { ...this.confusionMatrix },
          },
          
          // V5: Configuration
          confidenceThreshold: this.confidenceThreshold,
          minAutonomousConfidence: this.minAutonomousConfidence,
          
          disclaimer: '⚠️ SYNTHETIC CONTROLLED EVALUATION — NOT PRODUCTION DATA ⚠️'
        };
        
        console.log(`✅ Training complete! Error: ${result.error.toFixed(6)}`);
        console.log(`📈 [V5 HELD-OUT TEST] Accuracy: ${this.accuracy.toFixed(2)}%, Precision: ${this.precision.toFixed(2)}%, Recall: ${this.recall.toFixed(2)}%, F1: ${this.f1Score.toFixed(2)}%`);
        console.log(`   FPR: ${this.falsePositiveRate.toFixed(2)}%, FNR: ${this.falseNegativeRate.toFixed(2)}%`);
        
        // V5: Run baseline comparison and calibration
        console.log('\n🔬 Running additional evaluations...');
        this.trainBaseline(testSet);
        this.calculateCalibration(testSet);
        
        resolve(result);
      });
    });
  }

  // V4: Calculate model accuracy, precision, recall, F1, FPR, FNR on held-out test set
  calculateAccuracy(testData) {
    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    testData.forEach(sample => {
      // sample.input is ALREADY normalized (0-1 range) — run the network
      // directly on it. Do NOT call this.predict() here, because predict()
      // re-normalizes raw metrics internally and would double-normalize
      // already-normalized data, corrupting every feature toward zero.
      const result = this.net.run(sample.input);
      const attackProbability = result.critical;
      const confidence = Math.max(result.normal, result.warning, result.critical);
      let classification = 'NORMAL';
      if (result.critical > 0.6) classification = 'CRITICAL';
      else if (result.warning > 0.4 || result.critical > 0.3) classification = 'WARNING';
      const prediction = { attackProbability, confidence, classification };
      const actualClass = Object.keys(sample.output).reduce((a, b) => 
        sample.output[a] > sample.output[b] ? a : b
      );
      const predictedClass = prediction.classification;
      
      // Binary classification: attack (critical/warning) vs normal
      const actualIsAttack = actualClass === 'critical' || actualClass === 'warning';
      const predictedIsAttack = predictedClass === 'CRITICAL' || predictedClass === 'WARNING';
      
      // Exact match
      if ((actualClass === 'critical' && predictedClass === 'CRITICAL') ||
          (actualClass === 'warning' && predictedClass === 'WARNING') ||
          (actualClass === 'normal' && predictedClass === 'NORMAL')) {
        correct++;
      }
      
      // Calculate confusion matrix for binary classification
      if (actualIsAttack && predictedIsAttack) {
        truePositives++;
      } else if (!actualIsAttack && predictedIsAttack) {
        falsePositives++;
      } else if (!actualIsAttack && !predictedIsAttack) {
        trueNegatives++;
      } else if (actualIsAttack && !predictedIsAttack) {
        falseNegatives++;
      }
    });
    
    // Store confusion matrix
    this.confusionMatrix = {
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives
    };
    
    this.accuracy = (correct / testData.length) * 100;
    
    // Calculate precision, recall, F1 (binary classification)
    this.precision = truePositives / (truePositives + falsePositives) * 100 || 0;
    this.recall = truePositives / (truePositives + falseNegatives) * 100 || 0;
    this.f1Score = 2 * (this.precision * this.recall) / (this.precision + this.recall) || 0;
    
    // V4: False positive rate: FP / (FP + TN) - "false alarm rate"
    this.falsePositiveRate = (falsePositives / (falsePositives + trueNegatives)) * 100 || 0;
    
    // V4: False negative rate: FN / (FN + TP) - "miss rate"
    this.falseNegativeRate = (falseNegatives / (falseNegatives + truePositives)) * 100 || 0;
  }

  // Normalize metrics to 0-1 range for neural network input
  normalizeMetrics(metrics) {
    return {
      latency: Math.min(metrics.latency / 1000, 1), // 0-1000ms -> 0-1
      errorRate: metrics.errorRate / 100, // 0-100% -> 0-1
      queueSize: Math.min(metrics.queueSize / 100, 1), // 0-100 -> 0-1
      cpuUsage: metrics.cpuUsage / 100, // 0-100% -> 0-1
      memoryUsage: metrics.memoryUsage / 100, // 0-100% -> 0-1
      requestsPerSecond: Math.min(metrics.requestsPerSecond / 200, 1), // 0-200 -> 0-1
      timeOfDay: (new Date().getHours()) / 24, // 0-23 -> 0-1
      latencyTrend: Math.min(metrics.latencyTrend || 0, 1),
      errorTrend: Math.min(metrics.errorTrend || 0, 1)
    };
  }

  // Make a prediction - V5: implements abstention for low confidence
  predict(rawMetrics) {
    if (!this.isTrained) {
      return {
        attackProbability: 0,
        confidence: 0,
        classification: 'NORMAL',
        shouldAbstain: true,
        message: 'Model not trained yet'
      };
    }

    const normalized = this.normalizeMetrics(rawMetrics);
    const result = this.net.run(normalized);
    
    const attackProbability = result.critical;
    const confidence = Math.max(result.normal, result.warning, result.critical);
    
    // V4: Store confidence for safety gate
    this.lastConfidence = confidence;
    
    // V5: Abstention logic - low confidence = don't trust prediction
    const shouldAbstain = confidence < this.confidenceThreshold;
    const isAutonomousConfidence = confidence >= this.minAutonomousConfidence;
    
    let classification = 'NORMAL';
    if (result.critical > 0.6) {
      classification = 'CRITICAL';
    } else if (result.warning > 0.4 || result.critical > 0.3) {
      classification = 'WARNING';
    }
    
    this.predictionCount++;
    
    // Store prediction in history
    this.predictionHistory.unshift({
      timestamp: Date.now(),
      classification,
      confidence,
      attackProbability,
      metrics: rawMetrics,
      shouldAbstain, // V5
      isAutonomousConfidence, // V5
    });
    
    // Keep last 100 predictions
    if (this.predictionHistory.length > 100) {
      this.predictionHistory = this.predictionHistory.slice(0, 100);
    }
    
    return {
      attackProbability: attackProbability,
      confidence: confidence,
      classification: classification,
      shouldAbstain, // V5: Signal that confidence is too low
      isAutonomousConfidence, // V5: Signal if suitable for autonomous action
      probabilities: {
        normal: result.normal,
        warning: result.warning,
        critical: result.critical
      },
      message: this.getClassificationMessage(classification, attackProbability, shouldAbstain)
    };
  }

  getClassificationMessage(classification, probability, shouldAbstain = false) {
    if (shouldAbstain) {
      return `⚠️ LOW CONFIDENCE - Abstaining from decision (${(probability * 100).toFixed(1)}%)`;
    }
    if (classification === 'CRITICAL') {
      return `⚠️ ATTACK DETECTED - ${(probability * 100).toFixed(1)}% confidence`;
    } else if (classification === 'WARNING') {
      return `⚡ WARNING - Elevated threat level ${(probability * 100).toFixed(1)}%`;
    }
    return '✅ NORMAL - All systems healthy';
  }

  // Feature attribution (SHAP-like) - shows which metrics drove the decision
  getFeatureAttribution(metrics) {
    if (!this.isTrained) {
      return {};
    }

    const normalized = this.normalizeMetrics(metrics);
    const baseline = this.net.run({
      latency: 0.3,
      errorRate: 0.05,
      queueSize: 0.3,
      cpuUsage: 0.4,
      memoryUsage: 0.5,
      requestsPerSecond: 0.4,
      timeOfDay: 0.5,
      latencyTrend: 0.2,
      errorTrend: 0.1
    });

    const baseCritical = baseline.critical;
    const contributions = {};

    // Test impact of each feature by setting it to current value
    const features = Object.keys(normalized);
    features.forEach(feature => {
      const testInput = {
        latency: 0.3,
        errorRate: 0.05,
        queueSize: 0.3,
        cpuUsage: 0.4,
        memoryUsage: 0.5,
        requestsPerSecond: 0.4,
        timeOfDay: 0.5,
        latencyTrend: 0.2,
        errorTrend: 0.1
      };
      testInput[feature] = normalized[feature];
      
      const result = this.net.run(testInput);
      contributions[feature] = Math.abs(result.critical - baseCritical);
    });

    // Normalize to percentages
    const total = Object.values(contributions).reduce((a, b) => a + b, 0);
    Object.keys(contributions).forEach(key => {
      contributions[key] = (contributions[key] / total) * 100;
    });

    return contributions;
  }

  // Get feature importance (averaged across many samples)
  getFeatureImportance() {
    if (!this.isTrained) {
      return {};
    }
    
    // If cached and recent, return cached
    if (Object.keys(this.featureImportance).length > 0) {
      return this.featureImportance;
    }
    
    // Calculate feature importance by averaging attribution across random samples
    // Use seeded random for stable results
    const numSamples = 50;
    const aggregatedContributions = {};
    const rng = seededRandom(42); // Use same seed as training for consistency
    
    for (let i = 0; i < numSamples; i++) {
      const randomMetrics = {
        latency: rng() * 1000,
        errorRate: rng() * 50,
        queueSize: rng() * 100,
        cpuUsage: rng() * 100,
        memoryUsage: rng() * 100,
        requestsPerSecond: rng() * 200,
        latencyTrend: rng(),
        errorTrend: rng()
      };
      
      const attribution = this.getFeatureAttribution(randomMetrics);
      
      Object.keys(attribution).forEach(feature => {
        if (!aggregatedContributions[feature]) {
          aggregatedContributions[feature] = 0;
        }
        aggregatedContributions[feature] += attribution[feature];
      });
    }
    
    // Average
    Object.keys(aggregatedContributions).forEach(feature => {
      aggregatedContributions[feature] /= numSamples;
    });
    
    this.featureImportance = aggregatedContributions;
    return aggregatedContributions;
  }

  // Get last N predictions from history
  getPredictionHistory(n = 50) {
    return this.predictionHistory.slice(0, n);
  }

  // Online learning - update model with new confirmed attack
  async learnFromIncident(metrics, wasAttack) {
    if (!this.isTrained) return;

    const normalized = this.normalizeMetrics(metrics);
    const newSample = {
      input: normalized,
      output: {
        normal: wasAttack ? 0.1 : 0.9,
        warning: wasAttack ? 0.2 : 0.1,
        critical: wasAttack ? 0.7 : 0
      }
    };

    // Quick retrain with single sample (online learning)
    await this.net.trainAsync([newSample], {
      iterations: 50,
      errorThresh: 0.01
    });

    console.log(`🧠 Model updated with incident data (attack=${wasAttack})`);
  }

  // Export model weights as JSON
  exportModel() {
    if (!this.isTrained) {
      return null;
    }
    return this.net.toJSON();
  }

  // Import model weights from JSON
  importModel(json) {
    this.net.fromJSON(json);
    this.isTrained = true;
    console.log('✅ Model imported successfully');
  }

  // V5: Get model performance metrics including mlEvaluation and versioning
  getPerformanceMetrics() {
    return {
      // V5: Model identity
      modelVersion: this.modelVersion,
      datasetVersion: this.datasetVersion,
      modelTimestamp: this.modelTimestamp,
      
      // Training status
      isTrained: this.isTrained,
      isTraining: this.isTraining,
      trainingProgress: this.trainingProgress,
      
      // Evaluation metrics
      accuracy: this.accuracy,
      precision: this.precision,
      recall: this.recall,
      f1Score: this.f1Score,
      falsePositiveRate: this.falsePositiveRate,    // V4
      falseNegativeRate: this.falseNegativeRate,    // V4
      confusionMatrix: this.confusionMatrix,        // V4
      
      // Prediction stats
      predictionCount: this.predictionCount,
      lastTrainingError: this.lastTrainingError,
      trainingHistory: this.trainingHistory.slice(-50), // Last 50 points for chart
      
      // Feature analysis
      featureImportance: this.getFeatureImportance(),
      
      // V5: Thresholds
      confidenceThreshold: this.confidenceThreshold,
      minAutonomousConfidence: this.minAutonomousConfidence,
      
      // Full evaluation
      mlEvaluation: this.mlEvaluation,              // V4: Full evaluation object
      
      // V5: Synthetic data warning
      syntheticDataWarning: this.getSyntheticDataWarning(),
      
      // V5: Additional evaluations
      realWorldEvaluation: this.realWorldEvaluation,
      baselineComparison: this.baselineEvaluation,
      calibration: this.calibrationData,
      crossValidation: this.cvResults,
      
      status: this.isTrained ? 'Ready' : this.isTraining ? 'Training...' : 'Not Trained'
    };
  }
  
  // V5: Get synthetic data warning for UI display
  getSyntheticDataWarning() {
    return {
      isSynthetic: true,
      severity: 'WARNING',
      title: '⚠️ SYNTHETIC EVALUATION DATA',
      message: 'This AI model is trained and evaluated on synthetically generated data only. Real-world performance may differ significantly.',
      details: [
        'Training data: Computer-generated with statistical distributions',
        'Attack patterns: Simulated based on assumptions',
        'Real-world generalization: Untested',
        'Recommended: Retrain on real telemetry for production use'
      ],
      recommendedAction: 'Use for demonstration purposes only. Retrain with production data before deployment.'
    };
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // V5: REAL-WORLD EVALUATION & BASELINE COMPARISON
  // ══════════════════════════════════════════════════════════════════════════
  
  // Add real-world sample from actual monitoring
  addRealWorldSample(metrics, actualState) {
    const normalized = this.normalizeMetrics(metrics);
    const label = actualState === 'CRITICAL' || actualState === 'WARNING' ? 'attack' : 'normal';
    
    this.realWorldSamples.push({
      input: normalized,
      output: {
        normal: label === 'normal' ? 0.9 : 0.1,
        warning: label === 'attack' ? 0.2 : 0.1,
        critical: label === 'attack' ? 0.7 : 0
      },
      timestamp: Date.now(),
      actualState,
      rawMetrics: metrics
    });
    
    // Keep last 200 samples
    if (this.realWorldSamples.length > 200) {
      this.realWorldSamples.shift();
    }
    
    console.log(`📊 Real-world sample added (${label}). Total: ${this.realWorldSamples.length}`);
  }
  
  // Evaluate model on real-world samples (if available)
  evaluateOnRealWorld() {
    if (!this.isTrained || this.realWorldSamples.length < 10) {
      return {
        available: false,
        message: 'Insufficient real-world samples (need at least 10)',
        samplesCollected: this.realWorldSamples.length
      };
    }
    
    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    this.realWorldSamples.forEach(sample => {
      const result = this.net.run(sample.input);
      const prediction = result.critical > 0.6 ? 'CRITICAL' : 
                        (result.warning > 0.4 || result.critical > 0.3) ? 'WARNING' : 'NORMAL';
      
      const actualClass = Object.keys(sample.output).reduce((a, b) => 
        sample.output[a] > sample.output[b] ? a : b
      );
      
      const actualIsAttack = actualClass === 'critical' || actualClass === 'warning';
      const predictedIsAttack = prediction === 'CRITICAL' || prediction === 'WARNING';
      
      if ((actualClass === 'critical' && prediction === 'CRITICAL') ||
          (actualClass === 'warning' && prediction === 'WARNING') ||
          (actualClass === 'normal' && prediction === 'NORMAL')) {
        correct++;
      }
      
      if (actualIsAttack && predictedIsAttack) truePositives++;
      else if (!actualIsAttack && predictedIsAttack) falsePositives++;
      else if (!actualIsAttack && !predictedIsAttack) trueNegatives++;
      else if (actualIsAttack && !predictedIsAttack) falseNegatives++;
    });
    
    const accuracy = (correct / this.realWorldSamples.length) * 100;
    const precision = truePositives / (truePositives + falsePositives) * 100 || 0;
    const recall = truePositives / (truePositives + falseNegatives) * 100 || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    const fpr = (falsePositives / (falsePositives + trueNegatives)) * 100 || 0;
    const fnr = (falseNegatives / (falseNegatives + truePositives)) * 100 || 0;
    
    this.realWorldEvaluation = {
      available: true,
      sampleCount: this.realWorldSamples.length,
      accuracy,
      precision,
      recall,
      f1,
      falsePositiveRate: fpr,
      falseNegativeRate: fnr,
      confusionMatrix: { truePositives, trueNegatives, falsePositives, falseNegatives },
      dataSource: 'Real telemetry from monitored nodes',
      evaluatedAt: new Date().toISOString()
    };
    
    console.log(`📊 Real-world evaluation: Accuracy=${accuracy.toFixed(2)}%, F1=${f1.toFixed(2)}%`);
    
    return this.realWorldEvaluation;
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // V5: BASELINE MODEL (Simple Rule-Based Classifier)
  // ══════════════════════════════════════════════════════════════════════════
  
  // Train and evaluate a simple baseline for comparison
  trainBaseline(testData) {
    console.log('📊 Training baseline rule-based classifier...');
    
    // Simple threshold-based classifier
    // Rule: latency > 0.7 OR errorRate > 0.3 => ATTACK
    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    testData.forEach(sample => {
      const input = sample.input;
      
      // Simple rule: high latency or high error rate = attack
      const baselinePrediction = (input.latency > 0.7 || input.errorRate > 0.3) ? 'attack' : 'normal';
      
      const actualClass = Object.keys(sample.output).reduce((a, b) => 
        sample.output[a] > sample.output[b] ? a : b
      );
      const actualIsAttack = actualClass === 'critical' || actualClass === 'warning';
      const predictedIsAttack = baselinePrediction === 'attack';
      
      if ((actualIsAttack && predictedIsAttack) || (!actualIsAttack && !predictedIsAttack)) {
        correct++;
      }
      
      if (actualIsAttack && predictedIsAttack) truePositives++;
      else if (!actualIsAttack && predictedIsAttack) falsePositives++;
      else if (!actualIsAttack && !predictedIsAttack) trueNegatives++;
      else if (actualIsAttack && !predictedIsAttack) falseNegatives++;
    });
    
    const accuracy = (correct / testData.length) * 100;
    const precision = truePositives / (truePositives + falsePositives) * 100 || 0;
    const recall = truePositives / (truePositives + falseNegatives) * 100 || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    const fpr = (falsePositives / (falsePositives + trueNegatives)) * 100 || 0;
    const fnr = (falseNegatives / (falseNegatives + truePositives)) * 100 || 0;
    
    this.baselineEvaluation = {
      model: 'Rule-based threshold classifier',
      rule: 'latency > 0.7 OR errorRate > 0.3 => ATTACK',
      testSamples: testData.length,
      accuracy,
      precision,
      recall,
      f1,
      falsePositiveRate: fpr,
      falseNegativeRate: fnr,
      confusionMatrix: { truePositives, trueNegatives, falsePositives, falseNegatives }
    };
    
    // Calculate improvement over baseline
    const improvementAccuracy = this.accuracy - accuracy;
    const improvementF1 = this.f1Score - f1;
    
    console.log(`📊 Baseline: Accuracy=${accuracy.toFixed(2)}%, F1=${f1.toFixed(2)}%`);
    console.log(`🚀 Neural net improvement: +${improvementAccuracy.toFixed(2)}% accuracy, +${improvementF1.toFixed(2)}% F1`);
    
    return this.baselineEvaluation;
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // V5: TEMPORAL FEATURES (Sliding Window)
  // ══════════════════════════════════════════════════════════════════════════
  
  // Calculate temporal features from sliding window history
  calculateTemporalFeatures(history, windowSize = 5) {
    if (!history || history.length < 2) {
      return {
        mean: 0,
        std: 0,
        rateOfChange: 0
      };
    }
    
    const window = history.slice(-windowSize);
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    
    // Standard deviation
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
    const std = Math.sqrt(variance);
    
    // Rate of change (slope)
    const rateOfChange = window.length >= 2 ? 
      (window[window.length - 1] - window[0]) / window.length : 0;
    
    return { mean, std, rateOfChange };
  }
  
  // Enhanced prediction with temporal features
  predictWithTemporalFeatures(rawMetrics, latencyHistory = [], errorHistory = []) {
    const latencyTemporal = this.calculateTemporalFeatures(latencyHistory, 5);
    const errorTemporal = this.calculateTemporalFeatures(errorHistory, 5);
    
    // Create enhanced metrics with temporal features
    const enhancedMetrics = {
      ...rawMetrics,
      latencyMean: latencyTemporal.mean,
      latencyStd: latencyTemporal.std,
      latencyTrend: latencyTemporal.rateOfChange,
      errorMean: errorTemporal.mean,
      errorStd: errorTemporal.std,
      errorTrend: errorTemporal.rateOfChange
    };
    
    // For now, use existing prediction (temporal features will be added to training in next version)
    return this.predict(rawMetrics);
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // V5: CALIBRATION (Reliability Diagram & Brier Score)
  // ══════════════════════════════════════════════════════════════════════════
  
  // Calculate calibration metrics
  calculateCalibration(testData) {
    console.log('📊 Calculating model calibration...');
    
    const predictions = [];
    
    testData.forEach(sample => {
      const result = this.net.run(sample.input);
      const confidence = Math.max(result.normal, result.warning, result.critical);
      const prediction = result.critical > 0.6 ? 'CRITICAL' :
                        (result.warning > 0.4 || result.critical > 0.3) ? 'WARNING' : 'NORMAL';
      
      const actualClass = Object.keys(sample.output).reduce((a, b) => 
        sample.output[a] > sample.output[b] ? a : b
      );
      
      const actualIsAttack = actualClass === 'critical' || actualClass === 'warning';
      const predictedIsAttack = prediction === 'CRITICAL' || prediction === 'WARNING';
      const isCorrect = (actualIsAttack && predictedIsAttack) || (!actualIsAttack && !predictedIsAttack);
      
      predictions.push({
        confidence,
        correct: isCorrect ? 1 : 0,
        predictedProb: result.critical
      });
    });
    
    // Bin predictions by confidence (10 bins: 0-10%, 10-20%, ..., 90-100%)
    const bins = Array(10).fill(0).map(() => ({ count: 0, correct: 0, avgConfidence: 0 }));
    
    predictions.forEach(pred => {
      const binIndex = Math.min(Math.floor(pred.confidence * 10), 9);
      bins[binIndex].count++;
      bins[binIndex].correct += pred.correct;
      bins[binIndex].avgConfidence += pred.confidence;
    });
    
    // Calculate average accuracy per bin
    const calibrationCurve = bins.map((bin, idx) => {
      if (bin.count === 0) return null;
      return {
        confidenceRange: `${idx * 10}-${(idx + 1) * 10}%`,
        predictedConfidence: (bin.avgConfidence / bin.count) * 100,
        actualAccuracy: (bin.correct / bin.count) * 100,
        sampleCount: bin.count
      };
    }).filter(x => x !== null);
    
    // Calculate Brier score (lower is better, range 0-1)
    const brierScore = predictions.reduce((sum, pred) => {
      const error = Math.pow(pred.predictedProb - pred.correct, 2);
      return sum + error;
    }, 0) / predictions.length;
    
    // Expected Calibration Error (ECE) - average difference between confidence and accuracy
    const ece = calibrationCurve.reduce((sum, bin) => {
      return sum + Math.abs(bin.predictedConfidence - bin.actualAccuracy) * (bin.sampleCount / testData.length);
    }, 0);
    
    this.calibrationData = {
      calibrationCurve,
      brierScore,
      expectedCalibrationError: ece,
      interpretation: {
        brier: brierScore < 0.15 ? 'Well calibrated' : brierScore < 0.25 ? 'Moderately calibrated' : 'Poorly calibrated',
        ece: ece < 5 ? 'Excellent' : ece < 10 ? 'Good' : ece < 15 ? 'Fair' : 'Poor'
      }
    };
    
    console.log(`📊 Calibration: Brier Score=${brierScore.toFixed(4)}, ECE=${ece.toFixed(2)}%`);
    
    return this.calibrationData;
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // V5: CLASS IMBALANCE & CROSS-VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  
  // Generate imbalanced dataset (realistic: <10% attacks)
  generateImbalancedDataset(totalSamples = 500, attackRate = 0.05, seed = 42) {
    const rng = seededRandom(seed);
    const data = [];
    
    for (let i = 0; i < totalSamples; i++) {
      // Only attackRate% are attacks (e.g., 5%)
      const isAttack = rng() < attackRate;
      
      // Generate features independently
      const baseLatency = rng();
      const baseError = rng();
      const baseQueue = rng();
      const baseCpu = rng();
      const baseMemory = rng() * 0.8 + 0.2;
      const baseRps = rng();
      const timeOfDay = rng();
      
      const latencyTrend = baseLatency > 0.5 ? baseLatency * 0.8 : baseLatency * 0.4;
      const errorTrend = baseError > 0.3 ? baseError * 0.7 : baseError * 0.3;
      
      // Derive label from features with noise
      const attackScore = (baseLatency * 0.3) + (baseError * 0.3) + (baseQueue * 0.2) + (baseCpu * 0.2);
      const finalIsAttack = isAttack ? true : (attackScore > 0.75); // Force some attacks
      
      const noise = (rng() - 0.5) * 0.1;
      const finalLatency = Math.max(0, Math.min(1, baseLatency + noise));
      const finalError = Math.max(0, Math.min(1, baseError + noise));
      
      data.push({
        input: {
          latency: finalLatency,
          errorRate: finalError,
          queueSize: baseQueue,
          cpuUsage: baseCpu,
          memoryUsage: baseMemory,
          requestsPerSecond: baseRps,
          timeOfDay: timeOfDay,
          latencyTrend: latencyTrend,
          errorTrend: errorTrend
        },
        output: {
          normal: finalIsAttack ? 0.1 : 0.9,
          warning: finalIsAttack ? 0.2 : 0.1,
          critical: finalIsAttack ? 0.7 : 0
        }
      });
    }
    
    const attackCount = data.filter(d => d.output.critical > 0.5).length;
    console.log(`📊 Imbalanced dataset: ${attackCount}/${totalSamples} attacks (${(attackCount/totalSamples*100).toFixed(1)}%)`);
    
    return data;
  }
  
  // K-fold cross-validation
  async performCrossValidation(k = 5, samples = 500, seed = 42) {
    console.log(`📊 Running ${k}-fold cross-validation...`);
    
    const fullData = this.generateTrainingData(samples, seed);
    const foldSize = Math.floor(samples / k);
    const folds = [];
    
    // Split into k folds
    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = i === k - 1 ? samples : start + foldSize;
      folds.push(fullData.slice(start, end));
    }
    
    const results = [];
    
    // Train and evaluate k times
    for (let i = 0; i < k; i++) {
      console.log(`  Fold ${i + 1}/${k}...`);
      
      // Use fold i as test, rest as train
      const testFold = folds[i];
      const trainFolds = folds.filter((_, idx) => idx !== i).flat();
      
      // Create temporary network
      const tempNet = new brain.NeuralNetwork({
        hiddenLayers: [12, 8, 6],
        activation: 'leaky-relu',
        learningRate: 0.01
      });
      
      // Train
      await tempNet.trainAsync(trainFolds, {
        iterations: 1000,
        errorThresh: 0.005,
        log: false
      });
      
      // Evaluate
      let correct = 0;
      let tp = 0, fp = 0, tn = 0, fn = 0;
      
      testFold.forEach(sample => {
        const result = tempNet.run(sample.input);
        const prediction = result.critical > 0.6 ? 'CRITICAL' :
                          (result.warning > 0.4 || result.critical > 0.3) ? 'WARNING' : 'NORMAL';
        
        const actualClass = Object.keys(sample.output).reduce((a, b) =>
          sample.output[a] > sample.output[b] ? a : b
        );
        
        const actualIsAttack = actualClass === 'critical' || actualClass === 'warning';
        const predictedIsAttack = prediction === 'CRITICAL' || prediction === 'WARNING';
        
        if ((actualIsAttack && predictedIsAttack) || (!actualIsAttack && !predictedIsAttack)) {
          correct++;
        }
        
        if (actualIsAttack && predictedIsAttack) tp++;
        else if (!actualIsAttack && predictedIsAttack) fp++;
        else if (!actualIsAttack && !predictedIsAttack) tn++;
        else if (actualIsAttack && !predictedIsAttack) fn++;
      });
      
      const accuracy = (correct / testFold.length) * 100;
      const precision = tp / (tp + fp) * 100 || 0;
      const recall = tp / (tp + fn) * 100 || 0;
      const f1 = 2 * (precision * recall) / (precision + recall) || 0;
      
      results.push({ fold: i + 1, accuracy, precision, recall, f1 });
    }
    
    // Calculate mean and std
    const meanAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / k;
    const meanF1 = results.reduce((sum, r) => sum + r.f1, 0) / k;
    const stdAccuracy = Math.sqrt(results.reduce((sum, r) => sum + Math.pow(r.accuracy - meanAccuracy, 2), 0) / k);
    const stdF1 = Math.sqrt(results.reduce((sum, r) => sum + Math.pow(r.f1 - meanF1, 2), 0) / k);
    
    this.cvResults = {
      k,
      folds: results,
      meanAccuracy,
      stdAccuracy,
      meanF1,
      stdF1,
      interpretation: `Accuracy: ${meanAccuracy.toFixed(2)}% ± ${stdAccuracy.toFixed(2)}%, F1: ${meanF1.toFixed(2)}% ± ${stdF1.toFixed(2)}%`
    };
    
    console.log(`✅ Cross-validation complete: ${this.cvResults.interpretation}`);
    
    return this.cvResults;
  }
}

export default NeuralAgent;

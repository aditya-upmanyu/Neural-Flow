// backend/src/utils/logger.js
// Enhanced logging system with levels, formatting, and file output

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVELS = {
  ERROR: { value: 0, label: 'ERROR', emoji: '❌', color: '\x1b[31m' },
  WARN:  { value: 1, label: 'WARN',  emoji: '⚠️ ', color: '\x1b[33m' },
  INFO:  { value: 2, label: 'INFO',  emoji: 'ℹ️ ', color: '\x1b[36m' },
  HTTP:  { value: 3, label: 'HTTP',  emoji: '🌐', color: '\x1b[35m' },
  DEBUG: { value: 4, label: 'DEBUG', emoji: '🐛', color: '\x1b[90m' },
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.enableColors = options.enableColors !== false;
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.filename = options.filename || 'neuralflow.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    // Create logs directory if it doesn't exist
    if (this.enableFile) {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    }
  }

  shouldLog(level) {
    const configLevel = LOG_LEVELS[this.level]?.value ?? LOG_LEVELS.INFO.value;
    const messageLevel = LOG_LEVELS[level]?.value ?? LOG_LEVELS.INFO.value;
    return messageLevel <= configLevel;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    
    let formatted = `[${timestamp}] ${levelInfo.emoji} ${levelInfo.label.padEnd(5)}`;
    
    if (meta.component) {
      formatted += ` [${meta.component}]`;
    }
    
    formatted += ` ${message}`;
    
    if (meta.data && Object.keys(meta.data).length > 0) {
      formatted += ` ${JSON.stringify(meta.data)}`;
    }
    
    if (meta.error) {
      formatted += `\n  Error: ${meta.error.message}`;
      if (meta.error.stack) {
        formatted += `\n  Stack: ${meta.error.stack}`;
      }
    }
    
    return formatted;
  }

  writeToFile(message) {
    if (!this.enableFile) return;
    
    try {
      const logPath = path.join(this.logDir, this.filename);
      
      // Check file size and rotate if needed
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(logPath);
        }
      }
      
      fs.appendFileSync(logPath, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  rotateLogFile(logPath) {
    try {
      // Shift existing logs
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldPath = logPath + `.${i}`;
        const newPath = logPath + `.${i + 1}`;
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
      
      // Rename current log
      fs.renameSync(logPath, logPath + '.1');
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, meta);
    const cleanFormatted = formatted.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emojis for file
    
    // Console output with colors
    if (this.enableColors) {
      const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.INFO;
      console.log(`${levelInfo.color}${formatted}${RESET_COLOR}`);
    } else {
      console.log(formatted);
    }
    
    // File output without colors
    this.writeToFile(cleanFormatted);
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Helper method for API logging
  logRequest(req, statusCode, duration) {
    const meta = {
      data: {
        method: req.method,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      }
    };
    this.http(`${req.method} ${req.path} ${statusCode}`, meta);
  }

  // Helper method for error logging with stack traces
  logError(message, error, meta = {}) {
    this.error(message, { ...meta, error });
  }
}

// Create singleton logger instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableColors: process.env.NODE_ENV !== 'production',
  enableFile: true,
});

export default logger;
export { Logger, LOG_LEVELS };

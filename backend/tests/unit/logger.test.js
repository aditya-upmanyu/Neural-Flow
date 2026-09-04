// backend/tests/unit/logger.test.js
// Unit tests for logger utility

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  let logger;
  const testLogDir = path.join(process.cwd(), 'test-logs');

  beforeEach(() => {
    logger = new Logger({
      level: 'DEBUG',
      enableFile: true,
      logDir: testLogDir,
      filename: 'test.log',
      enableColors: false,
    });
  });

  afterEach(() => {
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Log Levels', () => {
    it('should log ERROR messages', () => {
      expect(() => logger.error('Test error')).not.toThrow();
    });

    it('should log WARN messages', () => {
      expect(() => logger.warn('Test warning')).not.toThrow();
    });

    it('should log INFO messages', () => {
      expect(() => logger.info('Test info')).not.toThrow();
    });

    it('should log DEBUG messages', () => {
      expect(() => logger.debug('Test debug')).not.toThrow();
    });

    it('should respect log level threshold', () => {
      const infoLogger = new Logger({ level: 'INFO', enableFile: false });
      expect(infoLogger.shouldLog('ERROR')).toBe(true);
      expect(infoLogger.shouldLog('INFO')).toBe(true);
      expect(infoLogger.shouldLog('DEBUG')).toBe(false);
    });
  });

  describe('File Logging', () => {
    it('should create log directory', () => {
      logger.info('Test message');
      expect(fs.existsSync(testLogDir)).toBe(true);
    });

    it('should write logs to file', () => {
      logger.info('Test message');
      const logPath = path.join(testLogDir, 'test.log');
      expect(fs.existsSync(logPath)).toBe(true);
      const content = fs.readFileSync(logPath, 'utf8');
      expect(content).toContain('Test message');
    });

    it('should rotate logs when file size exceeds limit', () => {
      const smallLogger = new Logger({
        enableFile: true,
        logDir: testLogDir,
        filename: 'small.log',
        maxFileSize: 100, // Very small for testing
      });

      // Write enough data to trigger rotation
      for (let i = 0; i < 50; i++) {
        smallLogger.info(`Test message number ${i} with extra text`);
      }

      const rotatedPath = path.join(testLogDir, 'small.log.1');
      expect(fs.existsSync(rotatedPath)).toBe(true);
    });
  });

  describe('Message Formatting', () => {
    it('should include timestamp in formatted message', () => {
      const message = logger.formatMessage('INFO', 'Test', {});
      expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include component in formatted message', () => {
      const message = logger.formatMessage('INFO', 'Test', { component: 'TestComponent' });
      expect(message).toContain('[TestComponent]');
    });

    it('should include error details in formatted message', () => {
      const error = new Error('Test error');
      const message = logger.formatMessage('ERROR', 'Failed', { error });
      expect(message).toContain('Test error');
      expect(message).toContain('Stack:');
    });

    it('should include metadata in formatted message', () => {
      const message = logger.formatMessage('INFO', 'Test', {
        data: { key: 'value' },
      });
      expect(message).toContain('{"key":"value"}');
    });
  });

  describe('Request Logging', () => {
    it('should log HTTP requests', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
      };
      expect(() => logger.logRequest(mockReq, 200, 50)).not.toThrow();
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error');
      expect(() => logger.logError('Operation failed', error)).not.toThrow();
    });
  });
});

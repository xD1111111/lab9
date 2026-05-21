const fs = require('fs');
const LOG_LEVELS = { DEBUG: 0, INFO: 1, ERROR: 2 };

class TextFormatter {
  format(entry) {
    const { level, message, timestamp, ...rest } = entry;
    const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
    return `[${timestamp}] [${level}] ${message}${extra}`;
  }
}

class JsonFormatter {
  format(entry) {
    return JSON.stringify(entry);
  }
}

class ConsoleHandler {
  constructor(formatter = new TextFormatter()) {
    this.formatter = formatter;
  }

  handle(entry) {
    console.log(this.formatter.format(entry));
  }
}

class FileHandler {
  constructor(filePath, formatter = new JsonFormatter()) {
    this.filePath = filePath;
    this.formatter = formatter;
  }

  handle(entry) {
    fs.appendFileSync(this.filePath, this.formatter.format(entry) + '\n');
  }
}

class Logger {
  constructor(minLevel = 'INFO') {
    this.minLevel = minLevel;
    this._handlers = [new ConsoleHandler()];
  }

  addHandler(handler) {
    this._handlers.push(handler);
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };

    for (const handler of this._handlers) {
      handler.handle(entry);
    }
  }

  debug(message, data = {}) { this.log('DEBUG', message, data); }
  info(message, data = {})  { this.log('INFO',  message, data); }
  error(message, data = {}) { this.log('ERROR', message, data); }
}

function logDecorator(fn, level = 'INFO', logger = new Logger(level)) {
  const name = fn.name || 'anonymous';

  return async function (...args) {
    const start = Date.now();

    logger.log(level, `${name} called`, { args });

    try {
      const result = await fn.apply(this, args);
      const duration = Date.now() - start;
      logger.log(level, `${name} returned`, { result, duration });
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      logger.log('ERROR', `${name} threw error`, { error: err.message, duration });
      throw err;
    }
  };
}

module.exports = { Logger, ConsoleHandler, FileHandler, TextFormatter, JsonFormatter, logDecorator, LOG_LEVELS };

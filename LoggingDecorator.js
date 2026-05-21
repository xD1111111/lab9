const LOG_LEVELS = { DEBUG: 0, INFO: 1, ERROR: 2 };

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

class ConsoleHandler {
  handle(entry) {
    const { level, message, timestamp, ...rest } = entry;
    const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
    console.log(`[${timestamp}] [${level}] ${message}${extra}`);
  }
}

module.exports = { Logger, ConsoleHandler, LOG_LEVELS };

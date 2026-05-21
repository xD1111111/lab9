const { Logger, ConsoleHandler, FileHandler, TextFormatter, JsonFormatter } = require('./LoggingDecorator');
const fs = require('fs');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`);
}

section('Logger — log levels');
{
  const logs = [];
  const handler = { handle: (e) => logs.push(e) };

  const logger = new Logger('INFO');
  logger._handlers = [handler];

  logger.debug('debug msg');
  logger.info('info msg');
  logger.error('error msg');

  assert(logs.length === 2, 'INFO level filters out DEBUG');
  assert(logs[0].level === 'INFO', 'first log is INFO');
  assert(logs[1].level === 'ERROR', 'second log is ERROR');
}

section('Logger — timestamp');
{
  const logs = [];
  const logger = new Logger('DEBUG');
  logger._handlers = [{ handle: (e) => logs.push(e) }];
  logger.info('test');

  assert(typeof logs[0].timestamp === 'string', 'log entry has timestamp');
  assert(!isNaN(Date.parse(logs[0].timestamp)), 'timestamp is valid ISO string');
}

section('Logger — DEBUG level logs all');
{
  const logs = [];
  const logger = new Logger('DEBUG');
  logger._handlers = [{ handle: (e) => logs.push(e) }];

  logger.debug('d');
  logger.info('i');
  logger.error('e');

  assert(logs.length === 3, 'DEBUG level logs all messages');
}

section('Logger — ERROR level logs only errors');
{
  const logs = [];
  const logger = new Logger('ERROR');
  logger._handlers = [{ handle: (e) => logs.push(e) }];

  logger.debug('d');
  logger.info('i');
  logger.error('e');

  assert(logs.length === 1, 'ERROR level logs only errors');
  assert(logs[0].level === 'ERROR', 'logged entry is ERROR');
}

section('JsonFormatter');
{
  const formatter = new JsonFormatter();
  const entry = { level: 'INFO', message: 'test', timestamp: '2026-01-01T00:00:00.000Z' };
  const output = formatter.format(entry);
  const parsed = JSON.parse(output);
  assert(parsed.level === 'INFO', 'JSON output has level');
  assert(parsed.message === 'test', 'JSON output has message');
}

section('TextFormatter');
{
  const formatter = new TextFormatter();
  const entry = { level: 'INFO', message: 'hello', timestamp: '2026-01-01T00:00:00.000Z' };
  const output = formatter.format(entry);
  assert(output.includes('[INFO]'), 'text output includes level');
  assert(output.includes('hello'), 'text output includes message');
  assert(output.includes('2026-01-01'), 'text output includes timestamp');
}

section('FileHandler');
{
  const path = '/tmp/test_log.json';
  if (fs.existsSync(path)) fs.unlinkSync(path);

  const handler = new FileHandler(path);
  handler.handle({ level: 'INFO', message: 'file test', timestamp: new Date().toISOString() });

  const content = fs.readFileSync(path, 'utf8').trim();
  const parsed = JSON.parse(content);
  assert(parsed.message === 'file test', 'FileHandler writes to file');

  fs.unlinkSync(path);
}

console.log(`\n${'═'.repeat(55)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) console.log('  All tests passed! 🎉');

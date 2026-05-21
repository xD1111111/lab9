const { Logger, logDecorator } = require('./LoggingDecorator');

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

function makeLogger(logs) {
  const logger = new Logger('DEBUG');
  logger._handlers = [{ handle: (e) => logs.push(e) }];
  return logger;
}

(async () => {
  section('logDecorator — sync function');
  {
    const logs = [];
    const logger = makeLogger(logs);

    const add = logDecorator((a, b) => a + b, 'INFO', logger);
    const result = await add(2, 3);

    assert(result === 5, 'returns correct result');
    assert(logs.length === 2, 'logs call and return');
    assert(logs[0].args[0] === 2 && logs[0].args[1] === 3, 'logs arguments');
    assert(logs[1].result === 5, 'logs return value');
    assert(typeof logs[1].duration === 'number', 'logs execution time');
  }

  section('logDecorator — async function');
  {
    const logs = [];
    const logger = makeLogger(logs);

    const fetchData = logDecorator(
      async (id) => { await new Promise(r => setTimeout(r, 10)); return { id, data: 'ok' }; },
      'INFO',
      logger
    );

    const result = await fetchData(42);
    assert(result.id === 42, 'async function returns correct result');
    assert(logs[1].result.data === 'ok', 'logs async return value');
    assert(logs[1].duration >= 10, 'execution time includes async delay');
  }

  section('logDecorator — error logging');
  {
    const logs = [];
    const logger = makeLogger(logs);

    const failing = logDecorator(
      () => { throw new Error('something went wrong'); },
      'ERROR',
      logger
    );

    try {
      await failing();
    } catch (e) {
      assert(e.message === 'something went wrong', 'error is rethrown');
    }

    const errorLog = logs.find(l => l.level === 'ERROR' && l.error);
    assert(errorLog !== undefined, 'error is logged');
    assert(errorLog.error === 'something went wrong', 'error message is logged');
  }

  section('logDecorator — conditional logging by level');
  {
    const logs = [];
    const logger = makeLogger(logs);
    logger.minLevel = 'ERROR';

    const fn = logDecorator((x) => x * 2, 'INFO', logger);
    await fn(5);

    assert(logs.length === 0, 'INFO logs suppressed when minLevel is ERROR');
  }

  section('logDecorator — execution time profiling');
  {
    const logs = [];
    const logger = makeLogger(logs);

    const slow = logDecorator(
      async () => { await new Promise(r => setTimeout(r, 50)); return 'done'; },
      'DEBUG',
      logger
    );

    await slow();
    assert(logs[1].duration >= 50, 'execution time is at least 50ms');
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('  All tests passed! 🎉');
})();

import picocolors from 'picocolors';

const prefixes = {
  wait: picocolors.white(picocolors.bold('○')),
  error: picocolors.red(picocolors.bold('⨯')),
  warn: picocolors.yellow(picocolors.bold('⚠')),
  ready: picocolors.white(picocolors.bold('►')),
  info: picocolors.blue(picocolors.bold('ℹ')),
  event: picocolors.green(picocolors.bold('✓')),
  trace: picocolors.magenta(picocolors.bold('»')),
};

const methods = {
  log: 'log',
  warn: 'warn',
  error: 'error',
} as const;

function prefixedLog(prefixType: keyof typeof prefixes, ...message: unknown[]) {
  if ((message[0] === '' || message[0] === undefined) && message.length === 1) {
    message.shift();
  }

  const consoleMethod: keyof typeof methods =
    prefixType in methods ? methods[prefixType as keyof typeof methods] : 'log';

  const prefix = prefixes[prefixType];
  if (message.length === 0) {
    console[consoleMethod]('');
  } else {
    console[consoleMethod](`${prefix}`, ...message);
  }
}

export function wait(...message: unknown[]) {
  prefixedLog('wait', ...message);
}

export function error(...message: unknown[]) {
  prefixedLog('error', ...message);
}

export function warn(...message: unknown[]) {
  prefixedLog('warn', ...message);
}

export function ready(...message: unknown[]) {
  prefixedLog('ready', ...message);
}

export function info(...message: unknown[]) {
  prefixedLog('info', ...message);
}

export function event(...message: unknown[]) {
  prefixedLog('event', ...message);
}

export function trace(...message: unknown[]) {
  prefixedLog('trace', ...message);
}

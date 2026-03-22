type LogLevel = 'info' | 'warn' | 'error';

type LogMetadata = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /(secret|token|password|authorization|cookie|apikey|api_key|key)/i;

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      redacted[k] = SENSITIVE_KEY_PATTERN.test(k) ? '[REDACTED]' : redactValue(v);
    }
    return redacted;
  }

  return value;
}

function safeStringify(payload: Record<string, unknown>) {
  try {
    return JSON.stringify(payload);
  } catch {
    return JSON.stringify({
      level: payload.level,
      context: payload.context,
      timestamp: payload.timestamp,
      note: 'Log payload was not fully serializable',
    });
  }
}

function toSerializableError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function writeLog(level: LogLevel, context: string, metadata: LogMetadata = {}) {
  const redactedMetadata = redactValue(metadata);
  const payload = {
    level,
    context,
    timestamp: new Date().toISOString(),
    ...((redactedMetadata && typeof redactedMetadata === 'object')
      ? (redactedMetadata as Record<string, unknown>)
      : {}),
  };

  const serializedPayload = safeStringify(payload);

  if (level === 'error') {
    console.error(serializedPayload);
    return;
  }

  if (level === 'warn') {
    console.warn(serializedPayload);
    return;
  }

  console.info(serializedPayload);
}

export function logServerInfo(context: string, metadata: LogMetadata = {}) {
  writeLog('info', context, metadata);
}

export function logServerWarn(context: string, metadata: LogMetadata = {}) {
  writeLog('warn', context, metadata);
}

export function logServerError(
  context: string,
  error: unknown,
  metadata: LogMetadata = {}
) {
  writeLog('error', context, {
    ...metadata,
    error: toSerializableError(error),
  });
}

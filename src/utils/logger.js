export function logEvent(type, data = {}) {
  console.log(
    `[${new Date().toISOString()}] [${type}]`,
    JSON.stringify(data)
  );
}

export function logError(type, error) {
  console.error(
    `[${new Date().toISOString()}] [${type}]`,
    error?.message || error
  );
}
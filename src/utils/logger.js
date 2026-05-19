export function logEvent(type, data = {}) {
  console.log(
    `[${new Date().toISOString()}] [${type}]`,
    JSON.stringify(data).slice(0, 500)
  );
}

export function logError(type, error) {
  console.error(
    `[${new Date().toISOString()}] [${type}]`,
    error?.message || error
  );
}
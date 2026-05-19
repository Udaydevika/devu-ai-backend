
const cache = new Map();

const MAX_CACHE = 100;

// ===========================
// GET
// ===========================

export function getCache(key) {

  return cache.get(key);
}

// ===========================
// SET
// ===========================

export function setCache(
  key,
  value
) {

  // remove oldest
  if (
    cache.size >= MAX_CACHE
  ) {

    const firstKey =
      cache.keys().next().value;

    cache.delete(firstKey);
  }

  cache.set(key, value);

  setTimeout(() => {

    cache.delete(key);

  }, 1000 * 60 * 5);
}
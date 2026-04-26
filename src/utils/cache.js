const cache = new Map();

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value) {
  cache.set(key, value);

  setTimeout(() => {
    cache.delete(key);
  }, 1000 * 60 * 5); // 5 min cache
}
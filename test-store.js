const obj = {
  a: 1,
  nested: {
    b: undefined,
    c: 2
  },
  arr: [1, undefined, 3]
};
function isPlainObject(val) {
  return val !== null && typeof val === 'object' && val.constructor === Object;
}
function storeLargeStrings(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => storeLargeStrings(item));
  }
  if (isPlainObject(obj)) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      result[key] = storeLargeStrings(value);
    }
    return result;
  }
  return obj;
}
console.log(JSON.stringify(storeLargeStrings(obj), null, 2));

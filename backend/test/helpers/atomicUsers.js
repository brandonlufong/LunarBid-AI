// Minimal in-memory emulation of the atomic updates used by services/usage.js:
// User.findOneAndUpdate({ _id, 'a.b': { $lt: n } }, { $inc }) and User.updateOne({ _id }, { $inc | $set }).
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}
function matches(doc, filter) {
  return Object.entries(filter).every(([k, cond]) => {
    if (k === '_id') return String(doc._id) === String(cond);
    const v = get(doc, k) || 0;
    if (cond && typeof cond === 'object' && '$lt' in cond) return v < cond.$lt;
    return v === cond;
  });
}
function apply(doc, update) {
  for (const [k, n] of Object.entries(update.$inc || {})) set(doc, k, (get(doc, k) || 0) + n);
  for (const [k, v] of Object.entries(update.$set || {})) set(doc, k, v);
}

module.exports = function installAtomicUsers(User, users) {
  User.findOneAndUpdate = async (filter, update) => {
    const doc = users.get(String(filter._id));
    if (!doc || !matches(doc, filter)) return null;
    apply(doc, update);
    return { usage: { ...doc.usage.toObject?.() ?? doc.usage } };
  };
  User.updateOne = async (filter, update) => {
    const doc = users.get(String(filter._id));
    if (doc) apply(doc, update);
    return { acknowledged: true };
  };
};

var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// ephemeral.ts
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var _key, _prefix, _root, _timeoutId;
var EphemeralSignal = class {
  constructor(key, prefix, rootRef, timeoutId) {
    __privateAdd(this, _key);
    __privateAdd(this, _prefix);
    __privateAdd(this, _root);
    __privateAdd(this, _timeoutId);
    __privateSet(this, _key, key);
    __privateSet(this, _prefix, prefix);
    __privateSet(this, _root, rootRef);
    __privateSet(this, _timeoutId, timeoutId);
  }
  id() {
    return __privateGet(this, _key);
  }
  remove() {
    if (__privateGet(this, _timeoutId) !== void 0) {
      clearTimeout(__privateGet(this, _timeoutId));
    }
    if (__privateGet(this, _root)[__privateGet(this, _key)]) {
      delete __privateGet(this, _root)[__privateGet(this, _key)];
      return true;
    }
    return false;
  }
  filter() {
    return { include: new RegExp(`^${escapeRegex(__privateGet(this, _key))}$`) };
  }
  filterPrefix() {
    return { include: new RegExp(`^${escapeRegex(__privateGet(this, _prefix))}`) };
  }
};
_key = new WeakMap();
_prefix = new WeakMap();
_root = new WeakMap();
_timeoutId = new WeakMap();
function install(engine, options = {}) {
  const { prefix: defaultPrefix = "eph_", timeout: defaultTimeout = 0 } = options;
  const { action, root } = engine;
  action({
    name: "ephemeral",
    apply: (ctx, data = {}, options2 = {}) => {
      const { duration, prefix: customPrefix } = options2;
      const prefix = customPrefix ?? defaultPrefix;
      const key = prefix + self.crypto.randomUUID().replace(/-/g, "");
      root[key] = data;
      let timeoutId;
      const effectiveDuration = duration !== void 0 ? duration : defaultTimeout;
      if (effectiveDuration > 0) {
        timeoutId = setTimeout(() => {
          if (root[key]) {
            delete root[key];
          }
        }, effectiveDuration);
      }
      return new EphemeralSignal(key, prefix, root, timeoutId);
    }
  });
  console.log(`Ephemeral signals plugin loaded with default prefix '${defaultPrefix}' and default timeout ${defaultTimeout}ms, @ephemeral() is now available`);
}
export {
  install
};

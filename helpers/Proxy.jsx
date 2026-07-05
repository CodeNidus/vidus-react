// ============================================
// ENHANCED NESTED REACTIVE PROXY WITH SPECIAL OBJECT SUPPORT
// ============================================

const proxyCache = new WeakMap();

/**
 * Check if a value is a special object that shouldn't be proxied or cloned
 */
const isSpecialObject = (value) => {
  return (
      value instanceof MediaStream ||
      value instanceof MediaSource ||
      value instanceof File ||
      value instanceof Blob ||
      value instanceof Date ||
      value instanceof RegExp ||
      value instanceof Function ||
      value instanceof HTMLElement ||
      value instanceof Node ||
      value instanceof ArrayBuffer ||
      value instanceof DataView ||
      value instanceof Map ||
      value instanceof Set ||
      value instanceof WeakMap ||
      value instanceof WeakSet
  );
};

/**
 * Deep clone with special object preservation
 */
const deepClone = (value) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle special objects
  if (isSpecialObject(value)) {
    return value; // Return as-is
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item));
  }

  // Handle plain objects
  if (typeof value === 'object') {
    const result = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = deepClone(value[key]);
      }
    }
    return result;
  }

  // Handle primitives
  return value;
};

/**
 * Check if a value should be proxied
 */
const shouldProxy = (value) => {
  return (
      value !== null &&
      typeof value === 'object' &&
      !isSpecialObject(value) &&
      !proxyCache.has(value)
  );
};

/**
 * Creates a reactive proxy with full nested support
 */
const createDeepProxy = (target, onUpdate, rootTarget = target) => {
  // Don't proxy primitives or special objects
  if (typeof target !== 'object' || target === null || isSpecialObject(target)) {
    return target;
  }

  // Return cached proxy if it exists
  if (proxyCache.has(target)) {
    return proxyCache.get(target);
  }

  // Get all mutating array methods
  const arrayMutatingMethods = [
    'push', 'pop', 'splice', 'shift', 'unshift',
    'reverse', 'sort', 'fill', 'copyWithin'
  ];

  // Methods that should not trigger updates (read-only)
  const readOnlyMethods = [
    'concat', 'slice', 'filter', 'map', 'flat', 'flatMap',
    'forEach', 'every', 'some', 'find', 'findIndex',
    'includes', 'indexOf', 'lastIndexOf', 'join',
    'keys', 'values', 'entries', 'toString', 'toLocaleString'
  ];

  const handler = {
    /**
     * Intercept property access
     */
    get(obj, property) {
      // Handle array methods
      if (Array.isArray(obj) && typeof property === 'string') {
        // Override mutating array methods
        if (arrayMutatingMethods.includes(property)) {
          return function(...args) {
            const result = Array.prototype[property].apply(obj, args);
            notifyUpdate(rootTarget, onUpdate);
            return result;
          };
        }

        // Handle array methods that return new arrays (make them reactive)
        if (readOnlyMethods.includes(property) && property !== 'forEach') {
          return function(...args) {
            const result = Array.prototype[property].apply(obj, args);
            // Make the result reactive if it's an array
            if (Array.isArray(result)) {
              return createDeepProxy(result, onUpdate, rootTarget);
            }
            return result;
          };
        }
      }

      // Get the value
      const value = obj[property];

      // Deep proxy for nested objects/arrays
      if (shouldProxy(value)) {
        return createDeepProxy(value, onUpdate, rootTarget);
      }

      return value;
    },

    /**
     * Intercept property setting
     */
    set(obj, property, value) {
      // Check if value actually changed
      const oldValue = obj[property];

      // Special handling for MediaStream and similar objects
      if (isSpecialObject(value) && isSpecialObject(oldValue)) {
        // For special objects, compare by reference
        if (oldValue === value) {
          return true;
        }
      } else if (oldValue === value) {
        return true;
      }

      // Make new value reactive if it's a proxiable object
      if (shouldProxy(value)) {
        value = createDeepProxy(value, onUpdate, rootTarget);
      }

      // Set the value
      obj[property] = value;

      // Notify about the change
      notifyUpdate(rootTarget, onUpdate);

      return true;
    },

    /**
     * Intercept property deletion
     */
    deleteProperty(obj, property) {
      if (!(property in obj)) {
        return true;
      }

      delete obj[property];
      notifyUpdate(rootTarget, onUpdate);
      return true;
    },

    has(obj, property) {
      return property in obj;
    },

    ownKeys(obj) {
      return Reflect.ownKeys(obj);
    },

    getOwnPropertyDescriptor(obj, property) {
      return Reflect.getOwnPropertyDescriptor(obj, property);
    },

    getPrototypeOf(obj) {
      return Reflect.getPrototypeOf(obj);
    },

    setPrototypeOf(obj, proto) {
      return Reflect.setPrototypeOf(obj, proto);
    },

    isExtensible(obj) {
      return Reflect.isExtensible(obj);
    },

    preventExtensions(obj) {
      return Reflect.preventExtensions(obj);
    },

    getOwnPropertyNames(obj) {
      return Reflect.getOwnPropertyNames(obj);
    },

    getOwnPropertySymbols(obj) {
      return Reflect.getOwnPropertySymbols(obj);
    }
  };

  const proxy = new Proxy(target, handler);
  proxyCache.set(target, proxy);
  return proxy;
};

/**
 * Notify about updates
 */
const notifyUpdate = (rootTarget, onUpdate) => {
  // Create a safe snapshot without destroying special objects
  const snapshot = createSafeSnapshot(rootTarget);
  onUpdate(snapshot);
};

/**
 * Create a safe snapshot that preserves special objects
 */
const createSafeSnapshot = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  // For special objects, return them as-is
  if (isSpecialObject(value)) {
    return value;
  }

  // For arrays, create a shallow copy
  if (Array.isArray(value)) {
    return [...value];
  }

  // For plain objects, create a shallow copy
  if (typeof value === 'object') {
    return { ...value };
  }

  // For primitives
  return value;
};

/**
 * Create a reactive array with full nested support
 */
export const createProxyArray = (onUpdate, initialData = []) => {
  if (!Array.isArray(initialData)) {
    throw new Error('Initial data must be an array');
  }

  // Deep clone while preserving special objects
  const target = deepClone(initialData);
  return createDeepProxy(target, onUpdate);
};

/**
 * Create a reactive object with full nested support
 */
export const createProxyObject = (onUpdate, initialData = {}) => {
  if (typeof initialData !== 'object' || Array.isArray(initialData) || initialData === null) {
    throw new Error('Initial data must be a plain object');
  }

  // Deep clone while preserving special objects
  const target = deepClone(initialData);
  return createDeepProxy(target, onUpdate);
};

// ============================================
// SPECIFIC FIX FOR MEDIASTREAM IN USER CONNECTIONS
// ============================================

/**
 * Create a reactive state specifically for WebRTC/MediaStream connections
 */
export const createReactiveConnection = (onUpdate, initialData = {}) => {
  // Don't clone MediaStream objects
  const target = {};

  for (const key in initialData) {
    if (initialData.hasOwnProperty(key)) {
      const value = initialData[key];
      // Keep MediaStream and other special objects as-is
      if (isSpecialObject(value)) {
        target[key] = value;
      } else if (Array.isArray(value)) {
        target[key] = value.map(item =>
            isSpecialObject(item) ? item : deepClone(item)
        );
      } else if (typeof value === 'object' && value !== null) {
        target[key] = deepClone(value);
      } else {
        target[key] = value;
      }
    }
  }

  return createDeepProxy(target, onUpdate);
};

// ============================================
// BATCHED AND SMART VERSIONS (UPDATED)
// ============================================

export const createBatchedReactive = (initialData, onUpdate, delay = 0) => {
  let timeoutId = null;
  let pendingUpdate = false;
  let lastData = null;

  const batchedOnUpdate = (data) => {
    // Skip if it's the same data
    if (lastData === data) return;
    lastData = data;

    if (pendingUpdate) return;
    pendingUpdate = true;
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      pendingUpdate = false;
      onUpdate(data);
    }, delay);
  };

  if (Array.isArray(initialData)) {
    return createProxyArray(batchedOnUpdate, initialData);
  } else {
    return createProxyObject(batchedOnUpdate, initialData);
  }
};

export const createSmartReactive = (initialData, onUpdate) => {
  let previousSnapshot = null;

  const smartOnUpdate = (data) => {
    // Create a safe string representation for comparison
    // Skip special objects in comparison
    const currentSnapshot = safeStringify(data);
    if (currentSnapshot === previousSnapshot) {
      return;
    }
    previousSnapshot = currentSnapshot;
    onUpdate(data);
  };

  if (Array.isArray(initialData)) {
    return createProxyArray(smartOnUpdate, initialData);
  } else {
    return createProxyObject(smartOnUpdate, initialData);
  }
};

/**
 * Safe stringify that handles special objects
 */
const safeStringify = (value) => {
  const seen = new WeakSet();

  const replacer = (key, val) => {
    // Skip special objects
    if (isSpecialObject(val)) {
      return `[${val.constructor.name}]`;
    }
    // Handle circular references
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    return val;
  };

  try {
    return JSON.stringify(value, replacer);
  } catch (e) {
    return JSON.stringify({ error: 'Unable to stringify' });
  }
};

// ============================================
// USAGE EXAMPLE - WEBRTC CONNECTION
// ============================================

/*
// Example: Managing WebRTC connections
const connections = createProxyObject((state) => {
  console.log('Connection state updated:', state);

  // Update UI or other components
  updatePeerList(state.peers);
}, {
  peers: [],
  localStream: null,
  settings: {
    audio: true,
    video: true
  }
});

// Store a MediaStream
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    connections.localStream = stream; // ✅ Works without destroying the stream

    // Use the stream directly
    document.getElementById('local-video').srcObject = connections.localStream;
  });

// Add a peer with their stream
connections.peers.push({
  id: 'peer-1',
  name: 'John',
  stream: peerStream // ✅ MediaStream preserved
});

// Update peer properties
connections.peers[0].name = 'John Doe'; // ✅ Triggers update
connections.peers[0].stream = newStream; // ✅ Triggers update

// When accessing nested objects
const firstPeer = connections.peers[0];
console.log(firstPeer.stream); // ✅ Returns the actual MediaStream
document.getElementById('remote-video').srcObject = firstPeer.stream; // ✅ Works!
*/

// ============================================
// EXPORTS
// ============================================

export default {
  createProxyArray,
  createProxyObject,
  createReactiveConnection,
  createBatchedReactive,
  createSmartReactive,
  isSpecialObject
};
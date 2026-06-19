import Valkey from 'iovalkey';
import { AgentCache } from '@betterdb/agent-cache';
import fs from 'fs';
import path from 'path';

let valkeyClient: any = null;
let agentCache: any = null;
let useFallback = false;

const memoryStore = new Map<string, any>();
const CACHE_FILE = path.join(process.cwd(), 'cache_store.json');

function saveMemoryStore() {
  try {
    const data: Record<string, any> = {};
    for (const [k, v] of memoryStore.entries()) {
      data[k] = v;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Cache Persistence] Failed to save cache:', err);
  }
}

function loadMemoryStore() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        memoryStore.set(k, v);
      }
      console.log(`[Cache Persistence] Loaded ${memoryStore.size} items from cache_store.json`);
    }
  } catch (err) {
    console.error('[Cache Persistence] Failed to load cache:', err);
  }
}

// Initial load on import
loadMemoryStore();

function setMemoryStore(key: string, value: any) {
  memoryStore.set(key, value);
  saveMemoryStore();
}

// In-Memory cache fallback if Valkey/Redis is not running
const memoryCache = {
  llm: {
    check: async (params: any) => {
      const key = `llm:${JSON.stringify(params)}`;
      if (memoryStore.has(key)) {
        return { hit: true, data: memoryStore.get(key) };
      }
      return { hit: false };
    },
    store: async (params: any, response: any) => {
      const key = `llm:${JSON.stringify(params)}`;
      setMemoryStore(key, response);
    }
  },
  tool: {
    check: async (name: string, args: any) => {
      const key = `tool:${name}:${JSON.stringify(args)}`;
      if (memoryStore.has(key)) {
        return { hit: true, data: memoryStore.get(key) };
      }
      return { hit: false };
    },
    store: async (name: string, args: any, result: any) => {
      const key = `tool:${name}:${JSON.stringify(args)}`;
      setMemoryStore(key, result);
    }
  },
  session: {
    set: async (threadId: string, key: string, value: any) => {
      const sessionKey = `session:${threadId}:${key}`;
      setMemoryStore(sessionKey, value);
    },
    get: async (threadId: string, key: string) => {
      const sessionKey = `session:${threadId}:${key}`;
      return memoryStore.get(sessionKey) || null;
    }
  },
  semantic: {
    getRecent: async (agentIndex: number) => {
      const key = `semantic:recent:${agentIndex}`;
      return memoryStore.get(key) || [];
    },
    store: async (agentIndex: number, prompt: string, response: string) => {
      const key = `semantic:recent:${agentIndex}`;
      const list = memoryStore.get(key) || [];
      list.push({ prompt, response, timestamp: Date.now() });
      if (list.length > 30) list.shift();
      setMemoryStore(key, list);
    }
  }
};

try {
  valkeyClient = new Valkey({
    host: process.env.VALKEY_HOST || '127.0.0.1',
    port: parseInt(process.env.VALKEY_PORT || '6379', 10),
    connectTimeout: 500,
    maxRetriesPerRequest: 0
  });

  valkeyClient.on('error', (err: any) => {
    if (!useFallback) {
      console.warn('⚠️ BetterDB Agent Cache (Valkey) connection failed. Falling back to local in-memory cache.');
      useFallback = true;
    }
  });

  agentCache = new AgentCache({ client: valkeyClient });
} catch (err) {
  console.warn('⚠️ BetterDB Agent Cache failed to initialize. Falling back to local in-memory cache.', err);
  useFallback = true;
}

export const cache = {
  isValkeyActive: () => !useFallback && !!agentCache,

  llm: {
    check: async (params: any) => {
      if (useFallback || !agentCache) {
        const res = await memoryCache.llm.check(params);
        if (res.hit) {
          const count = memoryStore.get('stats:hits') || 0;
          setMemoryStore('stats:hits', count + 1);
        } else {
          const count = memoryStore.get('stats:misses') || 0;
          setMemoryStore('stats:misses', count + 1);
        }
        return res;
      }
      try {
        const result = await agentCache.llm.check(params);
        return result || { hit: false };
      } catch (err) {
        useFallback = true;
        const res = await memoryCache.llm.check(params);
        if (res.hit) {
          const count = memoryStore.get('stats:hits') || 0;
          setMemoryStore('stats:hits', count + 1);
        } else {
          const count = memoryStore.get('stats:misses') || 0;
          setMemoryStore('stats:misses', count + 1);
        }
        return res;
      }
    },
    store: async (params: any, response: any) => {
      if (useFallback || !agentCache) {
        return memoryCache.llm.store(params, response);
      }
      try {
        await agentCache.llm.store(params, response);
      } catch (err) {
        useFallback = true;
        memoryCache.llm.store(params, response);
      }
    }
  },

  tool: {
    check: async (name: string, args: any) => {
      if (useFallback || !agentCache) {
        return memoryCache.tool.check(name, args);
      }
      try {
        const result = await agentCache.tool.check(name, args);
        return result || { hit: false };
      } catch (err) {
        useFallback = true;
        return memoryCache.tool.check(name, args);
      }
    },
    store: async (name: string, args: any, result: any) => {
      if (useFallback || !agentCache) {
        return memoryCache.tool.store(name, args, result);
      }
      try {
        await agentCache.tool.store(name, args, result);
      } catch (err) {
        useFallback = true;
        memoryCache.tool.store(name, args, result);
      }
    }
  },

  session: {
    set: async (threadId: string, key: string, value: any) => {
      if (useFallback || !agentCache) {
        return memoryCache.session.set(threadId, key, value);
      }
      try {
        await agentCache.session.set(threadId, key, value);
      } catch (err) {
        useFallback = true;
        memoryCache.session.set(threadId, key, value);
      }
    },
    get: async (threadId: string, key: string) => {
      if (useFallback || !agentCache) {
        return memoryCache.session.get(threadId, key);
      }
      try {
        return await agentCache.session.get(threadId, key);
      } catch (err) {
        useFallback = true;
        return memoryCache.session.get(threadId, key);
      }
    }
  },
  semantic: {
    getRecent: async (agentIndex: number): Promise<any[]> => {
      if (useFallback || !valkeyClient) {
        return memoryCache.semantic.getRecent(agentIndex);
      }
      try {
        const key = `betterdb_ac:semantic_recent:${agentIndex}`;
        const data = await valkeyClient.get(key);
        return data ? JSON.parse(data) : [];
      } catch (err) {
        return memoryCache.semantic.getRecent(agentIndex);
      }
    },
    store: async (agentIndex: number, prompt: string, response: string) => {
      if (useFallback || !valkeyClient) {
        return memoryCache.semantic.store(agentIndex, prompt, response);
      }
      try {
        const key = `betterdb_ac:semantic_recent:${agentIndex}`;
        const data = await valkeyClient.get(key);
        const list = data ? JSON.parse(data) : [];
        list.push({ prompt, response, timestamp: Date.now() });
        if (list.length > 30) list.shift();
        await valkeyClient.set(key, JSON.stringify(list), 'EX', 3600 * 24);
      } catch (err) {
        memoryCache.semantic.store(agentIndex, prompt, response);
      }
    }
  },
  incrementSemanticHits: async () => {
    if (useFallback || !valkeyClient) {
      const count = memoryStore.get('stats:semantic_hits') || 0;
      setMemoryStore('stats:semantic_hits', count + 1);
      return;
    }
    try {
      await valkeyClient.hincrby('betterdb_ac:stats', 'semantic_hits', 1);
    } catch (err) {}
  },
  getSemanticHits: async (): Promise<number> => {
    if (useFallback || !valkeyClient) {
      return memoryStore.get('stats:semantic_hits') || 0;
    }
    try {
      const val = await valkeyClient.hget('betterdb_ac:stats', 'semantic_hits');
      return val ? parseInt(val, 10) : 0;
    } catch (err) {
      return memoryStore.get('stats:semantic_hits') || 0;
    }
  },
  stats: async () => {
    if (useFallback || !agentCache) {
      const hits = memoryStore.get('stats:hits') || 0;
      const misses = memoryStore.get('stats:misses') || 0;
      const semanticHits = memoryStore.get('stats:semantic_hits') || 0;
      return {
        llm: { hits, misses, total: hits + misses, hitRate: hits + misses > 0 ? hits / (hits + misses) : 0 },
        semanticHits,
        costSavedMicros: (hits + semanticHits) * 1500
      };
    }
    try {
      const s = await agentCache.stats();
      const semanticHits = await cache.getSemanticHits();
      return {
        ...s,
        semanticHits,
        costSavedMicros: s.costSavedMicros + (semanticHits * 1500)
      };
    } catch (err) {
      return { llm: { hits: 0, misses: 0, total: 0, hitRate: 0 }, semanticHits: 0, costSavedMicros: 0 };
    }
  }
};

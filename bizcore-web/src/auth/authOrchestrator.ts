import axios from 'axios';

const LOCK_KEY = 'bizcore-auth-lock';
const CHANNEL_NAME = 'bizcore-auth-sync';
const REFRESH_BUFFER = 60;

let broadcastChannel: BroadcastChannel | null = null;
let currentTabId = Math.random().toString(36).substring(7);
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;
let schedulerTimeout: ReturnType<typeof setTimeout> | null = null;
let visibilityHandlerAttached = false;

interface LockData {
  ownerId: string;
  timestamp: number;
  heartbeat: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  user: unknown;
  business: unknown;
}

let authState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isBootstrapped: false,
  user: null,
  business: null,
};

const listeners: Set<() => void> = new Set();

export const auth = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    listeners.forEach((fn) => fn());
  },

  getState(): AuthState {
    return { ...authState };
  },

  setState(newState: Partial<AuthState>) {
    authState = { ...authState, ...newState };
    this.notify();
  },

  getTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Number(payload?.exp ?? 0);
    } catch {
      return 0;
    }
  },

  isTokenExpiringSoon(token: string): boolean {
    const exp = this.getTokenExpiry(token);
    const now = Math.floor(Date.now() / 1000);
    return exp - now < REFRESH_BUFFER;
  },

  getBroadcastChannel(): BroadcastChannel {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        const { type, token, ownerId } = event.data;
        if (type === 'token-updated' && token && ownerId !== currentTabId) {
          this.setState({ accessToken: token });
        }
      };
    }
    return broadcastChannel;
  },

  acquireLease(): boolean {
    try {
      const existing = localStorage.getItem(LOCK_KEY);
      if (existing) {
        const lock: LockData = JSON.parse(existing);
        const age = Date.now() - lock.timestamp;
        const heartbeatAge = Date.now() - lock.heartbeat;
        if (age < 10000 && heartbeatAge < 5000) {
          return false;
        }
      }
      const newLock: LockData = {
        ownerId: currentTabId,
        timestamp: Date.now(),
        heartbeat: Date.now(),
      };
      localStorage.setItem(LOCK_KEY, JSON.stringify(newLock));
      return true;
    } catch {
      return false;
    }
  },

  releaseLease() {
    try {
      const existing = localStorage.getItem(LOCK_KEY);
      if (existing) {
        const lock: LockData = JSON.parse(existing);
        if (lock.ownerId === currentTabId) {
          localStorage.removeItem(LOCK_KEY);
        }
      }
    } catch {}
  },

  heartbeat() {
    try {
      const existing = localStorage.getItem(LOCK_KEY);
      if (existing) {
        const lock: LockData = JSON.parse(existing);
        if (lock.ownerId === currentTabId) {
          lock.heartbeat = Date.now();
          localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
        }
      }
    } catch {}
  },

  async refresh(): Promise<string | null> {
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    if (!authState.refreshToken) {
      return null;
    }

    if (!this.acquireLease()) {
      await new Promise((r) => setTimeout(r, 500));
      return this.refresh();
    }

    isRefreshing = true;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    heartbeatInterval = setInterval(() => this.heartbeat(), 2000);

    refreshPromise = (async () => {
      try {
        const res = await axios.post('http://localhost:5011/api/auth/refresh', {
          refreshToken: authState.refreshToken,
        });

        if (res.data?.success && res.data?.data?.accessToken) {
          const newAccess = res.data.data.accessToken;
          const newRefresh = res.data.data.refreshToken;

          this.setState({
            accessToken: newAccess,
            refreshToken: newRefresh,
          });

          this.getBroadcastChannel().postMessage({
            type: 'token-updated',
            token: newAccess,
            ownerId: currentTabId,
          });

          this.scheduleRefresh();
          return newAccess;
        }
        throw new Error('Invalid refresh response');
      } catch (err) {
        this.logout();
        throw err;
      } finally {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        isRefreshing = false;
        refreshPromise = null;
        this.releaseLease();
      }
    })();

    return refreshPromise;
  },

  scheduleRefresh() {
    if (schedulerTimeout) {
      clearTimeout(schedulerTimeout);
      schedulerTimeout = null;
    }

    const token = authState.accessToken;
    if (!token) return;

    const exp = this.getTokenExpiry(token);
    const now = Math.floor(Date.now() / 1000);
    const msUntilRefresh = (exp - REFRESH_BUFFER - now) * 1000;

    if (msUntilRefresh > 0) {
      schedulerTimeout = setTimeout(() => {
        this.refresh();
      }, msUntilRefresh);
    } else {
      this.refresh();
    }
  },

  setupVisibilityHandler() {
    if (visibilityHandlerAttached) return;
    visibilityHandlerAttached = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && authState.accessToken) {
        if (this.isTokenExpiringSoon(authState.accessToken)) {
          this.refresh();
        }
      }
    });
  },

  async initAuth(): Promise<void> {
    if (authState.isBootstrapped) return;

    const persisted = this.loadPersistedState();
    if (!persisted?.accessToken || !persisted.isAuthenticated) {
      this.setState({ isBootstrapped: true, ...persisted });
      return;
    }

    this.setState({ ...persisted });

    if (this.isTokenExpiringSoon(persisted.accessToken)) {
      try {
        await this.refresh();
      } catch {
        this.setState({ isBootstrapped: true });
        return;
      }
    }

    this.setState({ isBootstrapped: true });
    this.scheduleRefresh();
    this.setupVisibilityHandler();
  },

  loadPersistedState(): AuthState | null {
    try {
      const raw = localStorage.getItem('bizcore-auth');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state ?? null;
    } catch {
      return null;
    }
  },

  logout() {
    if (schedulerTimeout) {
      clearTimeout(schedulerTimeout);
      schedulerTimeout = null;
    }
    this.setState({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapped: true,
      user: null,
      business: null,
    });
    try {
      localStorage.removeItem('bizcore-auth');
      localStorage.removeItem(LOCK_KEY);
    } catch {}
    window.location.replace('/login');
  },

  setAuth(user: unknown, accessToken: string, refreshToken: string) {
    this.setState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isBootstrapped: false,
    });
    this.scheduleRefresh();
    this.setupVisibilityHandler();
  },

  setTokens(accessToken: string, refreshToken: string) {
    this.setState({ accessToken, refreshToken });
    this.scheduleRefresh();
  },
};

export default auth;
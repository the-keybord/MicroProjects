/**
 * PocketBase REST + Realtime Client for RFALL (Alliance Roster)
 * Backend Target: https://db.zece.info
 * Assigned Prefix: RFALL_ (Collections: RFALL_alliances, RFALL_logs)
 * Dedicated Service User: rfall@zece.info
 * Security Standard: Least Privilege (API rules locked to rfall@zece.info)
 */

const PB_CONFIG = {
    baseUrl: 'https://db.zece.info',
    authCollection: 'users',
    identity: 'rfall@zece.info',
    password: 'rfall_Zece2026!secret',
    tokenStorageKey: 'rfall_pb_token',
    alliancesCollection: 'RFALL_alliances',
    logsCollection: 'RFALL_logs'
};

// Allow environment/runtime overrides if provided by a config file or hosting injection
if (typeof window !== 'undefined' && window.RFALL_CONFIG) {
    Object.assign(PB_CONFIG, window.RFALL_CONFIG);
}

class PocketBaseClient {
    constructor(config = {}) {
        this.baseUrl = (config.baseUrl || PB_CONFIG.baseUrl).replace(/\/+$/, '');
        this.authCollection = config.authCollection || PB_CONFIG.authCollection;
        this.identity = config.identity || PB_CONFIG.identity;
        this.password = config.password || PB_CONFIG.password;
        this.storageKey = config.tokenStorageKey || PB_CONFIG.tokenStorageKey;

        this.token = null;
        this.authPromise = null;
        this.eventSource = null;
        this.clientId = null;
        this.currentTopic = null;
        this.onMessageCallback = null;
        this.onStatusChangeCallback = null;

        this._loadCachedToken();
    }

    _loadCachedToken() {
        try {
            const raw = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.token && this._isTokenFresh(parsed.token)) {
                    this.token = parsed.token;
                }
            }
        } catch {
            this.token = null;
        }
    }

    _isTokenFresh(token) {
        if (!token || typeof token !== 'string') return false;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const exp = payload.exp;
            if (!exp) return false;
            // Token must be valid for at least another 60 seconds
            return (Date.now() / 1000) < (exp - 60);
        } catch {
            return false;
        }
    }

    _saveCachedToken(token) {
        this.token = token;
        try {
            const record = { token, savedAt: Date.now() };
            localStorage.setItem(this.storageKey, JSON.stringify(record));
        } catch {
            // Ignore storage quota/permission issues
        }
    }

    _clearCachedToken() {
        this.token = null;
        try {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
        } catch {
            // Ignore storage issues
        }
    }

    /**
     * Authenticate runtime application strictly as rfall@zece.info
     */
    async authenticate(force = false) {
        if (!force && this.token && this._isTokenFresh(this.token)) {
            return this.token;
        }

        if (this.authPromise) {
            return this.authPromise;
        }

        this.authPromise = (async () => {
            try {
                const authUrl = `${this.baseUrl}/api/collections/${encodeURIComponent(this.authCollection)}/auth-with-password`;
                const res = await fetch(authUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identity: this.identity,
                        password: this.password
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Authentication failed with HTTP ${res.status}`);
                }

                const data = await res.json();
                if (!data.token) {
                    throw new Error('Authentication response did not contain a token.');
                }

                this._saveCachedToken(data.token);
                return this.token;
            } finally {
                this.authPromise = null;
            }
        })();

        return this.authPromise;
    }

    /**
     * Authenticated REST request with automatic token injection and 401 auto-refresh
     */
    async request(path, options = {}, isRetry = false) {
        // Authenticate before making requests to secured collections
        const isAuthEndpoint = path.includes('/auth-with-password');
        let token = null;

        if (!isAuthEndpoint) {
            try {
                token = await this.authenticate(false);
            } catch (authErr) {
                console.error('[PocketBase Auth Error]', authErr);
                throw authErr;
            }
        }

        const headers = Object.assign({}, options.headers);
        if (token && !headers['Authorization']) {
            headers['Authorization'] = token;
        }

        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        if (!isFormData && options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const reqOptions = {
            ...options,
            headers
        };

        const res = await fetch(`${this.baseUrl}${path}`, reqOptions);

        if (res.status === 204) {
            return null;
        }

        // On 401 Unauthorized, refresh token once and retry
        if (res.status === 401 && !isRetry && !isAuthEndpoint) {
            this._clearCachedToken();
            await this.authenticate(true);
            return this.request(path, options, true);
        }

        const text = await res.text();
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        if (!res.ok) {
            const msg = data?.message || `HTTP ${res.status}`;
            const err = new Error(msg);
            err.status = res.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    async health() {
        return this.request('/api/health');
    }

    async listRecords(collection, { page = 1, perPage = 200, sort = '', filter = '' } = {}) {
        const params = new URLSearchParams({
            page: String(page),
            perPage: String(perPage)
        });
        if (sort) params.set('sort', sort);
        if (filter) params.set('filter', filter);
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records?${params}`);
    }

    async createRecord(collection, body) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records`, {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body)
        });
    }

    async updateRecord(collection, id, body) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: isFormData ? body : JSON.stringify(body)
        });
    }

    async deleteRecord(collection, id) {
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
    }

    getFileUrl(collection, recordId, filename, thumb = '') {
        if (!recordId || !filename) return '';
        const base = `${this.baseUrl}/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(recordId)}/${encodeURIComponent(filename)}`;
        const params = new URLSearchParams();
        if (thumb) params.set('thumb', thumb);
        if (this.token) params.set('token', this.token);
        const query = params.toString();
        return query ? `${base}?${query}` : base;
    }

    subscribe(topic, onMessage, onStatusChange) {
        this.unsubscribe();
        this.currentTopic = topic;
        this.onMessageCallback = onMessage;
        this.onStatusChangeCallback = onStatusChange;

        try {
            const es = new EventSource(`${this.baseUrl}/api/realtime`);
            this.eventSource = es;

            es.addEventListener('PB_CONNECT', async (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    this.clientId = payload.clientId;

                    // Ensure authenticated token is passed to realtime subscription
                    const token = await this.authenticate();
                    await this.request('/api/realtime', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            clientId: this.clientId,
                            subscriptions: [topic]
                        })
                    });
                    if (this.onStatusChangeCallback) this.onStatusChangeCallback('live');
                } catch (err) {
                    console.warn('[PocketBase Realtime Sub Error]', err);
                    if (this.onStatusChangeCallback) this.onStatusChangeCallback('connected');
                }
            });

            es.addEventListener(topic, (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (this.onMessageCallback) this.onMessageCallback(payload);
                } catch {
                    // ignore malformed realtime frame
                }
            });

            es.onerror = () => {
                if (this.onStatusChangeCallback) this.onStatusChangeCallback('reconnecting');
            };
        } catch {
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('connected');
        }
    }

    unsubscribe() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.clientId = null;
            this.currentTopic = null;
        }
    }
}

// Global initialization
window.pb = new PocketBaseClient(PB_CONFIG);
window.RFALL = {
    ALLIANCES: PB_CONFIG.alliancesCollection,
    LOGS: PB_CONFIG.logsCollection,
    PREFIX: 'RFALL_'
};

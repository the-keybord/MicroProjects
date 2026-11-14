/**
 * PocketBase REST + Realtime Client for SumoSpik (Sumobot Scoring System)
 * Backend Target: https://db.zece.info
 * Assigned Prefix: sumospik_
 * Dedicated Service User: sumospik@zece.info
 * Security Standard: Least Privilege (API rules locked to sumospik@zece.info)
 */

const PB_CONFIG = {
    baseUrl: 'https://db.zece.info',
    authCollection: 'users',
    identity: 'sumospik@zece.info',
    password: 'sumospik_Zece2026!secret',
    tokenStorageKey: 'sumospik_pb_token',
    prefix: 'sumospik_',
    collections: {
        championships: 'sumospik_championships',
        teams: 'sumospik_teams',
        matches: 'sumospik_matches',
        settings: 'sumospik_settings'
    }
};

// Allow environment/runtime overrides
if (typeof window !== 'undefined' && window.SUMOSPIK_CONFIG) {
    Object.assign(PB_CONFIG, window.SUMOSPIK_CONFIG);
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
        this.subscriptions = new Map(); // topic -> callbacks

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
            return (Date.now() / 1000) < (exp - 60);
        } catch {
            return false;
        }
    }

    _saveCachedToken(token) {
        this.token = token;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({ token, savedAt: Date.now() }));
        } catch {
            // Ignore storage issues
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
                    throw new Error(errData.message || `Auth failed with HTTP ${res.status}`);
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

    async request(path, options = {}, isRetry = false) {
        const isAuthEndpoint = path.includes('/auth-with-password');
        let token = null;

        if (!isAuthEndpoint) {
            try {
                token = await this.authenticate(false);
            } catch (err) {
                console.error('[SumoSpik PB Auth Error]', err);
                throw err;
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

        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers
        });

        if (res.status === 204) {
            return null;
        }

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

    async listRecords(collection, { page = 1, perPage = 200, sort = '', filter = '' } = {}) {
        const params = new URLSearchParams({
            page: String(page),
            perPage: String(perPage)
        });
        if (sort) params.set('sort', sort);
        if (filter) params.set('filter', filter);
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records?${params}`);
    }

    async getRecord(collection, id) {
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`);
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

    /**
     * Subscribe to one or multiple collection topics with realtime SSE
     */
    subscribe(topic, onMessage, onStatusChange) {
        this.subscriptions.set(topic, onMessage);
        this._ensureRealtimeConnected(onStatusChange);
    }

    unsubscribe(topic) {
        if (topic) {
            this.subscriptions.delete(topic);
        } else {
            this.subscriptions.clear();
        }

        if (this.subscriptions.size === 0 && this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.clientId = null;
        }
    }

    _ensureRealtimeConnected(onStatusChange) {
        if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
            this._submitSubscriptions();
            return;
        }

        if (this.eventSource) {
            this.eventSource.close();
        }

        try {
            const es = new EventSource(`${this.baseUrl}/api/realtime`);
            this.eventSource = es;

            es.addEventListener('PB_CONNECT', async (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    this.clientId = payload.clientId;
                    await this._submitSubscriptions();
                    if (onStatusChange) onStatusChange('live');
                } catch {
                    if (onStatusChange) onStatusChange('connected');
                }
            });

            // Listen to each subscribed topic
            const dispatch = (evt) => {
                try {
                    const payload = JSON.parse(evt.data);
                    const cb = this.subscriptions.get(evt.type) || this.subscriptions.get('*');
                    if (cb) cb(payload);
                } catch (e) {
                    // Ignore parse error
                }
            };

            for (const t of this.subscriptions.keys()) {
                es.addEventListener(t, dispatch);
            }

            es.onerror = () => {
                if (onStatusChange) onStatusChange('reconnecting');
            };
        } catch {
            if (onStatusChange) onStatusChange('connected');
        }
    }

    async _submitSubscriptions() {
        if (!this.clientId || this.subscriptions.size === 0) return;
        try {
            const token = await this.authenticate();
            await this.request('/api/realtime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    clientId: this.clientId,
                    subscriptions: Array.from(this.subscriptions.keys())
                })
            });
        } catch (err) {
            console.warn('[SumoSpik Realtime Sync Warning]', err);
        }
    }
}

window.pb = new PocketBaseClient(PB_CONFIG);
window.SUMOSPIK = PB_CONFIG.collections;

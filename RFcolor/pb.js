/**
 * Lightweight zero-dependency PocketBase REST + Realtime client
 * Target backend: https://db.zece.info
 * Collections: RFALL_alliances, RFALL_logs
 */
const PB_BASE_URL = 'https://db.zece.info';
const ALLIANCES_COLLECTION = 'RFALL_alliances';
const LOGS_COLLECTION = 'RFALL_logs';

class PocketBaseClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.eventSource = null;
        this.clientId = null;
    }

    async request(path, options = {}) {
        const res = await fetch(`${this.baseUrl}${path}`, options);
        if (res.status === 204) {
            return null;
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

    async listRecords(collection, { page = 1, perPage = 200, sort = '' } = {}) {
        const params = new URLSearchParams({
            page: String(page),
            perPage: String(perPage)
        });
        if (sort) params.set('sort', sort);
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records?${params}`);
    }

    async createRecord(collection, body) {
        const isFormData = body instanceof FormData;
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records`, {
            method: 'POST',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? body : JSON.stringify(body)
        });
    }

    async updateRecord(collection, id, body) {
        const isFormData = body instanceof FormData;
        return this.request(`/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
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
        return thumb ? `${base}?thumb=${encodeURIComponent(thumb)}` : base;
    }

    subscribe(topic, onMessage, onStatusChange) {
        this.unsubscribe();
        try {
            const es = new EventSource(`${this.baseUrl}/api/realtime`);
            this.eventSource = es;

            es.addEventListener('PB_CONNECT', async (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    this.clientId = payload.clientId;
                    await this.request('/api/realtime', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId: this.clientId,
                            subscriptions: [topic]
                        })
                    });
                    if (onStatusChange) onStatusChange('live');
                } catch {
                    if (onStatusChange) onStatusChange('connected');
                }
            });

            es.addEventListener(topic, (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (onMessage) onMessage(payload);
                } catch {
                    // ignore malformed realtime frame
                }
            });

            es.onerror = () => {
                if (onStatusChange) onStatusChange('reconnecting');
            };
        } catch {
            if (onStatusChange) onStatusChange('connected');
        }
    }

    unsubscribe() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.clientId = null;
        }
    }
}

window.pb = new PocketBaseClient(PB_BASE_URL);
window.RFALL = {
    ALLIANCES: ALLIANCES_COLLECTION,
    LOGS: LOGS_COLLECTION
};


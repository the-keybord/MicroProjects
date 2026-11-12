(() => {
    'use strict';

    const { pb, RFALL } = window;

    const QUICK_SWATCHES = [
        '#1A56DB', '#0F52BA', '#008080', '#3EB489', '#50C878',
        '#DC143C', '#FF2400', '#F28500', '#FFD700', '#8F00FF',
        '#9966CC', '#708090', '#1B1B1B'
    ];

    const MAX_LOGO_BYTES = 5 * 1024 * 1024;
    const ALLOWED_LOGO_TYPES = new Set([
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/svg+xml',
        'image/gif'
    ]);

    const state = {
        alliances: [],
        activeView: localStorage.getItem('rfall_active_view') === 'occupied' ? 'occupied' : 'all',
        search: '',
        theme: localStorage.getItem('rfall_theme') || 'light',
        editingRecord: null,
        pendingLogoFile: null,
        pendingObjectUrl: null,
        removeLogo: false,
        saving: false,
        confirmCallback: null
    };

    const el = {
        connectionPill: document.getElementById('connection-status'),
        connectionLabel: document.getElementById('connection-label'),
        tabAll: document.getElementById('tab-all'),
        tabOccupied: document.getElementById('tab-occupied'),
        countAll: document.getElementById('count-all'),
        countOccupied: document.getElementById('count-occupied'),
        searchInput: document.getElementById('search-input'),
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        errorMessage: document.getElementById('error-message'),
        emptyState: document.getElementById('empty-state'),
        emptyMessage: document.getElementById('empty-message'),
        rosterGrid: document.getElementById('roster-grid'),
        btnRetry: document.getElementById('btn-retry'),
        btnResetView: document.getElementById('btn-reset-view'),
        btnNewAlliance: document.getElementById('btn-new-alliance'),
        btnTheme: document.getElementById('btn-theme'),
        themeIconDark: document.getElementById('theme-icon-dark'),
        themeIconLight: document.getElementById('theme-icon-light'),

        // Alliance Modal
        modal: document.getElementById('alliance-modal'),
        modalColorStrip: document.getElementById('modal-color-strip'),
        modalEyebrow: document.getElementById('modal-eyebrow'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        allianceForm: document.getElementById('alliance-form'),
        formRecordId: document.getElementById('form-record-id'),
        formCode: document.getElementById('form-code'),
        formName: document.getElementById('form-name'),
        formColorPicker: document.getElementById('form-color-picker'),
        formColorHex: document.getElementById('form-color-hex'),
        quickSwatches: document.getElementById('quick-swatches'),
        formMembers: document.getElementById('form-members'),
        btnClearMembers: document.getElementById('btn-clear-members'),
        memberPreviewChips: document.getElementById('member-preview-chips'),
        formRobots: document.getElementById('form-robots'),
        btnClearRobots: document.getElementById('btn-clear-robots'),
        robotPreviewChips: document.getElementById('robot-preview-chips'),
        formNotes: document.getElementById('form-notes'),
        formLogoInput: document.getElementById('form-logo-input'),
        logoDropzone: document.getElementById('logo-dropzone'),
        logoPreviewImg: document.getElementById('logo-preview-img'),
        logoPreviewFallback: document.getElementById('logo-preview-fallback'),
        btnRemoveLogo: document.getElementById('btn-remove-logo'),
        btnDeleteAlliance: document.getElementById('btn-delete-alliance'),
        btnCancelModal: document.getElementById('btn-cancel-modal'),
        btnSaveAlliance: document.getElementById('btn-save-alliance'),

        // Confirm Modal
        confirmModal: document.getElementById('confirm-modal'),
        confirmTitle: document.getElementById('confirm-title'),
        confirmMessage: document.getElementById('confirm-message'),
        confirmCancel: document.getElementById('confirm-cancel'),
        confirmOk: document.getElementById('confirm-ok'),

        // CSV Modal
        btnCsvModal: document.getElementById('btn-csv-modal'),
        csvModal: document.getElementById('csv-modal'),
        csvModalClose: document.getElementById('csv-modal-close'),
        csvCancel: document.getElementById('csv-cancel'),
        csvTextarea: document.getElementById('csv-textarea'),
        csvFileInput: document.getElementById('csv-file-input'),
        csvSummary: document.getElementById('csv-summary'),
        btnDownloadCsv: document.getElementById('btn-download-csv'),
        btnApplyCsv: document.getElementById('btn-apply-csv'),

        // Activity Sheet
        btnActivity: document.getElementById('btn-activity'),
        activityBackdrop: document.getElementById('activity-backdrop'),
        activitySheet: document.getElementById('activity-sheet'),
        activityClose: document.getElementById('activity-close'),
        activityList: document.getElementById('activity-list'),

        // Snackbar
        snackbar: document.getElementById('snackbar'),
        snackbarText: document.getElementById('snackbar-text')
    };

    let snackbarTimer = null;

    function showSnackbar(message) {
        el.snackbarText.textContent = message;
        el.snackbar.hidden = false;
        clearTimeout(snackbarTimer);
        snackbarTimer = setTimeout(() => {
            el.snackbar.hidden = true;
        }, 3200);
    }

    function setConnectionStatus(status) {
        el.connectionPill.classList.remove('online', 'offline');
        if (status === 'live') {
            el.connectionPill.classList.add('online');
            el.connectionLabel.textContent = 'Live';
        } else if (status === 'connected' || status === 'reconnecting') {
            el.connectionPill.classList.add('online');
            el.connectionLabel.textContent = status === 'connected' ? 'Connected' : 'Syncing';
        } else if (status === 'offline') {
            el.connectionPill.classList.add('offline');
            el.connectionLabel.textContent = 'Offline';
        } else {
            el.connectionLabel.textContent = 'Connecting';
        }
    }

    // --- Color & Text Utilities ---
    function normalizeHex(hex) {
        if (!hex) return '#1A56DB';
        const trimmed = hex.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
        if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
        return '#1A56DB';
    }

    function getContrastColor(hex) {
        const clean = normalizeHex(hex).slice(1);
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
        return lum > 0.42 ? '#111318' : '#FFFFFF';
    }

    function getInitials(name, code) {
        const words = (name || '')
            .replace(/alliance/i, '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        if (words.length === 1 && words[0].length >= 2) {
            return words[0].slice(0, 2).toUpperCase();
        }
        return (code || 'RF').slice(0, 2).toUpperCase();
    }

    function parseTokens(str) {
        if (!str || !str.trim()) return [];
        if (str.includes(',')) {
            return str.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [str.trim()];
    }

    function isOccupied(record) {
        return Boolean(
            (record.members && record.members.trim() !== '') ||
            (record.robots && record.robots.trim() !== '')
        );
    }

    function getLogoThumbUrl(record, thumbSize = '256x256') {
        if (!record || !record.logo) return '';
        const isSvg = record.logo.toLowerCase().endsWith('.svg');
        return pb.getFileUrl(RFALL.ALLIANCES, record.id, record.logo, isSvg ? '' : thumbSize);
    }

    function formatRelativeTime(isoStr) {
        if (!isoStr) return 'Recently';
        const ts = Date.parse(isoStr.replace(' ', 'T'));
        if (Number.isNaN(ts)) return '';
        const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    // --- Theme & Primary Views ---
    function applyTheme(theme) {
        state.theme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('rfall_theme', state.theme);
        el.themeIconDark.hidden = state.theme === 'dark';
        el.themeIconLight.hidden = state.theme === 'light';
    }

    function setActiveView(view) {
        state.activeView = view === 'occupied' ? 'occupied' : 'all';
        localStorage.setItem('rfall_active_view', state.activeView);

        const isAll = state.activeView === 'all';
        el.tabAll.classList.toggle('active', isAll);
        el.tabAll.setAttribute('aria-selected', String(isAll));
        el.tabOccupied.classList.toggle('active', !isAll);
        el.tabOccupied.setAttribute('aria-selected', String(!isAll));

        renderAll();
    }

    // --- Data Fetching & Realtime ---
    async function loadAlliances() {
        el.loadingState.hidden = false;
        el.errorState.hidden = true;
        el.emptyState.hidden = true;
        el.rosterGrid.hidden = true;

        try {
            const res = await pb.listRecords(RFALL.ALLIANCES, {
                perPage: 200,
                sort: 'sort_order,code'
            });
            state.alliances = res.items || [];
            setConnectionStatus('connected');
            renderAll();

            pb.subscribe(
                RFALL.ALLIANCES,
                handleRealtimeEvent,
                (rtStatus) => setConnectionStatus(rtStatus)
            );
        } catch (err) {
            setConnectionStatus('offline');
            el.loadingState.hidden = true;
            el.errorState.hidden = false;
            el.errorMessage.textContent = `Could not load alliances from PocketBase: ${err.message}`;
        }
    }

    function handleRealtimeEvent(event) {
        const { action, record } = event || {};
        if (!record || !record.id) return;

        if (action === 'create') {
            if (!state.alliances.some((a) => a.id === record.id)) {
                state.alliances.push(record);
            }
        } else if (action === 'update') {
            const idx = state.alliances.findIndex((a) => a.id === record.id);
            if (idx !== -1) state.alliances[idx] = record;
            else state.alliances.push(record);
        } else if (action === 'delete') {
            state.alliances = state.alliances.filter((a) => a.id !== record.id);
        }

        renderAll();
    }

    async function logActivity(allianceCode, allianceName, action, details) {
        try {
            await pb.createRecord(RFALL.LOGS, {
                alliance_code: allianceCode || '',
                alliance_name: allianceName || 'Roster',
                action,
                details: details || ''
            });
        } catch {
            // Best-effort audit logging
        }
    }

    function compareCode(a, b) {
        const orderA = Number.isFinite(a.sort_order) && a.sort_order > 0 ? a.sort_order : parseInt(a.code, 10) || 9999;
        const orderB = Number.isFinite(b.sort_order) && b.sort_order > 0 ? b.sort_order : parseInt(b.code, 10) || 9999;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.code || '').localeCompare(String(b.code || ''));
    }

    // --- Rendering ---
    function getSearchFiltered(list) {
        const q = state.search.trim().toLowerCase();
        if (!q) return list;
        return list.filter((a) => {
            const hay = `${a.code} ${a.name} ${a.members || ''} ${a.robots || ''} ${a.notes || ''}`.toLowerCase();
            return hay.includes(q);
        });
    }

    function renderAll() {
        el.loadingState.hidden = true;
        el.errorState.hidden = true;

        const sortedAll = [...state.alliances].sort(compareCode);
        const occupiedAll = sortedAll.filter(isOccupied);

        el.countAll.textContent = String(sortedAll.length);
        el.countOccupied.textContent = String(occupiedAll.length);

        const source = state.activeView === 'occupied' ? occupiedAll : sortedAll;
        const items = getSearchFiltered(source);

        if (items.length === 0) {
            el.rosterGrid.hidden = true;
            el.emptyState.hidden = false;
            el.emptyMessage.textContent = state.search.trim()
                ? 'No alliances match your search.'
                : state.activeView === 'occupied'
                    ? 'No occupied alliances yet.'
                    : 'No alliances in the roster yet.';
            return;
        }

        el.emptyState.hidden = true;
        el.rosterGrid.hidden = false;
        el.rosterGrid.classList.toggle('occupied-mode', state.activeView === 'occupied');

        const frag = document.createDocumentFragment();
        items.forEach((alliance) => frag.appendChild(createMinimalColorCard(alliance)));
        el.rosterGrid.replaceChildren(frag);
    }

    // Minimal Colored Card (Centered Logo + Hover Information)
    function createMinimalColorCard(a) {
        const occupied = isOccupied(a);
        const color = normalizeHex(a.color);
        const contrast = getContrastColor(color);

        const card = document.createElement('article');
        card.className = `color-card ${occupied ? 'is-occupied' : 'is-available'}`;
        card.style.backgroundColor = color;
        card.style.color = contrast;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${a.name} (${a.code}) - ${occupied ? 'Occupied' : 'Available'}`);

        const updatePopoverPosition = () => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const halfPopover = 138;
            card.classList.toggle('flip-down', rect.top < 250);
            card.classList.toggle('align-left', cardCenterX - halfPopover < 8);
            card.classList.toggle('align-right', cardCenterX + halfPopover > window.innerWidth - 8);
        };
        card.addEventListener('mouseenter', updatePopoverPosition);
        card.addEventListener('focusin', updatePopoverPosition);

        card.addEventListener('click', () => openEditModal(a));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEditModal(a);
            }
        });

        const frame = document.createElement('div');
        frame.className = 'color-card-frame';
        card.appendChild(frame);

        const cornerDot = document.createElement('span');
        cornerDot.className = 'corner-dot';
        cornerDot.setAttribute('aria-hidden', 'true');
        card.appendChild(cornerDot);

        // Centered Logo
        const logoWrap = document.createElement('div');
        if (a.logo) {
            logoWrap.className = 'center-logo-wrap has-image';
            const img = document.createElement('img');
            img.src = getLogoThumbUrl(a, '256x256');
            img.alt = `${a.name} logo`;
            img.loading = 'lazy';
            logoWrap.appendChild(img);
        } else {
            logoWrap.className = 'center-logo-wrap is-monogram';
            logoWrap.textContent = getInitials(a.name, a.code);
        }
        card.appendChild(logoWrap);

        // Hover Information Popover
        const popover = document.createElement('div');
        popover.className = 'hover-popover';

        const popHeader = document.createElement('div');
        popHeader.className = 'popover-header';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'popover-title-wrap';
        const swatch = document.createElement('span');
        swatch.className = 'popover-swatch';
        swatch.style.backgroundColor = color;
        const popTitle = document.createElement('h4');
        popTitle.className = 'popover-title';
        popTitle.textContent = `${a.code} · ${a.name}`;
        titleWrap.append(swatch, popTitle);

        const badge = document.createElement('span');
        badge.className = `status-badge ${occupied ? 'occupied' : 'available'}`;
        badge.textContent = occupied ? 'Occupied' : 'Available';
        popHeader.append(titleWrap, badge);
        popover.appendChild(popHeader);

        // Members in hover card
        const memSec = document.createElement('div');
        memSec.className = 'popover-section';
        const memLabel = document.createElement('span');
        memLabel.className = 'popover-label';
        memLabel.textContent = 'Members';
        memSec.appendChild(memLabel);
        if (a.members && a.members.trim()) {
            const memVal = document.createElement('div');
            memVal.className = 'popover-value';
            memVal.textContent = parseTokens(a.members).join(', ');
            memSec.appendChild(memVal);
        } else {
            const memEmpty = document.createElement('div');
            memEmpty.className = 'popover-empty';
            memEmpty.textContent = 'No members yet';
            memSec.appendChild(memEmpty);
        }
        popover.appendChild(memSec);

        // Robots in hover card
        const robSec = document.createElement('div');
        robSec.className = 'popover-section';
        const robLabel = document.createElement('span');
        robLabel.className = 'popover-label';
        robLabel.textContent = 'Robots';
        robSec.appendChild(robLabel);
        if (a.robots && a.robots.trim()) {
            const robVal = document.createElement('div');
            robVal.className = 'popover-value';
            robVal.textContent = parseTokens(a.robots).join(', ');
            robSec.appendChild(robVal);
        } else {
            const robEmpty = document.createElement('div');
            robEmpty.className = 'popover-empty';
            robEmpty.textContent = 'No robots listed';
            robSec.appendChild(robEmpty);
        }
        popover.appendChild(robSec);

        if (a.notes && a.notes.trim()) {
            const noteSec = document.createElement('div');
            noteSec.className = 'popover-section';
            const noteLabel = document.createElement('span');
            noteLabel.className = 'popover-label';
            noteLabel.textContent = 'Notes';
            const noteVal = document.createElement('div');
            noteVal.className = 'popover-value';
            noteVal.textContent = a.notes.trim();
            noteSec.append(noteLabel, noteVal);
            popover.appendChild(noteSec);
        }

        const hint = document.createElement('div');
        hint.className = 'popover-hint';
        hint.textContent = 'Click card to edit logo, members & robots';
        popover.appendChild(hint);

        card.appendChild(popover);
        return card;
    }

    // --- Edit / Create Modal ---
    function initQuickSwatches() {
        const frag = document.createDocumentFragment();
        QUICK_SWATCHES.forEach((hex) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'swatch-btn';
            btn.style.backgroundColor = hex;
            btn.title = hex;
            btn.setAttribute('aria-label', `Select color ${hex}`);
            btn.addEventListener('click', () => syncColorInputs(hex));
            frag.appendChild(btn);
        });
        el.quickSwatches.replaceChildren(frag);
    }

    function syncColorInputs(hex) {
        const norm = normalizeHex(hex);
        el.formColorPicker.value = norm;
        el.formColorHex.value = norm;
        el.modalColorStrip.style.backgroundColor = norm;
        updateLogoPreview();
    }

    function updateChipPreview(inputEl, containerEl, chipClass) {
        const tokens = parseTokens(inputEl.value);
        if (tokens.length === 0) {
            containerEl.replaceChildren();
            return;
        }
        const frag = document.createDocumentFragment();
        tokens.forEach((name) => {
            const chip = document.createElement('span');
            chip.className = chipClass;
            chip.textContent = name;
            frag.appendChild(chip);
        });
        containerEl.replaceChildren(frag);
    }

    function clearPendingObjectUrl() {
        if (state.pendingObjectUrl) {
            URL.revokeObjectURL(state.pendingObjectUrl);
            state.pendingObjectUrl = null;
        }
    }

    function updateLogoPreview() {
        const color = normalizeHex(el.formColorHex.value);
        const name = el.formName.value.trim() || 'Alliance';
        const code = el.formCode.value.trim() || 'RF';

        if (state.pendingLogoFile && state.pendingObjectUrl) {
            el.logoPreviewImg.src = state.pendingObjectUrl;
            el.logoPreviewImg.hidden = false;
            el.logoPreviewFallback.hidden = true;
            el.btnRemoveLogo.hidden = false;
            return;
        }

        if (!state.removeLogo && state.editingRecord && state.editingRecord.logo) {
            el.logoPreviewImg.src = getLogoThumbUrl(state.editingRecord, '256x256');
            el.logoPreviewImg.hidden = false;
            el.logoPreviewFallback.hidden = true;
            el.btnRemoveLogo.hidden = false;
            return;
        }

        el.logoPreviewImg.hidden = true;
        el.logoPreviewImg.removeAttribute('src');
        el.logoPreviewFallback.hidden = false;
        el.logoPreviewFallback.style.backgroundColor = color;
        el.logoPreviewFallback.style.color = getContrastColor(color);
        el.logoPreviewFallback.textContent = getInitials(name, code);
        el.btnRemoveLogo.hidden = true;
    }

    function handleLogoFileSelection(file) {
        if (!file) return;
        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            showSnackbar('Unsupported image type. Use PNG, JPG, WebP, SVG, or GIF.');
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            showSnackbar('Image exceeds 5 MB limit.');
            return;
        }

        clearPendingObjectUrl();
        state.pendingLogoFile = file;
        state.pendingObjectUrl = URL.createObjectURL(file);
        state.removeLogo = false;
        updateLogoPreview();
    }

    function openEditModal(record = null) {
        clearPendingObjectUrl();
        state.pendingLogoFile = null;
        state.removeLogo = false;
        state.editingRecord = record;
        el.formLogoInput.value = '';

        if (record) {
            el.modalEyebrow.textContent = `ALLIANCE #${record.code}`;
            el.modalTitle.textContent = `Edit ${record.name}`;
            el.formRecordId.value = record.id;
            el.formCode.value = record.code || '';
            el.formName.value = record.name || '';
            el.formMembers.value = record.members || '';
            el.formRobots.value = record.robots || '';
            el.formNotes.value = record.notes || '';
            syncColorInputs(record.color || '#1A56DB');
            el.btnDeleteAlliance.hidden = false;
            el.btnSaveAlliance.textContent = 'Save Changes';
        } else {
            const nextNum = state.alliances.reduce((max, a) => {
                const n = parseInt(a.code, 10);
                return Number.isFinite(n) && n > max ? n : max;
            }, 0) + 1;
            const nextCode = String(nextNum).padStart(2, '0');

            el.modalEyebrow.textContent = 'NEW ALLIANCE';
            el.modalTitle.textContent = 'Create Alliance';
            el.formRecordId.value = '';
            el.formCode.value = nextCode;
            el.formName.value = '';
            el.formMembers.value = '';
            el.formRobots.value = '';
            el.formNotes.value = '';
            syncColorInputs('#1A56DB');
            el.btnDeleteAlliance.hidden = true;
            el.btnSaveAlliance.textContent = 'Create Alliance';
        }

        updateChipPreview(el.formMembers, el.memberPreviewChips, 'member-chip');
        updateChipPreview(el.formRobots, el.robotPreviewChips, 'robot-chip');
        updateLogoPreview();
        el.modal.hidden = false;
        el.formMembers.focus();
    }

    function closeEditModal() {
        el.modal.hidden = true;
        clearPendingObjectUrl();
        state.pendingLogoFile = null;
        state.editingRecord = null;
    }

    async function handleSaveAlliance(e) {
        e.preventDefault();
        if (state.saving) return;

        const code = el.formCode.value.trim();
        const name = el.formName.value.trim();
        const color = normalizeHex(el.formColorHex.value);
        const members = el.formMembers.value.trim();
        const robots = el.formRobots.value.trim();
        const notes = el.formNotes.value.trim();

        if (!code || !name) {
            showSnackbar('Code and Alliance Name are required.');
            return;
        }

        const duplicate = state.alliances.find(
            (a) => String(a.code).trim() === code && a.id !== state.editingRecord?.id
        );
        if (duplicate) {
            showSnackbar(`Code #${code} is already used by ${duplicate.name}.`);
            return;
        }

        const sortOrder = parseInt(code, 10) || (state.alliances.length + 1);

        state.saving = true;
        el.btnSaveAlliance.disabled = true;
        el.btnSaveAlliance.textContent = 'Saving...';

        try {
            const formData = new FormData();
            formData.append('code', code);
            formData.append('name', name);
            formData.append('color', color);
            formData.append('members', members);
            formData.append('robots', robots);
            formData.append('notes', notes);
            formData.append('sort_order', String(sortOrder));

            if (state.pendingLogoFile) {
                formData.append('logo', state.pendingLogoFile);
            } else if (state.removeLogo) {
                formData.append('logo', '');
            }

            let saved;
            if (state.editingRecord) {
                const prev = state.editingRecord;
                saved = await pb.updateRecord(RFALL.ALLIANCES, prev.id, formData);

                const idx = state.alliances.findIndex((a) => a.id === saved.id);
                if (idx !== -1) state.alliances[idx] = saved;

                const wasOcc = isOccupied(prev);
                const nowOcc = isOccupied(saved);
                let action = 'updated';
                let details = `Members: ${saved.members || 'None'} | Robots: ${saved.robots || 'None'}`;
                if (!wasOcc && nowOcc) {
                    action = 'claimed';
                } else if (wasOcc && !nowOcc) {
                    action = 'released';
                    details = `Cleared previous roster`;
                } else if (state.pendingLogoFile) {
                    action = 'logo_updated';
                    details = `Uploaded logo (${state.pendingLogoFile.name})`;
                }
                logActivity(saved.code, saved.name, action, details);
                showSnackbar(`Saved ${saved.name}`);
            } else {
                saved = await pb.createRecord(RFALL.ALLIANCES, formData);
                if (!state.alliances.some((a) => a.id === saved.id)) {
                    state.alliances.push(saved);
                }
                logActivity(saved.code, saved.name, 'created', `Created ${saved.name}`);
                showSnackbar(`Created ${saved.name}`);
            }

            renderAll();
            closeEditModal();
        } catch (err) {
            showSnackbar(`Failed to save: ${err.message}`);
        } finally {
            state.saving = false;
            el.btnSaveAlliance.disabled = false;
            el.btnSaveAlliance.textContent = state.editingRecord ? 'Save Changes' : 'Create Alliance';
        }
    }

    function openConfirmDialog(title, message, onConfirm) {
        el.confirmTitle.textContent = title;
        el.confirmMessage.textContent = message;
        state.confirmCallback = onConfirm;
        el.confirmModal.hidden = false;
    }

    function closeConfirmDialog() {
        el.confirmModal.hidden = true;
        state.confirmCallback = null;
    }

    async function handleDeleteCurrentAlliance() {
        const record = state.editingRecord;
        if (!record) return;

        openConfirmDialog(
            `Delete ${record.name}?`,
            `Alliance #${record.code} (${record.name}) and any uploaded logo will be permanently deleted from PocketBase.`,
            async () => {
                try {
                    await pb.deleteRecord(RFALL.ALLIANCES, record.id);
                    state.alliances = state.alliances.filter((a) => a.id !== record.id);
                    logActivity(record.code, record.name, 'deleted', 'Removed alliance from roster');
                    renderAll();
                    closeConfirmDialog();
                    closeEditModal();
                    showSnackbar(`Deleted ${record.name}`);
                } catch (err) {
                    showSnackbar(`Delete failed: ${err.message}`);
                }
            }
        );
    }

    // --- CSV Import & Export ---
    function escapeCsvCell(val) {
        const str = String(val ?? '');
        if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    function generateCsvString() {
        const sorted = [...state.alliances].sort(compareCode);
        const lines = ['id,name,color,members,robots,notes'];
        sorted.forEach((a) => {
            lines.push([
                escapeCsvCell(a.code),
                escapeCsvCell(a.name),
                escapeCsvCell(a.color),
                escapeCsvCell(a.members || ''),
                escapeCsvCell(a.robots || ''),
                escapeCsvCell(a.notes || '')
            ].join(','));
        });
        return lines.join('\n');
    }

    function parseCsvLine(line) {
        const cells = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                cells.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current);
        return cells;
    }

    function cleanLegacyQuotes(str) {
        return String(str || '')
            .replace(/&quot;/g, '"')
            .trim()
            .replace(/^"+|"+$/g, '')
            .trim();
    }

    function parseCsvText(text) {
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const rows = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (i === 0 && /^id\s*,/i.test(line)) continue;

            const cols = parseCsvLine(line);
            if (cols.length < 3) continue;

            const code = (cols[0] || '').trim();
            const name = (cols[1] || '').trim();
            const color = normalizeHex(cols[2] || '#1A56DB');
            const members = cleanLegacyQuotes(cols[3] || '');
            const robots = cleanLegacyQuotes(cols[4] || '');
            const notes = cleanLegacyQuotes(cols[5] || '');

            if (code && name) {
                rows.push({ code, name, color, members, robots, notes });
            }
        }
        return rows;
    }

    function updateCsvSummary() {
        const rows = parseCsvText(el.csvTextarea.value);
        const byCode = new Map(state.alliances.map((a) => [String(a.code).trim(), a]));
        let updates = 0;
        let creates = 0;
        rows.forEach((r) => {
            if (byCode.has(r.code)) updates++;
            else creates++;
        });
        el.csvSummary.textContent = rows.length
            ? `Parsed ${rows.length} rows (${updates} existing to update, ${creates} new to create). Logos are preserved.`
            : 'No valid CSV rows detected.';
    }

    function openCsvModal() {
        el.csvTextarea.value = generateCsvString();
        updateCsvSummary();
        el.csvModal.hidden = false;
    }

    function closeCsvModal() {
        el.csvModal.hidden = true;
    }

    function downloadCsv() {
        const content = generateCsvString();
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'alliances.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showSnackbar('Downloaded alliances.csv');
    }

    async function applyCsvToPocketBase() {
        const rows = parseCsvText(el.csvTextarea.value);
        if (rows.length === 0) {
            showSnackbar('Nothing valid to sync.');
            return;
        }

        el.btnApplyCsv.disabled = true;
        el.btnApplyCsv.textContent = 'Syncing...';

        const byCode = new Map(state.alliances.map((a) => [String(a.code).trim(), a]));
        let updatedCount = 0;
        let createdCount = 0;

        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const existing = byCode.get(row.code);
                const sortOrder = parseInt(row.code, 10) || (i + 1);

                if (existing) {
                    const changed =
                        existing.name !== row.name ||
                        normalizeHex(existing.color) !== row.color ||
                        (existing.members || '') !== row.members ||
                        (existing.robots || '') !== row.robots ||
                        (existing.notes || '') !== row.notes;

                    if (changed) {
                        const updated = await pb.updateRecord(RFALL.ALLIANCES, existing.id, {
                            name: row.name,
                            color: row.color,
                            members: row.members,
                            robots: row.robots,
                            notes: row.notes,
                            sort_order: sortOrder
                        });
                        const idx = state.alliances.findIndex((a) => a.id === updated.id);
                        if (idx !== -1) state.alliances[idx] = updated;
                        updatedCount++;
                    }
                } else {
                    const created = await pb.createRecord(RFALL.ALLIANCES, {
                        code: row.code,
                        name: row.name,
                        color: row.color,
                        members: row.members,
                        robots: row.robots,
                        notes: row.notes,
                        sort_order: sortOrder
                    });
                    state.alliances.push(created);
                    createdCount++;
                }
            }

            logActivity('CSV', 'Bulk CSV Sync', 'imported', `Updated ${updatedCount}, created ${createdCount} alliances`);
            renderAll();
            closeCsvModal();
            showSnackbar(`Synced CSV: ${updatedCount} updated, ${createdCount} created.`);
        } catch (err) {
            showSnackbar(`CSV sync failed: ${err.message}`);
        } finally {
            el.btnApplyCsv.disabled = false;
            el.btnApplyCsv.textContent = 'Sync CSV to PocketBase';
        }
    }

    // --- Activity Side Sheet ---
    async function openActivitySheet() {
        el.activityBackdrop.hidden = false;
        el.activitySheet.hidden = false;
        el.activityList.innerHTML = '<p class="muted-text">Loading activity...</p>';

        try {
            const res = await pb.listRecords(RFALL.LOGS, {
                perPage: 40,
                sort: '-created'
            });
            const logs = res.items || [];
            if (logs.length === 0) {
                el.activityList.innerHTML = '<p class="muted-text">No activity recorded yet.</p>';
                return;
            }

            const frag = document.createDocumentFragment();
            logs.forEach((entry) => {
                const item = document.createElement('div');
                item.className = 'activity-item';

                const top = document.createElement('div');
                top.className = 'activity-top';

                const title = document.createElement('span');
                title.className = 'activity-title';
                title.textContent = entry.alliance_code
                    ? `#${entry.alliance_code} ${entry.alliance_name}`
                    : entry.alliance_name;

                const badge = document.createElement('span');
                badge.className = 'activity-badge';
                badge.textContent = entry.action;

                top.append(title, badge);
                item.appendChild(top);

                if (entry.details) {
                    const details = document.createElement('div');
                    details.className = 'activity-details';
                    details.textContent = entry.details;
                    item.appendChild(details);
                }

                const time = document.createElement('span');
                time.className = 'activity-time';
                time.textContent = formatRelativeTime(entry.created);
                item.appendChild(time);

                frag.appendChild(item);
            });
            el.activityList.replaceChildren(frag);
        } catch (err) {
            el.activityList.textContent = `Could not load activity: ${err.message}`;
        }
    }

    function closeActivitySheet() {
        el.activityBackdrop.hidden = true;
        el.activitySheet.hidden = true;
    }

    // --- Event Listeners ---
    function bindEvents() {
        el.btnTheme.addEventListener('click', () => {
            applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        });

        el.tabAll.addEventListener('click', () => setActiveView('all'));
        el.tabOccupied.addEventListener('click', () => setActiveView('occupied'));

        el.searchInput.addEventListener('input', (e) => {
            state.search = e.target.value;
            renderAll();
        });

        el.btnResetView.addEventListener('click', () => {
            state.search = '';
            el.searchInput.value = '';
            setActiveView('all');
        });

        el.btnRetry.addEventListener('click', loadAlliances);
        el.btnNewAlliance.addEventListener('click', () => openEditModal(null));

        // Modal controls
        el.modalClose.addEventListener('click', closeEditModal);
        el.btnCancelModal.addEventListener('click', closeEditModal);
        el.modal.addEventListener('click', (e) => {
            if (e.target === el.modal) closeEditModal();
        });
        el.allianceForm.addEventListener('submit', handleSaveAlliance);
        el.btnDeleteAlliance.addEventListener('click', handleDeleteCurrentAlliance);

        el.formColorPicker.addEventListener('input', (e) => syncColorInputs(e.target.value));
        el.formColorHex.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                el.formColorPicker.value = val;
                el.modalColorStrip.style.backgroundColor = val;
                updateLogoPreview();
            }
        });
        el.formName.addEventListener('input', updateLogoPreview);
        el.formCode.addEventListener('input', updateLogoPreview);

        el.formMembers.addEventListener('input', () => {
            updateChipPreview(el.formMembers, el.memberPreviewChips, 'member-chip');
        });
        el.btnClearMembers.addEventListener('click', () => {
            el.formMembers.value = '';
            updateChipPreview(el.formMembers, el.memberPreviewChips, 'member-chip');
            el.formMembers.focus();
        });

        el.formRobots.addEventListener('input', () => {
            updateChipPreview(el.formRobots, el.robotPreviewChips, 'robot-chip');
        });
        el.btnClearRobots.addEventListener('click', () => {
            el.formRobots.value = '';
            updateChipPreview(el.formRobots, el.robotPreviewChips, 'robot-chip');
            el.formRobots.focus();
        });

        // Logo upload & drag-and-drop
        el.formLogoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            handleLogoFileSelection(file);
        });

        el.btnRemoveLogo.addEventListener('click', () => {
            clearPendingObjectUrl();
            state.pendingLogoFile = null;
            state.removeLogo = true;
            el.formLogoInput.value = '';
            updateLogoPreview();
        });

        ['dragenter', 'dragover'].forEach((evt) => {
            el.logoDropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                el.logoDropzone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach((evt) => {
            el.logoDropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                el.logoDropzone.classList.remove('dragover');
            });
        });
        el.logoDropzone.addEventListener('drop', (e) => {
            const file = e.dataTransfer?.files?.[0];
            handleLogoFileSelection(file);
        });

        // Confirm modal
        el.confirmCancel.addEventListener('click', closeConfirmDialog);
        el.confirmModal.addEventListener('click', (e) => {
            if (e.target === el.confirmModal) closeConfirmDialog();
        });
        el.confirmOk.addEventListener('click', () => {
            if (state.confirmCallback) state.confirmCallback();
        });

        // CSV modal
        el.btnCsvModal.addEventListener('click', openCsvModal);
        el.csvModalClose.addEventListener('click', closeCsvModal);
        el.csvCancel.addEventListener('click', closeCsvModal);
        el.csvModal.addEventListener('click', (e) => {
            if (e.target === el.csvModal) closeCsvModal();
        });
        el.csvTextarea.addEventListener('input', updateCsvSummary);
        el.btnDownloadCsv.addEventListener('click', downloadCsv);
        el.btnApplyCsv.addEventListener('click', applyCsvToPocketBase);
        el.csvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            el.csvTextarea.value = await file.text();
            updateCsvSummary();
            e.target.value = '';
        });

        // Activity sheet
        el.btnActivity.addEventListener('click', openActivitySheet);
        el.activityClose.addEventListener('click', closeActivitySheet);
        el.activityBackdrop.addEventListener('click', closeActivitySheet);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!el.confirmModal.hidden) closeConfirmDialog();
                else if (!el.modal.hidden) closeEditModal();
                else if (!el.csvModal.hidden) closeCsvModal();
                else if (!el.activitySheet.hidden) closeActivitySheet();
                return;
            }

            if (
                e.key === '/' &&
                el.modal.hidden &&
                el.csvModal.hidden &&
                el.confirmModal.hidden &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA'
            ) {
                e.preventDefault();
                el.searchInput.focus();
            }
        });
    }

    // --- Boot ---
    applyTheme(state.theme);
    setActiveView(state.activeView);
    initQuickSwatches();
    bindEvents();
    loadAlliances();
})();

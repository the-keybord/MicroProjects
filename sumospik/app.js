(() => {
    'use strict';

    const { pb, SUMOSPIK } = window;

    // --- Application State ---
    const state = {
        championships: [],
        currentChamp: null,
        teams: [],
        matches: [],
        activeTab: 'matches',
        filterRound: 'all',
        filterStatus: 'all',
        searchMatches: '',
        searchTeams: '',
        theme: localStorage.getItem('sumospik_theme') || 'light',

        // Referee Console State
        referee: {
            activeMatch: null,
            timerSeconds: 180,
            timerTotal: 180,
            timerRunning: false,
            timerInterval: null,
            soundEnabled: true,
            redScore: 0,
            blueScore: 0,
            roundsData: []
        },

        confirmCallback: null
    };

    // --- DOM Elements Cache ---
    const el = {
        connectionPill: document.getElementById('connection-status'),
        connectionLabel: document.getElementById('connection-label'),
        btnTheme: document.getElementById('btn-theme'),
        themeIcon: document.getElementById('theme-icon'),

        // Championship Header
        champSelect: document.getElementById('champ-select'),
        btnNewChamp: document.getElementById('btn-new-champ'),
        btnEditChamp: document.getElementById('btn-edit-champ'),

        // Nav Tabs
        tabMatchesBtn: document.getElementById('tab-matches-btn'),
        tabStandingsBtn: document.getElementById('tab-standings-btn'),
        tabTeamsBtn: document.getElementById('tab-teams-btn'),
        tabSettingsBtn: document.getElementById('tab-settings-btn'),

        badgeMatchesCount: document.getElementById('badge-matches-count'),
        badgeStandingsCount: document.getElementById('badge-standings-count'),
        badgeTeamsCount: document.getElementById('badge-teams-count'),

        // Views
        viewMatches: document.getElementById('view-matches'),
        viewStandings: document.getElementById('view-standings'),
        viewTeams: document.getElementById('view-teams'),
        viewSettings: document.getElementById('view-settings'),

        // Matches View
        filterRound: document.getElementById('filter-round'),
        filterStatus: document.getElementById('filter-status'),
        searchMatches: document.getElementById('search-matches'),
        btnOpenGenerate: document.getElementById('btn-open-generate'),
        btnAddMatch: document.getElementById('btn-add-match'),
        matchesGrid: document.getElementById('matches-grid'),
        matchesEmpty: document.getElementById('matches-empty'),

        // Standings View
        standingsTbody: document.getElementById('standings-tbody'),
        standingsEmpty: document.getElementById('standings-empty'),
        btnRecalcStandings: document.getElementById('btn-recalc-standings'),

        // Teams View
        searchTeams: document.getElementById('search-teams'),
        btnOpenBulkTeams: document.getElementById('btn-open-bulk-teams'),
        btnAddTeam: document.getElementById('btn-add-team'),
        teamsGrid: document.getElementById('teams-grid'),
        teamsEmpty: document.getElementById('teams-empty'),

        // Settings View
        formRulesSettings: document.getElementById('form-rules-settings'),
        settingMatchFormat: document.getElementById('setting-match-format'),
        settingRoundTime: document.getElementById('setting-round-time'),
        settingPtsWin: document.getElementById('setting-pts-win'),
        settingPtsDraw: document.getElementById('setting-pts-draw'),
        settingPtsLoss: document.getElementById('setting-pts-loss'),
        btnTriggerSchedule: document.getElementById('btn-trigger-schedule'),
        btnClearMatches: document.getElementById('btn-clear-matches'),

        // Referee Modal
        modalReferee: document.getElementById('modal-referee'),
        refMatchTitle: document.getElementById('ref-match-title'),
        btnCloseReferee: document.getElementById('btn-close-referee'),
        digitalClock: document.getElementById('digital-clock'),
        btnTimerStart: document.getElementById('btn-timer-start'),
        btnTimerPause: document.getElementById('btn-timer-pause'),
        btnTimerReset: document.getElementById('btn-timer-reset'),
        btnTimerSub15: document.getElementById('btn-timer-sub15'),
        btnTimerAdd15: document.getElementById('btn-timer-add15'),
        btnSoundToggle: document.getElementById('btn-sound-toggle'),

        refRedName: document.getElementById('ref-red-name'),
        refRedRobot: document.getElementById('ref-red-robot'),
        refRedDots: document.getElementById('ref-red-dots'),
        refRedScore: document.getElementById('ref-red-score'),
        btnRedAddPt: document.getElementById('btn-red-add-pt'),
        btnRedSubPt: document.getElementById('btn-red-sub-pt'),

        refBlueName: document.getElementById('ref-blue-name'),
        refBlueRobot: document.getElementById('ref-blue-robot'),
        refBlueDots: document.getElementById('ref-blue-dots'),
        refBlueScore: document.getElementById('ref-blue-score'),
        btnBlueAddPt: document.getElementById('btn-blue-add-pt'),
        btnBlueSubPt: document.getElementById('btn-blue-sub-pt'),

        btnRefDraw: document.getElementById('btn-ref-draw'),
        btnRefFinish: document.getElementById('btn-ref-finish'),

        // Championship Modal
        modalChamp: document.getElementById('modal-champ'),
        modalChampTitle: document.getElementById('modal-champ-title'),
        formChamp: document.getElementById('form-champ'),
        champId: document.getElementById('champ-id'),
        champNameInput: document.getElementById('champ-name-input'),
        champCategoryInput: document.getElementById('champ-category-input'),
        champFormatInput: document.getElementById('champ-format-input'),
        champNotesInput: document.getElementById('champ-notes-input'),
        btnDeleteChamp: document.getElementById('btn-delete-champ'),
        btnCancelChamp: document.getElementById('btn-cancel-champ'),
        btnCloseChampModal: document.getElementById('btn-close-champ-modal'),

        // Team Modal
        modalTeam: document.getElementById('modal-team'),
        modalTeamTitle: document.getElementById('modal-team-title'),
        formTeam: document.getElementById('form-team'),
        teamId: document.getElementById('team-id'),
        teamNameInput: document.getElementById('team-name-input'),
        teamRobotInput: document.getElementById('team-robot-input'),
        teamClubInput: document.getElementById('team-club-input'),
        teamColorInput: document.getElementById('team-color-input'),
        btnDeleteTeam: document.getElementById('btn-delete-team'),
        btnCancelTeam: document.getElementById('btn-cancel-team'),
        btnCloseTeamModal: document.getElementById('btn-close-team-modal'),

        // Bulk Teams Modal
        modalBulkTeams: document.getElementById('modal-bulk-teams'),
        formBulkTeams: document.getElementById('form-bulk-teams'),
        bulkTeamsTextarea: document.getElementById('bulk-teams-textarea'),
        btnCancelBulk: document.getElementById('btn-cancel-bulk'),
        btnCloseBulkModal: document.getElementById('btn-close-bulk-modal'),

        // Generate Schedule Modal
        modalGenerate: document.getElementById('modal-generate'),
        formGenerateSchedule: document.getElementById('form-generate-schedule'),
        genFormatSelect: document.getElementById('gen-format-select'),
        groupCustomCount: document.getElementById('group-custom-count'),
        genCustomCount: document.getElementById('gen-custom-count'),
        genSummary: document.getElementById('gen-summary'),
        btnCancelGen: document.getElementById('btn-cancel-gen'),
        btnCloseGenModal: document.getElementById('btn-close-gen-modal'),

        // Confirm Modal
        modalConfirm: document.getElementById('modal-confirm'),
        confirmTitle: document.getElementById('confirm-title'),
        confirmMessage: document.getElementById('confirm-message'),
        btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
        btnConfirmOk: document.getElementById('btn-confirm-ok'),

        // Snackbar
        snackbar: document.getElementById('snackbar'),
        snackbarText: document.getElementById('snackbar-text')
    };

    let snackbarTimer = null;
    function showToast(msg) {
        el.snackbarText.textContent = msg;
        el.snackbar.hidden = false;
        clearTimeout(snackbarTimer);
        snackbarTimer = setTimeout(() => {
            el.snackbar.hidden = true;
        }, 3200);
    }

    // --- Web Audio API Synthesizer (Zero External Assets) ---
    const AudioEngine = {
        ctx: null,

        _getCtx() {
            if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return this.ctx;
        },

        playWhistle() {
            if (!state.referee.soundEnabled) return;
            const ctx = this._getCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        },

        playPointChime() {
            if (!state.referee.soundEnabled) return;
            const ctx = this._getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, now + (idx * 0.08));
                gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + (idx * 0.08));
                osc.stop(now + (idx * 0.08) + 0.4);
            });
        },

        playBuzzer() {
            if (!state.referee.soundEnabled) return;
            const ctx = this._getCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.85);
        },

        playTick() {
            if (!state.referee.soundEnabled) return;
            const ctx = this._getCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.09);
        }
    };

    // --- Theme Handling ---
    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sumospik_theme', theme);
        el.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    }

    // --- Tab Switching ---
    function switchTab(tabId) {
        state.activeTab = tabId;
        const tabs = [
            { id: 'matches', btn: el.tabMatchesBtn, view: el.viewMatches },
            { id: 'standings', btn: el.tabStandingsBtn, view: el.viewStandings },
            { id: 'teams', btn: el.tabTeamsBtn, view: el.viewTeams },
            { id: 'settings', btn: el.tabSettingsBtn, view: el.viewSettings }
        ];

        tabs.forEach((t) => {
            const isActive = t.id === tabId;
            t.btn.classList.toggle('active', isActive);
            t.btn.setAttribute('aria-selected', String(isActive));
            t.view.classList.toggle('active', isActive);
        });

        if (tabId === 'standings') {
            recalculateAndRenderStandings();
        }
    }

    // --- Connection Status ---
    function setConnectionStatus(status) {
        el.connectionPill.classList.remove('online', 'connecting', 'offline');
        if (status === 'live' || status === 'connected') {
            el.connectionPill.classList.add('online');
            el.connectionLabel.textContent = status === 'live' ? 'Live SSE' : 'Connected';
        } else if (status === 'connecting') {
            el.connectionPill.classList.add('connecting');
            el.connectionLabel.textContent = 'Connecting...';
        } else if (status === 'reconnecting') {
            el.connectionPill.classList.add('connecting');
            el.connectionLabel.textContent = 'Syncing...';
        } else {
            el.connectionPill.classList.add('offline');
            el.connectionLabel.textContent = 'Offline';
        }
    }

    // =========================================================
    // PocketBase Data Loading
    // =========================================================

    async function initApp() {
        applyTheme(state.theme);
        setConnectionStatus('connecting');

        try {
            await pb.authenticate();
            await loadChampionships();
            subscribeRealtime();
        } catch (err) {
            console.error('[SumoSpik Init Error]', err);
            showToast('Reconnecting to database...');
            setConnectionStatus('reconnecting');
            setTimeout(initApp, 2500);
        }
    }

    function subscribeRealtime() {
        pb.subscribe(SUMOSPIK.championships, (evt) => {
            handleChampionshipRealtime(evt);
        }, setConnectionStatus);

        pb.subscribe(SUMOSPIK.teams, (evt) => {
            handleTeamRealtime(evt);
        });

        pb.subscribe(SUMOSPIK.matches, (evt) => {
            handleMatchRealtime(evt);
        });
    }

    async function loadChampionships() {
        try {
            let res;
            try {
                res = await pb.listRecords(SUMOSPIK.championships, {
                    perPage: 100,
                    sort: '-created'
                });
            } catch (sortErr) {
                console.warn('Sort -created failed, trying default sort:', sortErr);
                res = await pb.listRecords(SUMOSPIK.championships, { perPage: 100 });
            }

            state.championships = res.items || [];

            // If zero championships exist, provision default
            if (state.championships.length === 0) {
                const defaultChamp = await pb.createRecord(SUMOSPIK.championships, {
                    name: 'Inaugural SumoSpik Cup 2026',
                    category: 'Standard 3kg Autonomous',
                    format: 'round_robin',
                    match_format: 'best_of_3',
                    round_time_sec: 180,
                    points_win: 3,
                    points_draw: 1,
                    points_loss: 0,
                    status: 'active',
                    notes: 'Sumo Dohyo Arena 1'
                });
                state.championships = [defaultChamp];
            }

            renderChampionshipDropdown();

            // Select championship from localStorage, or prefer the user's active one
            const savedId = localStorage.getItem('sumospik_current_champ_id');
            const found = state.championships.find((c) => c.id === savedId);

            // Prefer savedId if found; otherwise prefer the latest active championship
            const targetChamp = found || state.championships[0];
            await selectChampionship(targetChamp.id);
        } catch (err) {
            console.error('Error loading championships:', err);
            throw err;
        }
    }

    function renderChampionshipDropdown() {
        el.champSelect.innerHTML = '';
        state.championships.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.name} ${c.category ? `(${c.category})` : ''}`;
            el.champSelect.appendChild(opt);
        });
    }

    async function selectChampionship(champId) {
        const champ = state.championships.find((c) => c.id === champId);
        if (!champ) return;

        state.currentChamp = champ;
        localStorage.setItem('sumospik_current_champ_id', champ.id);
        el.champSelect.value = champ.id;

        // Populate settings form with current rules
        el.settingMatchFormat.value = champ.match_format || 'best_of_3';
        el.settingRoundTime.value = champ.round_time_sec || 180;
        el.settingPtsWin.value = champ.points_win ?? 3;
        el.settingPtsDraw.value = champ.points_draw ?? 1;
        el.settingPtsLoss.value = champ.points_loss ?? 0;

        await Promise.all([
            loadTeamsForCurrentChamp(),
            loadMatchesForCurrentChamp()
        ]);

        renderAll();
    }

    async function loadTeamsForCurrentChamp() {
        if (!state.currentChamp) return;
        try {
            const res = await pb.listRecords(SUMOSPIK.teams, {
                filter: `championship_id="${state.currentChamp.id}"`,
                perPage: 200,
                sort: 'name'
            });
            state.teams = res.items || [];
            el.badgeTeamsCount.textContent = state.teams.length;
        } catch (err) {
            console.error('Error loading teams:', err);
            state.teams = [];
        }
    }

    async function loadMatchesForCurrentChamp() {
        if (!state.currentChamp) return;
        try {
            const res = await pb.listRecords(SUMOSPIK.matches, {
                filter: `championship_id="${state.currentChamp.id}"`,
                perPage: 300,
                sort: 'round_num,match_num'
            });
            state.matches = res.items || [];
            el.badgeMatchesCount.textContent = state.matches.length;
            populateRoundFilter();
        } catch (err) {
            console.error('Error loading matches:', err);
            state.matches = [];
        }
    }

    function populateRoundFilter() {
        const rounds = new Set();
        state.matches.forEach((m) => {
            if (m.round_num) rounds.add(m.round_num);
        });

        const sorted = Array.from(rounds).sort((a, b) => a - b);
        el.filterRound.innerHTML = '<option value="all">All Rounds</option>';
        sorted.forEach((r) => {
            const opt = document.createElement('option');
            opt.value = String(r);
            opt.textContent = `Round ${r}`;
            el.filterRound.appendChild(opt);
        });
        el.filterRound.value = state.filterRound;
    }

    // Realtime Handlers
    function handleChampionshipRealtime(evt) {
        if (evt.action === 'create') {
            if (!state.championships.some((c) => c.id === evt.record.id)) {
                state.championships.unshift(evt.record);
                renderChampionshipDropdown();
            }
        } else if (evt.action === 'update') {
            const idx = state.championships.findIndex((c) => c.id === evt.record.id);
            if (idx !== -1) {
                state.championships[idx] = evt.record;
                renderChampionshipDropdown();
                if (state.currentChamp?.id === evt.record.id) {
                    state.currentChamp = evt.record;
                }
            }
        } else if (evt.action === 'delete') {
            state.championships = state.championships.filter((c) => c.id !== evt.record.id);
            renderChampionshipDropdown();
            if (state.currentChamp?.id === evt.record.id && state.championships.length > 0) {
                selectChampionship(state.championships[0].id);
            }
        }
    }

    function handleTeamRealtime(evt) {
        if (!state.currentChamp || evt.record.championship_id !== state.currentChamp.id) return;
        if (evt.action === 'create') {
            if (!state.teams.some((t) => t.id === evt.record.id)) {
                state.teams.push(evt.record);
            }
        } else if (evt.action === 'update') {
            const idx = state.teams.findIndex((t) => t.id === evt.record.id);
            if (idx !== -1) state.teams[idx] = evt.record;
        } else if (evt.action === 'delete') {
            state.teams = state.teams.filter((t) => t.id !== evt.record.id);
        }
        el.badgeTeamsCount.textContent = state.teams.length;
        renderTeams();
        recalculateAndRenderStandings();
    }

    function handleMatchRealtime(evt) {
        if (!state.currentChamp || evt.record.championship_id !== state.currentChamp.id) return;
        if (evt.action === 'create') {
            if (!state.matches.some((m) => m.id === evt.record.id)) {
                state.matches.push(evt.record);
            }
        } else if (evt.action === 'update') {
            const idx = state.matches.findIndex((m) => m.id === evt.record.id);
            if (idx !== -1) state.matches[idx] = evt.record;
            // If currently open in referee console and updated elsewhere
            if (state.referee.activeMatch?.id === evt.record.id && !state.referee.timerRunning) {
                state.referee.activeMatch = evt.record;
                state.referee.redScore = evt.record.team1_score || 0;
                state.referee.blueScore = evt.record.team2_score || 0;
                renderRefereeScores();
            }
        } else if (evt.action === 'delete') {
            state.matches = state.matches.filter((m) => m.id !== evt.record.id);
        }
        el.badgeMatchesCount.textContent = state.matches.length;
        populateRoundFilter();
        renderMatches();
        recalculateAndRenderStandings();
    }

    // =========================================================
    // Rendering: Matches Grid
    // =========================================================

    function getTeamById(id) {
        return state.teams.find((t) => t.id === id) || { name: 'TBD', robot_name: '', color: '#94A3B8' };
    }

    function renderMatches() {
        const grid = el.matchesGrid;
        grid.innerHTML = '';

        let list = [...state.matches];

        // Filter by round
        if (state.filterRound !== 'all') {
            const rNum = Number(state.filterRound);
            list = list.filter((m) => m.round_num === rNum);
        }

        // Filter by status
        if (state.filterStatus !== 'all') {
            list = list.filter((m) => (m.status || 'scheduled') === state.filterStatus);
        }

        // Search filter
        if (state.searchMatches) {
            const q = state.searchMatches.toLowerCase();
            list = list.filter((m) => {
                const t1 = getTeamById(m.team1_id);
                const t2 = getTeamById(m.team2_id);
                return (
                    t1.name.toLowerCase().includes(q) ||
                    t1.robot_name?.toLowerCase().includes(q) ||
                    t2.name.toLowerCase().includes(q) ||
                    t2.robot_name?.toLowerCase().includes(q)
                );
            });
        }

        if (list.length === 0) {
            el.matchesEmpty.style.display = 'block';
            return;
        }
        el.matchesEmpty.style.display = 'none';

        list.forEach((m) => {
            const t1 = getTeamById(m.team1_id);
            const t2 = getTeamById(m.team2_id);

            const card = document.createElement('div');
            card.className = 'match-card';

            const statusClass = (m.status || 'scheduled').toLowerCase();
            const statusLabel = statusClass === 'live' ? '● LIVE' : (statusClass === 'finished' ? 'FINAL' : 'SCHEDULED');

            const isT1Winner = m.winner_id === t1.id && statusClass === 'finished';
            const isT2Winner = m.winner_id === t2.id && statusClass === 'finished';

            card.innerHTML = `
                <div class="match-header">
                    <span class="match-seq">MATCH #${m.match_num || 1}</span>
                    <span class="match-round-tag">Round ${m.round_num || 1}</span>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="match-body">
                    <div class="team-corner red">
                        <span class="corner-label">🔴 Red</span>
                        <span class="team-name" title="${escapeHtml(t1.name)}">${escapeHtml(t1.name)}</span>
                        <span class="robot-name">${escapeHtml(t1.robot_name || 'No robot')}</span>
                        ${isT1Winner ? '<span class="team-winner-tag">🏆 WINNER</span>' : ''}
                    </div>

                    <div class="match-score-center">
                        <div class="score-digits">
                            <span>${m.team1_score ?? 0}</span>
                            <span class="score-colon">:</span>
                            <span>${m.team2_score ?? 0}</span>
                        </div>
                    </div>

                    <div class="team-corner blue">
                        <span class="corner-label">🔵 Blue</span>
                        <span class="team-name" title="${escapeHtml(t2.name)}">${escapeHtml(t2.name)}</span>
                        <span class="robot-name">${escapeHtml(t2.robot_name || 'No robot')}</span>
                        ${isT2Winner ? '<span class="team-winner-tag">🏆 WINNER</span>' : ''}
                    </div>
                </div>
                <div class="match-footer">
                    <button class="btn-referee" data-match-id="${m.id}">
                        🥋 Referee Console (Dohyo Ring)
                    </button>
                    <button class="btn-icon-sm btn-delete-match" data-match-id="${m.id}" title="Delete Match">🗑</button>
                </div>
            `;

            grid.appendChild(card);
        });

        // Bind referee buttons
        grid.querySelectorAll('.btn-referee').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-match-id');
                const match = state.matches.find((m) => m.id === id);
                if (match) openRefereeConsole(match);
            });
        });

        grid.querySelectorAll('.btn-delete-match').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-match-id');
                confirmAction('Delete Match', 'Are you sure you want to delete this match?', async () => {
                    await pb.deleteRecord(SUMOSPIK.matches, id);
                    showToast('Match deleted');
                });
            });
        });
    }

    // =========================================================
    // Referee Scoring Console (Live Dohyo Ring)
    // =========================================================

    function openRefereeConsole(match) {
        state.referee.activeMatch = match;
        state.referee.redScore = match.team1_score || 0;
        state.referee.blueScore = match.team2_score || 0;
        state.referee.timerTotal = state.currentChamp?.round_time_sec || 180;
        state.referee.timerSeconds = match.duration_sec && match.duration_sec > 0 ? match.duration_sec : state.referee.timerTotal;
        state.referee.timerRunning = false;
        clearInterval(state.referee.timerInterval);

        const t1 = getTeamById(match.team1_id);
        const t2 = getTeamById(match.team2_id);

        el.refMatchTitle.textContent = `Match #${match.match_num || 1} — Round ${match.round_num || 1}`;
        el.refRedName.textContent = t1.name;
        el.refRedRobot.textContent = t1.robot_name || 'No robot';
        el.refBlueName.textContent = t2.name;
        el.refBlueRobot.textContent = t2.robot_name || 'No robot';

        updateDigitalClockDisplay();
        renderRefereeScores();

        el.modalReferee.classList.add('active');

        // Mark match as LIVE if scheduled
        if (match.status !== 'live' && match.status !== 'finished') {
            pb.updateRecord(SUMOSPIK.matches, match.id, { status: 'live' }).catch(() => {});
        }
    }

    function closeRefereeConsole() {
        clearInterval(state.referee.timerInterval);
        state.referee.timerRunning = false;
        el.modalReferee.classList.remove('active');
    }

    function renderRefereeScores() {
        el.refRedScore.textContent = state.referee.redScore;
        el.refBlueScore.textContent = state.referee.blueScore;

        const maxPoints = state.currentChamp?.match_format === 'best_of_5' ? 3 : (state.currentChamp?.match_format === 'single_round' ? 1 : 2);

        // Render Yuko dots
        el.refRedDots.innerHTML = '';
        el.refBlueDots.innerHTML = '';
        for (let i = 0; i < maxPoints; i++) {
            const dotR = document.createElement('div');
            dotR.className = `yuko-dot ${i < state.referee.redScore ? 'filled' : ''}`;
            el.refRedDots.appendChild(dotR);

            const dotB = document.createElement('div');
            dotB.className = `yuko-dot ${i < state.referee.blueScore ? 'filled' : ''}`;
            el.refBlueDots.appendChild(dotB);
        }
    }

    function updateDigitalClockDisplay() {
        const sec = Math.max(0, state.referee.timerSeconds);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        el.digitalClock.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        el.digitalClock.classList.toggle('warning', sec <= 10 && sec > 0);
    }

    function startTimer() {
        if (state.referee.timerRunning) return;
        state.referee.timerRunning = true;
        AudioEngine.playWhistle();

        clearInterval(state.referee.timerInterval);
        state.referee.timerInterval = setInterval(() => {
            if (state.referee.timerSeconds > 0) {
                state.referee.timerSeconds--;
                updateDigitalClockDisplay();
                if (state.referee.timerSeconds === 10 || state.referee.timerSeconds === 5) {
                    AudioEngine.playTick();
                } else if (state.referee.timerSeconds === 0) {
                    pauseTimer();
                    AudioEngine.playBuzzer();
                    showToast('⏰ Time expired for this round!');
                }
            } else {
                pauseTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        state.referee.timerRunning = false;
        clearInterval(state.referee.timerInterval);
    }

    function resetTimer() {
        pauseTimer();
        state.referee.timerSeconds = state.referee.timerTotal;
        updateDigitalClockDisplay();
    }

    async function finishAndSaveMatch(isDraw = false) {
        pauseTimer();
        const m = state.referee.activeMatch;
        if (!m) return;

        let winnerId = '';
        if (!isDraw) {
            if (state.referee.redScore > state.referee.blueScore) {
                winnerId = m.team1_id;
            } else if (state.referee.blueScore > state.referee.redScore) {
                winnerId = m.team2_id;
            } else {
                isDraw = true;
            }
        }

        try {
            await pb.updateRecord(SUMOSPIK.matches, m.id, {
                team1_score: state.referee.redScore,
                team2_score: state.referee.blueScore,
                winner_id: winnerId,
                is_draw: isDraw,
                status: 'finished',
                duration_sec: state.referee.timerTotal - state.referee.timerSeconds
            });

            AudioEngine.playBuzzer();
            showToast('Match finished & scores saved!');
            closeRefereeConsole();
            await recalculateAndRenderStandings();
        } catch (err) {
            console.error('Save match error:', err);
            showToast('Error saving match scores.');
        }
    }

    // =========================================================
    // Standings & Leaderboard Recalculation
    // =========================================================

    async function recalculateAndRenderStandings() {
        if (!state.currentChamp) return;

        const ptsWin = state.currentChamp.points_win ?? 3;
        const ptsDraw = state.currentChamp.points_draw ?? 1;
        const ptsLoss = state.currentChamp.points_loss ?? 0;

        // Initialize team stats
        const statsMap = new Map();
        state.teams.forEach((t) => {
            statsMap.set(t.id, {
                team: t,
                mp: 0,
                w: 0,
                l: 0,
                d: 0,
                rw: 0,
                rl: 0,
                diff: 0,
                pts: 0
            });
        });

        // Compute from finished matches
        state.matches.forEach((m) => {
            if (m.status !== 'finished') return;
            const t1 = statsMap.get(m.team1_id);
            const t2 = statsMap.get(m.team2_id);
            if (!t1 || !t2) return;

            const s1 = m.team1_score || 0;
            const s2 = m.team2_score || 0;

            t1.mp++;
            t2.mp++;
            t1.rw += s1;
            t1.rl += s2;
            t2.rw += s2;
            t2.rl += s1;

            if (m.is_draw || s1 === s2) {
                t1.d++;
                t2.d++;
                t1.pts += ptsDraw;
                t2.pts += ptsDraw;
            } else if (s1 > s2 || m.winner_id === t1.team.id) {
                t1.w++;
                t2.l++;
                t1.pts += ptsWin;
                t2.pts += ptsLoss;
            } else {
                t2.w++;
                t1.l++;
                t2.pts += ptsWin;
                t1.pts += ptsLoss;
            }
        });

        const ranking = Array.from(statsMap.values()).map((item) => {
            item.diff = item.rw - item.rl;
            return item;
        });

        // Sort: Points DESC -> Diff DESC -> RW DESC -> Team Name ASC
        ranking.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.diff !== a.diff) return b.diff - a.diff;
            if (b.rw !== a.rw) return b.rw - a.rw;
            return a.team.name.localeCompare(b.team.name);
        });

        // Render Table
        const tbody = el.standingsTbody;
        tbody.innerHTML = '';

        if (ranking.length === 0) {
            el.standingsEmpty.style.display = 'block';
            return;
        }
        el.standingsEmpty.style.display = 'none';

        ranking.forEach((r, idx) => {
            const tr = document.createElement('tr');
            let medal = `#${idx + 1}`;
            if (idx === 0) medal = '<span class="medal-gold">🥇 1</span>';
            else if (idx === 1) medal = '<span class="medal-silver">🥈 2</span>';
            else if (idx === 2) medal = '<span class="medal-bronze">🥉 3</span>';

            tr.innerHTML = `
                <td class="rank-cell">${medal}</td>
                <td>
                    <div class="team-cell">
                        <span class="team-color-dot" style="background-color: ${r.team.color || '#2563EB'};"></span>
                        <div>
                            <div style="font-weight: 700;">${escapeHtml(r.team.name)}</div>
                            <div style="font-size: 0.75rem; color: var(--md-on-surface-variant);">${escapeHtml(r.team.robot_name || 'No robot')}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(r.team.club || '—')}</td>
                <td style="text-align: center; font-weight: 600;">${r.mp}</td>
                <td style="text-align: center; color: #16A34A; font-weight: 700;">${r.w}</td>
                <td style="text-align: center; color: #DC2626; font-weight: 700;">${r.l}</td>
                <td style="text-align: center; color: var(--md-outline); font-weight: 600;">${r.d}</td>
                <td style="text-align: center; font-family: var(--font-mono); font-size: 0.8rem;">${r.rw} - ${r.rl}</td>
                <td style="text-align: center; font-family: var(--font-mono); font-weight: 700; color: ${r.diff >= 0 ? '#16A34A' : '#DC2626'}">
                    ${r.diff > 0 ? '+' : ''}${r.diff}
                </td>
                <td class="points-cell" style="text-align: center;">${r.pts}</td>
            `;
            tbody.appendChild(tr);
        });

        el.badgeStandingsCount.textContent = ranking.length;
    }

    // =========================================================
    // Teams Management
    // =========================================================

    function renderTeams() {
        const grid = el.teamsGrid;
        grid.innerHTML = '';

        let list = [...state.teams];
        if (state.searchTeams) {
            const q = state.searchTeams.toLowerCase();
            list = list.filter((t) => (
                t.name.toLowerCase().includes(q) ||
                t.robot_name?.toLowerCase().includes(q) ||
                t.club?.toLowerCase().includes(q)
            ));
        }

        if (list.length === 0) {
            el.teamsEmpty.style.display = 'block';
            return;
        }
        el.teamsEmpty.style.display = 'none';

        list.forEach((t) => {
            const card = document.createElement('div');
            card.className = 'team-card';

            const initials = t.name.slice(0, 2).toUpperCase();
            const color = t.color || '#2563EB';

            card.innerHTML = `
                <div>
                    <div class="team-card-header">
                        <div class="team-badge-circle" style="background-color: ${color};">
                            ${initials}
                        </div>
                        <button class="btn-icon-sm btn-edit-team" data-id="${t.id}" title="Edit Team">✏</button>
                    </div>
                    <h4 class="team-card-title">${escapeHtml(t.name)}</h4>
                    <div class="team-card-robot">🤖 ${escapeHtml(t.robot_name || 'Robot Unnamed')}</div>
                    <div class="team-card-club">🏛 ${escapeHtml(t.club || 'Independent')}</div>
                </div>
                <div class="team-card-actions">
                    <button class="btn btn-tonal btn-delete-team-card" data-id="${t.id}" style="color: #DC2626; font-size: 0.75rem; padding: 4px 10px;">
                        Delete
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll('.btn-edit-team').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const team = state.teams.find((t) => t.id === id);
                if (team) openTeamModal(team);
            });
        });

        grid.querySelectorAll('.btn-delete-team-card').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const team = state.teams.find((t) => t.id === id);
                if (!team) return;
                confirmAction('Delete Team', `Are you sure you want to remove team "${team.name}"?`, async () => {
                    await pb.deleteRecord(SUMOSPIK.teams, team.id);
                    showToast(`Deleted team ${team.name}`);
                });
            });
        });
    }

    function openTeamModal(team = null) {
        if (team) {
            el.modalTeamTitle.textContent = 'Edit Team';
            el.teamId.value = team.id;
            el.teamNameInput.value = team.name;
            el.teamRobotInput.value = team.robot_name || '';
            el.teamClubInput.value = team.club || '';
            el.teamColorInput.value = team.color || '#2563EB';
            el.btnDeleteTeam.style.display = 'block';
        } else {
            el.modalTeamTitle.textContent = 'Add Team';
            el.teamId.value = '';
            el.teamNameInput.value = '';
            el.teamRobotInput.value = '';
            el.teamClubInput.value = '';
            el.teamColorInput.value = '#2563EB';
            el.btnDeleteTeam.style.display = 'none';
        }
        el.modalTeam.classList.add('active');
    }

    // =========================================================
    // Schedule Generation (Round Robin & Custom)
    // =========================================================

    function openGenerateModal() {
        const teamCount = state.teams.length;
        if (teamCount < 2) {
            showToast('Please add at least 2 teams before generating matches.');
            return;
        }

        const totalPairMatches = (teamCount * (teamCount - 1)) / 2;
        el.genSummary.innerHTML = `
            <strong>${teamCount} Teams registered:</strong><br>
            • Single Round Robin generates <strong>${totalPairMatches} matches</strong> across ${teamCount % 2 === 0 ? teamCount - 1 : teamCount} rounds.<br>
            • Double Round Robin generates <strong>${totalPairMatches * 2} matches</strong>.
        `;

        el.modalGenerate.classList.add('active');
    }

    async function generateSchedule(format, customCount = 10) {
        if (!state.currentChamp || state.teams.length < 2) return;

        const teamIds = state.teams.map((t) => t.id);
        const matchesToCreate = [];
        let matchSeq = 1;

        if (format === 'custom_matches') {
            // Pair teams randomly
            for (let i = 0; i < customCount; i++) {
                const idx1 = Math.floor(Math.random() * teamIds.length);
                let idx2 = Math.floor(Math.random() * (teamIds.length - 1));
                if (idx2 >= idx1) idx2++;

                matchesToCreate.push({
                    championship_id: state.currentChamp.id,
                    round_num: Math.floor(i / (teamIds.length / 2)) + 1,
                    match_num: matchSeq++,
                    team1_id: teamIds[idx1],
                    team2_id: teamIds[idx2],
                    team1_score: 0,
                    team2_score: 0,
                    status: 'scheduled'
                });
            }
        } else {
            // Standard Round Robin (Berger Tables Algorithm)
            const n = teamIds.length;
            const teamsList = [...teamIds];
            if (n % 2 !== 0) {
                teamsList.push(null); // Dummy team for BYE
            }
            const totalRounds = teamsList.length - 1;
            const half = teamsList.length / 2;

            const passes = format === 'double_round_robin' ? 2 : 1;

            for (let pass = 0; pass < passes; pass++) {
                const workingTeams = [...teamsList];
                for (let r = 0; r < totalRounds; r++) {
                    const roundNum = (pass * totalRounds) + (r + 1);

                    for (let i = 0; i < half; i++) {
                        const t1 = workingTeams[i];
                        const t2 = workingTeams[workingTeams.length - 1 - i];

                        if (t1 !== null && t2 !== null) {
                            // Alternate home/away corner
                            const isAlternate = (r + i + pass) % 2 === 1;
                            matchesToCreate.push({
                                championship_id: state.currentChamp.id,
                                round_num: roundNum,
                                match_num: matchSeq++,
                                team1_id: isAlternate ? t2 : t1,
                                team2_id: isAlternate ? t1 : t2,
                                team1_score: 0,
                                team2_score: 0,
                                status: 'scheduled'
                            });
                        }
                    }

                    // Rotate teams list (keep first element fixed)
                    workingTeams.splice(1, 0, workingTeams.pop());
                }
            }
        }

        // Save generated matches
        showToast(`Generating ${matchesToCreate.length} matches...`);
        for (const m of matchesToCreate) {
            await pb.createRecord(SUMOSPIK.matches, m);
        }

        showToast(`✓ Successfully generated ${matchesToCreate.length} matches!`);
        el.modalGenerate.classList.remove('active');
        await loadMatchesForCurrentChamp();
        renderMatches();
    }

    // =========================================================
    // Championships CRUD
    // =========================================================

    function openChampModal(champ = null) {
        if (champ) {
            el.modalChampTitle.textContent = 'Edit Championship';
            el.champId.value = champ.id;
            el.champNameInput.value = champ.name;
            el.champCategoryInput.value = champ.category || '';
            el.champFormatInput.value = champ.format || 'round_robin';
            el.champNotesInput.value = champ.notes || '';
            el.btnDeleteChamp.style.display = state.championships.length > 1 ? 'block' : 'none';
        } else {
            el.modalChampTitle.textContent = 'New Championship';
            el.champId.value = '';
            el.champNameInput.value = '';
            el.champCategoryInput.value = 'Standard 3kg Autonomous';
            el.champFormatInput.value = 'round_robin';
            el.champNotesInput.value = '';
            el.btnDeleteChamp.style.display = 'none';
        }
        el.modalChamp.classList.add('active');
    }

    // =========================================================
    // Confirmation Dialog
    // =========================================================

    function confirmAction(title, message, callback) {
        el.confirmTitle.textContent = title;
        el.confirmMessage.textContent = message;
        state.confirmCallback = callback;
        el.modalConfirm.classList.add('active');
    }

    // --- Helpers ---
    function escapeHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function renderAll() {
        renderMatches();
        recalculateAndRenderStandings();
        renderTeams();
    }

    // =========================================================
    // Event Listeners Binding
    // =========================================================

    function bindEvents() {
        // Theme
        el.btnTheme.addEventListener('click', toggleTheme);

        // Navigation Tabs
        el.tabMatchesBtn.addEventListener('click', () => switchTab('matches'));
        el.tabStandingsBtn.addEventListener('click', () => switchTab('standings'));
        el.tabTeamsBtn.addEventListener('click', () => switchTab('teams'));
        el.tabSettingsBtn.addEventListener('click', () => switchTab('settings'));

        // Championship Switcher
        el.champSelect.addEventListener('change', (e) => selectChampionship(e.target.value));
        el.btnNewChamp.addEventListener('click', () => openChampModal(null));
        el.btnEditChamp.addEventListener('click', () => openChampModal(state.currentChamp));

        // Matches Filters
        el.filterRound.addEventListener('change', (e) => {
            state.filterRound = e.target.value;
            renderMatches();
        });
        el.filterStatus.addEventListener('change', (e) => {
            state.filterStatus = e.target.value;
            renderMatches();
        });
        el.searchMatches.addEventListener('input', (e) => {
            state.searchMatches = e.target.value.trim();
            renderMatches();
        });

        // Matches Actions
        el.btnOpenGenerate.addEventListener('click', openGenerateModal);
        el.btnTriggerSchedule.addEventListener('click', openGenerateModal);
        el.btnAddMatch.addEventListener('click', () => {
            if (state.teams.length < 2) {
                showToast('Add at least 2 teams before adding a match.');
                return;
            }
            // Create quick match
            pb.createRecord(SUMOSPIK.matches, {
                championship_id: state.currentChamp.id,
                round_num: 1,
                match_num: state.matches.length + 1,
                team1_id: state.teams[0].id,
                team2_id: state.teams[1].id,
                team1_score: 0,
                team2_score: 0,
                status: 'scheduled'
            }).then(() => showToast('Match added'));
        });

        // Reset Matches
        el.btnClearMatches.addEventListener('click', () => {
            confirmAction('Reset Matches', 'Are you sure you want to delete ALL matches for this championship?', async () => {
                for (const m of state.matches) {
                    await pb.deleteRecord(SUMOSPIK.matches, m.id);
                }
                showToast('All matches cleared.');
            });
        });

        // Referee Console Controls
        el.btnCloseReferee.addEventListener('click', closeRefereeConsole);
        el.btnTimerStart.addEventListener('click', startTimer);
        el.btnTimerPause.addEventListener('click', pauseTimer);
        el.btnTimerReset.addEventListener('click', resetTimer);
        el.btnTimerAdd15.addEventListener('click', () => {
            state.referee.timerSeconds += 15;
            updateDigitalClockDisplay();
        });
        el.btnTimerSub15.addEventListener('click', () => {
            state.referee.timerSeconds = Math.max(0, state.referee.timerSeconds - 15);
            updateDigitalClockDisplay();
        });
        el.btnSoundToggle.addEventListener('click', () => {
            state.referee.soundEnabled = !state.referee.soundEnabled;
            el.btnSoundToggle.textContent = state.referee.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
        });

        // Referee Score Buttons
        el.btnRedAddPt.addEventListener('click', () => {
            state.referee.redScore++;
            AudioEngine.playPointChime();
            renderRefereeScores();
        });
        el.btnRedSubPt.addEventListener('click', () => {
            state.referee.redScore = Math.max(0, state.referee.redScore - 1);
            renderRefereeScores();
        });
        el.btnBlueAddPt.addEventListener('click', () => {
            state.referee.blueScore++;
            AudioEngine.playPointChime();
            renderRefereeScores();
        });
        el.btnBlueSubPt.addEventListener('click', () => {
            state.referee.blueScore = Math.max(0, state.referee.blueScore - 1);
            renderRefereeScores();
        });

        el.btnRefDraw.addEventListener('click', () => finishAndSaveMatch(true));
        el.btnRefFinish.addEventListener('click', () => finishAndSaveMatch(false));

        // Teams Search & Add
        el.searchTeams.addEventListener('input', (e) => {
            state.searchTeams = e.target.value.trim();
            renderTeams();
        });
        el.btnAddTeam.addEventListener('click', () => openTeamModal(null));
        el.btnOpenBulkTeams.addEventListener('click', () => {
            el.bulkTeamsTextarea.value = '';
            el.modalBulkTeams.classList.add('active');
        });

        // Standings Recalc Button
        el.btnRecalcStandings.addEventListener('click', () => {
            recalculateAndRenderStandings();
            showToast('Standings updated!');
        });

        // Form Rules Settings
        el.formRulesSettings.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!state.currentChamp) return;
            try {
                await pb.updateRecord(SUMOSPIK.championships, state.currentChamp.id, {
                    match_format: el.settingMatchFormat.value,
                    round_time_sec: Number(el.settingRoundTime.value) || 180,
                    points_win: Number(el.settingPtsWin.value) ?? 3,
                    points_draw: Number(el.settingPtsDraw.value) ?? 1,
                    points_loss: Number(el.settingPtsLoss.value) ?? 0
                });
                showToast('Championship rules saved successfully!');
                await recalculateAndRenderStandings();
            } catch (err) {
                console.error('Error saving settings:', err);
                showToast('Error saving rules.');
            }
        });

        // Form Championship
        el.formChamp.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = el.champId.value;
            const data = {
                name: el.champNameInput.value.trim(),
                category: el.champCategoryInput.value.trim(),
                format: el.champFormatInput.value,
                notes: el.champNotesInput.value.trim()
            };

            try {
                if (id) {
                    await pb.updateRecord(SUMOSPIK.championships, id, data);
                    showToast('Championship updated');
                } else {
                    const created = await pb.createRecord(SUMOSPIK.championships, {
                        ...data,
                        match_format: 'best_of_3',
                        round_time_sec: 180,
                        points_win: 3,
                        points_draw: 1,
                        points_loss: 0,
                        status: 'active'
                    });
                    showToast('Championship created');
                    await loadChampionships();
                    await selectChampionship(created.id);
                }
                el.modalChamp.classList.remove('active');
            } catch (err) {
                console.error('Champ save error:', err);
                showToast('Error saving championship.');
            }
        });

        el.btnCancelChamp.addEventListener('click', () => el.modalChamp.classList.remove('active'));
        el.btnCloseChampModal.addEventListener('click', () => el.modalChamp.classList.remove('active'));

        el.btnDeleteChamp.addEventListener('click', () => {
            const id = el.champId.value;
            if (!id) return;
            confirmAction('Delete Championship', 'This will delete this championship, its teams, and matches. Continue?', async () => {
                await pb.deleteRecord(SUMOSPIK.championships, id);
                el.modalChamp.classList.remove('active');
                showToast('Championship deleted');
                await loadChampionships();
            });
        });

        // Form Team
        el.formTeam.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!state.currentChamp) return;
            const id = el.teamId.value;
            const data = {
                championship_id: state.currentChamp.id,
                name: el.teamNameInput.value.trim(),
                robot_name: el.teamRobotInput.value.trim(),
                club: el.teamClubInput.value.trim(),
                color: el.teamColorInput.value
            };

            try {
                if (id) {
                    await pb.updateRecord(SUMOSPIK.teams, id, data);
                    showToast(`Updated ${data.name}`);
                } else {
                    await pb.createRecord(SUMOSPIK.teams, data);
                    showToast(`Added ${data.name}`);
                }
                el.modalTeam.classList.remove('active');
            } catch (err) {
                console.error('Team save error:', err);
                showToast('Error saving team.');
            }
        });

        el.btnCancelTeam.addEventListener('click', () => el.modalTeam.classList.remove('active'));
        el.btnCloseTeamModal.addEventListener('click', () => el.modalTeam.classList.remove('active'));

        el.btnDeleteTeam.addEventListener('click', () => {
            const id = el.teamId.value;
            if (!id) return;
            confirmAction('Delete Team', 'Are you sure you want to delete this team?', async () => {
                await pb.deleteRecord(SUMOSPIK.teams, id);
                el.modalTeam.classList.remove('active');
                showToast('Team deleted');
            });
        });

        // Form Bulk Teams
        el.formBulkTeams.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!state.currentChamp) return;
            const text = el.bulkTeamsTextarea.value.trim();
            if (!text) return;

            const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
            const palette = ['#DC2626', '#2563EB', '#16A34A', '#D97706', '#9333EA', '#0891B2', '#4F46E5', '#E11D48'];

            showToast(`Registering ${lines.length} teams...`);
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].split(',').map((p) => p.trim());
                const teamName = parts[0];
                const robotName = parts[1] || '';
                const club = parts[2] || '';
                const color = palette[i % palette.length];

                await pb.createRecord(SUMOSPIK.teams, {
                    championship_id: state.currentChamp.id,
                    name: teamName,
                    robot_name: robotName,
                    club: club,
                    color: color
                });
            }

            showToast(`✓ Registered ${lines.length} teams successfully!`);
            el.modalBulkTeams.classList.remove('active');
            await loadTeamsForCurrentChamp();
            renderTeams();
        });

        el.btnCancelBulk.addEventListener('click', () => el.modalBulkTeams.classList.remove('active'));
        el.btnCloseBulkModal.addEventListener('click', () => el.modalBulkTeams.classList.remove('active'));

        // Form Generate Schedule
        el.genFormatSelect.addEventListener('change', (e) => {
            el.groupCustomCount.style.display = e.target.value === 'custom_matches' ? 'block' : 'none';
        });

        el.formGenerateSchedule.addEventListener('submit', async (e) => {
            e.preventDefault();
            const format = el.genFormatSelect.value;
            const count = Number(el.genCustomCount.value) || 10;
            await generateSchedule(format, count);
        });

        el.btnCancelGen.addEventListener('click', () => el.modalGenerate.classList.remove('active'));
        el.btnCloseGenModal.addEventListener('click', () => el.modalGenerate.classList.remove('active'));

        // Confirmation Modal
        el.btnConfirmCancel.addEventListener('click', () => {
            el.modalConfirm.classList.remove('active');
            state.confirmCallback = null;
        });

        el.btnConfirmOk.addEventListener('click', async () => {
            el.modalConfirm.classList.remove('active');
            if (state.confirmCallback) {
                await state.confirmCallback();
                state.confirmCallback = null;
            }
        });
    }

    // --- Init on DOM Ready ---
    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        initApp();
    });
})();

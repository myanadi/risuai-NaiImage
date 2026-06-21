//@name NAI Anlas Check
//@display-name NAI Anlas Check
//@version 0.1.3
//@api 3.0
//@description NovelAI Anlas 잔여 확인 미니 도구. NAI Image와 같은 위치(채팅창 ⋯ 메뉴)에 등록 + 사이드바 양쪽.

(async () => {
    const risuai = globalThis.risuai || globalThis.Risuai;
    if (!risuai) throw new Error('[NAI Anlas Check] RisuAI Plugin API v3 가 필요합니다.');

    const STORAGE_KEY = 'nai-anlas-check-config';
    const DEFAULT_CONFIG = { apiKey: '', lastCheck: null, lastFixed: 0, lastPurchased: 0 };
    let config = { ...DEFAULT_CONFIG };

    let storage = null;
    async function getStorage() {
        if (!storage) storage = await risuai.getLocalPluginStorage();
        return storage;
    }
    async function loadConfig() {
        try {
            const s = await getStorage();
            const saved = await s.getItem(STORAGE_KEY);
            if (saved && typeof saved === 'object') {
                config = { ...DEFAULT_CONFIG, ...saved };
            }
        } catch (e) { console.warn('[NAI Anlas Check] load failed', e); }
    }
    async function saveConfig() {
        try {
            const s = await getStorage();
            await s.setItem(STORAGE_KEY, config);
        } catch (e) { console.warn('[NAI Anlas Check] save failed', e); }
    }

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
    }
    function fmtNumber(n) {
        return Number(n || 0).toLocaleString('en-US');
    }
    function fmtDate(ts) {
        if (!ts) return '아직 확인 안 함';
        const d = new Date(ts);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${mm}/${dd} ${hh}:${mi}`;
    }

    // ── 메인 UI ─────────────────────────────────────────────────────
    async function openWindow() {
        await loadConfig();
        await risuai.showContainer('fullscreen');

        document.body.innerHTML = `
          <style>
            body { margin:0; padding:0; background:rgba(0,0,0,0.25); min-height:100vh;
                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                   display:flex; align-items:center; justify-content:center; }
            .nac-card { width:340px; max-width:92vw; background:#fdf8f9; border:1px solid #f0d4d8;
                        border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.18); padding:18px 18px 16px;
                        color:#58444a; }
            .nac-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
            .nac-title h2 { margin:0; font-size:14px; color:#e07a8f; font-weight:700; }
            .nac-close { background:none; border:none; cursor:pointer; font-size:18px; color:#8a5868;
                         padding:0 4px; line-height:1; }
            .nac-section { margin-bottom:14px; }
            .nac-label { font-size:11.5px; color:#8a5868; margin-bottom:5px; font-weight:600; }
            .nac-hint  { font-size:10.5px; color:#ab9398; margin-top:4px; }
            .nac-row { display:flex; gap:6px; align-items:stretch; }
            .nac-row input { flex:1; background:#fff; border:1px solid #efe5e6; border-radius:8px;
                             padding:8px 10px; font-size:12.5px; color:#58444a; box-sizing:border-box;
                             font-family:inherit; }
            .nac-row input:focus { outline:none; border-color:#e07a8f; }
            .nac-btn { background:#e07a8f; color:#fff; border:none; border-radius:8px; padding:8px 14px;
                       font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
            .nac-btn:hover { background:#d36780; }
            .nac-btn:disabled { background:#e6c0c8; cursor:default; }
            .nac-btn.ghost { background:#fbedf0; color:#e07a8f; }
            .nac-btn.ghost:hover { background:#f6dde2; }
            .nac-divider { height:1px; background:#f0d4d8; margin:14px -18px; }
            .nac-status { font-size:11px; color:#2f9e6e; margin-top:6px; min-height:14px; }
            .nac-error  { color:#c8526c; }
            .nac-amount { font-size:22px; font-weight:700; color:#58444a; margin:6px 0 2px; }
            .nac-meta { font-size:10.5px; color:#ab9398; margin-top:4px; }
          </style>

          <div class="nac-card">
            <div class="nac-title">
              <h2>✅ NAI Anlas Check</h2>
              <button class="nac-close" id="nac-close" title="닫기">✕</button>
            </div>

            <div class="nac-section">
              <div class="nac-label">NovelAI API Key</div>
              <div class="nac-row">
                <input id="nac-key" type="password" value="${esc(config.apiKey)}" placeholder="pst-..." autocomplete="off" />
                <button class="nac-btn ghost" id="nac-save">저장</button>
              </div>
              <div class="nac-hint">novelai.net → User Settings → Account → Get Persistent API Token</div>
              <div class="nac-status" id="nac-save-status"></div>
            </div>

            <div class="nac-divider"></div>

            <div class="nac-section">
              <div class="nac-label">Anlas 확인</div>
              <div class="nac-row">
                <div style="flex:1; font-size:11.5px; color:#8a5868; display:flex; align-items:center; padding-left:2px;">
                  버튼을 눌러 잔여량을 확인하세요
                </div>
                <button class="nac-btn" id="nac-check">확인</button>
              </div>
              <div id="nac-result-area" style="margin-top:8px;">
                ${config.lastCheck ? renderAmount() : ''}
              </div>
              <div class="nac-status" id="nac-check-status"></div>
              <div class="nac-meta" id="nac-meta">마지막 확인: ${fmtDate(config.lastCheck)}</div>
            </div>
          </div>
        `;

        document.getElementById('nac-close').addEventListener('click', async () => {
            await risuai.hideContainer();
        });
        document.body.addEventListener('click', async (e) => {
            // 카드 바깥 클릭 시 닫기
            if (e.target === document.body) {
                await risuai.hideContainer();
            }
        });

        document.getElementById('nac-save').addEventListener('click', async () => {
            config.apiKey = document.getElementById('nac-key').value.trim();
            await saveConfig();
            const st = document.getElementById('nac-save-status');
            st.textContent = '저장됨';
            st.classList.remove('nac-error');
            setTimeout(() => { st.textContent = ''; }, 1500);
        });

        document.getElementById('nac-check').addEventListener('click', checkAnlas);
    }

    function renderAmount() {
        const total = (config.lastFixed || 0) + (config.lastPurchased || 0);
        return `
          <div class="nac-amount">
            ${fmtNumber(total)}
            <span style="font-size:13px; color:#8a5868; margin-left:6px; font-weight:400;">Anlas</span>
          </div>
        `;
    }

    async function checkAnlas() {
        const btn = document.getElementById('nac-check');
        const statusEl = document.getElementById('nac-check-status');
        const resultArea = document.getElementById('nac-result-area');
        const metaEl = document.getElementById('nac-meta');

        const apiKey = document.getElementById('nac-key').value.trim();
        if (!apiKey) {
            statusEl.textContent = 'API Key를 먼저 입력하세요.';
            statusEl.classList.add('nac-error');
            return;
        }

        btn.disabled = true;
        btn.textContent = '확인중...';
        statusEl.textContent = '';
        statusEl.classList.remove('nac-error');

        try {
            const res = await risuai.nativeFetch('https://api.novelai.net/user/subscription', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + apiKey }
            });

            if (!res.ok) {
                let msg = '';
                try { msg = await res.text(); } catch (_) {}
                throw new Error(`HTTP ${res.status}: ${msg.slice(0, 200) || res.statusText}`);
            }

            const data = await res.json();
            const fixed = data?.trainingStepsLeft?.fixedTrainingStepsLeft ?? 0;
            const purchased = data?.trainingStepsLeft?.purchasedTrainingSteps ?? 0;

            // 저장
            config.apiKey = apiKey;
            config.lastFixed = fixed;
            config.lastPurchased = purchased;
            config.lastCheck = Date.now();
            await saveConfig();

            // 표시
            resultArea.innerHTML = renderAmount();
            metaEl.textContent = `마지막 확인: ${fmtDate(config.lastCheck)}`;
            statusEl.textContent = '';
        } catch (e) {
            console.error('[NAI Anlas Check]', e);
            statusEl.textContent = '❌ ' + (e.message || '조회 실패');
            statusEl.classList.add('nac-error');
        } finally {
            btn.disabled = false;
            btn.textContent = '확인';
        }
    }

    // ── 사이드바 + 햄버거 메뉴 등록 ──────────────────────────────────
    await loadConfig();

    // (1) 사이드바 설정 메뉴
    await risuai.registerSetting(
        'NAI Anlas Check',
        openWindow,
        '✅',
        'html',
        'nai-anlas-check-setting'
    );

    // (2) 채팅창 ⋯ 메뉴 (NAI Image와 같은 위치)
    await risuai.registerButton(
        {
            name: 'NAI Anlas Check',
            icon: '✅',
            iconType: 'html',
            location: 'chat',
            id: 'nai-anlas-check-chat'
        },
        openWindow
    );

    console.log('[NAI Anlas Check v0.1.3] loaded (sidebar + chat menu)');
})();

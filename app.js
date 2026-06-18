const BASE_URL = 'http://localhost/hospital_api';

// ============= CEK HALAMAN AKTIF =============
const IS_DASHBOARD = document.getElementById('dashboard-container') !== null;
const IS_LANDING = document.getElementById('landingPage') !== null;

// ============= UTILITY: ESCAPE HTML =============
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============= UPDATE LANDING PAGE STATS =============
async function updateLandingStats() {
    try {
        const response = await fetch('api-info.php');
        const result = await response.json();
        if (result.success) {
            const el = (id) => document.getElementById(id);
            if (el('landing-total-endpoints')) el('landing-total-endpoints').innerHTML = `${result.data.total_endpoints} API Endpoints`;
            if (el('landing-http-methods')) el('landing-http-methods').innerHTML = result.data.methods_list.join(', ');
            if (el('landing-total-resources')) el('landing-total-resources').innerHTML = `${result.data.total_resources} Resources + Real-time`;
        }
    } catch (err) {
        console.error('❌ Gagal update landing stats:', err);
    }
}

// ============= LOAD API STATS =============
async function loadApiStats() {
    try {
        const response = await fetch('api-info.php');
        const result = await response.json();
        if (result.success) {
            const { total_endpoints, http_methods, total_resources } = result.data;

            const apiTotalInfo = document.querySelector('#tab-api .total-info');
            const tryitTotalInfo = document.querySelector('#tab-tryit .total-info');
            if (apiTotalInfo) apiTotalInfo.innerHTML = `📊 <strong>${total_endpoints} Endpoints</strong> | ${http_methods} Methods | ${total_resources} Resources`;
            if (tryitTotalInfo) tryitTotalInfo.innerHTML = `📊 <strong>${total_endpoints} Endpoints</strong> | ${http_methods} Methods | ${total_resources} Resources`;
        }
    } catch (err) {
        console.error('❌ Gagal load API stats:', err);
    }
}

// ============= RENDER STATS CARD =============
function renderStats(tabName) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    if (tabName === 'patients') {
        statsContainer.innerHTML = `<div class="stats"><div class="stat-card patients"><h2 id="total-patients">-</h2><p>👤 Total Pasien</p></div></div>`;
    } else if (tabName === 'doctors') {
        statsContainer.innerHTML = `<div class="stats"><div class="stat-card doctors"><h2 id="total-doctors">-</h2><p>👨‍⚕️ Total Dokter</p></div></div>`;
    } else {
        statsContainer.innerHTML = `
            <div class="stats">
                <div class="stat-card endpoints"><h2>18</h2><p>🔌 Total Endpoints</p></div>
                <div class="stat-card methods"><h2>4</h2><p>⚡ HTTP Methods</p></div>
                <div class="stat-card resources"><h2>4</h2><p>📦 Total Resources</p></div>
            </div>`;
    }
}

// ============= INIT DASHBOARD =============
function initDashboard() {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey || localStorage.getItem('isLoggedIn') !== 'true') {
        // Belum login, paksa ke landing
        window.location.href = 'index.php';
        return;
    }

    // Isi info user di header
    const currentUser = localStorage.getItem('currentUser');
    const fullname = localStorage.getItem('userFullname');
    const role = localStorage.getItem('userRole');

    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.textContent = fullname || currentUser;

    const roleEl = document.getElementById('userRoleDisplay');
    if (roleEl) {
        roleEl.textContent = role === 'doctor' ? '👨‍⚕️ Dokter' : (role === 'admin' ? '🛡️ Admin' : '📋 Staff');
    }

    renderStats('patients');
    loadPatients();
    loadApiStats();
}

// ============= SHOW TAB =============
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');

    renderStats(tabName);

    if (tabName === 'patients') loadPatients();
    else if (tabName === 'doctors') loadDoctors();
}

// ============= TRY IT OUT =============
function tryThisEndpoint(method, url, params, body) {
    showTab('tryit');
    document.getElementById('try-method').value = method;
    document.getElementById('try-url').value = url.split('?')[0];
    document.getElementById('try-params').value = params || '';

    if (body && body !== 'null') {
        try {
            document.getElementById('try-body').value = JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            document.getElementById('try-body').value = body;
        }
    } else {
        document.getElementById('try-body').value = '';
    }

    document.getElementById('response-area').style.display = 'none';
    setTimeout(() => {
        document.getElementById('try-body').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

async function sendRequest() {
    let url = document.getElementById('try-url').value;
    const method = document.getElementById('try-method').value;
    const params = document.getElementById('try-params').value;
    let jsonBody = document.getElementById('try-body').value;

    if (params) url += (url.includes('?') ? '&' : '?') + params;

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) options.headers['x-api-key'] = apiKey;

    if (method !== 'GET' && jsonBody && jsonBody.trim()) {
        try { options.body = JSON.stringify(JSON.parse(jsonBody)); }
        catch (e) { options.body = jsonBody; }
    }

    const responseArea = document.getElementById('response-area');
    const statusDiv = document.getElementById('response-status');
    const bodyDiv = document.getElementById('response-body');

    responseArea.style.display = 'block';
    statusDiv.innerHTML = '<span class="loading-spinner"></span> Mengirim request...';
    statusDiv.className = 'response-status';
    bodyDiv.textContent = '';

    try {
        const startTime = Date.now();
        const response = await fetch(url, options);
        const elapsed = Date.now() - startTime;
        const text = await response.text();

        let formatted;
        try { formatted = JSON.stringify(JSON.parse(text), null, 2); }
        catch (e) { formatted = text; }

        if (response.ok) {
            statusDiv.innerHTML = `✅ ${response.status} ${response.statusText} - ⏱️ ${elapsed}ms`;
            statusDiv.className = 'response-status success';
        } else {
            statusDiv.innerHTML = `❌ ${response.status} ${response.statusText} - ⏱️ ${elapsed}ms`;
            statusDiv.className = 'response-status error';
        }
        bodyDiv.textContent = formatted;
    } catch (error) {
        statusDiv.innerHTML = `❌ Error: ${error.message}`;
        statusDiv.className = 'response-status error';
        bodyDiv.textContent = 'Gagal mengirim request. Periksa koneksi atau URL.';
    }
}

function setExample(type) {
    const examples = {
        patients: { method: 'GET', url: `${BASE_URL}/patients/index.php`, params: '', body: '' },
        patients_detail: { method: 'GET', url: `${BASE_URL}/patients/detail.php`, params: 'id=1', body: '' },
        doctors: { method: 'GET', url: `${BASE_URL}/doctors/index.php`, params: '', body: '' },
        appointments: { method: 'GET', url: `${BASE_URL}/appointments/index.php`, params: '', body: '' },
        post_patient: { method: 'POST', url: `${BASE_URL}/patients/index.php`, params: '', body: '{\n    "name": "Pasien Baru",\n    "nik": "1234567890123456",\n    "birth_date": "1995-05-15",\n    "gender": "Laki-laki",\n    "phone": "08123456789",\n    "address": "Jl. Contoh No. 123"\n}' },
        post_doctor: { method: 'POST', url: `${BASE_URL}/doctors/index.php`, params: '', body: '{\n    "name": "dr. Ahmad Fauzi",\n    "specialization": "Anak",\n    "phone": "08987654321"\n}' }
    };

    const ex = examples[type];
    if (ex) {
        document.getElementById('try-method').value = ex.method;
        document.getElementById('try-url').value = ex.url;
        document.getElementById('try-params').value = ex.params;
        document.getElementById('try-body').value = ex.body;
        document.getElementById('response-area').style.display = 'none';
        showTab('tryit');
    }
}

// ============= UTILITY: HIGHLIGHT =============
function highlightText(text, search) {
    if (text === null || text === undefined || text === '') return '-';
    const str = String(text);
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    let escaped = str.replace(/[&<>"']/g, m => map[m]);
    if (!search) return escaped;
    const escSearch = String(search).replace(/[&<>"']/g, m => map[m]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${escSearch})`, 'gi'), '<mark class="highlight-search">$1</mark>');
}

// ============= LOAD PATIENTS =============
async function loadPatients(search = '') {
    const tbody = document.getElementById('patients-table');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Memuat data...</td></tr>';

    try {
        let url = `${BASE_URL}/patients/index.php`;
        if (search) url += `?search=${encodeURIComponent(search)}`;

        const headers = {};
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) headers['x-api-key'] = apiKey;

        const res = await fetch(url, { headers });
        const data = await res.json();

        const totalEl = document.getElementById('total-patients');
        if (totalEl) totalEl.textContent = data.data?.length || 0;

        if (!data.data || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">Tidak ada data pasien</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><b>${highlightText(p.name, search)}</b></td>
                <td>${highlightText(p.nik, search)}</td>
                <td>${highlightText(p.birth_date, search)}</td>
                <td><span class="badge ${p.gender === 'Laki-laki' ? 'badge-male' : 'badge-female'}">${highlightText(p.gender, search)}</span></td>
                <td>${highlightText(p.phone, search) || '-'}</td>
                <td>${highlightText(p.address, search) || '-'}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="7" class="empty">Gagal memuat data! Pastikan server berjalan.</td></tr>';
    }
}

// ============= LOAD DOCTORS =============
async function loadDoctors(search = '') {
    const tbody = document.getElementById('doctors-table');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Memuat data...</td></tr>';

    try {
        let url = `${BASE_URL}/doctors/index.php`;
        if (search) url += `?search=${encodeURIComponent(search)}`;

        const headers = {};
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) headers['x-api-key'] = apiKey;

        const res = await fetch(url, { headers });
        const data = await res.json();

        const totalEl = document.getElementById('total-doctors');
        if (totalEl) totalEl.textContent = data.data?.length || 0;

        if (!data.data || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">Tidak ada data dokter</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><b>${escapeHtml(d.name)}</b></td>
                <td>${escapeHtml(d.specialization)}</td>
                <td>${escapeHtml(d.phone) || '-'}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loadDoctors:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="empty">Gagal memuat data! Pastikan server berjalan.</td></tr>';
    }
}

// ============= SEARCH =============
let searchTimeout, searchDoctorTimeout;
function searchPatient() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadPatients(document.getElementById('search-input').value), 400);
}
function searchDoctor() {
    clearTimeout(searchDoctorTimeout);
    searchDoctorTimeout = setTimeout(() => loadDoctors(document.getElementById('search-doctor-input').value), 400);
}

// ============= LOGIN SYSTEM =============
function showLoginModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'flex';
    showLoginForm();
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.textContent = input.type === 'password' ? '👁️' : '🙈';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('registerError').textContent = '';
    document.getElementById('registerSuccess').textContent = '';
    ['regFullname', 'regEmail', 'regPhone', 'regUsername', 'regPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('regGender').value = '';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        document.getElementById('loginError').textContent = 'Username dan password harus diisi!';
        return;
    }

    try {
        const response = await fetch('login_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', result.user.username);
            localStorage.setItem('userRole', result.user.role);
            localStorage.setItem('userFullname', result.user.fullname);
            localStorage.setItem('apiKey', result.user.api_key);
            localStorage.setItem('userId', result.user.id);

            showToast('✅ Login berhasil! Mengalihkan...');
            // ✅ Redirect ke dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.php';
            }, 800);
        } else {
            document.getElementById('loginError').textContent = result.message;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('loginError').textContent = 'Terjadi kesalahan koneksi';
    }
}

async function doRegister() {
    const fullname = document.getElementById('regFullname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const gender = document.getElementById('regGender').value;
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    document.getElementById('registerError').textContent = '';
    document.getElementById('registerSuccess').textContent = '';

    if (!fullname || !email || !username || !password) {
        document.getElementById('registerError').textContent = 'Nama lengkap, email, username, dan password harus diisi!';
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('registerError').textContent = 'Format email tidak valid!';
        return;
    }
    if (password.length < 4) {
        document.getElementById('registerError').textContent = 'Password minimal 4 karakter!';
        return;
    }
    if (phone && !/^[0-9+\-\s]+$/.test(phone)) {
        document.getElementById('registerError').textContent = 'Nomor telepon hanya boleh berisi angka, +, -, dan spasi!';
        return;
    }

    try {
        const response = await fetch('login_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', fullname, email, phone, gender, username, password, role })
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('registerSuccess').textContent = result.message;
            document.getElementById('loginUsername').value = username;
            ['regFullname', 'regEmail', 'regPhone', 'regUsername', 'regPassword'].forEach(id => {
                document.getElementById(id).value = '';
            });
            document.getElementById('regGender').value = '';
            setTimeout(() => {
                showLoginForm();
                document.getElementById('loginError').textContent = '✅ Akun berhasil dibuat! Silakan login.';
            }, 2000);
        } else {
            document.getElementById('registerError').textContent = result.message;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('registerError').textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    }
}

function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.clear();
        showToast('👋 Logout berhasil!');
        // ✅ Redirect ke landing page
        setTimeout(() => {
            window.location.href = 'index.php';
        }, 800);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#1a73e8;color:white;border-radius:12px;z-index:9999;font-family:Inter,sans-serif;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function handleCopy(btn) {
    const url = btn.getAttribute('data-url');
    navigator.clipboard.writeText(url);
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
}

document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function () { handleCopy(this); });
});

window.onclick = (e) => {
    const authModal = document.getElementById('authModal');
    if (authModal && e.target === authModal) closeAuthModal();
};

// ============= PROFIL USER =============
async function showProfile() {
    const apiKey = localStorage.getItem('apiKey');
    const userId = localStorage.getItem('userId');
    if (!apiKey || !userId) { showToast('Silakan login terlebih dahulu'); return; }

    try {
        const response = await fetch(`${BASE_URL}/users/detail.php?id=${userId}`, {
            headers: { 'x-api-key': apiKey }
        });
        const result = await response.json();

        if (result.success && result.data) {
            const u = result.data;
            document.getElementById('profileUsername').textContent = u.username || '-';
            document.getElementById('profileFullname').textContent = u.fullname || '-';
            document.getElementById('profileEmail').textContent = u.email || '-';
            document.getElementById('profilePhone').textContent = u.phone || '-';
            document.getElementById('profileGender').textContent = u.gender || '-';

            const roleMap = { admin: '🛡️ Admin', doctor: '👨‍⚕️ Dokter', staff: '📋 Staff' };
            document.getElementById('profileRole').innerHTML = `<span class="profile-role-badge">${roleMap[u.role] || u.role}</span>`;
            document.getElementById('profileStatus').innerHTML = u.is_active == 1
                ? '<span class="profile-status-badge">✅ Aktif</span>'
                : '<span class="profile-status-badge" style="background:#f8d7da;color:#721c24;">❌ Nonaktif</span>';

            if (u.created_at) {
                document.getElementById('profileCreatedAt').textContent = new Date(u.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            } else {
                document.getElementById('profileCreatedAt').textContent = '-';
            }

            document.getElementById('profileApiKey').textContent = u.api_key || 'Belum ada API Key';
            document.getElementById('profileModal').style.display = 'flex';
        } else {
            showToast('Gagal mengambil data profil');
        }
    } catch (err) {
        console.error(err);
        showToast('Terjadi kesalahan saat mengambil data profil');
    }
}

function copyProfileApiKey() {
    const apiKey = document.getElementById('profileApiKey')?.textContent;
    if (apiKey && apiKey !== 'Belum ada API Key') {
        navigator.clipboard.writeText(apiKey)
            .then(() => showToast('✅ API Key berhasil disalin!'))
            .catch(() => showToast('❌ Gagal menyalin API Key'));
    } else {
        showToast('Tidak ada API Key untuk disalin');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
}

// ============= INITIALIZE =============
window.onload = () => {
    if (IS_DASHBOARD) {
        // Halaman dashboard.php
        initDashboard();
    } else if (IS_LANDING) {
        // Halaman index.php — cek kalau sudah login, langsung redirect
        if (localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('apiKey')) {
            window.location.href = 'dashboard.php';
            return;
        }
        updateLandingStats();
    }
};

// ============ COPY API KEY DARI HEADER ============
function copyHeaderApiKey() {
    const apiKey = localStorage.getItem('apiKey');

    if (apiKey) {
        navigator.clipboard.writeText(apiKey).then(() => {
            const btn = document.querySelector('.btn-copy-header');
            if (btn) {
                // Simpan teks asli
                const originalText = btn.innerHTML;
                // Ubah teks tombol jadi "✅ Copied!"
                btn.innerHTML = '✅ Copied!';
                btn.style.background = '#10b981';
                btn.style.color = 'white';
                btn.style.borderColor = '#10b981';
                // Kembalikan setelah 2 detik
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 2000);
            }
            // Notifikasi tambahan (opsional)
            showToast('✅ API Key berhasil disalin!');
        }).catch(() => {
            // Fallback jika clipboard tidak didukung
            const textarea = document.createElement('textarea');
            textarea.value = apiKey;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            const btn = document.querySelector('.btn-copy-header');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                btn.style.background = '#10b981';
                btn.style.color = 'white';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }
            showToast('✅ API Key berhasil disalin!');
        });
    } else {
        showToast('❌ Tidak ada API Key untuk disalin');
    }
}
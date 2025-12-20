const firebaseConfig = {
    apiKey: "AIzaSyCtCIVlpeHxk58T0jocsAbz4sdZTvPKzys",
    authDomain: "new-obs-data.firebaseapp.com",
    projectId: "new-obs-data",
    storageBucket: "new-obs-data.firebasestorage.app",
    messagingSenderId: "552069224960",
    appId: "1:552069224960:web:85dda7a0201682c96156e5",
    measurementId: "G-C2M3ZEYXRT"
};

// Prevent multiple initializations
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

function initNavAuth(containerId = 'nav-auth-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Instant render from cache to avoid flicker between pages
    try {
        const cachedStr = sessionStorage.getItem('navUser');
        if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            const initials = cached.email ? cached.email.substring(0, 2).toUpperCase() : '??';
            const avatarHtml = cached.photoURL 
                ? `<img src="${cached.photoURL}" class="w-8 h-8 rounded-full object-cover shadow-lg shadow-indigo-500/30 border border-zinc-700">`
                : `<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">${initials}</div>`;

            const adminItem = cached.role === 'admin' 
                ? `<button id="nav-manage-users" class="w-full text-left px-3 py-2 text-[10px] font-bold text-indigo-300 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wide">Benutzer verwalten</button>`
                : '';

            container.innerHTML = `
                <div class="relative group">
                    <button class="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                        ${avatarHtml}
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-[#101014] border border-[#1f1f23] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <div class="p-3 border-b border-[#1f1f23]">
                            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Angemeldet als</p>
                            <p class="text-xs font-bold text-white truncate">${cached.email || ''}</p>
                        </div>
                        <div class="p-1">
                            ${adminItem}
                            <button onclick="firebase.auth().signOut()" class="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wide">Abmelden</button>
                        </div>
                    </div>
                </div>
            `;
            try {
                const manageBtn = container.querySelector('#nav-manage-users');
                if (manageBtn) {
                    manageBtn.onclick = () => {
                        const inTools = window.location.pathname.includes('/tools/');
                        const target = inTools ? '../users.html' : 'users.html';
                        window.location.href = target;
                    };
                }
            } catch(e) { /* ignore */ }
        }
    } catch(e) { /* ignore */ }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            let photoURL = user.photoURL;
            let role = undefined;
            const initials = user.email ? user.email.substring(0, 2).toUpperCase() : '??';

            try {
                const doc = await db.collection('users').doc(user.uid).get();
                const data = doc.exists ? doc.data() : {};
                photoURL = photoURL || data.photoURL || null;
                role = data.role;
            } catch(e) { /* ignore */ }

            const avatarHtml = photoURL 
                ? `<img src="${photoURL}" class="w-8 h-8 rounded-full object-cover shadow-lg shadow-indigo-500/30 border border-zinc-700">`
                : `<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">${initials}</div>`;

            const adminItem = role === 'admin' 
                ? `<button id="nav-manage-users" class="w-full text-left px-3 py-2 text-[10px] font-bold text-indigo-300 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wide">Benutzer verwalten</button>`
                : '';

            container.innerHTML = `
                <div class="relative group">
                    <button class="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                        ${avatarHtml}
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-[#101014] border border-[#1f1f23] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <div class="p-3 border-b border-[#1f1f23]">
                            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Angemeldet als</p>
                            <p class="text-xs font-bold text-white truncate">${user.email}</p>
                        </div>
                        <div class="p-1">
                            ${adminItem}
                            <button onclick="firebase.auth().signOut()" class="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wide">Abmelden</button>
                        </div>
                    </div>
                </div>
            `;
            try {
                const manageBtn = container.querySelector('#nav-manage-users');
                if (manageBtn) {
                    manageBtn.onclick = () => {
                        const inTools = window.location.pathname.includes('/tools/');
                        const target = inTools ? '../users.html' : 'users.html';
                        window.location.href = target;
                    };
                }
            } catch(e) { /* ignore */ }

            // Cache for instant render on next navigation
            try {
                sessionStorage.setItem('navUser', JSON.stringify({ email: user.email, photoURL, role }));
            } catch(e) { /* ignore */ }
        } else {
            // Check if we are in a subdirectory (like tools/) to adjust link path
            const isTools = window.location.pathname.includes('/tools/');
            const loginPath = isTools ? '../login.html' : 'login.html';
            
            container.innerHTML = `
                <a href="${loginPath}" class="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all uppercase tracking-wide">
                    Login
                </a>
            `;
        }
    });
}

// Auto-init if the container exists immediately (for simple pages)
document.addEventListener('DOMContentLoaded', () => {
    initNavAuth();
});

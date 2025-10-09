// TODO: PASTE KONFIGURASI FIREBASE ANDA DI SINI
 const firebaseConfig = {
    apiKey: "AIzaSyDkSAxnbKHUbc4T-jQg6xVUiHyd4i0XiP0",
    authDomain: "chatbot-dolan-sawah-v2.firebaseapp.com",
    projectId: "chatbot-dolan-sawah-v2",
    storageBucket: "chatbot-dolan-sawah-v2.firebasestorage.app",
    messagingSenderId: "337869888557",
    appId: "1:337869888557:web:4416d6f89d8089c7096ca4"
  };

//---------------------------------------------------------
// Sisa kode di bawah ini jangan diubah
//---------------------------------------------------------

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const knowledgeCollection = db.collection('knowledgeBase');

const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const trainingForm = document.getElementById('training-form');
const trainingDataList = document.getElementById('training-data-list');
const logoutBtn = document.getElementById('logout-btn');

if (sessionStorage.getItem('isAdminLoggedIn') === 'true') { showDashboard(); }

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'ultimasquad@gmail.com' && password === '437666') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showDashboard();
    } else { alert('Username atau password salah!'); }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    loginContainer.style.display = 'block';
    dashboardContainer.style.display = 'none';
});

function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    loadTrainingData();
}

trainingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('topic-input').value;
    const keywordsString = document.getElementById('keywords-input').value;
    const answer = document.getElementById('answer-textarea').value;
    const keywords = keywordsString.split(',').map(k => k.trim().toLowerCase());

    try {
        await knowledgeCollection.add({ topic, keywords, answer, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        alert('Aturan berhasil disimpan!');
        trainingForm.reset();
        loadTrainingData();
    } catch (error) { console.error("Error: ", error); alert('Gagal menyimpan.'); }
});

async function loadTrainingData() {
    trainingDataList.innerHTML = 'Memuat data...';
    const snapshot = await knowledgeCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) { trainingDataList.innerHTML = '<p>Belum ada aturan.</p>'; return; }
    trainingDataList.innerHTML = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        const item = document.createElement('div');
        item.classList.add('training-item');
        item.innerHTML = `<p><strong>Topik:</strong> ${data.topic}</p><p><strong>Kata Kunci:</strong> ${data.keywords.join(', ')}</p><p><strong>Jawaban:</strong> <pre>${data.answer.substring(0, 150)}...</pre></p><button data-id="${doc.id}">Hapus</button>`;
        trainingDataList.appendChild(item);
    });
}

trainingDataList.addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON') {
        const docId = e.target.dataset.id;
        if (confirm('Yakin ingin hapus?')) {
            try {
                await knowledgeCollection.doc(docId).delete();
                loadTrainingData();
            } catch (error) { console.error("Error: ", error); alert('Gagal hapus.'); }
        }
    }
});

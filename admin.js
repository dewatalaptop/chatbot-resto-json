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

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const trainingForm = document.getElementById('training-form');
const trainingDataList = document.getElementById('training-data-list');
const logoutBtn = document.getElementById('logout-btn');
const docIdInput = document.getElementById('doc-id-input');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitle = document.getElementById('form-title');

// Cek status login
if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
    showDashboard();
}

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'ultimasquad@gmail.com' && password === '437666') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Username atau password salah!');
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    loginContainer.style.display = 'block';
    dashboardContainer.style.display = 'none';
});

trainingForm.addEventListener('submit', handleFormSubmit);
cancelEditBtn.addEventListener('click', resetForm);
trainingDataList.addEventListener('click', handleListClick);


/**
 * =================================================================
 * FUNGSI UTAMA BARU
 * =================================================================
 */

// Menampilkan dashboard dan memuat data
function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    loadTrainingData();
}

/**
 * [BARU] Fungsi ini mengubah semua jenis input jawaban menjadi format standar chatbot.
 * 1. Jika input adalah teks biasa, akan diubah menjadi format JSON teks.
 * 2. Jika input adalah JSON yang sudah valid, akan diformat ulang agar rapi.
 * 3. Jika input adalah JSON yang valid tapi tidak sesuai format, akan "dibungkus" sebagai teks.
 * Tujuannya agar tidak ada lagi error di sisi chatbot.
 */
function normalizeAnswerFormat(answerString) {
    try {
        const parsedJson = JSON.parse(answerString);
        // Cek apakah format sudah sesuai standar (array of objects with type & content)
        if (Array.isArray(parsedJson) && parsedJson.every(item => item.type && item.content)) {
            // Format sudah benar, kita hanya merapikannya (pretty-print)
            return JSON.stringify(parsedJson, null, 2);
        } else {
             // JSON valid tapi formatnya salah, bungkus sebagai teks agar tidak error
            const wrappedAsText = [{
                type: 'text',
                content: `Format JSON tidak standar, ditampilkan sebagai teks:\n\n${JSON.stringify(parsedJson, null, 2)}`
            }];
            return JSON.stringify(wrappedAsText, null, 2);
        }
    } catch (e) {
        // Jika parsing gagal, berarti ini adalah teks biasa
        const formattedText = [{ type: 'text', content: answerString }];
        return JSON.stringify(formattedText, null, 2);
    }
}


// Menangani submit form (bisa untuk Tambah Baru atau Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    const topic = document.getElementById('topic-input').value;
    const keywordsString = document.getElementById('keywords-input').value;
    const rawAnswer = document.getElementById('answer-textarea').value;
    const keywords = keywordsString.split(',').map(k => k.trim().toLowerCase());
    
    // [BARU] Normalisasi jawaban sebelum disimpan
    const finalAnswer = normalizeAnswerFormat(rawAnswer);

    const docId = docIdInput.value;

    try {
        if (docId) {
            // Mode Update
            await knowledgeCollection.doc(docId).update({ topic, keywords, answer: finalAnswer });
            alert('Aturan berhasil diperbarui!');
        } else {
            // Mode Tambah Baru
            await knowledgeCollection.add({ topic, keywords, answer: finalAnswer, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            alert('Aturan berhasil disimpan!');
        }
        resetForm();
        loadTrainingData();
    } catch (error) {
        console.error("Error saving data: ", error);
        alert('Gagal menyimpan data ke Firestore.');
    }
}

// Memuat semua data dari Firestore dan menampilkannya di list
async function loadTrainingData() {
    trainingDataList.innerHTML = 'Memuat data...';
    try {
        const snapshot = await knowledgeCollection.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            trainingDataList.innerHTML = '<p>Belum ada aturan tersimpan.</p>';
            return;
        }
        trainingDataList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.classList.add('training-item');
            // [BARU] Menambahkan tombol Edit dan Hapus
            item.innerHTML = `
                <div class="training-item-content">
                    <p><strong>Topik:</strong> ${data.topic}</p>
                    <p><strong>Kata Kunci:</strong> ${data.keywords.join(', ')}</p>
                    <p><strong>Jawaban:</strong> <pre>${data.answer.substring(0, 150)}...</pre></p>
                </div>
                <div class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-btn" data-id="${doc.id}">Hapus</button>
                </div>
            `;
            trainingDataList.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading data: ", error);
        trainingDataList.innerHTML = '<p>Gagal memuat data.</p>';
    }
}

// Menangani klik pada tombol Edit atau Hapus di list
async function handleListClick(e) {
    const target = e.target;
    const docId = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
        if (confirm('Anda yakin ingin menghapus aturan ini?')) {
            try {
                await knowledgeCollection.doc(docId).delete();
                loadTrainingData();
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert('Gagal menghapus aturan.');
            }
        }
    } else if (target.classList.contains('edit-btn')) {
        // [BARU] Logika untuk mode Edit
        try {
            const doc = await knowledgeCollection.doc(docId).get();
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('topic-input').value = data.topic;
                document.getElementById('keywords-input').value = data.keywords.join(', ');
                document.getElementById('answer-textarea').value = data.answer;
                docIdInput.value = doc.id; // Simpan ID untuk proses update

                // Ubah tampilan form ke mode edit
                formTitle.textContent = "Edit Aturan Chatbot";
                submitBtn.textContent = 'Update Aturan';
                cancelEditBtn.style.display = 'inline-block';
                window.scrollTo(0, 0); // Scroll ke atas agar form terlihat
            }
        } catch (error) {
            console.error("Error fetching document for edit: ", error);
            alert('Gagal memuat data untuk diedit.');
        }
    }
}

// [BARU] Fungsi untuk mereset form ke keadaan semula
function resetForm() {
    trainingForm.reset();
    docIdInput.value = '';
    formTitle.textContent = "Dashboard Pengetahuan Chatbot";
    submitBtn.textContent = 'Simpan Aturan';
    cancelEditBtn.style.display = 'none';
}

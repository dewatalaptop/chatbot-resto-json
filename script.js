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

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messageContainer = document.getElementById('message-container');
const chatWindow = document.getElementById('chat-window');

let knowledgeBase = [];

async function loadKnowledgeBase() {
    try {
        const snapshot = await knowledgeCollection.get();
        knowledgeBase = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Basis Pengetahuan dimuat.");
    } catch (error) {
        console.error("Gagal memuat basis pengetahuan:", error);
    }
}

function getFirestoreResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    // Jawaban fallback sekarang menggunakan format JSON array yang baru
    const fallbackAnswer = `[{"type": "text", "content": "Maaf, saya belum mengerti pertanyaan itu. Mohon tunggu balasan dari admin kami di WhatsApp ya."}]`;

    for (const rule of knowledgeBase) {
        // Mengubah keyword menjadi array jika belum
        const keywords = Array.isArray(rule.keywords) ? rule.keywords : (rule.keywords || '').split(',').map(k => k.trim());
        
        for (const keyword of keywords) {
            if (keyword && lowerCaseMessage.includes(keyword.toLowerCase())) {
                return rule.answer;
            }
        }
    }
    return fallbackAnswer;
}

function appendMessage(htmlContent, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    
    // innerHTML digunakan agar tag HTML bisa dirender
    messageElement.innerHTML = htmlContent; 

    messageContainer.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
}

/**
 * ====================================================================
 * FUNGSI INI DIMODIFIKASI UNTUK MEMBACA FORMAT JSON YANG BARU
 * ====================================================================
 * Fungsi ini mencoba mengubah string jawaban menjadi JSON.
 * Jika berhasil dan formatnya adalah array, ia akan membuat elemen HTML
 * untuk setiap bagian pesan (teks, gambar, tombol).
 * Jika gagal (hanya teks biasa), ia akan menampilkannya sebagai paragraf biasa.
 */
function renderBotMessage(messageString) {
    const messageDiv = document.createElement('div');
    
    try {
        const parsedData = JSON.parse(messageString);

        if (Array.isArray(parsedData)) {
            // Proses setiap bagian dalam array JSON
            parsedData.forEach(part => {
                if (part.type === 'text') {
                    const p = document.createElement('p');
                    p.textContent = part.content;
                    messageDiv.appendChild(p);
                } 
                else if (part.type === 'image') {
                    const img = document.createElement('img');
                    img.src = part.content;
                    img.className = 'chat-image';
                    img.alt = 'Gambar dari chatbot';
                    messageDiv.appendChild(img);
                } 
                else if (part.type === 'buttons') {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'button-container';
                    part.content.forEach(buttonData => {
                        const button = document.createElement('a');
                        button.textContent = buttonData.label;
                        button.href = buttonData.url;
                        button.target = '_blank';
                        button.className = 'chat-button';
                        buttonContainer.appendChild(button);
                    });
                    messageDiv.appendChild(buttonContainer);
                }
            });
        } else {
             // Jika JSON valid tapi bukan array, anggap sebagai error format
            throw new Error("Format JSON harus berupa Array.");
        }
    } catch (error) {
        // Jika parsing gagal, anggap itu teks biasa
        const p = document.createElement('p');
        p.textContent = messageString;
        messageDiv.appendChild(p);
    }

    // Masukkan semua elemen yang sudah dibuat ke dalam satu bubble pesan
    appendMessage(messageDiv.innerHTML, 'bot');
}


chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Menampilkan pesan pengguna (hanya teks)
    appendMessage(`<p>${userMessage}</p>`, 'user');
    userInput.value = '';

    setTimeout(() => {
        const botResponseString = getFirestoreResponse(userMessage);
        renderBotMessage(botResponseString);
    }, 500);
});

document.addEventListener('DOMContentLoaded', loadKnowledgeBase);

// TODO: PASTE KONFIGURASI FIREBASE ANDA DI SINI
 const firebaseConfig = {
    apiKey: "AIzaSyDnizc-HXpSx-z4pA9P_crKCqPLK5735SI",
    authDomain: "proyek-chatbot-json.firebaseapp.com",
    projectId: "proyek-chatbot-json",
    storageBucket: "proyek-chatbot-json.firebasestorage.app",
    messagingSenderId: "283952252475",
    appId: "1:283952252475:web:ee9e1c2b7d5a9cef7afe1e"
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
    const fallbackAnswer = `{"type": "text", "content": "Maaf, saya belum mengerti pertanyaan itu. Mohon tunggu balasan dari admin kami di WhatsApp ya."}`;

    for (const rule of knowledgeBase) {
        for (const keyword of rule.keywords) {
            if (lowerCaseMessage.includes(keyword.toLowerCase().trim())) {
                return rule.answer;
            }
        }
    }
    return fallbackAnswer;
}

function appendMessage(htmlContent, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.innerHTML = htmlContent;
    messageContainer.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
}

function renderBotMessage(jsonString) {
    let messageContentHTML = '';
    try {
        const data = JSON.parse(jsonString);
        switch (data.type) {
            case 'text':
                messageContentHTML = `<p>${data.content}</p>`;
                break;
            case 'image':
                messageContentHTML = `
                    <img src="${data.url}" alt="Gambar dari chatbot" class="chat-image">
                    <p>${data.caption || ''}</p>
                `;
                break;
            case 'button':
                messageContentHTML = `
                    <p>${data.text}</p>
                    <a href="${data.url}" target="_blank" class="chat-button">${data.buttonText}</a>
                `;
                break;
            case 'rich':
                data.elements.forEach(element => {
                    if (element.type === 'image') {
                        messageContentHTML += `<img src="${element.url}" alt="Gambar dari chatbot" class="chat-image">`;
                    } else if (element.type === 'text') {
                        messageContentHTML += `<p>${element.content}</p>`;
                    } else if (element.type === 'button') {
                        messageContentHTML += `<a href="${element.url}" target="_blank" class="chat-button">${element.buttonText}</a>`;
                    }
                });
                break;
            default:
                messageContentHTML = `<p>${jsonString}</p>`;
        }
    } catch (e) {
        messageContentHTML = `<p>${jsonString}</p>`;
    }
    appendMessage(messageContentHTML, 'bot');
}


chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    appendMessage(`<p>${userMessage}</p>`, 'user');
    userInput.value = '';

    setTimeout(() => {
        const botResponseJSON = getFirestoreResponse(userMessage);
        renderBotMessage(botResponseJSON);
    }, 500);
});

document.addEventListener('DOMContentLoaded', loadKnowledgeBase);


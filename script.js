const API_KEY = 'AIzaSyB4JL-nBfykd7hw6U7u4w4ZgjQ73COsxQw'; // แทนที่ด้วย API key จาก Google AI Studio หรือ Vertex AI
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

async function generateContent(type) {
    const prompt = document.getElementById('prompt').value;
    if (!prompt) {
        alert('กรุณาพิมพ์พรอมต์ก่อน!');
        return;
    }
    
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = 'กำลังสร้าง... (อาจใช้เวลา 1-5 นาทีสำหรับวิดีโอ)';
    
    try {
        if (type === 'text') {
            // Generate ข้อความด้วย Gemini
            const response = await fetch(`${BASE_URL}/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            outputDiv.innerHTML = `<h2>เนื้อหาที่สร้าง:</h2><p>${text}</p>`;
            
        } else if (type === 'audio') {
            // Generate เสียงด้วย Text-to-Speech API
            const response = await fetch(`${TTS_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text: prompt },
                    voice: { languageCode: 'th-TH', name: 'th-TH-Neural2-A' }, // เสียงไทย (เปลี่ยนได้)
                    audioConfig: { audioEncoding: 'MP3' }
                })
            });
            const data = await response.json();
            const audioContent = data.audioContent;
            const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
            outputDiv.innerHTML = `<h2>เสียงที่สร้าง:</h2>`;
            audio.play();
            outputDiv.appendChild(audio);
            
        } else if (type === 'video') {
            // Generate วิดีโอด้วย Veo (async)
            const response = await fetch(`${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: { durationSeconds: '8', aspectRatio: '16:9' }
                })
            });
            const data = await response.json();
            const operationName = data.name;
            
            // Poll จนเสร็จ
            let done = false;
            while (!done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // รอ 10 วินาที
                const pollResponse = await fetch(`${BASE_URL}/${operationName}?key=${API_KEY}`);
                const pollData = await pollResponse.json();
                done = pollData.done;
                if (done) {
                    const videoUri = pollData.response.generateVideoResponse.generatedSamples[0].video.uri;
                    // Download หรือแสดง
                    outputDiv.innerHTML = `<h2>วิดีโอที่สร้าง:</h2><video controls src="${videoUri}"></video><p>ดาวน์โหลด: <a href="${videoUri}" target="_blank">คลิกที่นี่</a> (ใช้ API key ใน header ถ้าจำเป็น)</p>`;
                }
            }
        }
    } catch (error) {
        outputDiv.innerHTML = `เกิดข้อผิดพลาด: ${error.message}`;
    }
}

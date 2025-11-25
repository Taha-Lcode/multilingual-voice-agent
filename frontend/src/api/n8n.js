const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export const sendToN8n = async (audioBlob, transcript) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('transcript', transcript);

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        // Check if response is binary audio
        if (contentType && contentType.includes('audio')) {
            // Get text from custom header
            const aiText = response.headers.get('X-AI-Response') || response.headers.get('x-ai-response') || 'Response generated';
            
            console.log('AI Text from header:', aiText);

            // Get audio blob
            const audioBlob = await response.blob();
            console.log('Audio blob size:', audioBlob.size);
            
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL created:', audioUrl);

            return {
                text: aiText,
                audioUrl: audioUrl
            };
        }

        // Fallback to JSON
        const data = await response.json();
        console.log('JSON response:', data);
        
        return {
            text: data.text,
            audioBase64: data.audioBase64
        };

    } catch (error) {
        console.error('Error in sendToN8n:', error);
        throw error;
    }
};

// js/gemini-chat.js
class GeminiChat {
    constructor() {
       
        this.apiKey = 'AIzaSyAR72KMfP0_8Gvmd7xJF1oahjTdXlvkSFw';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.conversationHistory = [];
        this.maxHistory = 10; // أقصى عدد للرسائل المحفوظة
        this.systemPrompt = `أنت مساعد نباتات عربي خبير. اسمك "نباتي الذكي".
        
        قواعد أساسية:
        1. إجابتك باللغة العربية الفصحى أو العامية البسيطة
        2. كن دقيقاً وواضحاً في المعلومات
        3. إذا لم تعرف الإجابة، قل بصراحة "لا أعرف"
        4. اذكر المصادر العلمية إن أمكن
        5. قدم نصائح عملية وقابلة للتطبيق
        6. استخدم أمثلة من واقع الحياة العربية
        
        تخصصاتك:
        - تشخيص أمراض النباتات
        - نصائح الري والتسميد
        - زراعة النباتات المنزلية
        - حلول مشاكل الزراعة
        - معلومات علمية عن النباتات
        - نصائح للحدائق المنزلية`;
        
        this.initializeChat();
    }
    
    initializeChat() {
        // إضافة تاريخ بداية المحادثة
        this.addToHistory({
            role: 'system',
            content: this.systemPrompt
        });
    }
    
    addToHistory(message) {
        this.conversationHistory.push(message);
        // الحفاظ على حجم التاريخ المحدد
        if (this.conversationHistory.length > this.maxHistory + 1) { // +1 للنظام
            this.conversationHistory = [
                this.conversationHistory[0], // رسالة النظام
                ...this.conversationHistory.slice(-this.maxHistory)
            ];
        }
    }
    
    async sendMessage(message) {
        try {
            // إضافة رسالة المستخدم للتاريخ
            this.addToHistory({
                role: 'user',
                content: message
            });
            
            // إعداد الطلب
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: this.formatPrompt() }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0]) {
                const botResponse = data.candidates[0].content.parts[0].text;
                
                // إضافة رد البوت للتاريخ
                this.addToHistory({
                    role: 'assistant',
                    content: botResponse
                });
                
                return {
                    success: true,
                    message: botResponse
                };
            } else {
                throw new Error('No response from AI');
            }
            
        } catch (error) {
            console.error('Chat Error:', error);
            return {
                success: false,
                message: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                error: error.message
            };
        }
    }
    
    formatPrompt() {
        // تنسيق المحادثة السابقة للإرسال
        let prompt = this.systemPrompt + "\n\n";
        
        // إضافة آخر 5 رسائل فقط لتوفير السياق
        const recentMessages = this.conversationHistory.slice(-6); // +1 للنظام
        
        recentMessages.forEach((msg, index) => {
            if (index === 0) return; // تخطي رسالة النظام (مضاف مسبقاً)
            prompt += `${msg.role === 'user' ? 'المستخدم' : 'المساعد'}: ${msg.content}\n`;
        });
        
        prompt += "المساعد:";
        return prompt;
    }
    
    clearHistory() {
        this.conversationHistory = [{
            role: 'system',
            content: this.systemPrompt
        }];
    }
    
    getHistory() {
        return this.conversationHistory.filter(msg => msg.role !== 'system');
    }
}

// إنشاء نسخة عامة من الكلاس
window.GeminiChatBot = new GeminiChat();
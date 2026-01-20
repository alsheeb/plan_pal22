// js/chat-ui.js
class ChatUI {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.chatHistory = [];
        this.currentQuestion = '';
        
        this.initUI();
        this.bindEvents();
    }
    
    initUI() {
        // إنشاء عناصر الشات
        const chatContainer = document.createElement('div');
        chatContainer.id = 'plant-chat-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <i class="fas fa-robot"></i>
                    <span>مساعد النباتات الذكي</span>
                    <div class="chat-status">
                        <span class="status-dot online"></span>
                        <span>متصل</span>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="chat-btn minimize-btn" title="تصغير">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="chat-btn close-btn" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-body">
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="bot-message">
                            <div class="avatar">
                                <i class="fas fa-leaf"></i>
                            </div>
                            <div class="message-content">
                                <h4>🌿 مرحباً بك في مساعد النباتات الذكي!</h4>
                                <p>أنا هنا لمساعدتك في كل ما يتعلق بالنباتات. اسألني عن:</p>
                                <ul>
                                    <li>تشخيص الأمراض النباتية</li>
                                    <li>نصائح العناية اليومية</li>
                                    <li>مشاكل الزراعة والحلول</li>
                                    <li>أسئلة عامة عن النباتات</li>
                                </ul>
                                <p>اكتب سؤالك في المربع أدناه 👇</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="quick-questions">
                    <button class="quick-btn" data-question="كيف أعتني بنباتاتي المنزلية؟">
                        <i class="fas fa-home"></i> العناية المنزلية
                    </button>
                    <button class="quick-btn" data-question="ما أسباب اصفرار الأوراق؟">
                        <i class="fas fa-leaf"></i> اصفرار الأوراق
                    </button>
                    <button class="quick-btn" data-question="كيف أعالج الأمراض الفطرية؟">
                        <i class="fas fa-bug"></i> الأمراض الفطرية
                    </button>
                </div>
                
                <div class="chat-input-area">
                    <div class="input-wrapper">
                        <textarea 
                            id="chatInput" 
                            placeholder="اكتب سؤالك عن النباتات هنا..." 
                            rows="2"
                        ></textarea>
                        <div class="input-actions">
                            <button id="sendBtn" class="send-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    <div class="input-hints">
                        <span><i class="fas fa-lightbulb"></i> اضغط Ctrl+Enter للإرسال</span>
                        <button id="clearChat" class="text-btn">
                            <i class="fas fa-trash"></i> مسح المحادثة
                        </button>
                    </div>
                </div>
                
                <div class="typing-indicator" id="typingIndicator" style="display: none;">
                    <div class="dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>المساعد يكتب...</span>
                </div>
            </div>
            
            <div class="chat-footer">
                <span>Powered by Google Gemini AI</span>
                <span>•</span>
                <span id="messageCount">0 رسالة</span>
            </div>
        `;
        
        document.body.appendChild(chatContainer);
        
        // زر الفتح العائم
        const chatToggle = document.createElement('div');
        chatToggle.id = 'chatToggle';
        chatToggle.innerHTML = `
            <div class="toggle-icon">
                <i class="fas fa-robot"></i>
                <span class="notification-dot"></span>
            </div>
            <span class="toggle-text">اسأل عن النباتات</span>
        `;
        document.body.appendChild(chatToggle);
        
        this.applyStyles();
        this.closeChat(); // إغلاق الافتراضي
    }
    
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* زر الشات العائم */
            #chatToggle {
                position: fixed;
                bottom: 30px;
                left: 30px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 15px 20px;
                border-radius: 50px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                transition: all 0.3s ease;
                font-family: 'Cairo', sans-serif;
            }
            
            #chatToggle:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 30px rgba(16, 185, 129, 0.5);
            }
            
            .toggle-icon {
                position: relative;
                font-size: 24px;
            }
            
            .notification-dot {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 10px;
                height: 10px;
                background: #ef4444;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            /* حاوية الشات */
            #plant-chat-container {
                position: fixed;
                bottom: 100px;
                left: 30px;
                width: 400px;
                max-width: 90vw;
                height: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                z-index: 999;
                overflow: hidden;
                border: 1px solid #e5e7eb;
                font-family: 'Cairo', sans-serif;
            }
            
            /* هيدر الشات */
            .chat-header {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 18px;
                font-weight: 600;
            }
            
            .chat-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                opacity: 0.9;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #34d399;
            }
            
            .status-dot.online {
                background: #34d399;
                animation: blink 2s infinite;
            }
            
            .chat-actions {
                display: flex;
                gap: 8px;
            }
            
            .chat-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .chat-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            /* جسم الشات */
            .chat-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #fafafa;
            }
            
            /* الرسائل */
            .bot-message {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                animation: slideIn 0.3s ease;
            }
            
            .user-message {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                flex-direction: row-reverse;
                animation: slideIn 0.3s ease;
            }
            
            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 20px;
            }
            
            .bot-message .avatar {
                background: linear-gradient(135deg, #d1fae5, #a7f3d0);
                color: #065f46;
            }
            
            .user-message .avatar {
                background: linear-gradient(135deg, #93c5fd, #60a5fa);
                color: #1e40af;
            }
            
            .message-content {
                background: white;
                padding: 16px;
                border-radius: 18px;
                border: 1px solid #e5e7eb;
                max-width: 85%;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .bot-message .message-content {
                border-bottom-left-radius: 4px;
                background: white;
            }
            
            .user-message .message-content {
                border-bottom-right-radius: 4px;
                background: #f8fafc;
            }
            
            .message-content h4 {
                margin-bottom: 8px;
                color: #1f2937;
            }
            
            .message-content p {
                color: #4b5563;
                line-height: 1.6;
                margin-bottom: 8px;
            }
            
            .message-content ul {
                padding-right: 20px;
                margin: 10px 0;
                color: #4b5563;
            }
            
            .message-content li {
                margin-bottom: 5px;
            }
            
            .message-time {
                font-size: 11px;
                color: #9ca3af;
                text-align: left;
                margin-top: 8px;
            }
            
            /* الأسئلة السريعة */
            .quick-questions {
                padding: 0 20px 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
                background: white;
            }
            
            .quick-btn {
                background: #f0fdf4;
                border: 1px solid #a7f3d0;
                color: #065f46;
                padding: 10px 15px;
                border-radius: 12px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
                flex: 1;
                min-width: 120px;
                justify-content: center;
            }
            
            .quick-btn:hover {
                background: #d1fae5;
                transform: translateY(-2px);
            }
            
            /* منطقة الإدخال */
            .chat-input-area {
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                background: white;
            }
            
            .input-wrapper {
                position: relative;
                margin-bottom: 10px;
            }
            
            #chatInput {
                width: 100%;
                padding: 16px 60px 16px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                font-family: 'Cairo', sans-serif;
                font-size: 15px;
                resize: none;
                transition: border-color 0.3s;
                background: #f9fafb;
            }
            
            #chatInput:focus {
                outline: none;
                border-color: #10b981;
                background: white;
            }
            
            .input-actions {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
            }
            
            .send-btn {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                transition: all 0.3s;
            }
            
            .send-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
            }
            
            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .input-hints {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #6b7280;
            }
            
            .text-btn {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                transition: color 0.2s;
            }
            
            .text-btn:hover {
                color: #ef4444;
            }
            
            /* مؤشر الكتابة */
            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px 20px;
                background: white;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            
            .dots {
                display: flex;
                gap: 4px;
            }
            
            .dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                animation: bounce 1.4s infinite ease-in-out both;
            }
            
            .dots span:nth-child(1) { animation-delay: -0.32s; }
            .dots span:nth-child(2) { animation-delay: -0.16s; }
            
            /* الفوتر */
            .chat-footer {
                padding: 12px 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                font-size: 12px;
                color: #6b7280;
            }
            
            /* حالات خاصة */
            .welcome-message {
                animation: fadeIn 0.5s ease;
            }
            
            #plant-chat-container.closed {
                display: none;
            }
            
            #plant-chat-container.minimized {
                height: 70px;
                overflow: hidden;
            }
            
            #plant-chat-container.minimized .chat-body,
            #plant-chat-container.minimized .chat-footer {
                display: none;
            }
            
            /* الأنيميشن */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            /* التجاوب */
            @media (max-width: 768px) {
                #plant-chat-container {
                    width: 90vw;
                    left: 5vw;
                    right: 5vw;
                    bottom: 80px;
                }
                
                #chatToggle {
                    left: 20px;
                    bottom: 20px;
                }
            }
            
            @media (max-width: 480px) {
                #plant-chat-container {
                    width: 95vw;
                    left: 2.5vw;
                    height: 70vh;
                }
                
                .quick-questions {
                    flex-direction: column;
                }
                
                .quick-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // زر التبديل
        document.getElementById('chatToggle').addEventListener('click', () => this.toggleChat());
        
        // إغلاق وتصغير
        document.querySelector('.close-btn').addEventListener('click', () => this.closeChat());
        document.querySelector('.minimize-btn').addEventListener('click', () => this.minimizeChat());
        
        // إرسال الرسالة
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // الأسئلة السريعة
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.currentTarget.getAttribute('data-question');
                chatInput.value = question;
                this.sendMessage();
            });
        });
        
        // مسح المحادثة
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
        
        // السماح بالتصغير بالنقر على الهيدر
        document.querySelector('.chat-header').addEventListener('dblclick', () => this.minimizeChat());
    }
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // إضافة رسالة المستخدم
        this.addMessage(message, 'user');
        
        // مسح المدخل
        input.value = '';
        
        // تعطيل الزر أثناء المعالجة
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;
        
        // إظهار مؤشر الكتابة
        this.showTyping();
        
        try {
            // إرسال للذكاء الاصطناعي
            const response = await window.GeminiChatBot.sendMessage(message);
            
            // إخفاء مؤشر الكتابة
            this.hideTyping();
            
            if (response.success) {
                // إضافة رد البوت
                this.addMessage(response.message, 'bot');
            } else {
                this.addMessage('⚠️ ' + response.message, 'bot');
            }
            
        } catch (error) {
            this.hideTyping();
            this.addMessage('❌ حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', 'bot');
            console.error('Send error:', error);
        }
        
        // تفعيل الزر مجدداً
        sendBtn.disabled = false;
        input.focus();
    }
    
    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        
        const time = new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'leaf'}"></i>
            </div>
            <div class="message-content">
                ${text}
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // التمرير للأسفل
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // تحديث عدد الرسائل
        this.updateMessageCount();
        
        // حفظ في التاريخ
        this.chatHistory.push({
            text,
            sender,
            time: new Date().toISOString()
        });
    }
    
    showTyping() {
        document.getElementById('typingIndicator').style.display = 'flex';
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTyping() {
        document.getElementById('typingIndicator').style.display = 'none';
    }
    
    updateMessageCount() {
        const count = this.chatHistory.length;
        document.getElementById('messageCount').textContent = `${count} رسالة`;
    }
    
    toggleChat() {
        const chatContainer = document.getElementById('plant-chat-container');
        
        if (this.isMinimized) {
            this.isMinimized = false;
            chatContainer.classList.remove('minimized');
            chatContainer.classList.remove('closed');
        } else if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        const chatContainer = document.getElementById('plant-chat-container');
        chatContainer.classList.remove('closed');
        chatContainer.classList.remove('minimized');
        this.isOpen = true;
        this.isMinimized = false;
        
        // إظهار إشعار بسيط
        const toggleIcon = document.querySelector('.toggle-icon');
        const dot = toggleIcon.querySelector('.notification-dot');
        if (dot) dot.style.display = 'none';
        
        // تركيز على المدخل
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    }
    
    closeChat() {
        const chatContainer = document.getElementById('plant-chat-container');
        chatContainer.classList.add('closed');
        this.isOpen = false;
        this.isMinimized = false;
    }
    
    minimizeChat() {
        const chatContainer = document.getElementById('plant-chat-container');
        chatContainer.classList.toggle('minimized');
        this.isMinimized = !this.isMinimized;
    }
    
    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        
        // مسح جميع الرسائل عدا رسالة الترحيب
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMsg) {
            messagesContainer.appendChild(welcomeMsg.cloneNode(true));
        }
        
        // مسح التاريخ
        this.chatHistory = [];
        window.GeminiChatBot.clearHistory();
        
        // تحديث العداد
        this.updateMessageCount();
    }
}

// تهيئة واجهة المستخدم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.ChatUI = new ChatUI();
});
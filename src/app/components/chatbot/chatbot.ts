import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../../core/services/chat.service';
import { PatientService } from '../../core/services/patient.service';
import { ChatMessage, ChatSessionSummary } from '../../core/interfaces/chat.interfaces';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageTextarea') private messageTextarea!: ElementRef;

  private readonly chatService = inject(ChatService);
  private readonly patientService = inject(PatientService);
  private readonly sanitizer = inject(DomSanitizer);

  // ─── State ────────────────────────────────────────────────────
  readonly patientId = signal<number | null>(null);
  readonly chats = signal<ChatSessionSummary[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly activeChatId = signal<number | null>(null);
  readonly messageInput = signal('');

  readonly isLoadingProfile = signal(true);
  readonly isLoadingChats = signal(false);
  readonly isLoadingHistory = signal(false);
  readonly isSending = signal(false);
  readonly sidebarOpen = signal(true);

  ngOnInit(): void {
    this.loadPatientProfile();
  }

  // ─── Initialization ───────────────────────────────────────────

  private loadPatientProfile(): void {
    this.isLoadingProfile.set(true);
    this.patientService.getProfile().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.patientId.set(res.data.patientId);
          this.loadSidebarChats();
        }
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
      },
    });
  }

  private loadSidebarChats(): void {
    const pid = this.patientId();
    if (!pid) return;

    this.isLoadingChats.set(true);
    this.chatService.getPatientChats(pid).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.chats.set(res.data);
        }
        this.isLoadingChats.set(false);
      },
      error: () => {
        this.isLoadingChats.set(false);
      },
    });
  }

  // ─── Actions ──────────────────────────────────────────────────

  startNewChat(): void {
    this.activeChatId.set(null);
    this.messages.set([]);
    this.messageInput.set('');
    this.focusInput();
  }

  openChat(chatSessionId: number): void {
    if (this.activeChatId() === chatSessionId) return;

    this.activeChatId.set(chatSessionId);
    this.messages.set([]);
    this.isLoadingHistory.set(true);

    this.chatService.getChatHistory(chatSessionId).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.messages.set(res.data);
          this.scrollToBottom();
        }
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.isLoadingHistory.set(false);
      },
    });
  }

  sendMessage(): void {
    const text = this.messageInput().trim();
    const pid = this.patientId();
    if (!text || !pid || this.isSending()) return;

    // Optimistically add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, userMsg]);
    this.messageInput.set('');
    this.isSending.set(true);
    this.scrollToBottom();
    this.resetTextareaHeight();

    this.chatService
      .sendMessage({
        patientId: pid,
        chatSessionId: this.activeChatId() ?? null,
        message: text,
      })
      .subscribe({
        next: (res) => {
          if (res.isSuccess && res.data) {
            // If this was a new chat, set the active chat ID
            if (!this.activeChatId()) {
              this.activeChatId.set(res.data.chatSessionId);
            }

            // Append AI response
            const aiMsg: ChatMessage = {
              role: 'assistant',
              content: res.data.reply,
              timestamp: res.data.timestamp,
            };
            this.messages.update((msgs) => [...msgs, aiMsg]);
            this.scrollToBottom();

            // Refresh sidebar to reflect the new/updated chat
            this.loadSidebarChats();
          }
          this.isSending.set(false);
        },
        error: () => {
          // Remove the optimistically added user message on error
          this.messages.update((msgs) => msgs.slice(0, -1));
          this.messageInput.set(text);
          this.isSending.set(false);
        },
      });
  }

  onKeydown(event: KeyboardEvent): void {
    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    let s = dateStr.trim();
    if (!s.endsWith('Z') && !/[+-]\d{2}(?::?\d{2})?$/.test(s)) {
      s += 'Z';
    }
    return new Date(s);
  }

  getRelativeTime(dateStr: string): string {
    const date = this.parseDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60000) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTimestamp(dateStr: string): string {
    const date = this.parseDate(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  trackBySessionId(_index: number, chat: ChatSessionSummary): number {
    return chat.chatSessionId;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  private focusInput(): void {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.focus();
      }
    }, 50);
  }

  private resetTextareaHeight(): void {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.style.height = 'auto';
      }
    }, 0);
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';

    // 1. Escape HTML special characters
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

    // 3. Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 4. Italic (*text* or _text_)
    html = html.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

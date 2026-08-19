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

    // 1. Normalize line breaks and Unicode non-breaking spaces
    let raw = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u202F\u00A0]/g, ' ');

    // 2. Extract and protect fenced code blocks
    const codeBlocks: string[] = [];
    raw = raw.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const escapedCode = this.escapeHtml(code.trimEnd());
      const langLabel = lang
        ? `<div class="chat-code-header"><span>${this.escapeHtml(lang)}</span></div>`
        : '';
      const html = `<div class="chat-code-wrapper">${langLabel}<pre class="chat-code-block"><code>${escapedCode}</code></pre></div>`;
      codeBlocks.push(html);
      return `\n%%CODEBLOCK_${codeBlocks.length - 1}%%\n`;
    });

    // 3. Extract and protect inline code
    const inlineCodes: string[] = [];
    raw = raw.replace(/`([^`\n]+)`/g, (_match, code) => {
      const html = `<code class="chat-inline-code">${this.escapeHtml(code)}</code>`;
      inlineCodes.push(html);
      return `%%INLINECODE_${inlineCodes.length - 1}%%`;
    });

    // 4. Parse block by block
    const lines = raw.split('\n');
    const output: string[] = [];

    let inList = false;
    const listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];
    let inBlockquote = false;
    let quoteLines: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];
    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      if (paragraphLines.length > 0) {
        const text = paragraphLines.join('<br/>');
        output.push(`<p>${this.formatInline(text)}</p>`);
        paragraphLines = [];
      }
    };

    const flushQuote = () => {
      if (inBlockquote && quoteLines.length > 0) {
        const text = quoteLines.join('<br/>');
        output.push(`<blockquote>${this.formatInline(text)}</blockquote>`);
        quoteLines = [];
        inBlockquote = false;
      }
    };

    const flushTable = () => {
      if (inTable && tableLines.length > 0) {
        output.push(this.renderTableHtml(tableLines));
        tableLines = [];
        inTable = false;
      }
    };

    const closeAllLists = () => {
      while (listStack.length > 0) {
        const top = listStack.pop()!;
        output.push(`</li></${top.type}>`);
      }
      inList = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for codeblock placeholder
      const codeblockMatch = trimmed.match(/^%%CODEBLOCK_(\d+)%%$/);
      if (codeblockMatch) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        const index = parseInt(codeblockMatch[1], 10);
        output.push(codeBlocks[index]);
        continue;
      }

      // Check for empty line
      if (!trimmed) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        continue;
      }

      // Check for Horizontal Rule: ---, ***, ___
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        output.push('<hr class="chat-hr" />');
        continue;
      }

      // Check for Headings: #, ##, ###, ####
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        output.push(`<h${level}>${this.formatInline(text)}</h${level}>`);
        continue;
      }

      // Check for Blockquote: > text
      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushTable();
        closeAllLists();
        inBlockquote = true;
        quoteLines.push(quoteMatch[1]);
        continue;
      } else if (inBlockquote) {
        flushQuote();
      }

      // Check for Table: line starts and ends with |
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        flushParagraph();
        flushQuote();
        closeAllLists();
        inTable = true;
        tableLines.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Check for List items:
      // Unordered: [-*+•◦▪] or sub-bullets with spaces
      // Ordered: 1. or 1)
      const listMatch = line.match(/^(\s*)([-*+•◦▪]|\d+[\.\)])\s+(.+)$/);
      if (listMatch) {
        flushParagraph();
        flushQuote();
        flushTable();

        const leadingSpaces = listMatch[1].length;
        const bullet = listMatch[2];
        const itemContent = listMatch[3];
        const isOrdered = /^\d+[\.\)]$/.test(bullet);
        const listType: 'ul' | 'ol' = isOrdered ? 'ol' : 'ul';

        if (listStack.length === 0) {
          listStack.push({ type: listType, indent: leadingSpaces });
          output.push(`<${listType}><li>${this.formatInline(itemContent)}`);
        } else {
          const currentList = listStack[listStack.length - 1];
          if (leadingSpaces > currentList.indent) {
            listStack.push({ type: listType, indent: leadingSpaces });
            output.push(`<${listType} class="chat-sublist"><li>${this.formatInline(itemContent)}`);
          } else if (leadingSpaces < currentList.indent) {
            while (listStack.length > 1 && leadingSpaces < listStack[listStack.length - 1].indent) {
              const closed = listStack.pop()!;
              output.push(`</li></${closed.type}>`);
            }
            output.push(`</li><li>${this.formatInline(itemContent)}`);
          } else {
            output.push(`</li><li>${this.formatInline(itemContent)}`);
          }
        }
        inList = true;
        continue;
      }

      // Indented continuation inside list item
      if (inList && line.match(/^\s{2,}\S/)) {
        output.push(` ${this.formatInline(trimmed)}`);
        continue;
      } else if (inList) {
        closeAllLists();
      }

      // Plain paragraph line
      paragraphLines.push(trimmed);
    }

    // Flush any remaining blocks
    flushParagraph();
    flushQuote();
    flushTable();
    closeAllLists();

    let finalHtml = output.join('');

    // 5. Restore inline code placeholders
    finalHtml = finalHtml.replace(/%%INLINECODE_(\d+)%%/g, (_match, index) => {
      return inlineCodes[parseInt(index, 10)] || '';
    });

    return this.sanitizer.bypassSecurityTrustHtml(finalHtml);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatInline(text: string): string {
    if (!text) return '';

    // 1. Escape raw HTML special chars first
    let s = this.escapeHtml(text);

    // 2. Links: [text](url)
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );

    // 3. Bold + Italic: ***text*** or ___text___
    s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');

    // 4. Bold: **text** or __text__
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 5. Italic: *text* or _text_
    s = s.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // 6. Strikethrough: ~~text~~
    s = s.replace(/~~(.*?)~~/g, '<del>$1</del>');

    return s;
  }

  private renderTableHtml(lines: string[]): string {
    if (lines.length < 2) {
      return lines.map((l) => `<p>${this.formatInline(l)}</p>`).join('');
    }

    const parseRow = (row: string) =>
      row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

    const headers = parseRow(lines[0]);
    const isSeparator = /^\|?(\s*:?-+:?\s*\|)+$/.test(lines[1]);
    const startIndex = isSeparator ? 2 : 1;

    let table = '<div class="chat-table-wrapper"><table class="chat-table">';
    table += '<thead><tr>';
    for (const h of headers) {
      table += `<th>${this.formatInline(h)}</th>`;
    }
    table += '</tr></thead><tbody>';

    for (let i = startIndex; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      table += '<tr>';
      for (const cell of cells) {
        table += `<td>${this.formatInline(cell)}</td>`;
      }
      table += '</tr>';
    }
    table += '</tbody></table></div>';
    return table;
  }
}

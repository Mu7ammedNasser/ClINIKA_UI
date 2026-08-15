import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Chatbot } from './chatbot';

describe('Chatbot', () => {
  let component: Chatbot;
  let fixture: ComponentFixture<Chatbot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty message input and no active chat', () => {
    expect(component.messageInput()).toBe('');
    expect(component.activeChatId()).toBeNull();
  });

  it('should initialize with empty messages and chats arrays', () => {
    expect(component.messages()).toEqual([]);
    expect(component.chats()).toEqual([]);
  });

  it('should initialize with sidebar open', () => {
    expect(component.sidebarOpen()).toBe(true);
  });

  it('should toggle sidebar state', () => {
    expect(component.sidebarOpen()).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
  });

  it('should reset state when starting a new chat', () => {
    component.startNewChat();
    expect(component.activeChatId()).toBeNull();
    expect(component.messages()).toEqual([]);
    expect(component.messageInput()).toBe('');
  });

  it('should not send message when input is empty', () => {
    component.messageInput.set('');
    component.sendMessage();
    expect(component.isSending()).toBe(false);
  });

  it('should not send message when input is only whitespace', () => {
    component.messageInput.set('   ');
    component.sendMessage();
    expect(component.isSending()).toBe(false);
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    expect(component.getRelativeTime(now.toISOString())).toBe('Just now');
  });

  it('should parse UTC dates without trailing Z correctly as Just now', () => {
    const nowUtcString = new Date().toISOString().replace('Z', '');
    expect(component.getRelativeTime(nowUtcString)).toBe('Just now');
  });

  it('should format timestamp to time string', () => {
    const result = component.formatTimestamp('2026-08-15T14:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

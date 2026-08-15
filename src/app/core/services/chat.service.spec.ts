import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have getPatientChats, getChatHistory, and sendMessage methods defined', () => {
    expect(typeof service.getPatientChats).toBe('function');
    expect(typeof service.getChatHistory).toBe('function');
    expect(typeof service.sendMessage).toBe('function');
  });
});

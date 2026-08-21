import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorRequestService } from '../../../core/services/doctor-request.service';
import {
  DoctorRegistrationRequestDto,
  DoctorRegistrationRequestSummaryDto,
} from '../../../core/interfaces/doctor-request.interfaces';

@Component({
  selector: 'app-doctor-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-requests.html',
  styleUrl: './doctor-requests.css',
})
export class DoctorRequestsManagement implements OnInit {
  private readonly doctorRequestService = inject(DoctorRequestService);

  readonly requests = signal<DoctorRegistrationRequestSummaryDto[]>([]);
  readonly selectedRequest = signal<DoctorRegistrationRequestDto | null>(null);
  readonly isLoading = signal(false);
  readonly isDetailsLoading = signal(false);
  readonly isProcessingAction = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Filters & Search
  selectedStatus = 'All';
  searchQuery = '';

  // Reject modal state
  showRejectModal = false;
  rejectRequestId: number | null = null;
  rejectionReason = '';

  readonly statusTabs = [
    { label: 'All Requests', value: 'All' },
    { label: 'Pending Review', value: 'PendingAdminReview' },
    { label: 'Email Confirmed', value: 'EmailConfirmed' },
    { label: 'Active', value: 'Active' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.doctorRequestService.getAllRequests(this.selectedStatus).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.isSuccess && res.data) {
          this.requests.set(res.data);
        } else {
          this.requests.set([]);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Failed to load doctor registration requests.'
        );
      },
    });
  }

  onTabChange(status: string): void {
    this.selectedStatus = status;
    this.loadRequests();
  }

  get filteredRequests(): DoctorRegistrationRequestSummaryDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.requests();

    return this.requests().filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.primarySpecialty?.toLowerCase().includes(q) ||
        r.medicalLicenseNumber?.toLowerCase().includes(q)
    );
  }

  viewDetails(id: number): void {
    this.isDetailsLoading.set(true);
    this.selectedRequest.set(null);

    this.doctorRequestService.getRequestById(id).subscribe({
      next: (res) => {
        this.isDetailsLoading.set(false);
        if (res.isSuccess && res.data) {
          this.selectedRequest.set(res.data);
        }
      },
      error: (err) => {
        this.isDetailsLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Failed to load doctor request details.'
        );
      },
    });
  }

  closeDetails(): void {
    this.selectedRequest.set(null);
  }

  activateDoctor(id: number): void {
    if (!confirm('Are you sure you want to activate this doctor account? This will create their user credentials and grant full doctor access.')) {
      return;
    }

    this.isProcessingAction.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.doctorRequestService.activateDoctor(id).subscribe({
      next: (res) => {
        this.isProcessingAction.set(false);
        if (res.isSuccess) {
          this.successMessage.set('Doctor account successfully activated and verified!');
          this.loadRequests();
          if (this.selectedRequest()?.id === id) {
            this.viewDetails(id);
          }
        } else {
          this.errorMessage.set(res.message || 'Activation failed.');
        }
      },
      error: (err) => {
        this.isProcessingAction.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to activate doctor account.');
      },
    });
  }

  openRejectModal(id: number): void {
    this.rejectRequestId = id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectRequestId = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.rejectRequestId) return;
    if (!this.rejectionReason.trim()) {
      alert('Please provide a reason for rejecting or deactivating this request.');
      return;
    }

    this.isProcessingAction.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.doctorRequestService.rejectDoctor(this.rejectRequestId, this.rejectionReason).subscribe({
      next: (res) => {
        this.isProcessingAction.set(false);
        this.closeRejectModal();
        if (res.isSuccess) {
          this.successMessage.set('Doctor registration request has been marked as Rejected.');
          this.loadRequests();
          if (this.selectedRequest()?.id === this.rejectRequestId) {
            this.closeDetails();
          }
        } else {
          this.errorMessage.set(res.message || 'Rejection failed.');
        }
      },
      error: (err) => {
        this.isProcessingAction.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to reject doctor request.');
      },
    });
  }
}

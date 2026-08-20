import { Routes } from '@angular/router';

import { authGuard } from './core/gurds/auth.guard';
import { roleGuard } from './core/gurds/role.guard';
import { guestGuard } from './core/gurds/guest.guard';
import { UserRole } from './core/interfaces/auth.interfaces';

export const routes: Routes = [
  // ─── Auth Routes (guest only) ──────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/auth/reset-password/reset-password').then(
        (m) => m.ResetPassword
      ),
  },

  // ─── Doctor Layout ─────────────────────────────────────────────
  {
    path: 'doctor',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Doctor] },
    loadComponent: () =>
      import('./layouts/doctor-layout/doctor-layout').then(
        (m) => m.DoctorLayout
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./components/patients/patient-search/patient-search').then(
            (m) => m.PatientSearch
          ),
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./components/patients/patient-details/patient-details').then(
            (m) => m.PatientDetails
          ),
      },
      {
        path: 'patients/:id/history',
        loadComponent: () =>
          import('./components/patients/patient-history/patient-history').then(
            (m) => m.PatientHistory
          ),
      },
      {
        path: 'sessions/create',
        loadComponent: () =>
          import('./components/sessions/create-session/create-session').then(
            (m) => m.CreateSession
          ),
      },
      {
        path: 'sessions/diagnosis',
        loadComponent: () =>
          import('./components/sessions/diagnosis/diagnosis').then(
            (m) => m.Diagnosis
          ),
      },
      {
        path: 'sessions/interaction',
        loadComponent: () =>
          import(
            './components/sessions/interaction-check/interaction-check'
          ).then((m) => m.InteractionCheck),
      },
      {
        path: 'sessions/reports',
        loadComponent: () =>
          import('./components/sessions/reports/reports').then(
            (m) => m.Reports
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings').then((m) => m.Settings),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ─── Patient Layout ────────────────────────────────────────────
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Patient] },
    loadComponent: () =>
      import('./layouts/patient-layout/patient-layout').then(
        (m) => m.PatientLayout
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './components/patients/patient-dashboard/patient-dashboard'
          ).then((m) => m.PatientDashboard),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import(
            './components/patients/patient-sessions/patient-sessions'
          ).then((m) => m.PatientSessions),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./components/chatbot/chatbot').then((m) => m.Chatbot),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings').then((m) => m.Settings),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ─── Admin Layout ──────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.Admin] },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then(
        (m) => m.AdminLayout
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboard
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./components/admin/user-management/user-management').then(
            (m) => m.UserManagement
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/admin/role-management/role-management').then(
            (m) => m.RoleManagement
          ),
      },
      {
        path: 'diseases',
        loadComponent: () =>
          import('./components/admin/disease-management/disease-management').then(
            (m) => m.DiseaseManagement
          ),
      },
      {
        path: 'allergies',
        loadComponent: () =>
          import('./components/admin/allergy-management/allergy-management').then(
            (m) => m.AllergyManagement
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings').then((m) => m.Settings),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ─── Default & Wildcard ────────────────────────────────────────
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

import { Department } from '../types';

export interface MenuItem {
  label: string;
  path: string;
}

export interface DeptInfo {
  label: string;
  color: string;
  bgDark: string;
  icon: string;
  menuItems: MenuItem[];
}

export const DEPT_CONFIG: Record<Department, DeptInfo> = {
  fire: {
    label: 'Fire Department',
    color: '#ff6b35',
    bgDark: '#0f0500',
    icon: '🔥',
    menuItems: [
      { label: 'Live Incidents', path: '/incidents' },
      { label: 'Active Units', path: '/units' },
      { label: 'Incident Map', path: '/map' },
      { label: 'Case History', path: '/history' },
      { label: 'Resources', path: '/resources' },
    ],
  },
  medical: {
    label: 'Emergency Medical Service',
    color: '#00c896',
    bgDark: '#00100a',
    icon: '🏥',
    menuItems: [
      { label: 'Active Cases', path: '/incidents' },
      { label: 'Ambulance Units', path: '/units' },
      { label: 'Patient Intake', path: '/intake' },
      { label: 'Case History', path: '/history' },
      { label: 'Hospital Status', path: '/hospitals' },
    ],
  },
  police: {
    label: 'Police Department',
    color: '#3b82f6',
    bgDark: '#00050f',
    icon: '🚔',
    menuItems: [
      { label: 'Live Incidents', path: '/incidents' },
      { label: 'Officers on Duty', path: '/units' },
      { label: 'Incident Map', path: '/map' },
      { label: 'Case History', path: '/history' },
      { label: 'Profiles', path: '/profiles' },
    ],
  },
  defense: {
    label: 'Civil Defense Authority',
    color: '#ef4444',
    bgDark: '#0f0000',
    icon: '🛡️',
    menuItems: [
      { label: 'Threat Monitor', path: '/incidents' },
      { label: 'Response Teams', path: '/units' },
      { label: 'Threat Map', path: '/map' },
      { label: 'Incident Log', path: '/history' },
      { label: 'Protocols', path: '/protocols' },
    ],
  },
};

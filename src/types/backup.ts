import { Timestamp } from 'firebase/firestore';
import { Socio } from './socio';

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Timestamp;
  createdBy: string;
  asociacionId: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'creating' | 'completed' | 'failed' | 'corrupted';
  size: number; // in bytes
  recordCount: number;
  version: string;
  checksum: string;
  tags: string[];
  isEncrypted: boolean;
  compressionType: 'none' | 'gzip' | 'brotli';
  storageLocation: string;
  expiresAt?: Timestamp;
  lastVerified?: Timestamp;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface BackupData {
  metadata: BackupMetadata;
  socios: Socio[];
  settings?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string; // HH:MM format
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  includeSettings: boolean;
  includeCustomData: boolean;
  retentionDays: number;
  notificationsEnabled: boolean;
}

export interface RestoreOptions {
  backupId: string;
  restoreType: 'full' | 'socios_only' | 'settings_only' | 'selective';
  selectedFields?: string[];
  overwriteExisting: boolean;
  createBackupBeforeRestore: boolean;
  validateData: boolean;
}

export interface BackupProgress {
  step: string;
  progress: number;
  message: string;
  currentItem?: string;
  totalItems?: number;
  processedItems?: number;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Timestamp;
  nextScheduledBackup?: Timestamp;
  successfulBackups: number;
  failedBackups: number;
  averageSize: number;
  oldestBackup?: Timestamp;
}

export interface BackupVerification {
  id: string;
  backupId: string;
  verifiedAt: Timestamp;
  status: 'passed' | 'failed' | 'warning';
  issues: BackupIssue[];
  dataIntegrity: number; // percentage
  recordsVerified: number;
  recordsTotal: number;
}

export interface BackupIssue {
  type: 'corruption' | 'missing_data' | 'invalid_format' | 'checksum_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords?: string[];
  suggestedAction: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun?: Timestamp;
  nextRun: Timestamp;
  config: Partial<BackupConfig>;
}

export type BackupFilterType = 'all' | 'manual' | 'automatic' | 'scheduled' | 'failed';
export type BackupSortField = 'createdAt' | 'name' | 'size' | 'recordCount' | 'status';
export type BackupSortOrder = 'asc' | 'desc';
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupManifest {
  backupId: string;
  timestamp: string;
  collections: Record<string, number>;
  totalRecords: number;
  location: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.resolve(__dirname, '../../backups');

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err: any) {
        this.logger.warn(`Could not create backup directory: ${err.message}`);
      }
    }
  }

  async createBackup(adminEmail: string): Promise<BackupManifest> {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    const collectionsToBackup = ['properties', 'contracts', 'viewing_requests', 'users'];
    const db = admin.firestore();

    const result: Record<string, number> = {};
    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const coll of collectionsToBackup) {
      try {
        const snap = await db.collection(coll).limit(1000).get();
        result[coll] = snap.size;
        totalRecords += snap.size;
        backupData[coll] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (err: any) {
        this.logger.error(`Failed to export collection ${coll}: ${err.message}`);
        result[coll] = 0;
      }
    }

    const filePath = path.join(this.backupDir, `${backupId}.json`);
    const manifest: BackupManifest = {
      backupId,
      timestamp,
      collections: result,
      totalRecords,
      location: filePath,
    };

    try {
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            manifest,
            meta: { createdBy: adminEmail, schemaVersion: '1.0' },
            data: backupData,
          },
          null,
          2,
        ),
      );
      this.logger.log(`✅ Backup created successfully: ${backupId} (${totalRecords} records)`);
    } catch (err: any) {
      this.logger.error(`Failed to write backup file: ${err.message}`);
    }

    // Record audit event in Firestore
    try {
      await db.collection('backup_audit_log').add({
        ...manifest,
        createdBy: adminEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch {}

    return manifest;
  }

  async listBackups(): Promise<BackupManifest[]> {
    if (!fs.existsSync(this.backupDir)) return [];
    try {
      const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.json'));
      const manifests: BackupManifest[] = [];

      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(this.backupDir, file), 'utf8'));
          if (content.manifest) {
            manifests.push(content.manifest);
          }
        } catch {}
      }

      return manifests.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      return [];
    }
  }
}

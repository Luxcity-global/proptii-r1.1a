import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class HomeownerService {
  private readonly logger = new Logger(HomeownerService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  // ── Maintenance ──────────────────────────────────────────────────────────

  private get maintenanceCol() {
    const db = this.db;
    return db ? db.collection('homeowner_maintenance') : null;
  }

  async getMaintenanceTasks(userId: string) {
    const col = this.maintenanceCol;
    if (!col) return { tasks: [] };
    try {
      const snap = await col.where('userId', '==', userId).get();
      return { tasks: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
    } catch (err: any) {
      this.logger.warn(`getMaintenanceTasks error: ${err?.message || err}`);
      return { tasks: [] };
    }
  }

  async createMaintenanceTask(userId: string, data: any) {
    const col = this.maintenanceCol;
    const docId = `task_${userId}_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...data,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (col) {
      try { await col.doc(docId).set(payload); } catch (err: any) {
        this.logger.warn(`createMaintenanceTask error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, ...payload };
  }

  async updateMaintenanceTask(taskId: string, data: any) {
    const col = this.maintenanceCol;
    const update = { ...data, updatedAt: new Date().toISOString() };
    if (col) {
      try { await col.doc(taskId).set(update, { merge: true }); } catch (err: any) {
        this.logger.warn(`updateMaintenanceTask error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  async deleteMaintenanceTask(taskId: string) {
    const col = this.maintenanceCol;
    if (col) {
      try { await col.doc(taskId).delete(); } catch (err: any) {
        this.logger.warn(`deleteMaintenanceTask error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  // ── Projects ─────────────────────────────────────────────────────────────

  private get projectsCol() {
    const db = this.db;
    return db ? db.collection('homeowner_projects') : null;
  }

  async getProjects(userId: string) {
    const col = this.projectsCol;
    if (!col) return { projects: [] };
    try {
      const snap = await col.where('userId', '==', userId).get();
      return { projects: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
    } catch (err: any) {
      this.logger.warn(`getProjects error: ${err?.message || err}`);
      return { projects: [] };
    }
  }

  async createProject(userId: string, data: any) {
    const col = this.projectsCol;
    const docId = `proj_${userId}_${Date.now()}`;
    const payload = {
      id: docId,
      userId,
      ...data,
      status: data.status || 'planning',
      progress: data.progress ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (col) {
      try { await col.doc(docId).set(payload); } catch (err: any) {
        this.logger.warn(`createProject error: ${err?.message || err}`);
      }
    }
    return { success: true, id: docId, ...payload };
  }

  async updateProject(projectId: string, data: any) {
    const col = this.projectsCol;
    const update = { ...data, updatedAt: new Date().toISOString() };
    if (col) {
      try { await col.doc(projectId).set(update, { merge: true }); } catch (err: any) {
        this.logger.warn(`updateProject error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }

  async deleteProject(projectId: string) {
    const col = this.projectsCol;
    if (col) {
      try { await col.doc(projectId).delete(); } catch (err: any) {
        this.logger.warn(`deleteProject error: ${err?.message || err}`);
      }
    }
    return { success: true };
  }
}

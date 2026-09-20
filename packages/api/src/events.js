import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';

export class ProjectEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  publish(projectId, event) {
    const payload = {
      id: crypto.randomUUID(),
      projectId,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.emit(`project:${projectId}`, payload);
    this.emit('all', payload);
    return payload;
  }

  subscribe(projectId, listener) {
    const channel = `project:${projectId}`;
    this.on(channel, listener);
    return () => this.off(channel, listener);
  }
}

export const defaultProjectEventBus = new ProjectEventBus();

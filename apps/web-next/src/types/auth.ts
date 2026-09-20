export type UserRole = 'executive' | 'project_controls' | 'cost_engineer' | 'auditor' | 'viewer';

export interface UserContext {
  userId: string;
  organizationId: string;
  projectId: string;
  role: UserRole;
  name: string;
}

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  organization_id?: string;
  currency?: string;
  status?: string;
}

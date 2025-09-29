import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== Types ====================
export interface ProjectGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  group_id?: string;
  default_cli_tag?: string;
  default_env_tag?: string;
  default_ide_tag?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CLITag {
  id: string;
  name: string;
  command: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface EnvTag {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  configurations?: EnvConfiguration[];
}

export interface EnvConfiguration {
  id?: string;
  tag_id?: string;
  key: string;
  value: string;
  description?: string;
}

export interface IDETag {
  id: string;
  name: string;
  executable_path: string;
  command_args?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Session {
  sessionId: string;
  projectId: string;
  status: string;
  message?: string;
}

// ==================== API Services ====================

// Project Groups
export const groupApi = {
  getAll: () => api.get<ProjectGroup[]>('/groups'),
  create: (group: Partial<ProjectGroup>) => api.post<ProjectGroup>('/groups', group),
  delete: (id: string) => api.delete(`/groups/${id}`),
};

// CLI Tags
export const cliTagApi = {
  getAll: () => api.get<CLITag[]>('/cli-tags'),
  create: (tag: Partial<CLITag>) => api.post<CLITag>('/cli-tags', tag),
  update: (id: string, tag: Partial<CLITag>) => api.put(`/cli-tags/${id}`, tag),
  delete: (id: string) => api.delete(`/cli-tags/${id}`),
};

// Environment Tags
export const envTagApi = {
  getAll: () => api.get<EnvTag[]>('/env-tags'),
  getById: (id: string) => api.get<EnvTag>(`/env-tags/${id}`),
  create: (tag: Partial<EnvTag>) => api.post<EnvTag>('/env-tags', tag),
  update: (id: string, tag: Partial<EnvTag>) => api.put(`/env-tags/${id}`, tag),
  delete: (id: string) => api.delete(`/env-tags/${id}`),
};

// IDE Tags
export const ideTagApi = {
  getAll: () => api.get<IDETag[]>('/ide-tags'),
  getById: (id: string) => api.get<IDETag>(`/ide-tags/${id}`),
  create: (tag: Partial<IDETag>) => api.post<IDETag>('/ide-tags', tag),
  update: (id: string, tag: Partial<IDETag>) => api.put(`/ide-tags/${id}`, tag),
  delete: (id: string) => api.delete(`/ide-tags/${id}`),
};

// Projects
export const projectApi = {
  getAll: (group_id?: string) => {
    const params = group_id ? { group_id } : {};
    return api.get<Project[]>('/projects', { params });
  },
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (project: Partial<Project>) => api.post<Project>('/projects', project),
  update: (id: string, project: Partial<Project>) => api.put(`/projects/${id}`, project),
  delete: (id: string) => api.delete(`/projects/${id}`),
  start: (id: string, cli_tag_id?: string, env_tag_id?: string) =>
    api.post<Session>(`/projects/${id}/start`, { cli_tag_id, env_tag_id }),
  openIDE: (id: string, ide_tag_id?: string) =>
    api.post<{ projectId: string; ideTag: string; status: string; message: string }>(`/projects/${id}/open-ide`, { ide_tag_id }),
  scan: (scanPath: string, group_id?: string) =>
    api.post('/projects/scan', { scan_path: scanPath, group_id }),
  openFolder: (path: string) =>
    api.post('/projects/open-folder', { path }),
};

// Dialog
export const dialogApi = {
  selectFolder: () => api.post<{ path: string | null }>('/dialog/folder'),
};

export default api;
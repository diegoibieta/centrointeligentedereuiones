import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
});

export type MeetingModule = "investors" | "clients" | "suppliers" | "internal";
export type MeetingStatus = "pending" | "transcribing" | "analyzing" | "completed" | "error";

export interface Tag { id: string; name: string; color: string; }
export interface Project {
  id: string;
  name: string;
  description?: string;
  company_id?: string;
  company?: { id: string; name: string };
  persons: { id: string; name: string; role?: string }[];
  created_at: string;
}
export interface Company { id: string; name: string; sector?: string; notes?: string; created_at: string; }
export interface Person {
  id: string;
  name: string;
  role?: string;
  email?: string;
  company_id?: string;
  projects: { id: string; name: string }[];
  created_at: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  module: MeetingModule;
  status: MeetingStatus;
  duration_seconds?: number;
  summary?: string;
  project?: { id: string; name: string };
  company?: { id: string; name: string };
  person?: { id: string; name: string; role?: string };
  tags: Tag[];
}

export interface Meeting extends MeetingListItem {
  original_language?: string;
  transcript_original?: string;
  transcript_spanish?: string;
  agreements?: Array<{ description: string; responsible?: string; deadline?: string }>;
  tasks?: Array<{ description: string; responsible?: string; priority?: string; deadline?: string }>;
  risks?: Array<{ description: string; impact?: string; probability?: string; mitigation?: string }>;
  opportunities?: Array<{ description: string; potential?: string; action?: string }>;
  error_message?: string;
  created_at: string;
}

export const meetingsApi = {
  list: (params?: Record<string, string>) => api.get<MeetingListItem[]>("/meetings/", { params }),
  get: (id: string) => api.get<Meeting>(`/meetings/${id}`),
  search: (q: string) => api.get<MeetingListItem[]>("/meetings/search", { params: { q } }),
  ask: (question: string) => api.post<{ answer: string; sources: { id: string; title: string; date: string }[] }>("/meetings/ask", { question }),
  upload: (form: FormData) => api.post<Meeting>("/meetings/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id: string) => api.delete(`/meetings/${id}`),
};

export const projectsApi = {
  list: () => api.get<Project[]>("/projects/"),
  create: (data: { name: string; description?: string; company_id?: string; person_ids?: string[] }) =>
    api.post<Project>("/projects/", data),
  update: (id: string, data: { name: string; description?: string; company_id?: string; person_ids?: string[] }) =>
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const companiesApi = {
  list: () => api.get<Company[]>("/companies/"),
  create: (data: { name: string; sector?: string }) => api.post<Company>("/companies/", data),
  update: (id: string, data: { name: string; sector?: string }) => api.put<Company>(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};

export const personsApi = {
  list: () => api.get<Person[]>("/persons/"),
  create: (data: { name: string; role?: string; email?: string; company_id?: string; project_ids?: string[] }) =>
    api.post<Person>("/persons/", data),
  update: (id: string, data: { name: string; role?: string; email?: string; company_id?: string; project_ids?: string[] }) =>
    api.put<Person>(`/persons/${id}`, data),
  delete: (id: string) => api.delete(`/persons/${id}`),
};

export const tagsApi = {
  list: () => api.get<Tag[]>("/tags/"),
  create: (data: { name: string; color?: string }) => api.post<Tag>("/tags/", data),
};
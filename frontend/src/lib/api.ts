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
  tasks?: Array<{ description: string; responsible?: string; priority?: string; deadline?: string; completed?: boolean }>;
  risks?: Array<{ description: string; impact?: string; probability?: string; mitigation?: string }>;
  opportunities?: Array<{ description: string; potential?: string; action?: string }>;
  error_message?: string;
}

export const meetingsApi = {
  list: (params?: Record<string, string>) => api.get<MeetingListItem[]>("/meetings/", { params }),
  get: (id: string) => api.get<Meeting>(`/meetings/${id}`),
  search: (q: string) => api.get<MeetingListItem[]>("/meetings/search", { params: { q } }),
  ask: (question: string) => api.post<{ answer: string; sources: { id: string; title: string; date: string }[] }>("/meetings/ask", { question }),
  upload: (form: FormData) => api.post<Meeting>("/meetings/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id: string, form: FormData) => api.put<Meeting>(`/meetings/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateAnalysis: (id: string, body: object) => api.patch(`/meetings/${id}/analysis`, body),
  cancel: (id: string) => api.post(`/meetings/${id}/cancel`),
  retry: (id: string) => api.post(`/meetings/${id}/retry`),
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
  create: (data: { name: string; color: string }) => api.post<Tag>("/tags/", data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export interface CalendarEventAttendee {
  email: string;
  name?: string;
  status?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  meet_link?: string;
  attendees: CalendarEventAttendee[];
  html_link?: string;
  status?: string;
  created?: string;
  updated?: string;
}

export interface CalendarEventCreateInput {
  title: string;
  start: string;
  duration_minutes?: number;
  description?: string;
  attendees?: string[];
  location?: string;
  add_meet_link?: boolean;
}

export interface CalendarEventUpdateInput {
  title?: string;
  start?: string;
  duration_minutes?: number;
  description?: string;
  attendees?: string[];
  location?: string;
}

export const schedulingApi = {
  listEvents: (params?: { max_results?: number; time_min?: string; time_max?: string; query?: string }) =>
    api.get<CalendarEvent[]>("/scheduling/calendar/events", { params }),
  getEvent: (eventId: string) => api.get<CalendarEvent>(`/scheduling/calendar/events/${eventId}`),
  createEvent: (data: CalendarEventCreateInput) =>
    api.post<CalendarEvent>("/scheduling/calendar/events", data),
  updateEvent: (eventId: string, data: CalendarEventUpdateInput) =>
    api.patch<CalendarEvent>(`/scheduling/calendar/events/${eventId}`, data),
  deleteEvent: (eventId: string) => api.delete(`/scheduling/calendar/events/${eventId}`),
  syncMeetingToCalendar: (
    meetingId: string,
    data: { duration_minutes?: number; attendees?: string[]; add_meet_link?: boolean }
  ) => api.post<{ meeting_id: string; calendar_event: CalendarEvent }>(
    `/scheduling/meetings/${meetingId}/sync-calendar`, data
  ),
};
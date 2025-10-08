export type UssdTemplate = {
  id: string;
  name: string;
  telco: string;
  body: string;
  variables?: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export const fetchUssdTemplates = () => request<{ data: UssdTemplate[] }>(`/admin/ussd/templates`).then((res) => res.data);

export const createUssdTemplate = (payload: {
  name: string;
  telco: string;
  body: string;
  variables?: Record<string, unknown>;
  isActive?: boolean;
}) =>
  request<{ data: UssdTemplate }>(`/admin/ussd/templates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const updateUssdTemplate = (
  templateId: string,
  payload: Partial<{
    name: string;
    telco: string;
    body: string;
    variables?: Record<string, unknown>;
    isActive?: boolean;
  }>,
) =>
  request<{ data: UssdTemplate }>(`/admin/ussd/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const deleteUssdTemplate = (templateId: string) =>
  request<{ status: string }>(`/admin/ussd/templates/${templateId}`, {
    method: 'DELETE',
  });

export const activateUssdTemplate = (templateId: string) =>
  request<{ data: UssdTemplate }>(`/admin/ussd/templates/${templateId}/activate`, {
    method: 'POST',
  }).then((res) => res.data);

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

import { httpClient } from '@/services/http-client';

export const fetchUssdTemplates = () =>
  httpClient.data<UssdTemplate[]>(`/admin/ussd/templates`, { admin: true });

export const createUssdTemplate = (payload: {
  name: string;
  telco: string;
  body: string;
  variables?: Record<string, unknown>;
  isActive?: boolean;
}) =>
  httpClient.data<UssdTemplate>(`/admin/ussd/templates`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });

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
  httpClient.data<UssdTemplate>(`/admin/ussd/templates/${templateId}`, {
    admin: true,
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteUssdTemplate = (templateId: string) =>
  httpClient.request<{ status: string }>(`/admin/ussd/templates/${templateId}`, {
    admin: true,
    method: 'DELETE',
  });

export const activateUssdTemplate = (templateId: string) =>
  httpClient.data<UssdTemplate>(`/admin/ussd/templates/${templateId}/activate`, {
    admin: true,
    method: 'POST',
  });

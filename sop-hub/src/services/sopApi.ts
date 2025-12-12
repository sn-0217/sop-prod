import { Brand, SOPFile } from '@/types/sop';

export const API_BASE_URL = window.RUNTIME_CONFIG?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://l02plappmon01.corp.local:8080/api';

const handleResponse = async (response: Response, defaultMessage: string) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = defaultMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch (e) {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const sopApi = {
  // GET /api/sops?brand=xyz
  async getSOPs(brand: Brand): Promise<SOPFile[]> {
    const response = await fetch(`${API_BASE_URL}/sops?brand=${brand}`);
    return handleResponse(response, 'Failed to fetch SOPs');
  },

  // POST /api/sops/upload
  async uploadSOP(file: File, brand: Brand, metadata: { fileCategory: string; uploadedBy: string }): Promise<SOPFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brand', brand);
    formData.append('fileCategory', metadata.fileCategory);
    formData.append('uploadedBy', metadata.uploadedBy);

    const response = await fetch(`${API_BASE_URL}/sops/upload`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse(response, 'Failed to upload SOP');
  },

  // PUT /api/sops/{id}
  async updateSOP(
    id: string,
    metadata: { fileCategory: string; brand: string; uploadedBy: string; versionUpdateType?: 'MAJOR' | 'MINOR' },
    file?: File
  ): Promise<SOPFile> {
    const formData = new FormData();
    formData.append('fileCategory', metadata.fileCategory);
    formData.append('brand', metadata.brand);
    formData.append('uploadedBy', metadata.uploadedBy);
    if (metadata.versionUpdateType) {
      formData.append('versionUpdateType', metadata.versionUpdateType);
    }
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}/sops/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse(response, 'Failed to update SOP');
  },

  // DELETE /api/sops/{id}
  async deleteSOP(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sops/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      await handleResponse(response, 'Failed to delete SOP');
    }
  },

  // GET /api/sops/search?q=query&brand=xyz&category=abc
  async searchSOPsByContent(query: string, brand?: string, category?: string): Promise<SOPFile[]> {
    const params = new URLSearchParams({ q: query });
    if (brand) params.append('brand', brand);
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE_URL}/sops/search?${params.toString()}`);
    return handleResponse(response, 'Failed to search SOPs by content');
  },
};

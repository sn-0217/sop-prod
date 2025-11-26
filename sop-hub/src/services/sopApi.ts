import { Brand, SOPFile } from '@/types/sop';

export const API_BASE_URL = 'http://localhost:8080/api';

export const sopApi = {
  // GET /api/sops?brand=xyz
  async getSOPs(brand: Brand): Promise<SOPFile[]> {
    const response = await fetch(`${API_BASE_URL}/sops?brand=${brand}`);
    if (!response.ok) throw new Error('Failed to fetch SOPs');
    return response.json();
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

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to upload SOP';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        // use raw text if not json
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // PUT /api/sops/{id}
  async updateSOP(id: string, metadata: { fileCategory: string; brand: string; uploadedBy: string }, file?: File): Promise<SOPFile> {
    const formData = new FormData();
    formData.append('fileCategory', metadata.fileCategory);
    formData.append('brand', metadata.brand);
    formData.append('uploadedBy', metadata.uploadedBy);
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}/sops/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to update SOP');
    return response.json();
  },

  // DELETE /api/sops/{id}
  async deleteSOP(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sops/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete SOP');
  },
};

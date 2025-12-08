import api from './api';
import {
  RAGStatusResponse,
  StoreEmbeddingRequest,
  SearchRequest,
  SearchResponse,
  QuickTestResponse,
} from '@/types/rag';

export const ragService = {
  async checkStatus(): Promise<RAGStatusResponse> {
    const response = await api.get<RAGStatusResponse>('/test-rag/status');
    return response.data;
  },

  async createIndex(): Promise<any> {
    const response = await api.post('/test-rag/create-index');
    return response.data;
  },

  async storeEmbedding(data: StoreEmbeddingRequest): Promise<any> {
    const response = await api.post('/test-rag/store', data);
    return response.data;
  },

  async search(data: SearchRequest): Promise<SearchResponse> {
    const response = await api.post<SearchResponse>('/test-rag/search', data);
    return response.data;
  },

  async quickTest(): Promise<QuickTestResponse> {
    const response = await api.post<QuickTestResponse>('/test-rag/quick-test');
    return response.data;
  },

  async getExamples(): Promise<any> {
    const response = await api.get('/test-rag/examples');
    return response.data;
  },
};

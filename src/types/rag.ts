export interface RAGStatusResponse {
  status: string;
  credentials: {
    openai_configured: boolean;
    pinecone_configured: boolean;
  };
  pinecone?: {
    index_exists: boolean;
    index_name?: string;
  };
  help?: {
    openai?: string;
    pinecone?: string;
  };
}

export interface StoreEmbeddingRequest {
  text: string;
  metadata?: Record<string, any>;
  vector_id?: string;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
  filter_metadata?: Record<string, any>;
}

export interface SearchMatch {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  matches: SearchMatch[];
  query: string;
}

export interface QuickTestResponse {
  status: string;
  message: string;
  store_result: any;
  search_result: any;
}

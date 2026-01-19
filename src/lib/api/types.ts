/**
 * API types for Session Management and Article Management
 *
 * These types match the API contract defined in docs/api-contract.md
 * In production, these would be generated from OpenAPI spec using make gen-api
 */

export type SessionStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface SessionResponse {
	id: number;
	name: string;
	description: string | null;
	status: SessionStatus;
	article_count: number;
	created_at: string; // ISO 8601
	updated_at: string; // ISO 8601
}

export interface SessionListResponse {
	sessions: SessionResponse[];
	total: number;
}

export interface CreateSessionRequest {
	name: string;
	description?: string | null;
}

export interface UpdateSessionRequest {
	name?: string;
	description?: string;
}

export interface ChangeStatusRequest {
	status: SessionStatus;
}

// Article types
export type ArticleType = 'url' | 'file';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ArticleResponse {
	id: number;
	session_id: number;
	type: ArticleType;
	original_url: string | null;
	original_filename: string | null;
	title: string | null;
	extraction_status: ExtractionStatus;
	has_content: boolean;
	created_at: string;
	updated_at: string;
}

export interface ArticleListResponse {
	items: ArticleResponse[];
	total: number;
	session_id: number;
}

export interface AddUrlRequest {
	url: string;
	title?: string | null;
}

export interface UploadFileResponse {
	id: number;
	filename: string;
	size_bytes: number;
	extraction_status: ExtractionStatus;
	created_at: string;
}

export interface ArticleContentResponse {
	id: number;
	title: string | null;
	content_text: string;
	extraction_status: ExtractionStatus;
}

// Chat types
export interface ChatRequest {
	message: string;
}

export interface ChatSource {
	article_id: number;
	title: string | null;
	url: string | null;
}

export interface ChatResponse {
	message_id: number;
	content: string;
	sources: ChatSource[];
	created_at: string;
}

export interface ChatMessageResponse {
	id: number;
	role: 'user' | 'assistant';
	content: string;
	sources: ChatSource[] | null;
	created_at: string;
}

export interface ChatHistoryResponse {
	messages: ChatMessageResponse[];
}

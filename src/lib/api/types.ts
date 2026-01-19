/**
 * API types for Session Management
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

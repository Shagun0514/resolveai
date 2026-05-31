export type Role = 'admin' | 'agent' | 'supervisor';
export type Status = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'escalated';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Channel = 'email' | 'chat' | 'api' | 'phone' | 'web';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  channel: Channel;
  status: Status;
  priority: Priority;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_account_number?: string;

  // AI
  ai_sentiment?: Sentiment;
  ai_sentiment_score?: number;
  ai_category?: string;
  ai_summary?: string;
  ai_suggested_response?: string;
  ai_entities?: Record<string, string>;
  ai_processed_at?: string;

  // Assignment
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_at?: string;

  // SLA
  sla_due_at?: string;
  sla_breached: boolean;
  is_overdue?: boolean;
  resolved_at?: string;
  first_response_at?: string;

  tags?: string[];
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  complaint_id: string;
  sender_type: 'customer' | 'agent' | 'system' | 'ai';
  sender_id?: string;
  sender_name?: string;
  sender_user_name?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  pagination: Pagination;
}

export interface Analytics {
  totals: { all: number; open: number };
  by_status: { status: Status; count: string }[];
  by_category: { category: string; count: string }[];
  by_sentiment: { sentiment: Sentiment; count: string }[];
  by_channel: { channel: Channel; count: string }[];
  by_priority: { priority: Priority; count: string }[];
  sla: {
    breached: string;
    resolved: string;
    overdue: string;
    avg_resolution_hours: string;
  };
  trend: { date: string; count: string }[];
}

export interface ComplaintFilters {
  status?: string;
  priority?: string;
  category?: string;
  channel?: string;
  sentiment?: string;
  assigned_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

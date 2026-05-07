export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'agent' | 'client' | 'admin';
  createdAt: Date;
}

export interface Deal {
  id: string;
  createdAt: Date;
  clientId: string;
  agentId: string;
  title: string;
  status: 'lead' | 'active' | 'due-diligence' | 'offer' | 'won' | 'lost';
  suburb: string;
  budgetMin: number;
  budgetMax: number;
  bedrooms: number;
  bathrooms: number;
  brief: string;
  geoSegment: 'East' | 'West' | 'North' | 'Central';
  aiConsentGiven: boolean;
  agreementStatus: 'pending' | 'sent' | 'signed' | 'none';
  invoiceStatus: 'none' | 'deposit-sent' | 'deposit-paid' | 'final-sent' | 'final-paid';
}

export interface OffMarketProperty {
  id: string;
  createdAt: Date;
  streetAddress: string;
  suburb: string;
  priceGuide: number;
  bedrooms: number;
  bathrooms: number;
  sourceAgentId: string;
  notes: string;
  status: 'available' | 'under-offer' | 'sold';
  attachments: string[];
  priceHistory: { date: string; price: number; note: string }[];
}

export interface DealProperty {
  id: string;
  createdAt: Date;
  dealId: string;
  propertyId: string;
  shortlistStatus: 'considering' | 'shortlisted' | 'rejected' | 'offer-made';
  clientVisible: boolean;
  internalNotes: string;
  clientNotes: string;
  ddRecordId: string | null;
}

export interface Agent {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  phone: string;
  agency: string;
  geoSegment: 'East' | 'West' | 'North' | 'Central';
  isPreferred: boolean;
  suburb: string;
  lastContactedAt: Date | null;
  notes: string;
}

export interface DueDiligenceRecord {
  id: string;
  createdAt: Date;
  dealPropertyId: string;
  floodMapUrl: string;
  naturalHazardsUrl: string;
  floodMapScreenshot: string;
  hazardScreenshot: string;
  comparableSales: { address: string; salePrice: number; saleDate: string; bedrooms: number; bathrooms: number; notes: string }[];
  checklistItems: { item: string; completed: boolean; completedAt: Date | null }[];
  summaryNotes: string;
  reportGeneratedAt: Date | null;
}

export interface MeetingNote {
  id: string;
  createdAt: Date;
  dealId: string;
  title: string;
  rawTranscript: string;
  aiSummary: string;
  actionItems: { task: string; assignee: string; dueDate: string; completed: boolean }[];
  consentConfirmed: boolean;
  visibility: 'internal' | 'client-visible';
}

export interface ComplianceChecklist {
  id: string;
  createdAt: Date;
  dealId: string;
  items: { label: string; completed: boolean; completedAt: Date | null; completedBy: string }[];
  stage: 'engagement' | 'search' | 'offer' | 'settlement';
}

export interface EmailTemplate {
  id: string;
  createdAt: Date;
  name: string;
  category: 'welcome' | 'requirement-blast' | 'dd-request' | 'status-update' | 'post-settlement' | 'referrer-thanks' | 'other';
  subject: string;
  body: string;
  isActive: boolean;
}

export interface RequirementBlast {
  id: string;
  createdAt: Date;
  dealId: string;
  geoSegment: 'East' | 'West' | 'North' | 'Central' | 'All';
  preferredOnly: boolean;
  agentIds: string[];
  subject: string;
  body: string;
  sentAt: Date | null;
  status: 'draft' | 'sent';
  recipientCount: number;
}

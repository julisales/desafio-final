export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string; // plain text or HTML
  sentAt: string; // ISO
  relatedRedeemId?: string;
  metadata?: any;
}
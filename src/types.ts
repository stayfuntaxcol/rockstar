export type Stage = 'IDENTIFY'|'MAP'|'ENGAGE'|'PROPOSAL'|'COMMIT';

export interface Account {
  id?: string;
  name: string;
  country?: string;
  sector?: string;
  stage: Stage;
  rating?: number; // ROCK STAR-score (0-5) later
  ownerUid?: string;
  ownerName?: string;
  createdAt: number; // Date.now()
  updatedAt: number;
}

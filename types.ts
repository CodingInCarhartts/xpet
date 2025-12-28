
export interface Signature {
  id: string;
  handle: string;
  comment: string;
  created_at: string;  // ISO timestamp from Supabase
  location?: string;
}

export interface PetitionData {
  title: string;
  target: string;
  description: string;
  currentSignatures: number;
  goalSignatures: number;
  creator: {
    handle: string;
    avatar: string;
  };
}

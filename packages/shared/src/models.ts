import type { Tables } from './database.types';

export type Role = 'visitor' | 'seller' | 'organizer';
export type OrganizerStatus = 'none' | 'pending' | 'approved';
export type CoverType = 'indoor' | 'outdoor' | 'partial';
export type StallType = 'classic_market' | 'garage_sale' | 'yard_sale';
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';
export type FavoriteTarget = 'market' | 'stall';

// Die generierten Typen kennen die CHECK-Constraints nicht, daher engen wir die Textfelder hier ein.
export type Profile = Omit<Tables<'profiles'>, 'role' | 'organizer_status'> & {
  role: Role;
  organizer_status: OrganizerStatus;
};

export type Market = Omit<Tables<'markets'>, 'is_covered'> & {
  is_covered: CoverType | null;
};

export type Stall = Omit<Tables<'stalls'>, 'stall_type' | 'approval_status'> & {
  stall_type: StallType;
  approval_status: ApprovalStatus;
};

export type Favorite = Omit<Tables<'favorites'>, 'target_type'> & {
  target_type: FavoriteTarget;
};

export type MarketSuggestion = Tables<'market_suggestions'>;

export type NearbyMarket = { market: Market; distance_m: number };
export type NearbyStall = { stall: Stall; distance_m: number };

export type MarketDate = Tables<'market_dates'>;
export type NearbyMarketDate = { market_date: MarketDate; market: Market; distance_m: number };

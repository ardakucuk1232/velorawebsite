export type UserRole = 'customer' | 'staff';
export type Cart = Record<string, number>;

export interface UserIdentity {
  id: string;
  email: string;
  name: string;
}

export interface ProfileRecord extends UserIdentity {
  phone: string;
  address: string;
  city: string;
  role: UserRole;
  partner: number;
  referral: string;
  sponsor: string;
  cart: string;
  created: number;
  department: string;
  title: string;
  admin_note: string;
  segment: string;
}

export interface MemberProfile
  extends Omit<
    ProfileRecord,
    'cart' | 'partner' | 'department' | 'title' | 'admin_note' | 'segment'
  > {
  cart: Cart;
  partner: boolean;
}

export interface Session {
  identity: UserIdentity | null;
  profile: MemberProfile | null;
  isOwner?: boolean;
  availability: Record<string, boolean>;
}

export type RefreshSession = () => Promise<Session | null>;
export type StaffProfile = ProfileRecord & { owner: boolean };

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  number: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  note: string;
  total: number;
  shipping: number;
  status: string;
  tracking: string;
  created: number;
  items: OrderItem[];
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'served'
  | 'cancelled';

export type Venue = {
  id: string;
  name: string;
  slug: string;
  currency: string;
};

export type VenueTable = {
  id: string;
  venue_id: string;
  name: string;
  zone: string | null;
  active: boolean;
};

export type Modifier = {
  id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
  available: boolean;
  position: number;
};

export type ModifierGroup = {
  id: string;
  product_id: string;
  name: string;
  min_select: number;
  max_select: number;
  position: number;
  modifiers: Modifier[];
};

export type Product = {
  id: string;
  venue_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  allergens: string[];
  available: boolean;
  position: number;
  modifier_groups: ModifierGroup[];
};

export type Category = {
  id: string;
  name: string;
  position: number;
  active: boolean;
  products: Product[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  modifiers: { id: string; name: string; price_delta_cents: number }[];
  line_total_cents: number;
  note: string | null;
};

export type Order = {
  id: string;
  venue_id: string;
  table_id: string;
  session_id: string;
  round: number;
  status: OrderStatus;
  customer_name: string | null;
  note: string | null;
  total_cents: number;
  created_at: string;
  updated_at: string;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
  venue_tables?: { name: string; zone: string | null } | null;
};

/** Lo que el móvil manda a place_order(): sin precios, los pone el servidor. */
export type CartLine = {
  key: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  modifiers: { id: string; name: string; price_delta_cents: number }[];
  note?: string;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Recibido',
  accepted: 'Confirmado',
  preparing: 'En preparación',
  served: 'Servido',
  cancelled: 'Cancelado',
};

export const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'served',
];

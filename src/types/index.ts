export interface MenuFeedback {
  mustTry: number;    // Count or percentage
  veryTasty: number;  // Count or percentage
  good: number;       // Count or percentage
  ok: number;         // Count or percentage
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;       // Local asset path or Unsplash URL
  veg: boolean;        // true = veg, false = non-veg
  description: string;
  feedback: MenuFeedback;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  customInstructions: string;
}

export interface OrderPayload {
  id: string;
  tableNumber: string;
  items: CartItem[];
  totalAmount: number;
  timestamp: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
}

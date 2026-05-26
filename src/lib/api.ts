import { CartItem } from "@/types";

// Dynamic resolution of backend URL from environment variables, with localhost:3000 as default fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface ApiOrderItem {
  // Primary camelCase keys
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  customInstructions: string;

  // Snake_case aliases
  item_id: string;
  custom_instructions: string;

  // Semantic & other common schema aliases
  id: string;
  qty: number;
  notes: string;
  customerNotes: string;
  customer_notes: string;
  specifications: string;
}

export interface ApiOrderPayload {
  // Primary camelCase keys
  tableNumber: string;
  items: ApiOrderItem[];
  totalPrice: number;
  timestamp: string;

  // Snake_case & common backend schema aliases
  table_number: string;
  selected_table: string;
  ordered_items: ApiOrderItem[];
  orderedItems: ApiOrderItem[];
  total_price: number;
  quantity: number;
  totalQuantity: number;
  total_quantity: number;
}

export interface ApiOrderResponse {
  success: boolean;
  orderId: string;
  message?: string;
}

/**
 * Submits a completed order cart to the Admin Backend database via POST API request.
 * 
 * @param tableNumber Selected table number of the customer (e.g. "Table 4")
 * @param cart Current items in the customer's cart containing quantities and instructions
 * @param totalPrice Dynamically calculated grand total price of the items
 * @returns Promise resolving to the standard backend order response
 */
export async function submitOrderToBackend(
  tableNumber: string,
  cart: CartItem[],
  totalPrice: number
): Promise<ApiOrderResponse> {
  const endpoint = "/api/orders";

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Translate local cart structure into the strict backend API payload schema with multi-format support
  const apiItems: ApiOrderItem[] = cart.map((cartItem) => {
    const instructions = cartItem.customInstructions || "";
    return {
      // Primary keys
      itemId: cartItem.item.id,
      name: cartItem.item.name,
      price: cartItem.item.price,
      quantity: cartItem.quantity,
      customInstructions: instructions,

      // Snake case aliases
      item_id: cartItem.item.id,
      custom_instructions: instructions,

      // Semantic & other aliases
      id: cartItem.item.id,
      qty: cartItem.quantity,
      notes: instructions,
      customerNotes: instructions,
      customer_notes: instructions,
      specifications: instructions
    };
  });

  const payload: ApiOrderPayload = {
    // Primary keys
    tableNumber,
    items: apiItems,
    totalPrice,
    timestamp: new Date().toISOString(),

    // Snake case & aliases
    table_number: tableNumber,
    selected_table: tableNumber,
    ordered_items: apiItems,
    orderedItems: apiItems,
    total_price: totalPrice,
    quantity: totalQuantity,
    totalQuantity: totalQuantity,
    total_quantity: totalQuantity
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data: ApiOrderResponse = await response.json();
    return data;
  } catch (error) {
    console.error("API Order Submission Error:", error);
    throw error;
  }
}

import { MenuItem } from "@/types";

export const CATEGORIES = [
  "Starters",
  "Main Course",
  "Biryani",
  "Desserts",
  "Drinks"
] as const;

export const MENU_DATA: MenuItem[] = [
  // --- STARTERS ---
  {
    id: "start_01",
    name: "Paneer Tikka",
    category: "Starters",
    price: 249,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Cottage cheese cubes marinated in rich Indian spices and grilled to perfection in a tandoor.",
    feedback: { mustTry: 45, veryTasty: 35, good: 15, ok: 5 }
  },
  {
    id: "start_02",
    name: "Chicken 65",
    category: "Starters",
    price: 289,
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=600",
    veg: false,
    description: "Spicy, deep-fried chicken cubes tempered with aromatic curry leaves and fiery green chilies.",
    feedback: { mustTry: 60, veryTasty: 25, good: 12, ok: 3 }
  },
  {
    id: "start_03",
    name: "Crispy Corn",
    category: "Starters",
    price: 199,
    image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Deep fried golden corn kernels tossed with spices, chopped onions, and colorful bell peppers.",
    feedback: { mustTry: 30, veryTasty: 40, good: 20, ok: 10 }
  },

  // --- MAIN COURSE ---
  {
    id: "main_01",
    name: "Butter Chicken",
    category: "Main Course",
    price: 349,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600",
    veg: false,
    description: "Tender tandoori chicken pieces cooked in a rich, creamy tomato and butter gravy.",
    feedback: { mustTry: 75, veryTasty: 18, good: 5, ok: 2 }
  },
  {
    id: "main_02",
    name: "Kadai Paneer",
    category: "Main Course",
    price: 299,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Cottage cheese cooked in a spicy tomato-onion gravy with crisp bell peppers and freshly ground spices.",
    feedback: { mustTry: 40, veryTasty: 40, good: 15, ok: 5 }
  },
  {
    id: "main_03",
    name: "Dal Makhani",
    category: "Main Course",
    price: 229,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Creamy black lentils and kidney beans slow cooked overnight with butter, rich cream, and mild spices.",
    feedback: { mustTry: 50, veryTasty: 35, good: 10, ok: 5 }
  },

  // --- BIRYANI ---
  {
    id: "biry_01",
    name: "Hyderabadi Chicken Biryani",
    category: "Biryani",
    price: 329,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600",
    veg: false,
    description: "Premium basmati rice slow-cooked on dum with marinated chicken, real saffron, and aromatic spices.",
    feedback: { mustTry: 80, veryTasty: 15, good: 4, ok: 1 }
  },
  {
    id: "biry_02",
    name: "Special Paneer Biryani",
    category: "Biryani",
    price: 279,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Fragrant, saffron-infused basmati rice layered with spiced cottage cheese cubes and fresh mint.",
    feedback: { mustTry: 45, veryTasty: 35, good: 15, ok: 5 }
  },

  // --- DESSERTS ---
  {
    id: "dess_01",
    name: "Gulab Jamun",
    category: "Desserts",
    price: 99,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Deep fried golden milk dumplings soaked in a warm, sweet sugar syrup flavored with cardamom.",
    feedback: { mustTry: 55, veryTasty: 30, good: 10, ok: 5 }
  },
  {
    id: "dess_02",
    name: "Sizzling Brownie",
    category: "Desserts",
    price: 189,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Hot chocolate fudge brownie served on a sizzling hot plate with vanilla ice cream and warm chocolate sauce.",
    feedback: { mustTry: 70, veryTasty: 20, good: 8, ok: 2 }
  },

  // --- DRINKS ---
  {
    id: "drin_01",
    name: "Masala Shikanji",
    category: "Drinks",
    price: 79,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Traditional refreshing lemonade spiced with a roasted cumin blend and black salt.",
    feedback: { mustTry: 30, veryTasty: 45, good: 20, ok: 5 }
  },
  {
    id: "drin_02",
    name: "Virgin Mojito",
    category: "Drinks",
    price: 119,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Refreshing carbonated mocktail muddled with fresh mint leaves, lime juice, and simple syrup.",
    feedback: { mustTry: 40, veryTasty: 38, good: 17, ok: 5 }
  },
  {
    id: "drin_03",
    name: "Creamy Mango Lassi",
    category: "Drinks",
    price: 129,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600",
    veg: true,
    description: "Traditional rich sweet yogurt drink blended beautifully with fresh sweet Alphonso mango pulp.",
    feedback: { mustTry: 50, veryTasty: 35, good: 10, ok: 5 }
  }
];

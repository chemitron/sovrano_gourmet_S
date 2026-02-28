export type User = {
  email: string;
  username: string;
  role: string;
  lastLogin?: string;
  autoNumber?: string;
  serviceCosts?: Record<string, string>;
  id: string;
  activo?: boolean;
};

export type ServiceFromUser = {
  id: string;
  name: string;
  description: string;
  duration: string;
  cost: string;
};

export type StylistInfo = {
  id: string;
  name: string;
  autoNumber?: string | null;
};

export type MenuItem = {
  id: string;
  ItemName: string;
  categoryId: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  itemIndex: number;
  prepTime: number;
  priceCustomer: number;
  priceEmployee: number;
  soloEmpleado: boolean;
};

export type MenuCategory = {
  id: string;
  Categoryname: string;
  isActive: boolean;
  categoryIndex: number;
};

export type Order = {
  id: string;
  orderNumber?: number;
  username?: string;
  total?: number;
  items?: any[];
  approvalStatus?: string;
  createdAt?: any;
  status?: string;
  estacion?: string;
  chargedToAccount?: boolean;
  accountPaid?: boolean;
  served?: boolean;
  empezada?: boolean;
  userEmail?: string;
};

export type Account = {
  email: string;
  balance: number;
  username: string;
};

export type Ingredient = {
  id: string;
  ingId: number;
  name: string;
  unit: string;
  cost: number;
  stock: number;
  minStock: number;
  categoryId: number; // ⭐ FIXED
};

export type ItemCategory = {
  id: string;
  Categoryname: string;
  categoryIndex: number;
};
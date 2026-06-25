export interface Vehicle {
  id: number;
  registration: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
  payloadKg?: number;
  currentMileage: number;
  acquisitionDate?: string;
  insuranceExpiry?: string;
  status: string;
  active: boolean;
}

export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  cin?: string;
  phone?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  salary?: number;
  active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  active: boolean;
}

export interface AmazonPurchase {
  id: number;
  amazonOrderNumber: string;
  purchaseDate: string;
  supplier?: string;
  amountHt?: number;
  amountTtc?: number;
  shippingCost?: number;
  currency?: string;
  status?: string;
  totalPurchaseCost?: number;
  averageItemCost?: number;
}

export interface DashboardData {
  kpis: {
    revenue: number;
    expenses: number;
    netProfit: number;
    missionCount: number;
    orderCount: number;
    activeVehicleCount: number;
    unreadAlerts: number;
  };
  alerts: Array<{
    id: number;
    type: string;
    severity: string;
    title: string;
    message?: string;
    createdAt: string;
  }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  monthlyExpenses: Array<{ month: string; amount: number }>;
}

import { FormField, FormFieldOption } from '../form/form-field.model';

export const vehicleStatusOptions: FormFieldOption[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'ON_MISSION', label: 'En mission' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Hors service' }
];

export const orderStatusOptions: FormFieldOption[] = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'CONFIRMED', label: 'Confirmee' },
  { value: 'PREPARATION', label: 'Preparation' },
  { value: 'IN_DELIVERY', label: 'En livraison' },
  { value: 'DELIVERED', label: 'Livree' },
  { value: 'CANCELLED', label: 'Annulee' }
];

export const missionStatusOptions: FormFieldOption[] = [
  { value: 'PLANNED', label: 'Planifiee' },
  { value: 'ASSIGNED', label: 'Affectee' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DELIVERED', label: 'Livree' },
  { value: 'CANCELLED', label: 'Annulee' }
];

export const vehicleFields: FormField[] = [
  { key: 'registration', label: 'Immatriculation', type: 'text', required: true },
  { key: 'brand', label: 'Marque', type: 'text' },
  { key: 'model', label: 'Modele', type: 'text' },
  { key: 'year', label: 'Annee', type: 'number' },
  { key: 'vehicleType', label: 'Type', type: 'text' },
  { key: 'currentMileage', label: 'Kilometrage', type: 'number', required: true },
  { key: 'insuranceExpiry', label: 'Expiration assurance', type: 'datepicker' },
  { key: 'status', label: 'Statut', type: 'select', required: true, options: vehicleStatusOptions }
];

export const driverFields: FormField[] = [
  { key: 'firstName', label: 'Prenom', type: 'text', required: true },
  { key: 'lastName', label: 'Nom', type: 'text', required: true },
  { key: 'cin', label: 'CIN', type: 'text' },
  { key: 'phone', label: 'Telephone', type: 'text' },
  { key: 'licenseNumber', label: 'N permis', type: 'text' },
  { key: 'licenseCategory', label: 'Categorie permis', type: 'text' },
  { key: 'licenseExpiry', label: 'Expiration permis', type: 'datepicker' },
  { key: 'salary', label: 'Salaire', type: 'number' }
];

export const customerFields: FormField[] = [
  { key: 'name', label: 'Nom', type: 'text', required: true },
  { key: 'company', label: 'Societe', type: 'text' },
  { key: 'phone', label: 'Telephone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'country', label: 'Pays', type: 'text' },
  { key: 'nif', label: 'NIF', type: 'text' },
  { key: 'taxId', label: 'Matricule fiscal', type: 'text' }
];

export const sparePartFields: FormField[] = [
  { key: 'reference', label: 'Reference', type: 'text', required: true },
  { key: 'designation', label: 'Designation', type: 'text', required: true },
  { key: 'category', label: 'Categorie', type: 'text' },
  { key: 'supplier', label: 'Fournisseur', type: 'text' },
  { key: 'purchasePrice', label: 'Prix achat', type: 'number' },
  { key: 'stockQty', label: 'Stock', type: 'number', required: true },
  { key: 'minThreshold', label: 'Seuil min', type: 'number', required: true }
];

export const financialFields: FormField[] = [
  { key: 'entryDate', label: 'Date', type: 'datepicker', required: true },
  { key: 'entryType', label: 'Type', type: 'select', required: true, options: [
    { value: 'REVENUE', label: 'Revenu' },
    { value: 'EXPENSE', label: 'Depense' }
  ]},
  { key: 'category', label: 'Categorie', type: 'text', required: true },
  { key: 'amount', label: 'Montant', type: 'number', required: true },
  { key: 'description', label: 'Description', type: 'textarea' }
];

export const notificationFields: FormField[] = [
  { key: 'type', label: 'Type', type: 'text', required: true },
  { key: 'severity', label: 'Severite', type: 'select', options: [
    { value: 'INFO', label: 'Info' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'CRITICAL', label: 'Critical' }
  ]},
  { key: 'title', label: 'Titre', type: 'text', required: true },
  { key: 'message', label: 'Message', type: 'textarea' }
];

export function amazonFields(): FormField[] {
  return [
    { key: 'amazonOrderNumber', label: 'N commande Amazon', type: 'text', required: true },
    { key: 'purchaseDate', label: 'Date achat', type: 'datepicker', required: true },
    { key: 'supplier', label: 'Fournisseur', type: 'text' },
    { key: 'shippingCost', label: 'Frais livraison', type: 'number' },
    { key: 'status', label: 'Statut', type: 'text' },
    { key: 'itemDesignation', label: 'Produit', type: 'text', required: true },
    { key: 'itemQuantity', label: 'Quantite', type: 'number', required: true },
    { key: 'itemUnitPrice', label: 'Prix unitaire', type: 'number', required: true }
  ];
}

export function mapAmazonBody(v: Record<string, unknown>) {
  return {
    amazonOrderNumber: v['amazonOrderNumber'],
    purchaseDate: v['purchaseDate'],
    supplier: v['supplier'],
    shippingCost: v['shippingCost'] ?? 0,
    status: v['status'] ?? 'RECEIVED',
    items: [{
      designation: v['itemDesignation'],
      quantity: v['itemQuantity'],
      unitPrice: v['itemUnitPrice']
    }]
  };
}

export function orderFields(customerOptions: FormFieldOption[]): FormField[] {
  return [
    { key: 'reference', label: 'Reference', type: 'text', required: true },
    { key: 'orderDate', label: 'Date', type: 'datepicker', required: true },
    { key: 'customerId', label: 'Client', type: 'select', required: true, options: customerOptions },
    { key: 'status', label: 'Statut', type: 'select', required: true, options: orderStatusOptions },
    { key: 'designation', label: 'Produit', type: 'text', required: true },
    { key: 'quantity', label: 'Quantite', type: 'number', required: true },
    { key: 'salePrice', label: 'Prix vente', type: 'number', required: true }
  ];
}

export function mapOrderBody(v: Record<string, unknown>) {
  return {
    reference: v['reference'],
    orderDate: v['orderDate'],
    customerId: v['customerId'],
    status: v['status'],
    lines: [{
      designation: v['designation'],
      quantity: v['quantity'],
      salePrice: v['salePrice']
    }]
  };
}

export function missionFields(
  customerOptions: FormFieldOption[],
  vehicleOptions: FormFieldOption[],
  driverOptions: FormFieldOption[]
): FormField[] {
  return [
    { key: 'reference', label: 'Reference', type: 'text', required: true },
    { key: 'customerId', label: 'Client', type: 'select', options: customerOptions },
    { key: 'vehicleId', label: 'Vehicule', type: 'select', options: vehicleOptions },
    { key: 'driverId', label: 'Chauffeur', type: 'select', options: driverOptions },
    { key: 'departureDate', label: 'Depart', type: 'datetime-local' },
    { key: 'expectedArrival', label: 'Arrivee prevue', type: 'datetime-local' },
    { key: 'loadingAddress', label: 'Adresse chargement', type: 'text' },
    { key: 'deliveryAddress', label: 'Adresse livraison', type: 'text' },
    { key: 'status', label: 'Statut', type: 'select', required: true, options: missionStatusOptions },
    { key: 'revenue', label: 'Revenu', type: 'number' },
    { key: 'transportCost', label: 'Cout transport', type: 'number' }
  ];
}

export function mapMissionBody(v: Record<string, unknown>) {
  return {
    reference: v['reference'],
    customerId: v['customerId'] || null,
    vehicleId: v['vehicleId'] || null,
    driverId: v['driverId'] || null,
    departureDate: v['departureDate'] ? new Date(String(v['departureDate'])).toISOString() : null,
    expectedArrival: v['expectedArrival'] ? new Date(String(v['expectedArrival'])).toISOString() : null,
    loadingAddress: v['loadingAddress'],
    deliveryAddress: v['deliveryAddress'],
    status: v['status'],
    revenue: v['revenue'] ?? 0,
    transportCost: v['transportCost'] ?? 0
  };
}

export function fuelFields(vehicleOptions: FormFieldOption[], driverOptions: FormFieldOption[]): FormField[] {
  return [
    { key: 'vehicleId', label: 'Vehicule', type: 'select', required: true, options: vehicleOptions },
    { key: 'driverId', label: 'Chauffeur', type: 'select', options: driverOptions },
    { key: 'fillDate', label: 'Date', type: 'datetime-local', required: true },
    { key: 'mileage', label: 'Kilometrage', type: 'number', required: true },
    { key: 'station', label: 'Station', type: 'text' },
    { key: 'liters', label: 'Litres', type: 'number', required: true },
    { key: 'pricePerLiter', label: 'Prix/litre', type: 'number', required: true }
  ];
}

export function mapFuelBody(v: Record<string, unknown>) {
  return {
    vehicleId: v['vehicleId'],
    driverId: v['driverId'] || null,
    fillDate: v['fillDate'] ? new Date(String(v['fillDate'])).toISOString() : null,
    mileage: v['mileage'],
    station: v['station'],
    liters: v['liters'],
    pricePerLiter: v['pricePerLiter']
  };
}

export function maintenanceFields(vehicleOptions: FormFieldOption[]): FormField[] {
  return [
    { key: 'vehicleId', label: 'Vehicule', type: 'select', required: true, options: vehicleOptions },
    { key: 'maintenanceType', label: 'Type', type: 'text', required: true },
    { key: 'maintenanceDate', label: 'Date', type: 'datepicker', required: true },
    { key: 'mileage', label: 'Kilometrage', type: 'number' },
    { key: 'cost', label: 'Cout', type: 'number', required: true },
    { key: 'supplier', label: 'Fournisseur', type: 'text' },
    { key: 'nextDueDate', label: 'Prochaine echeance', type: 'datepicker' }
  ];
}

export function mapMaintenanceBody(v: Record<string, unknown>) {
  return {
    vehicleId: v['vehicleId'],
    maintenanceType: v['maintenanceType'],
    maintenanceDate: v['maintenanceDate'],
    mileage: v['mileage'],
    cost: v['cost'],
    supplier: v['supplier'],
    nextDueDate: v['nextDueDate']
  };
}

export function toOptions<T extends { id: number }>(
  items: T[],
  labelFn: (item: T) => string
): FormFieldOption[] {
  return items.map((item) => ({ value: item.id, label: labelFn(item) }));
}

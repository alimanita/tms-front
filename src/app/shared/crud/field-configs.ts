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
    { key: 'vehiculeId', label: 'Vehicule', type: 'select', required: true, options: vehicleOptions },
    { key: 'chauffeurId', label: 'Chauffeur', type: 'select', options: driverOptions },
    { key: 'fillingDate', label: 'Date', type: 'datetime-local', required: true },
    { key: 'fuelType', label: 'Type carburant', type: 'select', required: true, options: [
      { value: 'DIESEL', label: 'Diesel' },
      { value: 'ESSENCE', label: 'Essence' },
      { value: 'GPL', label: 'GPL' },
      { value: 'ELECTRIQUE', label: 'Electrique' }
    ]},
    { key: 'quantityLiters', label: 'Litres', type: 'number', required: true },
    { key: 'pricePerLiter', label: 'Prix/litre', type: 'number', required: true },
    { key: 'mileageAfter', label: 'Kilometrage apres', type: 'number' },
    { key: 'receiptNumber', label: 'N° ticket', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
}

export function mapFuelBody(v: Record<string, unknown>) {
  const formData = new FormData();
  const data = JSON.stringify({
    vehiculeId: v['vehiculeId'],
    chauffeurId: v['chauffeurId'] || null,
    fillingDate: v['fillingDate'] ? new Date(String(v['fillingDate'])).toISOString().slice(0, 19) : null,
    fuelType: v['fuelType'],
    quantityLiters: v['quantityLiters'],
    pricePerLiter: v['pricePerLiter'],
    mileageAfter: v['mileageAfter'] || null,
    receiptNumber: v['receiptNumber'] || null,
    notes: v['notes'] || null
  });
  formData.append('data', new Blob([data], { type: 'application/json' }));
  return formData;
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

export const tireStatusOptions: FormFieldOption[] = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'IN_USE', label: 'En service' },
  { value: 'WORN', label: 'Use' },
  { value: 'SCRAPPED', label: 'Reforme' }
];

export const machineStatusOptions: FormFieldOption[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En utilisation' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Hors service' }
];

export const workOrderStatusOptions: FormFieldOption[] = [
  { value: 'PLANNED', label: 'Planifie' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'ON_HOLD', label: 'En attente' },
  { value: 'COMPLETED', label: 'Termine' },
  { value: 'CANCELLED', label: 'Annule' }
];

export const workOrderEntityOptions: FormFieldOption[] = [
  { value: 'VEHICLE', label: 'Vehicule' },
  { value: 'MACHINE', label: 'Machine' }
];

export const workOrderTypeOptions: FormFieldOption[] = [
  { value: 'PREVENTIVE', label: 'Preventif' },
  { value: 'CORRECTIVE', label: 'Correctif' }
];

export const workOrderPriorityOptions: FormFieldOption[] = [
  { value: 'LOW', label: 'Basse' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' }
];

export const tirePositionOptions: FormFieldOption[] = [
  { value: 'FRONT_LEFT', label: 'Avant gauche' },
  { value: 'FRONT_RIGHT', label: 'Avant droit' },
  { value: 'REAR_LEFT_OUTER', label: 'Arriere gauche ext.' },
  { value: 'REAR_LEFT_INNER', label: 'Arriere gauche int.' },
  { value: 'REAR_RIGHT_OUTER', label: 'Arriere droit ext.' },
  { value: 'REAR_RIGHT_INNER', label: 'Arriere droit int.' },
  { value: 'SPARE', label: 'Secours' }
];

export const documentTypeOptions: FormFieldOption[] = [
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'TECHNICAL_INSPECTION', label: 'Controle technique' },
  { value: 'VIGNETTE', label: 'Vignette' },
  { value: 'REGISTRATION', label: 'Carte grise' },
  { value: 'DRIVING_LICENSE', label: 'Permis de conduire' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Certificat medical' },
  { value: 'OTHER', label: 'Autre' }
];

export const machineFields: FormField[] = [
  { key: 'reference', label: 'Reference', type: 'text', required: true },
  { key: 'serialNumber', label: 'N serie', type: 'text' },
  { key: 'name', label: 'Nom', type: 'text', required: true },
  { key: 'brand', label: 'Marque', type: 'text' },
  { key: 'model', label: 'Modele', type: 'text' },
  { key: 'category', label: 'Categorie', type: 'text' },
  { key: 'purchaseDate', label: 'Date achat', type: 'datepicker' },
  { key: 'purchasePrice', label: 'Prix achat', type: 'number' },
  { key: 'powerUnit', label: 'Unite puissance', type: 'text' },
  { key: 'powerValue', label: 'Puissance', type: 'number' },
  { key: 'initialHours', label: 'Heures initiales', type: 'number', required: true },
  { key: 'currentHours', label: 'Heures actuelles', type: 'number', required: true },
  { key: 'location', label: 'Emplacement', type: 'text' },
  { key: 'status', label: 'Statut', type: 'select', required: true, options: machineStatusOptions },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export function mapMachineBody(v: Record<string, unknown>) {
  return {
    reference: v['reference'],
    serialNumber: v['serialNumber'],
    name: v['name'],
    brand: v['brand'],
    model: v['model'],
    category: v['category'],
    purchaseDate: v['purchaseDate'],
    purchasePrice: v['purchasePrice'],
    powerUnit: v['powerUnit'],
    powerValue: v['powerValue'],
    initialHours: v['initialHours'] ?? 0,
    currentHours: v['currentHours'] ?? 0,
    location: v['location'],
    status: v['status'],
    notes: v['notes']
  };
}

export function workOrderFields(entityOptions: FormFieldOption[]): FormField[] {
  return [
    { key: 'reference', label: 'Reference', type: 'text', required: true },
    { key: 'entityKey', label: 'Entite', type: 'select', required: true, options: entityOptions },
    { key: 'orderType', label: 'Type OT', type: 'select', required: true, options: workOrderTypeOptions },
    { key: 'priority', label: 'Priorite', type: 'select', options: workOrderPriorityOptions },
    { key: 'maintenanceType', label: 'Type maintenance', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'scheduledDate', label: 'Date prevue', type: 'datepicker' },
    { key: 'mileageAtOrder', label: 'Km', type: 'number' },
    { key: 'hoursAtOrder', label: 'Heures', type: 'number' },
    { key: 'estimatedCost', label: 'Cout estime', type: 'number' },
    { key: 'actualCost', label: 'Cout reel', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
}

export function mapWorkOrderBody(v: Record<string, unknown>) {
  const [entityType, entityId] = String(v['entityKey'] ?? ':').split(':');
  return {
    reference: v['reference'],
    entityType,
    entityId: Number(entityId),
    orderType: v['orderType'],
    priority: v['priority'] ?? 'NORMAL',
    maintenanceType: v['maintenanceType'],
    description: v['description'],
    scheduledDate: v['scheduledDate'],
    mileageAtOrder: v['mileageAtOrder'],
    hoursAtOrder: v['hoursAtOrder'],
    estimatedCost: v['estimatedCost'],
    actualCost: v['actualCost'] ?? 0,
    notes: v['notes']
  };
}

export const tireFields: FormField[] = [
  { key: 'serialNumber', label: 'N serie', type: 'text', required: true },
  { key: 'brand', label: 'Marque', type: 'text' },
  { key: 'model', label: 'Modele', type: 'text' },
  { key: 'size', label: 'Dimension', type: 'text' },
  { key: 'type', label: 'Type', type: 'text' },
  { key: 'purchaseDate', label: 'Date achat', type: 'datepicker' },
  { key: 'purchaseCost', label: 'Prix achat', type: 'number' },
  { key: 'maxKm', label: 'Km max', type: 'number' },
  { key: 'status', label: 'Statut', type: 'select', required: true, options: tireStatusOptions }
];

export function mapTireBody(v: Record<string, unknown>) {
  return {
    serialNumber: v['serialNumber'],
    brand: v['brand'],
    model: v['model'],
    size: v['size'],
    type: v['type'],
    purchaseDate: v['purchaseDate'],
    purchaseCost: v['purchaseCost'],
    maxKm: v['maxKm'],
    status: v['status']
  };
}

export function tireAssignmentFields(
  tireOptions: FormFieldOption[],
  vehicleOptions: FormFieldOption[]
): FormField[] {
  return [
    { key: 'tireId', label: 'Pneu', type: 'select', required: true, options: tireOptions },
    { key: 'vehicleId', label: 'Vehicule', type: 'select', required: true, options: vehicleOptions },
    { key: 'position', label: 'Position', type: 'select', required: true, options: tirePositionOptions },
    { key: 'mountDate', label: 'Date montage', type: 'datepicker', required: true },
    { key: 'mountMileage', label: 'Km montage', type: 'number', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
}

export function mapTireAssignmentBody(v: Record<string, unknown>) {
  return {
    tireId: v['tireId'],
    vehicleId: v['vehicleId'],
    position: v['position'],
    mountDate: v['mountDate'],
    mountMileage: v['mountMileage'],
    notes: v['notes']
  };
}

export function oilChangeFields(vehicleOptions: FormFieldOption[]): FormField[] {
  return [
    { key: 'vehicleId', label: 'Vehicule', type: 'select', required: true, options: vehicleOptions },
    { key: 'oilType', label: 'Type huile', type: 'text', required: true },
    { key: 'changeDate', label: 'Date', type: 'datepicker', required: true },
    { key: 'mileageAtChange', label: 'Kilometrage', type: 'number', required: true },
    { key: 'quantityLiters', label: 'Litres', type: 'number', required: true },
    { key: 'unitCost', label: 'Prix/litre', type: 'number' },
    { key: 'totalCost', label: 'Cout total', type: 'number' },
    { key: 'nextChangeKm', label: 'Prochain km', type: 'number' },
    { key: 'nextChangeDate', label: 'Prochaine date', type: 'datepicker' },
    { key: 'performedBy', label: 'Realise par', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
}

export function mapOilChangeBody(v: Record<string, unknown>) {
  return {
    vehicleId: v['vehicleId'],
    oilType: v['oilType'],
    changeDate: v['changeDate'],
    mileageAtChange: v['mileageAtChange'],
    quantityLiters: v['quantityLiters'],
    unitCost: v['unitCost'],
    totalCost: v['totalCost'],
    nextChangeKm: v['nextChangeKm'],
    nextChangeDate: v['nextChangeDate'],
    performedBy: v['performedBy'],
    notes: v['notes']
  };
}

export function fleetDocumentFields(
  vehicleOptions: FormFieldOption[],
  driverOptions: FormFieldOption[]
): FormField[] {
  return [
    { key: 'vehicleId', label: 'Vehicule', type: 'select', options: vehicleOptions },
    { key: 'driverId', label: 'Chauffeur', type: 'select', options: driverOptions },
    { key: 'documentType', label: 'Type', type: 'select', required: true, options: documentTypeOptions },
    { key: 'referenceNumber', label: 'Reference', type: 'text' },
    { key: 'issuer', label: 'Emetteur', type: 'text' },
    { key: 'issueDate', label: 'Date emission', type: 'datepicker' },
    { key: 'expiryDate', label: 'Date expiration', type: 'datepicker' },
    { key: 'amount', label: 'Montant', type: 'number' },
    { key: 'status', label: 'Statut', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
}

export function mapFleetDocumentBody(v: Record<string, unknown>) {
  return {
    vehicleId: v['vehicleId'] || null,
    driverId: v['driverId'] || null,
    documentType: v['documentType'],
    referenceNumber: v['referenceNumber'],
    issuer: v['issuer'],
    issueDate: v['issueDate'],
    expiryDate: v['expiryDate'],
    amount: v['amount'],
    status: v['status'],
    notes: v['notes']
  };
}

export function toEntityOptions(
  vehicles: { id: number; registration: string }[],
  machines: { id: number; reference: string; name: string }[]
): FormFieldOption[] {
  return [
    ...vehicles.map((v) => ({ value: `VEHICLE:${v.id}`, label: `[Vehicule] ${v.registration}` })),
    ...machines.map((m) => ({ value: `MACHINE:${m.id}`, label: `[Machine] ${m.reference} - ${m.name}` }))
  ];
}

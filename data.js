export const STORES = [
  { id: 1, name: "Éxito Norte", city: "Bogotá", lat: 4.7110, lng: -74.0721, type: "exito" },
  { id: 2, name: "Carulla Calle 85", city: "Bogotá", lat: 4.6675, lng: -74.0536, type: "carulla" },
  { id: 3, name: "Éxito Poblado", city: "Medellín", lat: 6.2088, lng: -75.5677, type: "exito" },
  { id: 4, name: "Carulla Oviedo", city: "Medellín", lat: 6.1983, lng: -75.5746, type: "carulla" },
];

export const PROMOTERS = [
  { id: 101, name: "Carlos Ramírez", status: "En Almacén", currentStore: 1, activeTime: "04:30" },
  { id: 102, name: "Ana Gómez", status: "En Tránsito", currentStore: null, activeTime: "02:15" },
  { id: 103, name: "Luis Morales", status: "En Almacén", currentStore: 3, activeTime: "06:45" },
];

export const SALES_DATA = {
  labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  datasets: [
    {
      label: "Ventas Totales (Millones COP)",
      data: [1.2, 1.9, 1.5, 2.1, 3.0, 4.2, 3.8],
      backgroundColor: "rgba(99, 102, 241, 0.5)",
      borderColor: "rgba(99, 102, 241, 1)",
      borderWidth: 2,
    },
  ],
};

export const PRODUCT_SALES = {
  labels: ["Producto A", "Producto B", "Producto C", "Producto D"],
  datasets: [
    {
      data: [300, 150, 100, 50],
      backgroundColor: ["#6366f1", "#a855f7", "#ec4899", "#14b8a6"],
    },
  ],
};

export const INVENTORY_DATA = [
  { id: 1, store: "Éxito Norte", product: "Producto A", stock: 120, status: "Óptimo", value: "$4.5M" },
  { id: 2, store: "Éxito Norte", product: "Producto B", stock: 15, status: "Bajo", value: "$0.8M" },
  { id: 3, store: "Carulla Calle 85", product: "Producto A", stock: 85, status: "Óptimo", value: "$3.2M" },
  { id: 4, store: "Éxito Poblado", product: "Producto C", stock: 4, status: "Crítico", value: "$0.1M" },
];

export const TRACKING_LOGS = [
  { time: "08:00 AM", promoter: "Carlos Ramírez", action: "Ingreso", location: "Éxito Norte" },
  { time: "09:30 AM", promoter: "Ana Gómez", action: "Salida", location: "Carulla Calle 85" },
  { time: "11:15 AM", promoter: "Carlos Ramírez", action: "Venta Registrada", location: "Éxito Norte", details: "3x Producto A" },
  { time: "12:00 PM", promoter: "Luis Morales", action: "Ingreso", location: "Éxito Poblado" },
];

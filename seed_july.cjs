const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

const storeLocations = {
  1: { lat: 4.678, lng: -74.048 },
  2: { lat: 4.685350, lng: -74.075486 },
  3: { lat: 4.653457, lng: -74.103001 },
  4: { lat: 4.595604, lng: -74.143209 },
  5: { lat: 6.198902, lng: -75.572777 },
  6: { lat: 3.486256, lng: -76.495033 },
  7: { lat: 4.701389, lng: -74.040278 },
  8: { lat: 11.016629, lng: -74.821102 },
  9: { lat: 7.108489, lng: -73.104273 },
  10: { lat: 4.801646, lng: -75.719665 },
  11: { lat: 6.197949, lng: -75.558348 }
};

const users = [
  { id: 1, name: 'Diego Pardo', role: 'supervisor', loc: 1, restDay: 0 },
  { id: 2, name: 'Andrés Felipe Moreno', role: 'promoter', loc: 2, restDay: 1 },
  { id: 3, name: 'Camila Andrea Vargas', role: 'promoter', loc: 3, restDay: 2 },
  { id: 4, name: 'Luis Carlos Gómez', role: 'promoter', loc: 4, restDay: 1 },
  { id: 5, name: 'Valentina Rojas', role: 'promoter', loc: 5, restDay: 2 },
  { id: 6, name: 'Sebastián Martínez', role: 'promoter', loc: 6, restDay: 1 },
  { id: 7, name: 'Natalia Fernández', role: 'promoter', loc: 7, restDay: 2 },
  { id: 8, name: 'Mateo Restrepo', role: 'promoter', loc: 8, restDay: 1 },
  { id: 9, name: 'Isabella Castaño', role: 'promoter', loc: 9, restDay: 2 },
  { id: 10, name: 'Julián David Pérez', role: 'promoter', loc: 10, restDay: 1 },
  { id: 11, name: 'Daniela Orozco', role: 'promoter', loc: 11, restDay: 2 },
];

const products = ["EcoFlow River 2", "EcoFlow River 2 Max", "EcoFlow River 2 Pro", "EcoFlow Delta 2"];

db.serialize(() => {
  console.log("Limpiando datos antiguos...");
  db.run("DELETE FROM attendance");
  db.run("DELETE FROM sales");
  db.run("DELETE FROM supervisor_plans");

  console.log("Insertando datos realistas para Julio 2026 (Meta: 25)...");
  const insertAttendance = db.prepare("INSERT INTO attendance (user_id, location_id, type, timestamp, lat, lng) VALUES (?, ?, ?, ?, ?, ?)");
  const insertSales = db.prepare("INSERT INTO sales (user_id, location_id, product_name, qty, timestamp) VALUES (?, ?, ?, ?, ?)");
  const insertSupervisorPlan = db.prepare("INSERT INTO supervisor_plans (user_id, plan_date, locations_to_visit, objective, result, activities) VALUES (?, ?, ?, ?, ?, ?)");

  // Target goals
  // 3 fail: ID 3 (19), ID 7 (20), ID 10 (23)
  // Rest pass: >= 25 (e.g. 26 to 35)
  const salesTargets = {
    2: 32,
    3: 19, // Failed
    4: 28,
    5: 35,
    6: 26,
    7: 20, // Failed
    8: 27,
    9: 29,
    10: 23, // Failed
    11: 30
  };
  
  // Keep track of how many sales have been generated per promoter so far
  const currentSales = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 };

  for (let day = 1; day <= 31; day++) {
    const currentDay = new Date(2026, 6, day);
    const dayOfWeek = currentDay.getDay(); 
    const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
    const daysLeft = 31 - day + 1;

    users.forEach(u => {
      if (dayOfWeek === u.restDay) return;

      if (u.role === 'supervisor') {
        if (Math.random() > 0.1) {
            const stores = ["Alkosto 68", "Ktronix Salitre", "Alkosto Venecia"];
            const selectedStore = stores[Math.floor(Math.random()*stores.length)];
            insertSupervisorPlan.run(
              1, dateStr, selectedStore, "Auditoría y soporte comercial a promotores.",
              "Se encontró todo en orden. Promotores alineados con la meta de ventas de la semana.",
              JSON.stringify(["Revisar stock en bodega", "Verificar material publicitario"])
            );
        }
      } else {
        const checkInMin = Math.floor(Math.random() * 15); 
        const checkInStr = `${dateStr} 09:${(45 + checkInMin).toString().padStart(2, '0')}:00`;
        const lunchStartMin = Math.floor(Math.random() * 30);
        const lunchStartStr = `${dateStr} 13:${(0 + lunchStartMin).toString().padStart(2, '0')}:00`;
        const lunchEndMin = Math.floor(Math.random() * 30);
        const lunchEndStr = `${dateStr} 14:${(0 + lunchEndMin).toString().padStart(2, '0')}:00`;
        const checkOutMin = Math.floor(Math.random() * 15);
        const checkOutStr = `${dateStr} 19:${(0 + checkOutMin).toString().padStart(2, '0')}:00`;

        const loc = storeLocations[u.loc];
        const drift = (Math.random() - 0.5) * 0.0002;
        const lat = loc.lat + drift;
        const lng = loc.lng + drift;

        if (Math.random() > 0.05) { 
          insertAttendance.run(u.id, u.loc, 'check_in', checkInStr, lat, lng);
          insertAttendance.run(u.id, u.loc, 'lunch_start', lunchStartStr, lat, lng);
          insertAttendance.run(u.id, u.loc, 'lunch_end', lunchEndStr, lat, lng);
          insertAttendance.run(u.id, u.loc, 'check_out', checkOutStr, lat, lng);
          
          // Allocate remaining sales needed evenly across remaining days, but with randomness
          const remainingSales = salesTargets[u.id] - currentSales[u.id];
          if (remainingSales > 0) {
              const expectedToday = remainingSales / daysLeft;
              // Randomly decide if they sell today
              let salesToday = 0;
              if (Math.random() < 0.6) {
                  salesToday = Math.ceil(expectedToday * (Math.random() + 0.5)); // add some variance
              }
              // Force completion on last day if needed
              if (day === 31) salesToday = remainingSales; 
              // Don't overshoot
              if (salesToday > remainingSales) salesToday = remainingSales;

              for (let i = 0; i < salesToday; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const saleHour = Math.floor(Math.random() * 8) + 10;
                const saleMin = Math.floor(Math.random() * 60).toString().padStart(2, '0');
                insertSales.run(u.id, u.loc, product, 1, `${dateStr} ${saleHour}:${saleMin}:00`);
                currentSales[u.id]++;
              }
          }
        } else {
            // Force completion on last day even if absent (simulating late batch input maybe), just to hit the exact target
            if (day === 31) {
                const remainingSales = salesTargets[u.id] - currentSales[u.id];
                for (let i = 0; i < remainingSales; i++) {
                  const product = products[Math.floor(Math.random() * products.length)];
                  const saleHour = Math.floor(Math.random() * 8) + 10;
                  insertSales.run(u.id, u.loc, product, 1, `${dateStr} ${saleHour}:00:00`);
                  currentSales[u.id]++;
                }
            }
        }
      }
    });
  }

  insertAttendance.finalize();
  insertSales.finalize();
  insertSupervisorPlan.finalize();
});

setTimeout(() => {
  console.log("Simulación completada.");
  db.close();
}, 2000);

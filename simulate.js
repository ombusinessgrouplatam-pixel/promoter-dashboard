const http = require('http');

console.log("Iniciando Simulador Dinámico...");

let activeUsers = [];
let dbLocations = [];

function fetchUsers() {
  http.get('http://localhost:3001/api/dashboard', (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      try {
        const d = JSON.parse(raw);
        activeUsers = d.users;
        dbLocations = d.locations;
      } catch (e) {}
    });
  });
}

function sendReq(userId, locId, type, lat, lng) {
  const data = JSON.stringify({ user_id: userId, location_id: locId, type, lat, lng });
  const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/attendance', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }});
  req.write(data); req.end();
}

function sendSale(userId, locId) {
  const products = ['EcoFlow River 2', 'EcoFlow River 2 Max', 'EcoFlow River 2 Pro', 'EcoFlow Delta 2'];
  const p = products[Math.floor(Math.random() * products.length)];
  const data = JSON.stringify({ user_id: userId, location_id: locId, product_name: p, qty: 1 });
  const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/sales', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
       try {
         const json = JSON.parse(body);
         if (json.success) console.log(`[SIMULADOR] Promotor ID ${userId} VENDIÓ: ${p}`);
       } catch(e){}
    });
  });
  req.write(data); req.end();
}

let supervisorState = {}; // map of supervisorId -> { locId, lat, lng }

function simulateStep() {
  if (activeUsers.length === 0) return;
  
  // Pick a random user
  const u = activeUsers[Math.floor(Math.random() * activeUsers.length)];
  if (!u) return;

  if (u.role === 'promoter') {
    // Promoter sales
    const loc = dbLocations.find(l => l.name === u.assigned_store);
    if (loc) {
      if (Math.random() > 0.5) sendSale(u.id, loc.id);
      else sendReq(u.id, loc.id, 'check_in', loc.lat + (Math.random() - 0.5) * 0.005, loc.lng + (Math.random() - 0.5) * 0.005);
    }
  } else if (u.role === 'supervisor') {
    // Supervisor routing
    if (!supervisorState[u.id]) {
      const loc = dbLocations[Math.floor(Math.random() * dbLocations.length)];
      supervisorState[u.id] = { locId: loc.id, lat: loc.lat, lng: loc.lng };
      sendReq(u.id, loc.id, 'check_in', loc.lat + (Math.random() - 0.5) * 0.005, loc.lng + (Math.random() - 0.5) * 0.005);
      console.log(`[SIMULADOR] Supervisor ID ${u.id} Check IN en ${loc.name}`);
    } else {
      const st = supervisorState[u.id];
      sendReq(u.id, st.locId, 'check_out', st.lat, st.lng);
      console.log(`[SIMULADOR] Supervisor ID ${u.id} Check OUT`);
      delete supervisorState[u.id];
    }
  }
}

setInterval(fetchUsers, 10000); // refresh active users every 10s
setInterval(simulateStep, 4500); // run a simulation step every 4.5s
fetchUsers();

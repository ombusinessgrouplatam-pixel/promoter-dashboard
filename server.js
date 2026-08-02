const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://promoter_db_user:LS4XgDWjS8SZnEudQAVH7AKmg12VJbIB@dpg-d9nk2t942hec73fpt18g-a.oregon-postgres.render.com/promoter_db',
  ssl: { rejectUnauthorized: false }
});

const db = {
  run: (sql, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    pgSql = pgSql.replace(/date\(([^)]+)\)/ig, "TO_CHAR($1, 'YYYY-MM-DD')");
    if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
      pgSql += ' RETURNING id';
    }
    pool.query(pgSql, params, (err, res) => {
      if (cb) {
        if (err) cb.call({ lastID: null }, err);
        else cb.call({ lastID: (res.rows && res.rows.length > 0) ? res.rows[0].id : null }, null);
      }
    });
  },
  get: (sql, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    pgSql = pgSql.replace(/date\(([^)]+)\)/ig, "TO_CHAR($1, 'YYYY-MM-DD')");
    pool.query(pgSql, params, (err, res) => {
      if (cb) cb(err, res && res.rows ? res.rows[0] : null);
    });
  },
  all: (sql, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    pgSql = pgSql.replace(/date\(([^)]+)\)/ig, "TO_CHAR($1, 'YYYY-MM-DD')");
    pool.query(pgSql, params, (err, res) => {
      if (cb) cb(err, res ? res.rows : []);
    });
  }
};


app.get('/api/dashboard', (req, res) => {
  db.all("SELECT * FROM locations", (err, locations) => {
    db.all(`SELECT u.id, u.name, u.role, u.phone, l.name as assigned_store FROM users u LEFT JOIN locations l ON u.assigned_location_id = l.id`, (err, users) => {
      db.all(`SELECT i.product_name, i.stock, i.max_stock, l.name as store FROM inventory i JOIN locations l ON i.location_id = l.id`, (err, inventory) => {
          db.all(`SELECT a.type, a.timestamp, u.id as promoter_id, u.name as promoter, u.role as role, l.name as location, a.lat, a.lng
                  FROM attendance a JOIN users u ON a.user_id = u.id LEFT JOIN locations l ON a.location_id = l.id
                  ORDER BY a.timestamp DESC LIMIT 150`, (err, logs) => {
            db.all("SELECT * FROM store_staff", (err, storeStaff) => {
              db.all(`SELECT s.*, l.name as store_name FROM sales s LEFT JOIN locations l ON s.location_id = l.id`, (err, sales) => {
                res.json({ locations, users, inventory, logs, storeStaff: storeStaff || [], sales: sales || [] });
              });
            });
          });
      });
    });
  });
});

app.post('/api/attendance', (req, res) => {
  const { user_id, location_id, type, lat, lng } = req.body;
  db.run("INSERT INTO attendance (user_id, location_id, type, lat, lng) VALUES (?, ?, ?, ?, ?)", [user_id, location_id, type, lat, lng], function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ success: true, id: this.lastID });
  });
});

app.get('/api/inventory/:location_id', (req, res) => {
  db.all("SELECT product_name, stock FROM inventory WHERE location_id = ? AND stock > 0", [req.params.location_id], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/sales', (req, res) => {
  const { user_id, location_id, product_name, qty } = req.body;
  db.get("SELECT stock FROM inventory WHERE location_id = ? AND product_name = ?", [location_id, product_name], (err, row) => {
    if (err || !row) return res.status(500).json({error: 'Product not found'});
    if (row.stock < qty) return res.status(400).json({error: 'Insufficient stock'});
    
    db.run("UPDATE inventory SET stock = stock - ? WHERE location_id = ? AND product_name = ?", [qty, location_id, product_name], (err) => {
      if (err) return res.status(500).json({error: err.message});
      
      db.run("INSERT INTO sales (user_id, location_id, product_name, qty) VALUES (?, ?, ?, ?)", [user_id, location_id, product_name, qty], function(err) {
          if (err) return res.status(500).json({error: err.message});
          res.json({ success: true });
      });
    });
  });
});

app.get('/api/promoter/:id', (req, res) => {
  const userId = req.params.id;
  db.get("SELECT name, role, phone, assigned_location_id FROM users WHERE id = ?", [userId], (err, user) => {
    if (!user) return res.status(404).json({error: 'Not found'});
    
    if (user.role === 'supervisor') {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
      
      db.get("SELECT COUNT(DISTINCT location_id) as visitas_hoy FROM attendance WHERE user_id = ? AND date(timestamp) = ?", [userId, todayStr], (err, r1) => {
        db.get("SELECT COUNT(DISTINCT location_id) as cobertura_total FROM attendance WHERE user_id = ?", [userId], (err, r2) => {
          db.get("SELECT SUM(qty) as ventas_equipo FROM sales", (err, r3) => {
            db.get("SELECT COUNT(DISTINCT location_id) as tiendas_criticas FROM inventory WHERE stock <= 2", (err, r4) => {
               db.all("SELECT a.type, a.timestamp, date(a.timestamp) as date_str, l.name as loc_name, a.lat, a.lng, l.lat as store_lat, l.lng as store_lng FROM attendance a LEFT JOIN locations l ON a.location_id = l.id WHERE user_id = ? ORDER BY a.timestamp ASC", [userId], (err, visitLogs) => {
                 
                 let allRoutes = [];
                 let currentVisit = null;
                 visitLogs.forEach(log => {
                   if (log.type === 'check_in') {
                     if (currentVisit) allRoutes.push(currentVisit);
                     let gpsValid = false;
                     if (log.lat && log.lng && log.store_lat && log.store_lng) {
                       const R = 6371e3; // metres
                       const f1 = log.lat * Math.PI/180;
                       const f2 = log.store_lat * Math.PI/180;
                       const df = (log.store_lat-log.lat) * Math.PI/180;
                       const dl = (log.store_lng-log.lng) * Math.PI/180;
                       const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
                       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                       const d = R * c; // Distance in meters
                       if (d <= 500) gpsValid = true; // Within 500m
                     }
                     currentVisit = { date_str: log.date_str, location: log.loc_name, in: log.timestamp, out: null, gpsValid };
                   } else if (log.type === 'check_out') {
                     if (currentVisit && currentVisit.location === log.loc_name) {
                       currentVisit.out = log.timestamp;
                       allRoutes.push(currentVisit);
                       currentVisit = null;
                     }
                   }
                 });
                 if (currentVisit) allRoutes.push(currentVisit);
                 
                 res.json({
                   name: user.name,
                   role: user.role,
                   visitasHoy: r1 ? r1.visitas_hoy : 0,
                   coberturaTotal: r2 ? r2.cobertura_total : 0,
                   ventasEquipo: r3 ? r3.ventas_equipo : 0,
                   metaEquipo: 200, 
                   tiendasCriticas: r4 ? r4.tiendas_criticas : 0,
                   supervisorRoute: allRoutes, currentLat: visitLogs.length > 0 ? visitLogs[visitLogs.length - 1].lat : null, currentLng: visitLogs.length > 0 ? visitLogs[visitLogs.length - 1].lng : null 
                 });
               });
            });
          });
        });
      });
    } else {
      db.get("SELECT name, address, lat, lng FROM locations WHERE id = ?", [user.assigned_location_id], (err, location) => {
        db.all("SELECT product_name, stock, max_stock FROM inventory WHERE location_id = ?", [user.assigned_location_id], (err, storeInventory) => {
          db.all("SELECT a.type, a.timestamp, date(a.timestamp) as date_str, a.lat, a.lng, l.lat as store_lat, l.lng as store_lng FROM attendance a LEFT JOIN locations l ON a.location_id = l.id WHERE user_id = ? ORDER BY a.timestamp ASC", [userId], (err, logs) => {
            db.all("SELECT product_name, qty, timestamp, date(timestamp) as date_str FROM sales WHERE user_id = ? ORDER BY timestamp ASC", [userId], (err, sales) => {
              
              const dailyData = {};
              
              logs.forEach(log => {
                if (!dailyData[log.date_str]) dailyData[log.date_str] = { checkIn: null, lunchStart: null, lunchEnd: null, checkOut: null, salesQty: 0, items: [], gpsValid: false };
                if (log.type === 'check_in' && !dailyData[log.date_str].checkIn) {
                  dailyData[log.date_str].checkIn = log.timestamp;
                  if (log.lat && log.lng && log.store_lat && log.store_lng) {
                     const R = 6371e3;
                     const f1 = log.lat * Math.PI/180;
                     const f2 = log.store_lat * Math.PI/180;
                     const df = (log.store_lat-log.lat) * Math.PI/180;
                     const dl = (log.store_lng-log.lng) * Math.PI/180;
                     const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
                     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                     if (R * c <= 500) dailyData[log.date_str].gpsValid = true;
                  }
                }
                if (log.type === 'lunch_start' && !dailyData[log.date_str].lunchStart) dailyData[log.date_str].lunchStart = log.timestamp;
                if (log.type === 'lunch_end' && !dailyData[log.date_str].lunchEnd) dailyData[log.date_str].lunchEnd = log.timestamp;
                if (log.type === 'check_out') dailyData[log.date_str].checkOut = log.timestamp;
              });

              const PRODUCT_PRICES = {
                "EcoFlow River 2": 999900,
                "EcoFlow River 2 Pro": 2849900,
                "EcoFlow River 2 Max": 2249900,
                "EcoFlow Delta 2": 3999900
              };

              sales.forEach(sale => {
                if (!dailyData[sale.date_str]) dailyData[sale.date_str] = { checkIn: null, lunchStart: null, lunchEnd: null, checkOut: null, salesQty: 0, salesValue: 0, items: [] };
                dailyData[sale.date_str].salesQty += sale.qty;
                dailyData[sale.date_str].salesValue = (dailyData[sale.date_str].salesValue || 0) + (PRODUCT_PRICES[sale.product_name] || 0) * sale.qty;
                dailyData[sale.date_str].items.push(sale.product_name);
              });

              const dateList = Object.keys(dailyData).sort((a,b) => new Date(b) - new Date(a)); 
              
              let totalSalesToday = 0;
              let totalSalesWeek = 0;
              let totalSalesMonth = 0;
              let totalSalesTodayValue = 0;
              let totalSalesWeekValue = 0;
              let totalSalesMonthValue = 0;
              
              dateList.forEach(date => {
                 totalSalesMonth += dailyData[date].salesQty;
                 totalSalesMonthValue += (dailyData[date].salesValue || 0);
              });
              
              dateList.slice(0, 7).forEach(d => {
                 totalSalesWeek += dailyData[d].salesQty;
                 totalSalesWeekValue += (dailyData[d].salesValue || 0);
              });
              
              if (dateList.length > 0) {
                 totalSalesToday = dailyData[dateList[0]].salesQty;
                 totalSalesTodayValue = dailyData[dateList[0]].salesValue || 0;
              }
              
              res.json({
                name: user.name,
                role: user.role,
                storeName: location ? location.name : 'No Asignado',
                storeAddress: location ? location.address : '',
                storeLat: location ? location.lat : 0,
                storeLng: location ? location.lng : 0,
                storeInventory: storeInventory || [],
                monthlyGoal: 25,
                totalSalesToday, totalSalesWeek, totalSalesMonth,
                totalSalesTodayValue, totalSalesWeekValue, totalSalesMonthValue,
                dailyRecords: dateList.map(d => ({ date: d, ...dailyData[d] }))
              });
            });
          });
        });
      });
    }
  });
});

  app.get('/api/supervisor/plan', (req, res) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    db.get("SELECT * FROM supervisor_plans WHERE user_id = 1 AND plan_date = ?", [todayStr], (err, row) => {
      res.json(row || { locations_to_visit: '', objective: '', result: '', activities: '' });
    });
  });

  app.post('/api/supervisor/plan', (req, res) => {
    const { locations_to_visit, objective, result, activities } = req.body;
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    
    db.get("SELECT id FROM supervisor_plans WHERE user_id = 1 AND plan_date = ?", [todayStr], (err, row) => {
      if (row) {
        db.run("UPDATE supervisor_plans SET locations_to_visit = ?, objective = ?, result = ?, activities = ? WHERE id = ?", [locations_to_visit, objective, result, activities, row.id], err => res.json({success: true}));
      } else {
        db.run("INSERT INTO supervisor_plans (user_id, plan_date, locations_to_visit, objective, result, activities) VALUES (1, ?, ?, ?, ?, ?)", [todayStr, locations_to_visit, objective, result, activities], err => res.json({success: true}));
      }
    });
  });

app.get('/api/mobile-auth/:userId', (req, res) => {
  db.get(`SELECT u.*, l.name as store_name, l.lat as store_lat, l.lng as store_lng, l.radius FROM users u LEFT JOIN locations l ON u.assigned_location_id = l.id WHERE u.id = ?`, [req.params.userId], (err, row) => {
    res.json(row);
  });
});

// CRUD Personal
app.post('/api/users', (req, res) => {
  const { name, role, phone, assigned_location_id } = req.body;
  db.run("INSERT INTO users (name, role, phone, assigned_location_id) VALUES (?, ?, ?, ?)", [name, role, phone, assigned_location_id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], err => {
    if (err) return res.status(500).json({error: err.message});
    res.json({ success: true });
  });
});

// CRUD Locaciones
app.post('/api/locations', (req, res) => {
  const { name, city, department } = req.body;
  const address = `${name} ${city}`;
  const lat = 4.0 + Math.random() * 6.0; // Random coordinates in Colombia
  const lng = -75.0 + Math.random() * 2.0; // Random coordinates in Colombia
  db.run("INSERT INTO locations (name, address, city, department, lat, lng, radius) VALUES (?, ?, ?, ?, ?, ?, ?)", 
    [name, address, city, department, lat, lng, 150], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/locations/:id', (req, res) => {
  db.run("DELETE FROM locations WHERE id = ?", [req.params.id], err => {
    if (err) return res.status(500).json({error: err.message});
    // Remove users associated with this location or set to null
    db.run("UPDATE users SET assigned_location_id = NULL WHERE assigned_location_id = ?", [req.params.id]);
    db.run("DELETE FROM store_staff WHERE location_id = ?", [req.params.id]);
    res.json({ success: true });
  });
});

// CRUD Store Staff
app.post('/api/store-staff', (req, res) => {
  const { location_id, name, role, phone, email } = req.body;
  db.run("INSERT INTO store_staff (location_id, name, role, phone, email) VALUES (?, ?, ?, ?, ?)", 
    [location_id, name, role, phone, email], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/store-staff/:id', (req, res) => {
  db.run("DELETE FROM store_staff WHERE id = ?", [req.params.id], err => {
    if (err) return res.status(500).json({error: err.message});
    res.json({ success: true });
  });
});

app.post('/api/attendance', (req, res) => {
  const { user_id, type, lat, lng } = req.body;
  if (!user_id || !type) return res.status(400).json({error: "Faltan datos"});
  
  db.get("SELECT assigned_location_id FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err || !user) return res.status(500).json({error: "Usuario no encontrado"});
    
    // Convert to ISO 8601 YYYY-MM-DD HH:MM:SS format manually because SQLite date('now','localtime') is weird
    const now = new Date();
    // Offset by Colombia time roughly
    now.setHours(now.getHours() - 5);
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    db.run("INSERT INTO attendance (user_id, location_id, type, timestamp, lat, lng) VALUES (?, ?, ?, ?, ?, ?)", 
      [user_id, user.assigned_location_id, type, dateStr, lat, lng], function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ success: true, id: this.lastID });
    });
  });
});

// Analytics BI
const PRODUCT_PRICES = {
  'EcoFlow River 2': 1200000,
  'EcoFlow River 2 Max': 2500000,
  'EcoFlow River 2 Pro': 3800000,
  'EcoFlow Delta 2': 5500000
};

app.get('/api/analytics', (req, res) => {
  db.all("SELECT product_name, SUM(qty) as total_qty FROM sales GROUP BY product_name ORDER BY total_qty DESC", (err, topProducts) => {
    db.all("SELECT l.name as store, SUM(qty) as total_qty FROM sales s JOIN locations l ON s.location_id = l.id GROUP BY l.id ORDER BY total_qty DESC LIMIT 1", (err, topStore) => {
      db.all("SELECT s.location_id, l.name as store, s.product_name, SUM(s.qty) as total_qty, COUNT(DISTINCT date(s.timestamp)) as days_sold FROM sales s JOIN locations l ON s.location_id = l.id GROUP BY s.location_id, s.product_name", (err, rotation) => {
        
        let totalRevenue = 0;
        let totalTickets = 0;
        
        db.all("SELECT product_name, qty FROM sales", (err, allSales) => {
          allSales.forEach(s => {
            totalRevenue += (PRODUCT_PRICES[s.product_name] || 0) * s.qty;
            totalTickets += 1;
          });
          
          let avgTicket = totalTickets > 0 ? (totalRevenue / totalTickets) : 0;
          let bestSKU = topProducts.length > 0 ? topProducts[0].product_name : 'N/A';
          let bestStore = topStore.length > 0 ? topStore[0].store : 'N/A';
          
          res.json({
            bestSKU,
            bestStore,
            avgTicket,
            rotation
          });
        });
      });
    });
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));

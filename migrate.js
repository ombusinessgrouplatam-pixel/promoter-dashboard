const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqliteDb = new sqlite3.Database('./database.sqlite');
const pgPool = new Pool({
  connectionString: 'postgresql://promoter_db_user:LS4XgDWjS8SZnEudQAVH7AKmg12VJbIB@dpg-d9nk2t942hec73fpt18g-a.oregon-postgres.render.com/promoter_db',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log("Starting migration...");
  const client = await pgPool.connect();

  try {
    // 1. Create Tables in Postgres
    await client.query(`CREATE TABLE IF NOT EXISTS locations (id SERIAL PRIMARY KEY, name TEXT, address TEXT, city TEXT, department TEXT, lat REAL, lng REAL, radius REAL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, role TEXT, phone TEXT, assigned_location_id INTEGER)`);
    await client.query(`CREATE TABLE IF NOT EXISTS store_staff (id SERIAL PRIMARY KEY, location_id INTEGER, name TEXT, role TEXT, phone TEXT, email TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS inventory (id SERIAL PRIMARY KEY, location_id INTEGER, product_name TEXT, stock INTEGER, max_stock INTEGER)`);
    await client.query(`CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, user_id INTEGER, location_id INTEGER, type TEXT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, lat REAL, lng REAL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS sales (id SERIAL PRIMARY KEY, user_id INTEGER, location_id INTEGER, product_name TEXT, qty INTEGER, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`CREATE TABLE IF NOT EXISTS supervisor_plans (id SERIAL PRIMARY KEY, user_id INTEGER, plan_date DATE, locations_to_visit TEXT, objective TEXT, result TEXT, activities TEXT)`);

    // Clean existing data just in case
    await client.query("TRUNCATE locations, users, store_staff, inventory, attendance, sales, supervisor_plans RESTART IDENTITY CASCADE;");

    const getRows = (query) => new Promise((resolve, reject) => sqliteDb.all(query, (err, rows) => err ? reject(err) : resolve(rows)));

    // 2. Migrate Locations
    console.log("Migrating locations...");
    const locations = await getRows("SELECT * FROM locations");
    for (let loc of locations) {
      await client.query("INSERT INTO locations (id, name, address, city, department, lat, lng, radius) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", 
        [loc.id, loc.name, loc.address, loc.city, loc.department, loc.lat, loc.lng, loc.radius]);
    }
    if (locations.length) await client.query("SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations))");

    // 3. Migrate Users
    console.log("Migrating users...");
    const users = await getRows("SELECT * FROM users");
    for (let u of users) {
      await client.query("INSERT INTO users (id, name, role, phone, assigned_location_id) VALUES ($1, $2, $3, $4, $5)", 
        [u.id, u.name, u.role, u.phone, u.assigned_location_id]);
    }
    if (users.length) await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");

    // 4. Migrate Store Staff
    console.log("Migrating store staff...");
    const staff = await getRows("SELECT * FROM store_staff");
    for (let s of staff) {
      await client.query("INSERT INTO store_staff (id, location_id, name, role, phone, email) VALUES ($1, $2, $3, $4, $5, $6)", 
        [s.id, s.location_id, s.name, s.role, s.phone, s.email]);
    }
    if (staff.length) await client.query("SELECT setval('store_staff_id_seq', (SELECT MAX(id) FROM store_staff))");

    // 5. Migrate Inventory
    console.log("Migrating inventory...");
    const inv = await getRows("SELECT * FROM inventory");
    for (let i of inv) {
      await client.query("INSERT INTO inventory (id, location_id, product_name, stock, max_stock) VALUES ($1, $2, $3, $4, $5)", 
        [i.id, i.location_id, i.product_name, i.stock, i.max_stock]);
    }
    if (inv.length) await client.query("SELECT setval('inventory_id_seq', (SELECT MAX(id) FROM inventory))");

    // 6. Migrate Attendance
    console.log("Migrating attendance...");
    const att = await getRows("SELECT * FROM attendance");
    for (let a of att) {
      await client.query("INSERT INTO attendance (id, user_id, location_id, type, timestamp, lat, lng) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
        [a.id, a.user_id, a.location_id, a.type, a.timestamp, a.lat, a.lng]);
    }
    if (att.length) await client.query("SELECT setval('attendance_id_seq', (SELECT MAX(id) FROM attendance))");

    // 7. Migrate Sales
    console.log("Migrating sales...");
    const sales = await getRows("SELECT * FROM sales");
    for (let s of sales) {
      await client.query("INSERT INTO sales (id, user_id, location_id, product_name, qty, timestamp) VALUES ($1, $2, $3, $4, $5, $6)", 
        [s.id, s.user_id, s.location_id, s.product_name, s.qty, s.timestamp]);
    }
    if (sales.length) await client.query("SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales))");

    // 8. Migrate Supervisor Plans
    console.log("Migrating supervisor plans...");
    const plans = await getRows("SELECT * FROM supervisor_plans");
    for (let p of plans) {
      await client.query("INSERT INTO supervisor_plans (id, user_id, plan_date, locations_to_visit, objective, result, activities) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
        [p.id, p.user_id, p.plan_date, p.locations_to_visit, p.objective, p.result, p.activities]);
    }
    if (plans.length) await client.query("SELECT setval('supervisor_plans_id_seq', (SELECT MAX(id) FROM supervisor_plans))");

    console.log("Migration completed successfully!");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pgPool.end();
    sqliteDb.close();
  }
}

migrate();

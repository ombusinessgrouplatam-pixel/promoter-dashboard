import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, MapPin, Package, Users, Clock, X, Calendar, Database, Building2, Target, CheckSquare, Save, Minus, Maximize2, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const PRODUCT_PRICES = {
  "EcoFlow River 2": 999900,
  "EcoFlow River 2 Pro": 2849900,
  "EcoFlow River 2 Max": 2249900,
  "EcoFlow Delta 2": 3999900
};

function formatTime(timestamp) {
  if (!timestamp) return <span style={{fontSize: '0.75rem', fontWeight: '500', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block'}}>S/R</span>;
  const dateObj = timestamp.includes('T') ? new Date(timestamp) : new Date(timestamp.replace(' ', 'T'));
  const h = dateObj.getHours();
  const m = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const timeStr = `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
  return <span style={{fontSize: '0.8rem', fontWeight: '500', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block', letterSpacing: '0.5px'}}>{timeStr}</span>; 
}

function formatDate(dateString) {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return new Date(dateString + 'T00:00:00').toLocaleDateString('es-CO', options).toUpperCase();
}

function SupervisorPlan() {
  const [plan, setPlan] = useState({ locations_to_visit: '', objective: '', activities: '', result: '' });
  const [activitiesList, setActivitiesList] = useState(['']);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(API_BASE_URL + '/api/supervisor/plan').then(res => res.json()).then(data => {
      setPlan(data);
      if (data.activities) {
        try {
          const parsed = JSON.parse(data.activities);
          setActivitiesList(Array.isArray(parsed) && parsed.length > 0 ? parsed : ['']);
        } catch(e) {
          setActivitiesList(data.activities.split('\n').filter(a=>a.trim()));
        }
      } else {
        setActivitiesList(['']);
      }
    });
  }, []);

  const handleAddActivity = () => setActivitiesList([...activitiesList, '']);
  const handleActivityChange = (index, value) => {
    const newAct = [...activitiesList];
    newAct[index] = value;
    setActivitiesList(newAct);
  };
  const handleRemoveActivity = (index) => {
    const newAct = activitiesList.filter((_, i) => i !== index);
    setActivitiesList(newAct.length === 0 ? [''] : newAct);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalPlan = { ...plan, activities: JSON.stringify(activitiesList.filter(a => a.trim() !== '')) };
    await fetch(API_BASE_URL + '/api/supervisor/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPlan)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={18} color="#38bdf8"/> Plan de Trabajo Diario
      </h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.8rem' }}>Tiendas a Visitar</label>
          <input type="text" value={plan.locations_to_visit || ''} onChange={e => setPlan({...plan, locations_to_visit: e.target.value})} placeholder="Ej: Ktronix Salitre" style={{ width: '100%', padding: '10px', fontSize:'0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.8rem' }}>Objetivo</label>
          <textarea value={plan.objective || ''} onChange={e => setPlan({...plan, objective: e.target.value})} rows="2" placeholder="Ej: Auditoría" style={{ width: '100%', padding: '10px', fontSize:'0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.8rem' }}>Actividades Diarias</label>
          {activitiesList.map((act, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" value={act} onChange={e => handleActivityChange(index, e.target.value)} placeholder={`Actividad ${index + 1}`} style={{ flexGrow: 1, padding: '10px', fontSize:'0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
              <button type="button" onClick={() => handleRemoveActivity(index)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', width: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
            </div>
          ))}
          <button type="button" onClick={handleAddActivity} style={{ background: 'rgba(56,189,248,0.1)', border: '1px dashed rgba(56,189,248,0.3)', color: '#38bdf8', padding: '8px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>+ Añadir Actividad</button>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.8rem' }}>Resultado</label>
          <textarea value={plan.result || ''} onChange={e => setPlan({...plan, result: e.target.value})} rows="2" placeholder="Resultado final" style={{ width: '100%', padding: '10px', fontSize:'0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
        </div>
        <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', fontSize: '0.9rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Save size={16} /> {saved ? '¡Reporte Enviado!' : 'Enviar Reporte Final'}
        </button>
      </form>
    </div>
  );
}

// End of UserManagement removed

const WindowPanel = ({ title, icon, defaultSize, defaultPos, children, rightActions }) => {
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [pos, setPos] = useState(defaultPos);
  const [size, setSize] = useState(defaultSize);
  
  if (closed) return null;

  return (
    <Rnd
      size={minimized ? { width: size.width, height: 46 } : size}
      position={pos}
      onDrag={(e, d) => setPos({ x: d.x, y: d.y })}
      onDragStop={(e, d) => setPos({ x: d.x, y: d.y })}
      onResize={(e, dir, ref, delta, position) => {
        if (!minimized) {
          setSize({ width: ref.style.width, height: ref.style.height });
          setPos(position);
        }
      }}
      onResizeStop={(e, dir, ref, delta, position) => {
        if (!minimized) {
          setSize({ width: ref.style.width, height: ref.style.height });
          setPos(position);
        }
      }}
      minWidth={350}
      minHeight={minimized ? 46 : 250}
      dragHandleClassName="drag-handle"
      style={{ zIndex: 10, display: 'flex', flexDirection: 'column' }}
    >
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="drag-handle" style={{ padding: '12px 16px', cursor: 'move', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            <h1 style={{fontSize: '1rem', margin: 0, color: '#e2e8f0'}}>{title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {rightActions}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMinimized(!minimized)} style={{ width: 20, height: 20, borderRadius: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Minimizar / Restaurar">
                <Minus size={14} />
              </button>
              <button onClick={() => setClosed(true)} style={{ width: 20, height: 20, borderRadius: '4px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cerrar">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
        {!minimized && (
          <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        )}
      </div>
    </Rnd>
  );
};
function App() {
  const [data, setData] = useState({ locations: [], users: [], inventory: [], logs: [] });
  const [analytics, setAnalytics] = useState(null);
  const [selectedPromoter, setSelectedPromoter] = useState(null);
  const [timeFilter, setTimeFilter] = useState('mensual');
  const [userFormData, setUserFormData] = useState({ name: '', role: 'promoter', phone: '', assigned_location_id: 2 });

  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [locationFormData, setLocationFormData] = useState({ name: '', city: '', department: '' });
  const [storeStaffFormData, setStoreStaffFormData] = useState({ location_id: 1, name: '', role: '', phone: '', email: '' });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/api/dashboard');
      const json = await res.json();
      setData(json);

      const resAnal = await fetch(API_BASE_URL + '/api/analytics');
      const analJson = await resAnal.json();
      setAnalytics(analJson);
    } catch (err) {}
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await fetch(API_BASE_URL + '/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userFormData)
    });
    setUserFormData({ name: '', role: 'promoter', phone: '', assigned_location_id: 2 });
    fetchDashboardData();
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este registro?")) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    await fetch(API_BASE_URL + '/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationFormData)
    });
    setLocationFormData({ name: '', city: '', department: '' });
    fetchDashboardData();
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta tienda? Los promotores asignados quedarán sin asignar.")) {
      await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    }
  };

  const handleCreateStoreStaff = async (e) => {
    e.preventDefault();
    await fetch(API_BASE_URL + '/api/store-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeStaffFormData)
    });
    setStoreStaffFormData({ location_id: storeStaffFormData.location_id, name: '', role: '', phone: '', email: '' });
    fetchDashboardData();
  };

  const handleDeleteStoreStaff = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este contacto?")) {
      await fetch(`/api/store-staff/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchPromoterStats = (id) => {
    fetch(`/api/promoter/${id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedPromoter({...data, id});
        setTimeFilter('diario');
      });
  };


  const inventorySummary = data.inventory.reduce((acc, curr) => {
    acc[curr.product_name] = (acc[curr.product_name] || 0) + curr.stock;
    return acc;
  }, {});

  const inventoryByStore = data.inventory.reduce((acc, curr) => {
    if (!acc[curr.store]) acc[curr.store] = [];
    acc[curr.store].push(curr);
    return acc;
  }, {});

  const productData = {
    labels: Object.keys(inventorySummary),
    datasets: [{ data: Object.values(inventorySummary), backgroundColor: ["#6366f1", "#a855f7", "#ec4899", "#14b8a6"] }],
  };
  const doughnutOptions = { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: {size: 10} } } }, maintainAspectRatio: false };

  let filteredRecords = [];
  if (selectedPromoter) {
    let sourceRecords = selectedPromoter.role === 'supervisor' ? (selectedPromoter.supervisorRoute || []).slice().reverse() : selectedPromoter.dailyRecords;
    if (timeFilter === 'diario') filteredRecords = sourceRecords.slice(0, 1);
    else if (timeFilter === 'semanal') filteredRecords = sourceRecords.slice(0, 7);
    else filteredRecords = sourceRecords;
  }

  return (
    <div className="dashboard-container">
      {/* Modal Profile (Promoter / Supervisor) */}
      {selectedPromoter && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid #38bdf8', borderRadius: '16px', padding: '24px', width: '95%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', color: 'white', boxShadow: '0 25px 50px -12px rgba(56,189,248,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedPromoter.name} 
                  <span className={selectedPromoter.role === 'supervisor' ? "badge badge-warning" : "badge badge-success"} style={{fontSize: '0.75rem'}}>{selectedPromoter.role.toUpperCase()}</span>
                  
                  {(() => {
                    let status = { text: 'Fuera de Tienda', color: '#ef4444' };
                    let gpsValid = false;
                    
                    if (selectedPromoter.role === 'supervisor') {
                      const routes = selectedPromoter.supervisorRoute || [];
                      const lastVisit = routes.length > 0 ? routes[routes.length - 1] : null;
                      if (lastVisit && lastVisit.in && !lastVisit.out) {
                        status = { text: 'En Tienda', color: '#eab308' };
                        gpsValid = lastVisit.gpsValid;
                      }
                    } else {
                      const records = selectedPromoter.dailyRecords || [];
                      const lastRecord = records.length > 0 ? records[0] : null;
                      if (lastRecord && lastRecord.checkIn && !lastRecord.checkOut) {
                        status = { text: 'En Tienda', color: '#eab308' };
                        gpsValid = lastRecord.gpsValid;
                      }
                    }
                    
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: `${status.color}20`, border: `1px solid ${status.color}`, color: status.color, padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', boxShadow: `0 0 10px ${status.color}30` }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color, boxShadow: `0 0 8px ${status.color}` }}></div>
                          {status.text.toUpperCase()}
                        </span>
                        
                        {status.text === 'En Tienda' && (
                          <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', border: `1px solid ${gpsValid ? '#10b981' : '#ef4444'}`, color: gpsValid ? '#10b981' : '#ef4444', background: gpsValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                            <MapPin size={12} />
                            {gpsValid ? 'GPS Sincronizado' : 'GPS Fuera de Rango'}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </h2>
                <p className="text-muted" style={{marginTop: '4px', fontSize: '0.85rem'}}>{selectedPromoter.role === 'supervisor' ? 'Panel de Planificación y Auditoría' : 'Reporte de Rendimiento Julio 2026'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        fetch(API_BASE_URL + '/api/attendance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            user_id: selectedPromoter.id,
                            type: 'check_in',
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          })
                        }).then(() => fetchPromoterStats(selectedPromoter.id));
                      }, (error) => alert('Error de GPS: ' + error.message));
                    } else {
                      alert('GPS no soportado en este navegador');
                    }
                  }} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> Hacer Check-In
                  </button>
                  <button onClick={() => setSelectedPromoter(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}><X size={20}/></button>
                </div>
              </div>
            
            {selectedPromoter.role === 'supervisor' ? (
              <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 'bold' }}>VISITAS HOY</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{selectedPromoter.visitasHoy}</div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 'bold' }}>COBERTURA MES</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{selectedPromoter.coberturaTotal} <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>/ 10 Tiendas</span></div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>VENTAS EQUIPO (MES)</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{selectedPromoter.ventasEquipo} <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>/ {selectedPromoter.metaEquipo}</span></div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold' }}>TIENDAS EN RIESGO (Stock)</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{selectedPromoter.tiendasCriticas}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#38bdf8"/> En Vivo</div>
                    <MapContainer center={[selectedPromoter.currentLat || selectedPromoter.storeLat || 4.6, selectedPromoter.currentLng || selectedPromoter.storeLng || -74.0]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      {(selectedPromoter.currentLat || selectedPromoter.storeLat) && <Marker position={[selectedPromoter.currentLat || selectedPromoter.storeLat, selectedPromoter.currentLng || selectedPromoter.storeLng]}></Marker>}
                    </MapContainer>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Timeline de Visitas</h3>
                  <div className="filter-tabs" style={{marginBottom: 12}}>
                    <button onClick={() => setTimeFilter('diario')} className={`filter-btn ${timeFilter === 'diario' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Día</button>
                    <button onClick={() => setTimeFilter('semanal')} className={`filter-btn ${timeFilter === 'semanal' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Semana</button>
                    <button onClick={() => setTimeFilter('mensual')} className={`filter-btn ${timeFilter === 'mensual' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Mes (Julio)</button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Fecha</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Punto de Venta / Locación</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', textAlign: 'center' }}>Hora Entrada</th>
                        <th style={{ padding: '8px 12px', color: '#94a3b8', textAlign: 'center' }}>Hora Salida</th>
                        <th style={{ padding: '8px 12px', color: '#a855f7', textAlign: 'center' }}>Horas Trab.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!filteredRecords || filteredRecords.length === 0) && (
                        <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Sin registros para este periodo</td></tr>
                      )}
                      {filteredRecords && filteredRecords.map((route, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{formatDate(route.date_str)}</td>
                          <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{route.location}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{formatTime(route.in)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{formatTime(route.out)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', color: '#a855f7' }}>
                            {(() => {
                              if (route.in && route.out) {
                                const t1 = new Date(route.in);
                                const t2 = new Date(route.out);
                                return ((t2 - t1) / 3600000).toFixed(1) + 'h';
                              }
                              return '-';
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
                <SupervisorPlan />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                       <div>
                         <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                           <Database size={16} color="#38bdf8" /> 
                           Inventario Local ({selectedPromoter.storeName})
                         </h3>
                         {selectedPromoter.storeAddress && (
                           <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '22px' }}>
                             <MapPin size={12} color="#94a3b8"/> {selectedPromoter.storeAddress}
                           </div>
                         )}
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Meta Mes: {selectedPromoter.totalSalesMonth} / {selectedPromoter.monthlyGoal}</div>
                         <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                           <div style={{ height: '100%', width: `${Math.min((selectedPromoter.totalSalesMonth / selectedPromoter.monthlyGoal) * 100, 100)}%`, background: selectedPromoter.totalSalesMonth >= selectedPromoter.monthlyGoal ? '#10b981' : '#38bdf8', transition: 'width 0.5s' }}></div>
                         </div>
                       </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                       {selectedPromoter.storeInventory.map((inv, idx) => (
                         <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.product_name.replace('EcoFlow ', '')}</div>
                           <div style={{ fontSize: '1rem', fontWeight: 'bold', color: inv.stock === 0 ? '#ef4444' : inv.stock <= 2 ? '#f59e0b' : '#10b981' }}>{inv.stock}</div>
                         </div>
                       ))}
                     </div>
                  </div>
                  {/* Mini Map */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#38bdf8"/> En Vivo</div>
                    <MapContainer center={[selectedPromoter.storeLat || 4.6, selectedPromoter.storeLng || -74.0]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      {selectedPromoter.storeLat && <Marker position={[selectedPromoter.storeLat, selectedPromoter.storeLng]}></Marker>}
                    </MapContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                    <div style={{ background: 'rgba(56,189,248,0.2)', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}><Package size={20} /></div>
                    <div>
                      <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '0.5px' }}>REPORTE DIARIO</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1' }}>{selectedPromoter.totalSalesToday}</div>
                      <div style={{ fontSize: '0.85rem', color: '#bae6fd', marginTop: '4px' }}>${new Intl.NumberFormat('es-CO').format(selectedPromoter.totalSalesTodayValue || 0)}</div>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                    <div style={{ background: 'rgba(168,85,247,0.2)', padding: '10px', borderRadius: '10px', color: '#a855f7' }}><Activity size={20} /></div>
                    <div>
                      <div style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '0.5px' }}>REPORTE SEMANAL</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1' }}>{selectedPromoter.totalSalesWeek}</div>
                      <div style={{ fontSize: '0.85rem', color: '#e9d5ff', marginTop: '4px' }}>${new Intl.NumberFormat('es-CO').format(selectedPromoter.totalSalesWeekValue || 0)}</div>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
                    <div style={{ background: 'rgba(16,185,129,0.2)', padding: '10px', borderRadius: '10px', color: '#10b981' }}><Calendar size={20} /></div>
                    <div>
                      <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '0.5px' }}>REPORTE MENSUAL</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1' }}>{selectedPromoter.totalSalesMonth}</div>
                      <div style={{ fontSize: '0.85rem', color: '#d1fae5', marginTop: '4px' }}>${new Intl.NumberFormat('es-CO').format(selectedPromoter.totalSalesMonthValue || 0)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#38bdf8"/> Auditoría Detallada</h3>
                  <div className="filter-tabs" style={{marginBottom: 0}}>
                    <button onClick={() => setTimeFilter('diario')} className={`filter-btn ${timeFilter === 'diario' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Día</button>
                    <button onClick={() => setTimeFilter('semanal')} className={`filter-btn ${timeFilter === 'semanal' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Semana</button>
                    <button onClick={() => setTimeFilter('mensual')} className={`filter-btn ${timeFilter === 'mensual' ? 'active' : ''}`} style={{fontSize: '0.75rem', padding: '4px 12px'}}>Mes (Julio)</button>
                  </div>
                </div>
                
                <div style={{ overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table className="inventory-table" style={{ minWidth: '800px', margin: 0, fontSize: '0.8rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
                      <tr>
                        <th>Fecha</th>
                        <th style={{textAlign: 'center'}}>Entrada</th>
                        <th style={{textAlign: 'center'}}>Sale Alm.</th>
                        <th style={{textAlign: 'center'}}>Vuelve Alm.</th>
                        <th style={{textAlign: 'center'}}>Salida</th>
                        <th style={{textAlign: 'center', color: '#a855f7'}}>Horas Trab.</th>
                        <th style={{textAlign: 'center', color: '#38bdf8'}}>Und. Vendidas</th>
                        <th>Referencias</th>
                        <th style={{textAlign: 'right'}}>Precio (Total)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length === 0 && <tr><td colSpan="9" style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay registros para este periodo.</td></tr>}
                      {filteredRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: '#cbd5e1' }}>{formatDate(record.date)}</td>
                          <td style={{ textAlign: 'center' }}>{formatTime(record.checkIn)}</td>
                          <td style={{ textAlign: 'center' }}>{formatTime(record.lunchStart)}</td>
                          <td style={{ textAlign: 'center' }}>{formatTime(record.lunchEnd)}</td>
                          <td style={{ textAlign: 'center' }}>{formatTime(record.checkOut)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#a855f7' }}>
                            {(() => {
                              if (record.checkIn && record.checkOut) {
                                const t1 = new Date(record.checkIn);
                                const t2 = new Date(record.checkOut);
                                let totalMs = t2 - t1;
                                if (record.lunchStart && record.lunchEnd) {
                                  totalMs -= (new Date(record.lunchEnd) - new Date(record.lunchStart));
                                }
                                return (totalMs / 3600000).toFixed(1) + 'h';
                              }
                              return '-';
                            })()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${record.salesQty > 0 ? 'badge-success' : 'badge-neutral'}`} style={{fontSize: '0.85rem', padding: '4px 10px', minWidth: '30px', display: 'inline-block'}}>{record.salesQty}</span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {record.items.length > 0 ? [...new Set(record.items)].join(', ') : '-'}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>
                            {record.items.length > 0 ? `$${new Intl.NumberFormat('es-CO').format(record.items.reduce((acc, item) => acc + (PRODUCT_PRICES[item] || 0), 0))}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 60px)' }}>
        
        <WindowPanel 
          title="Mapa GPS en Vivo" 
          icon={<MapPin size={18} color="#38bdf8" />}
          defaultSize={{ width: 450, height: 420 }}
          defaultPos={{ x: 20, y: 20 }}
          rightActions={<Link to="/app" target="_blank" style={{ color: '#38bdf8', textDecoration: 'none', border: '1px solid #38bdf8', padding: '4px 8px', fontSize: '0.7rem', borderRadius: '4px' }}>App Móvil</Link>}
        >
          <div className="map-container" style={{ border: 'none', borderRadius: 0, flexGrow: 1, width: '100%', height: '100%' }}>
            <MapContainer center={[5.5, -74.5]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {data.locations.map(store => (
                <div key={store.id}>
                  <Marker position={[store.lat, store.lng]}>
                    <Popup><strong style={{color: 'black', fontSize:'0.8rem'}}>{store.name}</strong></Popup>
                  </Marker>
                  <Circle center={[store.lat, store.lng]} radius={store.radius} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.2 }} />
                </div>
              ))}
              {data.logs.filter(l => l.lat).slice(0,10).map((log, idx) => (
                <Marker key={`sup-${idx}`} position={[log.lat, log.lng]}>
                  <Popup><strong style={{color: 'black', fontSize:'0.8rem'}}>{log.promoter}</strong></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </WindowPanel>

        <WindowPanel
          title="Dashboard Operativo"
          icon={<Activity size={18} color="#6366f1" />}
          defaultSize={{ width: 700, height: 600 }}
          defaultPos={{ x: 500, y: 20 }}
        >
          <div style={{ padding: '16px', overflowY: 'auto', flexGrow: 1 }}>
            <div className="stats-grid" style={{marginBottom: '16px', gap: '12px'}}>
              <div className="stat-card" style={{padding: '12px'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><Users size={16} color="#94a3b8" /><span className="text-muted">Plantilla</span></div>
                <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.users.length}</div>
              </div>
              <div className="stat-card" style={{padding: '12px'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><Building2 size={16} color="#94a3b8" /><span className="text-muted">Locaciones</span></div>
                <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.locations.length - 1}</div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><Database size={16} color="#38bdf8" /><span style={{color: '#38bdf8', fontWeight: 'bold'}}>Inv. Global</span></div>
                <div className="stat-value" style={{color: '#38bdf8', fontSize: '1.5rem'}}>{Object.values(inventorySummary).reduce((a,b)=>a+b,0)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '220px', padding: '12px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '0.9rem', width: '100%', textAlign: 'left' }}>Stock por Referencia</h3>
                <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                  <Doughnut data={productData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '0', overflowY: 'auto', maxHeight: '250px' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Auditoría en Vivo</h3>
                </div>
                <div style={{ padding: '12px' }}>
                                 {(() => {
                      const supervisor = data.users?.find(u => u.role === 'supervisor');
                      const supervisorLog = data.logs.find(l => l.role === 'supervisor');
                      const promoters = data.users?.filter(u => u.role === 'promoter') || [];
                      
                      return (
                        <>
                          {supervisor && (
                            <div className="list-item" onClick={() => fetchPromoterStats(supervisor.id)} style={{padding: '8px', marginBottom: '8px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)'}}>
                              <div>
                                <strong style={{ color: '#f59e0b', display: 'block', fontSize: '0.8rem' }}>Identificador Supervisor: {supervisor.name}</strong>
                                <span className="text-muted" style={{fontSize: '0.75rem'}}>Gestión Tiendas: {supervisorLog ? `${supervisorLog.type} ${supervisorLog.location ? `@ ${supervisorLog.location}` : ''}` : 'Activo (En Ruta)'}</span>
                              </div>
                              {supervisorLog && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(supervisorLog.timestamp).toLocaleTimeString()}</div>}
                            </div>
                          )}
                          {promoters.map((promoter, idx) => {
                            const pLog = data.logs.find(l => l.promoter_id === promoter.id);
                            return (
                              <div key={idx} className="list-item" onClick={() => fetchPromoterStats(promoter.id)} style={{padding: '8px', marginBottom: '4px'}}>
                                <div>
                                  <strong style={{ color: '#38bdf8', display: 'block', fontSize: '0.8rem' }}>Identificación Promotor: {promoter.name}</strong>
                                  <span className="text-muted" style={{fontSize: '0.75rem'}}>Punto de Venta: {pLog?.location || promoter.assigned_store || 'Sin asignar'} - {pLog ? pLog.type : 'Sin actividad'}</span>
                                </div>
                                {pLog && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(pLog.timestamp).toLocaleTimeString()}</div>}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                </div>
              </div>

              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '0', overflowX: 'auto', overflowY: 'auto', maxHeight: '250px' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={16} /> Tiendas</h3>
                </div>
                
                <div style={{ padding: '12px' }}>
                  {Object.keys(inventoryByStore).filter(s => s !== 'Oficina Drone Nerds').map(storeName => (
                    <div key={storeName} style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <Building2 size={14} color="#94a3b8" /> {storeName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', padding: '8px' }}>
                        {inventoryByStore[storeName].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px' }}>
                            <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px' }}>{item.product_name.replace('EcoFlow ', '')}</span>
                            <strong style={{ color: item.stock === 0 ? '#ef4444' : item.stock <= 2 ? '#f59e0b' : '#10b981' }}>{item.stock}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </WindowPanel>

        <WindowPanel
          title="Administración"
          icon={<Users size={18} color="#10b981" />}
          defaultSize={{ width: 450, height: 550 }}
          defaultPos={{ x: 50, y: 500 }}
        >
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div className="filter-tabs" style={{marginBottom: '16px'}}>
              <button onClick={() => setActiveAdminTab('users')} className={`filter-btn ${activeAdminTab === 'users' ? 'active' : ''}`} style={{fontSize: '0.8rem', flex: 1}}>Personal</button>
              <button onClick={() => setActiveAdminTab('stores')} className={`filter-btn ${activeAdminTab === 'stores' ? 'active' : ''}`} style={{fontSize: '0.8rem', flex: 1}}>Tiendas</button>
              <button onClick={() => setActiveAdminTab('staff')} className={`filter-btn ${activeAdminTab === 'staff' ? 'active' : ''}`} style={{fontSize: '0.8rem', flex: 1}}>Contactos (Staff)</button>
              <button onClick={() => setActiveAdminTab('export')} className={`filter-btn ${activeAdminTab === 'export' ? 'active' : ''}`} style={{fontSize: '0.8rem', flex: 1, background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: '#ef4444'}}>SuperAdmin</button>
            </div>

            {activeAdminTab === 'users' ? (
              <>
                <form onSubmit={handleCreateUser} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#10b981' }}>Registrar Nuevo Personal</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre completo</label>
                      <input required type="text" placeholder="Ej. Juan Pérez" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Cargo</label>
                        <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                          <option value="promoter" style={{ background: '#0f172a' }}>Promotor</option>
                          <option value="supervisor" style={{ background: '#0f172a' }}>Supervisor</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Celular</label>
                        <input required type="text" placeholder="Ej. 3001234567" value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Tienda y Ciudad Asignada</label>
                      <select value={userFormData.assigned_location_id} onChange={e => setUserFormData({...userFormData, assigned_location_id: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                        {data.locations.map(l => {
                          const display = l.city ? `${l.name} (Ciudad: ${l.city})` : l.name;
                          return <option key={l.id} value={l.id} style={{ background: '#0f172a' }}>{display}</option>
                        })}
                      </select>
                    </div>
                    <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}>Guardar Registro</button>
                  </div>
                </form>

                <div style={{ overflowY: 'auto', flexGrow: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Nombre</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Cargo</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Tienda</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map(u => {
                        const loc = data.locations.find(l => l.id === u.assigned_location_id);
                        const cityDisplay = loc && loc.city ? loc.city : '-';
                        return (
                        <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px', color: '#e2e8f0' }}>{u.name} <br/><span style={{fontSize:'0.65rem', color:'#64748b'}}>{u.phone}</span></td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: u.role === 'supervisor' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)', color: u.role === 'supervisor' ? '#f59e0b' : '#38bdf8' }}>{u.role}</span>
                          </td>
                          <td style={{ padding: '8px', color: '#cbd5e1' }}>{cityDisplay} <br/><span style={{fontSize: '0.65rem', color: '#64748b'}}>{u.assigned_store || 'Sin asignar'}</span></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Eliminar</button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </>
            ) : activeAdminTab === 'stores' ? (
              <>
                <form onSubmit={handleCreateLocation} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#38bdf8' }}>Registrar Nueva Tienda</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre del Almacén</label>
                      <input required type="text" placeholder="Ej. Alkosto Calle 170" value={locationFormData.name} onChange={e => setLocationFormData({...locationFormData, name: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Ciudad</label>
                        <input required type="text" placeholder="Ej. Bogotá" value={locationFormData.city} onChange={e => setLocationFormData({...locationFormData, city: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Departamento</label>
                        <input required type="text" placeholder="Ej. Cundinamarca" value={locationFormData.department} onChange={e => setLocationFormData({...locationFormData, department: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <button type="submit" style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}>Guardar Tienda</button>
                  </div>
                </form>

                <div style={{ overflowY: 'auto', flexGrow: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Tienda</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Ubicación</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.locations.filter(l => l.name !== 'Oficina Drone Nerds').map(l => (
                        <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px', color: '#e2e8f0' }}>{l.name} {l.address && <><br/><span style={{fontSize: '0.7rem', color: '#94a3b8'}}>{l.address}</span></>}</td>
                          <td style={{ padding: '8px', color: '#cbd5e1' }}>{l.city} <br/><span style={{fontSize: '0.65rem', color: '#64748b'}}>{l.department}</span></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteLocation(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : activeAdminTab === 'staff' ? (
              <>
                <form onSubmit={handleCreateStoreStaff} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#f59e0b' }}>Registrar Contacto de Tienda (Staff)</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Tienda / Almacén</label>
                      <select value={storeStaffFormData.location_id} onChange={e => setStoreStaffFormData({...storeStaffFormData, location_id: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                        {data.locations.filter(l => l.name !== 'Oficina Drone Nerds').map(l => (
                          <option key={l.id} value={l.id} style={{ background: '#0f172a' }}>{l.name} ({l.city})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Nombre Completo</label>
                        <input required type="text" placeholder="Ej. Carlos G." value={storeStaffFormData.name} onChange={e => setStoreStaffFormData({...storeStaffFormData, name: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Cargo (Rol)</label>
                        <input required type="text" placeholder="Ej. Gerente" value={storeStaffFormData.role} onChange={e => setStoreStaffFormData({...storeStaffFormData, role: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Teléfono</label>
                        <input required type="text" placeholder="Celular/Ext" value={storeStaffFormData.phone} onChange={e => setStoreStaffFormData({...storeStaffFormData, phone: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Correo Electrónico</label>
                        <input type="email" placeholder="Opcional" value={storeStaffFormData.email} onChange={e => setStoreStaffFormData({...storeStaffFormData, email: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <button type="submit" style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}>Guardar Contacto</button>
                  </div>
                </form>

                <div style={{ overflowY: 'auto', flexGrow: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Tienda</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Nombre</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Contacto</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.storeStaff || []).map(s => {
                        const loc = data.locations.find(l => l.id === s.location_id);
                        return (
                        <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px', color: '#cbd5e1' }}>{loc ? loc.name : '-'}</td>
                          <td style={{ padding: '8px', color: '#e2e8f0' }}>{s.name} <br/><span style={{fontSize: '0.65rem', color: '#64748b'}}>{s.role}</span></td>
                          <td style={{ padding: '8px', color: '#cbd5e1' }}>{s.phone} <br/><span style={{fontSize: '0.65rem', color: '#64748b'}}>{s.email}</span></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteStoreStaff(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Eliminar</button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </>
            ) : activeAdminTab === 'export' ? (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#ef4444' }}>Panel de Super Administrador</h3>
                  <p style={{ color: '#cbd5e1', textAlign: 'center', fontSize: '0.85rem' }}>Genera un reporte consolidado en formato Excel con toda la información de la aplicación (Usuarios, Tiendas, Inventario, Asistencias, Ventas y Métricas BI).</p>
                  <button onClick={() => {
                    try {
                      const wb = XLSX.utils.book_new();
                      const wsUsers = XLSX.utils.json_to_sheet(data.users);
                      XLSX.utils.book_append_sheet(wb, wsUsers, "Usuarios");
                      
                      const mappedLocations = data.locations.map(l => ({
                        "ID": l.id,
                        "Nombre": l.name,
                        "Ciudad": l.city || 'N/A',
                        "Departamento": l.department || 'N/A'
                      }));
                      const wsLocations = XLSX.utils.json_to_sheet(mappedLocations);
                      XLSX.utils.book_append_sheet(wb, wsLocations, "Tiendas");

                      const mappedStaff = (data.storeStaff || []).map(s => {
                        const loc = data.locations.find(l => l.id === s.location_id);
                        return {
                          "ID": s.id,
                          "Tienda": loc ? loc.name : 'N/A',
                          "Nombre": s.name,
                          "Rol": s.role,
                          "Teléfono": s.phone,
                          "Email": s.email
                        };
                      });
                      const wsStaff = XLSX.utils.json_to_sheet(mappedStaff);
                      XLSX.utils.book_append_sheet(wb, wsStaff, "Contactos Staff");

                      const totalSalesByProduct = {};
                      const totalSalesByProductAndStore = {};
                      const storeSales = {};
                      const rotacionByStore = {};
                      
                      (data.sales || []).forEach(s => {
                        totalSalesByProduct[s.product_name] = (totalSalesByProduct[s.product_name] || 0) + s.qty;
                        const key = s.product_name + '_' + s.store_name;
                        totalSalesByProductAndStore[key] = (totalSalesByProductAndStore[key] || 0) + s.qty;
                        storeSales[s.store_name] = (storeSales[s.store_name] || 0) + s.qty;
                        
                        if (!rotacionByStore[s.store_name]) rotacionByStore[s.store_name] = {};
                        rotacionByStore[s.store_name][s.product_name] = (rotacionByStore[s.store_name][s.product_name] || 0) + s.qty;
                      });

                      const ventasReordenData = (data.sales || []).map(s => {
                        const inv = (data.inventory || []).find(i => i.product_name === s.product_name && i.store === s.store_name);
                        let avgDaily = 0.5;
                        if (analytics && analytics.rotation) {
                          const rot = analytics.rotation.find(r => r.product_name === s.product_name && r.store === s.store_name);
                          if (rot && rot.days_sold > 0) avgDaily = Number((rot.total_qty / 31).toFixed(1));
                        }
                        const safetyStock = 3;
                        const reorderPoint = Math.ceil((avgDaily * 7) + safetyStock);
                        const maxStock = inv ? inv.max_stock : 10;
                        const status = (inv ? inv.stock : 0) <= reorderPoint ? 'PEDIR YA' : 'ÓPTIMO';
                        
                        return {
                          "Tienda": s.store_name,
                          "Referencia": s.product_name,
                          "Precio (Incl. IVA)": PRODUCT_PRICES[s.product_name] || 0,
                          "Cantidad Vendida": s.qty,
                          "Fecha de la Venta": s.timestamp,
                          "Ventas por Almacen": totalSalesByProductAndStore[s.product_name + '_' + s.store_name],
                          "Stock Minimo": safetyStock,
                          "Stock Maximo": maxStock,
                          "Punto de Reorden": reorderPoint,
                          "Estado": status
                        };
                      });
                      const wsVentasReorden = XLSX.utils.json_to_sheet(ventasReordenData);
                      XLSX.utils.book_append_sheet(wb, wsVentasReorden, "Ventas y Reorden");

                      const tiendasTop = Object.keys(storeSales)
                        .map(store => ({ "Tienda": store, "Total Unidades Vendidas": storeSales[store] }))
                        .sort((a,b) => b["Total Unidades Vendidas"] - a["Total Unidades Vendidas"]);
                      const wsTiendasTop = XLSX.utils.json_to_sheet(tiendasTop);
                      XLSX.utils.book_append_sheet(wb, wsTiendasTop, "Tiendas Top Ventas");

                      const rotacionList = [];
                      Object.keys(rotacionByStore).forEach(store => {
                        const prods = Object.keys(rotacionByStore[store]).map(prod => ({
                          "Almacén": store,
                          "Referencia": prod,
                          "Unidades Vendidas": rotacionByStore[store][prod]
                        })).sort((a,b) => b["Unidades Vendidas"] - a["Unidades Vendidas"]);
                        rotacionList.push(...prods);
                      });
                      const wsRotacion = XLSX.utils.json_to_sheet(rotacionList);
                      XLSX.utils.book_append_sheet(wb, wsRotacion, "Rotación por Almacén");

                      XLSX.writeFile(wb, "Reporte_General_SuperAdmin.xlsx");
                    } catch(err) {
                      alert("Error al exportar: " + err.message);
                    }
                  }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>
                    <Download size={20} /> Exportar Data a Excel
                  </button>
                </div>
            ) : null}
          </div>
        </WindowPanel>

        <WindowPanel
          title="Reporte del Canal y Categoría (BI)"
          icon={<TrendingUp size={18} color="#f59e0b" />}
          defaultSize={{ width: 750, height: 600 }}
          defaultPos={{ x: 200, y: 150 }}
        >
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>SKU MAYOR ROTACIÓN</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{analytics?.bestSKU || 'Cargando...'}</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>Alta prob. de venta cruzada</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>TICKET PROMEDIO CANAL</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                  {analytics ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(analytics.avgTicket) : 'Cargando...'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>General Nacional</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02))', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.3)' }}>
                <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>TIENDA LÍDER (PRONÓSTICO)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{analytics?.bestStore || 'Cargando...'}</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>Mayor flujo peatonal (Ventas)</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="#a855f7" /> Análisis Supply Chain y Reorden
            </h3>

            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8' }}>Tienda</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8' }}>Referencia</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>Precio (Incl. IVA)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>Stock<br/>Actual</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>Promedio<br/>Diario (Vta)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#f59e0b' }}>Punto de<br/>Reorden</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>Min / Max<br/>(Seguridad/Cap)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.slice(0, 15).map((inv, idx) => {
                    let avgDaily = 0.5; // fallback
                    if (analytics && analytics.rotation) {
                      const rot = analytics.rotation.find(r => r.product_name === inv.product_name && r.store === inv.store);
                      if (rot && rot.days_sold > 0) {
                        avgDaily = Number((rot.total_qty / 31).toFixed(1)); // Div 31 days month
                      }
                    }

                    const leadTimeDays = 7;
                    const safetyStock = 3;
                    const reorderPoint = Math.ceil((avgDaily * leadTimeDays) + safetyStock);
                    const status = inv.stock <= reorderPoint ? 'PEDIR YA' : 'ÓPTIMO';
                    const color = inv.stock <= reorderPoint ? '#ef4444' : '#10b981';

                    return (
                      <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{inv.store}</td>
                        <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: '500' }}>{inv.product_name.replace('EcoFlow ', '')}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                          ${new Intl.NumberFormat('es-CO').format(PRODUCT_PRICES[inv.product_name] || 0)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>{inv.stock}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>{avgDaily} und/día</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#f59e0b', fontWeight: 'bold' }}>{reorderPoint}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>{safetyStock} / {inv.max_stock}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ background: color + '22', color: color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
          </div>
        </WindowPanel>
      </div>
    </div>
  );
}

export default App;

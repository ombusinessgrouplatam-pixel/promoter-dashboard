const API_BASE_URL = 'https://promoter-dashboard.onrender.com';
import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Clock, Coffee, LogOut } from 'lucide-react';

// Distance calculation using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d * 1000; // in meters
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

export default function MobileApp() {
  const [user, setUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [status, setStatus] = useState('Inactivo');
  const [locationError, setLocationError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/mobile-auth/${loginId}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      alert("Usuario no encontrado (Prueba IDs del 1 al 11)");
    }
  };

  const registerAttendance = (type) => {
    if (!navigator.geolocation) {
      setLocationError("El GPS no es compatible con este dispositivo.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Geofencing Check
      if (user.store_lat && user.store_lng) {
        const distance = getDistanceFromLatLonInKm(lat, lng, user.store_lat, user.store_lng);
        if (distance > user.radius && user.role !== 'supervisor') {
           setLocationError(`Estás a ${Math.round(distance)}m del sitio. Acércate más a ${user.store_name} (radio: ${user.radius}m)`);
           return;
        }
      }

      setLocationError("");
      
      try {
        await fetch(API_BASE_URL + '/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            location_id: user.assigned_location_id,
            type: type,
            lat, lng
          })
        });
        
        setStatus(type === 'check_in' ? 'Trabajando' : type === 'lunch_start' ? 'Almorzando' : 'Inactivo');
        alert("Registro exitoso!");
      } catch (err) {
        alert("Error guardando el registro.");
      }

    }, (err) => {
      setLocationError("Debes conceder permisos de ubicación (GPS) para usar la App.");
    }, { enableHighAccuracy: true });
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: 'white', textAlign: 'center' }}>
        <h1 style={{ marginTop: '50px' }}>📱 Promotor App</h1>
        <p className="text-muted">Inicia sesión con tu ID de empleado</p>
        <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
          <input 
            type="number" 
            placeholder="ID (Ej: 2)" 
            value={loginId} 
            onChange={e => setLoginId(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #38bdf8', background: 'transparent', color: 'white' }}
          />
          <button type="submit" style={{ width: '100%', padding: '12px', marginTop: '16px', borderRadius: '8px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none' }}>
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: 'white' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user.name}</h2>
        <span className="badge badge-success">{user.role.toUpperCase()}</span>
        
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <MapPin color="#38bdf8" />
          <span>{user.store_name}</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
          Estado Actual: <strong style={{ color: 'white' }}>{status}</strong>
        </div>
      </div>

      {locationError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginTop: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
          {locationError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
        <button 
          onClick={() => registerAttendance('check_in')}
          style={{ padding: '20px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={32} />
          <span>Check In</span>
        </button>
        <button 
          onClick={() => registerAttendance('check_out')}
          style={{ padding: '20px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <LogOut size={32} />
          <span>Check Out</span>
        </button>
        <button 
          onClick={() => registerAttendance('lunch_start')}
          style={{ padding: '20px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Coffee size={32} />
          <span>Almuerzo (Sale)</span>
        </button>
        <button 
          onClick={() => registerAttendance('lunch_end')}
          style={{ padding: '20px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Clock size={32} />
          <span>Almuerzo (Vuelve)</span>
        </button>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button onClick={() => setUser(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none' }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

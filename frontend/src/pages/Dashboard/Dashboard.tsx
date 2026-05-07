import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Asegúrate que la ruta sea correcta

export default function Dashboard() {
  const [estado, setEstado] = useState<any>(null);
  const [error, setError] = useState(false);
  const { logout } = useAuth(); // Usamos la función del contexto si existe

  useEffect(() => {
    const obtenerEstado = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Si no hay token, no intentamos la petición
        if (!token) {
          setError(true);
          return;
        }

        const res = await fetch("http://localhost:5000/api/attendance/hoy", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!res.ok) throw new Error("Error al obtener datos");

        const data = await res.json();
        setEstado(data);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    obtenerEstado();
  }, []);

  // Función para cerrar sesión manualmente
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "red" }}>Error al cargar estado</h2>
        <button onClick={handleLogout} style={{ marginTop: "10px", cursor: "pointer" }}>
          Regresar al Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button 
          onClick={handleLogout}
          style={{ 
            backgroundColor: "#ff4444", 
            color: "white", 
            border: "none", 
            padding: "8px 15px", 
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <hr style={{ margin: "20px 0", opacity: 0.3 }} />

      {!estado ? (
        <p>Cargando información del servidor...</p>
      ) : (
        <div style={{ backgroundColor: "#2a2a2a", padding: "15px", borderRadius: "8px" }}>
          <p><b>Estado actual:</b> {estado.status || "No disponible"}</p>
          <p><b>Fecha de registro:</b> {estado.fecha || "Sin fecha"}</p>
        </div>
      )}
    </div>
  );
}
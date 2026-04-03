import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Debes llenar ambos campos");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    switch (data.rol) {
      case "ADMIN":            navigate("/admin");         break;
      case "TRABAJADOR":       navigate("/trabajador");    break;
      case "GESTOR_RECURSOS":  navigate("/bodega");        break;
      case "ENCARGADO_VIAJES": navigate("/exploraciones"); break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700">

        <h2 className="text-2xl font-bold mb-6 text-center">Panel de Control</h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded-2xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo"
            className="w-full p-4 rounded-2xl bg-slate-900 mb-4 outline-none border-2 border-transparent focus:border-orange-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-4 rounded-2xl bg-slate-900 mb-6 outline-none border-2 border-transparent focus:border-orange-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 p-4 rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-50"
          >
            {loading ? "Verificando..." : "ENTRAR"}
          </button>
        </form>

      </div>
    </div>
  );
}
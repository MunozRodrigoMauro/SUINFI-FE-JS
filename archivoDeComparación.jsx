import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate("/dashboard"); // o donde quieras redirigir
    } catch (err) {
      alert("Login fallido");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="bg-[#111827] p-8 rounded shadow-md w-full max-w-sm text-white">
        <h2 className="text-2xl font-bold mb-6">Iniciar sesión</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 rounded text-black"
          onChange={handleChange}
          value={form.email}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full mb-6 px-4 py-2 rounded text-black"
          onChange={handleChange}
          value={form.password}
        />
        <button type="submit" className="bg-[#0a0e17] text-white px-4 py-2 rounded w-full hover:bg-gray-800">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginPage;

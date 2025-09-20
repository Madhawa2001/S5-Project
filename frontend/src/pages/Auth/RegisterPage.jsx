import { useState } from "react";
import { register } from "../../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate("/login");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#E8F1F9] to-[#F4F6F7]">
      <form
        onSubmit={handleRegister}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-[#2E86C1] mb-2 text-center">
          Doctor Registration
        </h2>
        <div className="h-1 w-12 bg-[#27AE60] mx-auto mb-6 rounded"></div>

        {/* Full Name */}
        <div className="flex items-center border rounded-lg mb-4 px-3">
          <User className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="flex items-center border rounded-lg mb-4 px-3">
          <Mail className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="flex items-center border rounded-lg mb-4 px-3">
          <Lock className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#27AE60] hover:bg-[#1E8449] text-white py-3 rounded-lg font-semibold transition"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-[#2E86C1] font-semibold">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;

import { useState } from "react";
import { login, googleAuth } from "../../services/auth";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react"; // icons
import { FcGoogle } from "react-icons/fc"; // Google icon with colors

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#E8F1F9] to-[#F4F6F7]">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-[#2E86C1] mb-2 text-center">
          Doctor Login
        </h2>
        <div className="h-1 w-12 bg-[#27AE60] mx-auto mb-6 rounded"></div>

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
          className="w-full bg-[#2E86C1] hover:bg-[#1B4F72] text-white py-3 rounded-lg font-semibold transition"
        >
          Login
        </button>

        <button
          type="button"
          onClick={googleAuth}
          className="w-full bg-white border text-gray-700 py-3 rounded-lg mt-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
        >
          <FcGoogle className="w-5 h-5" />
          Login with Google
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          New here?{" "}
          <Link to="/register" className="text-[#27AE60] font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;

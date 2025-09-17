import { useState } from "react";
import { login, googleAuth } from "../../services/auth";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="flex h-screen items-center justify-center bg-[#F4F6F7]">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-[#2E86C1] mb-6 text-center">
          Doctor Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-[#2E86C1] text-white py-3 rounded-lg font-semibold"
        >
          Login
        </button>

        <button
          type="button"
          onClick={googleAuth}
          className="w-full bg-red-500 text-white py-3 rounded-lg mt-3"
        >
          Login with Google
        </button>

        <p className="mt-4 text-sm text-center">
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

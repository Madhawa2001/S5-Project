import axios from "axios";

const API_URL = "http://localhost:5000/auth"; // update to your backend

export const login = async (email, password) => {
  const { data } = await axios.post(`${API_URL}/login`, { email, password });
  localStorage.setItem("token", data.accessToken);
  return data;
};

export const register = async (name, email, password) => {
  console.log("Sending registration data:", { name, email, password }); // Debug log

  try {
    const { data } = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
    });
    return data;
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error;
  }
};

export const googleAuth = () => {
  window.location.href = `${API_URL}/google`;
};

export const logout = () => {
  localStorage.removeItem("token");
};

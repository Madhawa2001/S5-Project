import axios from "axios";

const API_URL = "http://localhost:5000/api/patients";

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const fetchPatients = async () => {
  const { data } = await axios.get(API_URL, getAuthHeaders());
  return data;
};

export const addPatient = async (patient) => {
  const { data } = await axios.post(API_URL, patient, getAuthHeaders());
  return data;
};

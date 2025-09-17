import axios from "axios";

const API_URL = "http://localhost:5000/patients"; // match your backend route

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Fetch all patients
export const fetchPatients = async () => {
  const { data } = await axios.get(API_URL, getAuthHeaders());
  return data;
};

// Add a new patient
export const addPatient = async (patient) => {
  const { data } = await axios.post(API_URL, patient, getAuthHeaders());
  return data;
};

// Add blood metals for a patient
export const addBloodMetals = async (patientId, metals) => {
  const { data } = await axios.post(
    `${API_URL}/${patientId}`,
    metals,
    getAuthHeaders()
  );
  return data;
};

// Fetch blood metals reports for a patient
export const fetchBloodMetals = async (patientId) => {
  const { data } = await axios.get(`${API_URL}/${patientId}`, getAuthHeaders());
  return data;
};

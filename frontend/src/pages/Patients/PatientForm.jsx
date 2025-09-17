import { useState } from "react";
import { addPatient } from "../../services/patients";

const PatientForm = ({ onAdded }) => {
  const [form, setForm] = useState({
    name: "",
    ageYears: "",
    gender: "Female",
    pregnancyCount: 0,
    pregnancyStatus: "",
    diagnosis: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addPatient(form);
    onAdded();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
        Add New Patient
      </h3>

      <input
        type="text"
        name="name"
        placeholder="Patient Name"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      />

      <input
        type="number"
        name="ageYears"
        placeholder="Age (Years)"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      />

      <select
        name="gender"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      >
        <option>Female</option>
        <option>Male</option>
      </select>

      <input
        type="number"
        name="pregnancyCount"
        placeholder="Pregnancies"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      />

      <input
        type="text"
        name="pregnancyStatus"
        placeholder="Pregnancy Status"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      />

      <input
        type="text"
        name="diagnosis"
        placeholder="Diagnosis"
        className="w-full p-3 mb-3 border rounded-lg"
        onChange={handleChange}
      />

      <button
        type="submit"
        className="bg-[#27AE60] text-white px-6 py-2 rounded-lg"
      >
        Save
      </button>
    </form>
  );
};

export default PatientForm;

import { useState } from "react";
import { addPatient, addBloodMetals } from "../../services/patients";

const PatientForm = ({ onAdded }) => {
  // Patient info state
  const [patient, setPatient] = useState({
    name: "",
    ageYears: "",
    gender: "Female",
    pregnancyCount: 0,
    pregnancyStatus: "",
    diagnosis: "",
  });

  // Blood metals state
  const [metals, setMetals] = useState({
    lead_umolL: "",
    mercury_umolL: "",
    cadmium_umolL: "",
    selenium_umolL: "",
    manganese_umolL: "",
  });

  const handlePatientChange = (e) => {
    setPatient({ ...patient, [e.target.name]: e.target.value });
  };

  const handleMetalsChange = (e) => {
    setMetals({ ...metals, [e.target.name]: e.target.value });
  };

  // Submit patient info
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    const savedPatient = await addPatient(patient);
    onAdded(savedPatient); // return new patient to parent
  };

  // Submit blood metals
  const handleMetalsSubmit = async (e) => {
    e.preventDefault();
    if (!patient.id) {
      alert("Save patient info first!");
      return;
    }
    await addBloodMetals(patient.id, metals);
    alert("Blood metals saved!");
    setMetals({
      lead_umolL: "",
      mercury_umolL: "",
      cadmium_umolL: "",
      selenium_umolL: "",
      manganese_umolL: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* ---------------- Patient Info Form ---------------- */}
      <form
        onSubmit={handlePatientSubmit}
        className="bg-white rounded-2xl shadow p-6"
      >
        <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
          Add New Patient
        </h3>

        <input
          type="text"
          name="name"
          placeholder="Patient Name"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.name}
        />

        <input
          type="number"
          name="ageYears"
          placeholder="Age (Years)"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.ageYears}
        />

        <select
          name="gender"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.gender}
        >
          <option>Female</option>
          <option>Male</option>
        </select>

        <input
          type="number"
          name="pregnancyCount"
          placeholder="Pregnancies"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.pregnancyCount}
        />

        <input
          type="text"
          name="pregnancyStatus"
          placeholder="Pregnancy Status"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.pregnancyStatus}
        />

        <input
          type="text"
          name="diagnosis"
          placeholder="Diagnosis"
          className="w-full p-3 mb-3 border rounded-lg"
          onChange={handlePatientChange}
          value={patient.diagnosis}
        />

        <button
          type="submit"
          className="bg-[#2E86C1] text-white px-6 py-2 rounded-lg"
        >
          Save Patient
        </button>
      </form>

      {/* ---------------- Blood Metals Form ---------------- */}
      <form
        onSubmit={handleMetalsSubmit}
        className="bg-white rounded-2xl shadow p-6"
      >
        <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
          Add Blood Metals Report
        </h3>

        {[
          "lead_umolL",
          "mercury_umolL",
          "cadmium_umolL",
          "selenium_umolL",
          "manganese_umolL",
        ].map((metal) => (
          <input
            key={metal}
            type="number"
            step="0.01"
            name={metal}
            placeholder={
              metal.replace("_umolL", "").toUpperCase() + " (µmol/L)"
            }
            className="w-full p-3 mb-3 border rounded-lg"
            onChange={handleMetalsChange}
            value={metals[metal]}
          />
        ))}

        <button
          type="submit"
          className="bg-[#27AE60] text-white px-6 py-2 rounded-lg"
        >
          Save Blood Metals
        </button>
      </form>
    </div>
  );
};

export default PatientForm;

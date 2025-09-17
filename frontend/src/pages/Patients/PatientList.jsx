import { useEffect, useState } from "react";
import { fetchPatients } from "../../services/patients";
import PatientForm from "./PatientForm";

const PatientList = () => {
  const [patients, setPatients] = useState([]);

  const loadPatients = async () => {
    const data = await fetchPatients();
    setPatients(data);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div>
      <PatientForm onAdded={loadPatients} />
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
          Patients List
        </h3>
        <ul className="space-y-2">
          {patients.map((p) => (
            <li key={p.id} className="border-b py-2">
              {p.name} — {p.ageYears} yrs — {p.gender}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PatientList;

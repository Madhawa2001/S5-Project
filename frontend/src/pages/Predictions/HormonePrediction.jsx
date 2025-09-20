import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/predict/";

const HormonePrediction = () => {
  const [form, setForm] = useState({
    pregnancyStatus: "",
    ageMonths: "",
    pregnancyCount: "",
    gender: "",
    selenium_umolL: "",
    mercury_umolL: "",
    cadmium_umolL: "",
    lead_umolL: "",
    manganese_umolL: "",
    RHQ200: "",
    RHQ031: "",
    is_menopausal: "",
    BMXBMI: "",
    BMDSADCM: "",
  });

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPredictions(null);

    try {
      const { data } = await axios.post(`${API_URL}/from-features`, {
        ...form,
        pregnancyStatus: form.pregnancyStatus === "yes",
      });
      setPredictions(data.predictions);
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Prediction failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-[#2E86C1] mb-6">
        🔬 Hormone Prediction
      </h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="1">Male</option>
            <option value="2">Female</option>
          </select>
        </div>

        {/* Age in Months */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Age (months)
          </label>
          <input
            type="number"
            name="ageMonths"
            value={form.ageMonths}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          />
        </div>

        {/* Pregnancy Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pregnant?
          </label>
          <select
            name="pregnancyStatus"
            value={form.pregnancyStatus}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Pregnancy Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pregnancy Count
          </label>
          <input
            type="number"
            name="pregnancyCount"
            value={form.pregnancyCount}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          />
        </div>

        {/* BMI */}
        <div>
          <label className="block text-sm font-medium text-gray-700">BMI</label>
          <input
            type="number"
            step="0.1"
            name="BMXBMI"
            value={form.BMXBMI}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          />
        </div>

        {/* Abdomen Diameter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Abdomen Diameter
          </label>
          <input
            type="number"
            step="0.1"
            name="BMDSADCM"
            value={form.BMDSADCM}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          />
        </div>

        {/* Metals */}
        {[
          "selenium_umolL",
          "mercury_umolL",
          "cadmium_umolL",
          "lead_umolL",
          "manganese_umolL",
        ].map((metal) => (
          <div key={metal}>
            <label className="block text-sm font-medium text-gray-700">
              {metal.replace("_umolL", "").toUpperCase()} (µmol/L)
            </label>
            <input
              type="number"
              step="0.01"
              name={metal}
              value={form[metal]}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-lg p-2"
            />
          </div>
        ))}

        {/* Menopausal */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Menopausal?
          </label>
          <select
            name="is_menopausal"
            value={form.is_menopausal}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Breastfeeding */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Breastfeeding?
          </label>
          <select
            name="RHQ200"
            value={form.RHQ200}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Regular Periods */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regular Periods?
          </label>
          <select
            name="RHQ031"
            value={form.RHQ031}
            onChange={handleChange}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Submit */}
        <div className="col-span-2 flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-[#27AE60] text-white font-semibold shadow hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Get Predictions"}
          </button>
        </div>
      </form>

      {/* Predictions Result */}
      {predictions && (
        <div className="mt-6 p-4 bg-[#F4F6F7] rounded-xl">
          <h4 className="text-lg font-bold text-[#2C3E50] mb-2">Results:</h4>
          <ul className="space-y-1">
            <li>
              Testosterone:{" "}
              <span className="font-semibold">
                {predictions.testosterone.toFixed(2)}
              </span>
            </li>
            <li>
              Estradiol:{" "}
              <span className="font-semibold">
                {predictions.estradiol.toFixed(2)}
              </span>
            </li>
            <li>
              SHBG:{" "}
              <span className="font-semibold">
                {predictions.shbg.toFixed(2)}
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HormonePrediction;

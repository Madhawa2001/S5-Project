import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-[#2E86C1] text-white h-screen p-6">
      <h2 className="text-2xl font-bold mb-8">MedInsight</h2>
      <nav className="space-y-4">
        <Link to="/dashboard" className="block hover:text-[#F39C12]">
          Dashboard
        </Link>
        <Link to="/patients" className="block hover:text-[#F39C12]">
          Patients
        </Link>
        <Link to="/predictions/hormone" className="block hover:text-[#F39C12]">
          Hormone Prediction
        </Link>
        <Link
          to="/predictions/infertility"
          className="block hover:text-[#F39C12]"
        >
          Infertility Prediction
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;

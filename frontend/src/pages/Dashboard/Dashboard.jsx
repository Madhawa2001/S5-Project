const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-[#2C3E50]">Total Patients</h3>
        <p className="text-3xl font-bold text-[#2E86C1] mt-2">42</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-[#2C3E50]">Predictions</h3>
        <p className="text-3xl font-bold text-[#27AE60] mt-2">18</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-[#2C3E50]">Alerts</h3>
        <p className="text-3xl font-bold text-[#F39C12] mt-2">3</p>
      </div>
    </div>
  );
};

export default Dashboard;

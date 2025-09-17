const Navbar = () => {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-[#2E86C1]">Doctor Dashboard</h1>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="bg-[#F39C12] text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;

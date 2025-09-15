import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-100">
            <h1 className="text-4xl font-bold mb-4">Medical Prediction</h1>
            <p className="text-lg text-gray-700">
                Welcome! You are now logged in.
            </p>
            <button
                className="mt-6 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => navigate("/Patient-data")}
            >
                Go to Patient Data
            </button>
        </div>
    );
}

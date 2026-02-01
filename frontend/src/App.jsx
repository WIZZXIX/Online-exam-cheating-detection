import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Exam from "./pages/Exam";
import AdminDashboard from "./pages/AdminDashboard";
import AttemptDetails from "./pages/AttemptDetails";
import FaceVerify from "./pages/FaceVerify";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/face-verify" element={<FaceVerify />} />
      <Route path="/exam" element={<Exam />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/attempt/:id" element={<AttemptDetails />} />
    </Routes>
  );
}

export default App;

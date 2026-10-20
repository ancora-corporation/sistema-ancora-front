import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
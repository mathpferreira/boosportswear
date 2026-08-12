import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Loja from './pages/Loja';
import Admin from './pages/Admin';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loja />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Login initialMode="register" />} />
      </Routes>
    </BrowserRouter>
  );
}

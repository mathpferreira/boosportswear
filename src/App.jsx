import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Loja from './pages/Loja';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Institucional from './pages/Institucional';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loja />} />
        <Route path="/produto/:slugId" element={<Loja />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Login initialMode="register" />} />
        <Route path="/termos" element={<Institucional />} />
        <Route path="/privacidade" element={<Institucional />} />
        <Route path="/trocas-e-devolucoes" element={<Institucional />} />
        <Route path="/envios-e-prazos" element={<Institucional />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loja from './pages/Loja';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota principal: A vitrine da loja */}
        <Route path="/" element={<Loja />} />
        
        {/* Rota oculta: O painel de gerenciamento */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loja from './pages/Loja';
import Admin from './pages/Admin';
import Login from './pages/Login'; // Tem que ser import Login, e não import Admin!

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loja />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* É ESTA LINHA AQUI QUE ESTAVA FALTANDO 👇 */}
        <Route path="/login" element={<Login />} /> 
      </Routes>
    </BrowserRouter>
  );
}
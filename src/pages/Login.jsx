import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { API_URL } from '../config/api';

export default function Login({ initialMode = 'login' }) {
  const [modoCadastro, setModoCadastro] = useState(initialMode === 'register');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setModoCadastro(initialMode === 'register');
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (modoCadastro) {
      const palavrasNome = formData.nome.trim().split(/\s+/);
      if (palavrasNome.length < 2) {
        setErro('Por favor, insira seu nome e sobrenome completos.');
        setCarregando(false);
        return;
      }
      if (!aceitouTermos) {
        setErro('Você precisa aceitar os Termos e Condições da Boo Sportwear.');
        setCarregando(false);
        return;
      }
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(formData.email)) {
      setErro('Por favor, digite um endereço de e-mail válido.');
      setCarregando(false);
      return;
    }

    if (formData.senha.length < 6) {
      setErro('Sua senha deve ter no mínimo 6 caracteres.');
      setCarregando(false);
      return;
    }

    const endpoint = modoCadastro ? `${API_URL}/auth/cadastro` : `${API_URL}/auth/login`;

    try {
      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.message || 'Erro ao processar requisição.');
      }

      localStorage.setItem('@BOO:token', dados.token);
      localStorage.setItem('@BOO:usuario', JSON.stringify(dados.usuario));
      localStorage.setItem('token', dados.token);
      localStorage.setItem('usuario', JSON.stringify(dados.usuario));

      if (dados.usuario.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans antialiased text-zinc-900">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <AuthCard
          isRegister={modoCadastro}
          onToggleMode={() => {
            const proximoModoCadastro = !modoCadastro;
            setModoCadastro(proximoModoCadastro);
            setErro('');
            navigate(proximoModoCadastro ? '/registro' : '/login');
          }}
          onSubmit={handleSubmit}
          loading={carregando}
          error={erro}
          name={formData.nome}
          email={formData.email}
          password={formData.senha}
          onNameChange={(valor) => setFormData(prev => ({ ...prev, nome: valor }))}
          onEmailChange={(valor) => setFormData(prev => ({ ...prev, email: valor }))}
          onPasswordChange={(valor) => setFormData(prev => ({ ...prev, senha: valor }))}
          termsAccepted={aceitouTermos}
          onTermsChange={setAceitouTermos}
          pageMode
        />
      </div>
    </div>
  );
}

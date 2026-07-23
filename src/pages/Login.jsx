import { useState } from 'react';

export default function Login() {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // URL Base do Backend na VPS
  const API_URL = "http://167.148.161.90/api";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // ==========================================
    // 🛡️ BLINDAGEM E VALIDAÇÕES DO FORMULÁRIO
    // ==========================================
    if (modoCadastro) {
      // 1. Valida se tem Nome e Sobrenome (mínimo 2 palavras)
      const palavrasNome = formData.nome.trim().split(/\s+/);
      if (palavrasNome.length < 2) {
        setErro('Por favor, insira seu nome e sobrenome completos.');
        setCarregando(false);
        return; // Para a execução aqui
      }
    }

    // 2. Validação forte de E-mail (Regex)
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(formData.email)) {
      setErro('Por favor, digite um endereço de e-mail válido.');
      setCarregando(false);
      return;
    }

    // 3. Tamanho mínimo da Senha
    if (formData.senha.length < 6) {
      setErro('Sua senha deve ter no mínimo 6 caracteres.');
      setCarregando(false);
      return;
    }
    // ==========================================

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

      // Salva o Token e os Dados do Usuário na sessão
      localStorage.setItem('@BOO:token', dados.token);
      localStorage.setItem('@BOO:usuario', JSON.stringify(dados.usuario));

      // Se for ADMIN, vai para o painel. Se for CLIENTE, vai para a loja.
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
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-black tracking-[0.3em] uppercase">BOO</h1>
        <h2 className="mt-4 text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">
          {modoCadastro ? 'Criar Nova Conta' : 'Acesse Sua Conta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-zinc-50 py-8 px-6 shadow-sm rounded-lg border border-zinc-200/80 sm:px-10">
          {erro && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs py-3 px-4 rounded uppercase font-bold tracking-wider">
              {erro}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {modoCadastro && (
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full border border-zinc-300 rounded px-4 py-3 text-xs bg-white focus:outline-none focus:border-black"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-zinc-300 rounded px-4 py-3 text-xs bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2">
                Senha
              </label>
              <input
                type="password"
                name="senha"
                required
                value={formData.senha}
                onChange={handleChange}
                className="w-full border border-zinc-300 rounded px-4 py-3 text-xs bg-white focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Aguarde...' : modoCadastro ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-200 pt-6">
            <button
              onClick={() => {
                setModoCadastro(!modoCadastro);
                setErro('');
              }}
              className="text-xs text-zinc-500 hover:text-black font-semibold uppercase tracking-wider cursor-pointer"
            >
              {modoCadastro ? 'Já possui conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
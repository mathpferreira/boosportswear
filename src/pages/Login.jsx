import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import {
  API_URL,
  apiFetch,
  encerrarSessao,
  limparTokensLegados,
  salvarUsuario,
} from '../config/api';

export default function Login({ initialMode = 'login' }) {
  const [modoCadastro, setModoCadastro] = useState(initialMode === 'register');
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (modoCadastro) {
        if (formData.nome.trim().split(/\s+/).length < 2) {
          throw new Error('Insira seu nome e sobrenome completos.');
        }
        if (!aceitouTermos) {
          throw new Error('Você precisa aceitar as Políticas da Loja.');
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/.test(formData.senha)) {
          throw new Error(
            'Use ao menos 10 caracteres, com letra maiúscula, minúscula e número.',
          );
        }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Digite um endereço de e-mail válido.');
      }
      if (!formData.senha) throw new Error('Informe sua senha.');

      const endpoint = modoCadastro
        ? API_URL + '/auth/cadastro'
        : API_URL + '/auth/login';
      let versaoTermos = '';
      if (modoCadastro) {
        const configuracao = await apiFetch(`${API_URL}/configuracoes`, {}, false);
        const dadosConfiguracao = await configuracao.json().catch(() => ({}));
        if (!configuracao.ok || !dadosConfiguracao.termsVersion) {
          throw new Error('Não foi possível confirmar a versão das políticas. Tente novamente.');
        }
        versaoTermos = dadosConfiguracao.termsVersion;
      }
      const resposta = await apiFetch(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            modoCadastro
              ? {
                  ...formData,
                  aceitouTermos,
                  versaoTermos,
                  aceitouMarketing: false,
                }
              : formData,
          ),
        },
        false,
      );
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        const mensagem = Array.isArray(dados.message)
          ? dados.message[0]
          : dados.message;
        throw new Error(mensagem || 'Não foi possível entrar.');
      }
      if (!dados.usuario?.role) {
        throw new Error('A API retornou uma sessão incompleta. Tente novamente em instantes.');
      }

      limparTokensLegados();
      const sessao = await apiFetch(`${API_URL}/auth/me`, {}, false);
      const dadosSessao = await sessao.json().catch(() => ({}));
      if (!sessao.ok || !dadosSessao.usuario?.role) {
        await encerrarSessao();
        throw new Error(
          'O login foi aceito, mas não foi possível criar uma sessão segura. Tente novamente em instantes.',
        );
      }

      salvarUsuario(dadosSessao.usuario);
      navigate(dadosSessao.usuario.role === 'ADMIN' ? '/admin' : '/', {
        replace: true,
      });
    } catch (error) {
      setErro(error.message);
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
            const cadastro = !modoCadastro;
            setModoCadastro(cadastro);
            setErro('');
            navigate(cadastro ? '/registro' : '/login');
          }}
          onSubmit={handleSubmit}
          loading={carregando}
          error={erro}
          name={formData.nome}
          email={formData.email}
          password={formData.senha}
          onNameChange={(valor) =>
            setFormData((anterior) => ({ ...anterior, nome: valor }))
          }
          onEmailChange={(valor) =>
            setFormData((anterior) => ({ ...anterior, email: valor }))
          }
          onPasswordChange={(valor) =>
            setFormData((anterior) => ({ ...anterior, senha: valor }))
          }
          termsAccepted={aceitouTermos}
          onTermsChange={setAceitouTermos}
          pageMode
        />
      </div>
    </div>
  );
}

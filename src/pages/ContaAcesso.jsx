import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL, apiFetch } from '../config/api';

const inputClasses = 'w-full border border-zinc-300 rounded px-4 py-3 text-sm focus:outline-none focus:border-black';

export default function ContaAcesso({ modo }) {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const iniciouVerificacao = useRef(false);
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [carregando, setCarregando] = useState(modo === 'verificar');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (modo !== 'verificar' || iniciouVerificacao.current) return;
    iniciouVerificacao.current = true;
    const verificar = async () => {
      if (!token) {
        setErro('O link de verificação está incompleto. Solicite um novo link na sua conta.');
        setCarregando(false);
        return;
      }
      try {
        const resposta = await apiFetch(`${API_URL}/auth/verificar-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }, false);
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.message || 'Este link não pôde ser validado.');
        setMensagem('E-mail confirmado. Sua conta está pronta para comprar.');
        setConcluido(true);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    };
    void verificar();
  }, [modo, token]);

  const enviar = async (event) => {
    event.preventDefault();
    setErro('');
    setMensagem('');
    setCarregando(true);
    try {
      if (modo === 'recuperar') {
        const resposta = await apiFetch(`${API_URL}/auth/esqueci-senha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }, false);
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.message || 'Não foi possível solicitar a recuperação.');
        setMensagem('Se o e-mail estiver cadastrado, enviaremos um link válido por 30 minutos.');
        setConcluido(true);
        return;
      }

      if (!token) throw new Error('O link de recuperação está incompleto.');
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/.test(novaSenha)) {
        throw new Error('Use ao menos 10 caracteres, com letra maiúscula, minúscula e número.');
      }
      if (novaSenha !== confirmacaoSenha) throw new Error('As senhas não coincidem.');
      const resposta = await apiFetch(`${API_URL}/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      }, false);
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.message || 'Não foi possível redefinir a senha.');
      setMensagem('Senha redefinida. Todas as sessões anteriores foram encerradas.');
      setConcluido(true);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const titulo = modo === 'verificar'
    ? 'Verificação de e-mail'
    : modo === 'recuperar'
      ? 'Recuperar senha'
      : 'Criar nova senha';

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-zinc-900 flex items-center justify-center">
      <section className="w-full max-w-md">
        <Link to="/" className="block text-center text-3xl font-black tracking-[0.28em]">BOO</Link>
        <div className="mt-10 border-t border-zinc-200 pt-8">
          <h1 className="text-2xl font-black uppercase tracking-tight">{titulo}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {modo === 'verificar'
              ? 'Estamos validando o endereço usado no seu cadastro.'
              : modo === 'recuperar'
                ? 'Informe o e-mail da conta para receber um link seguro.'
                : 'Escolha uma senha forte que você ainda não utilizou.'}
          </p>

          {erro && <p role="alert" className="mt-6 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
          {mensagem && <p className="mt-6 bg-zinc-100 px-4 py-3 text-sm text-zinc-800">{mensagem}</p>}

          {modo !== 'verificar' && !concluido && (
            <form onSubmit={enviar} className="mt-7 space-y-4">
              {modo === 'recuperar' ? (
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" className={inputClasses} />
              ) : (
                <>
                  <input type="password" autoComplete="new-password" required value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} placeholder="Nova senha" className={inputClasses} />
                  <input type="password" autoComplete="new-password" required value={confirmacaoSenha} onChange={(event) => setConfirmacaoSenha(event.target.value)} placeholder="Repita a nova senha" className={inputClasses} />
                </>
              )}
              <button disabled={carregando} className="w-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">
                {carregando ? 'Aguarde...' : modo === 'recuperar' ? 'Enviar link seguro' : 'Redefinir senha'}
              </button>
            </form>
          )}

          {modo === 'verificar' && carregando && <p className="mt-6 text-sm text-zinc-500">Validando link...</p>}
          <Link to="/login" className="mt-8 block text-center text-xs font-bold uppercase tracking-widest underline underline-offset-4">
            {concluido ? 'Entrar na conta' : 'Voltar ao login'}
          </Link>
        </div>
      </section>
    </main>
  );
}

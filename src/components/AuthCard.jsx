import { FiX } from 'react-icons/fi';

export default function AuthCard({
  isRegister,
  onToggleMode,
  onSubmit,
  loading,
  error,
  name,
  email,
  password,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onClose,
  termsAccepted = false,
  onTermsChange,
  compact = false,
  pageMode = false,
}) {
  const inputClasses = "w-full border border-zinc-300 rounded px-4 py-3 text-xs bg-white focus:outline-none focus:border-black";
  const labelClasses = "block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2";

  return (
    <div className={`bg-white w-full ${pageMode ? 'max-w-md' : 'max-w-sm'} rounded-2xl shadow-2xl border border-zinc-200/80 ${compact ? 'p-6 sm:p-8' : 'p-8'} relative`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors"
        >
          <FiX className="text-xs" />
        </button>
      )}

      <div className="text-center mb-6">
        <h1 className="text-3xl font-black tracking-[0.3em] uppercase">BOO</h1>
        <h2 className="mt-4 text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">
          {isRegister ? 'Criar Nova Conta' : 'Acesse Sua Conta'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs py-3 px-4 rounded uppercase font-bold tracking-wider">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={onSubmit}>
        {isRegister && (
          <>
            <div>
              <label className={labelClasses}>Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className={inputClasses}
                placeholder="Maria Silva"
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => onTermsChange?.(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[11px] leading-5 text-zinc-600">
                Li e aceito as <a href="/politicas" target="_blank" rel="noreferrer" className="font-bold underline">Politicas da Loja</a> Boo Sportwear.
              </span>
            </label>
          </>
        )}

        <div>
          <label className={labelClasses}>E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={inputClasses}
          />
          {!isRegister && (
            <a href="/esqueci-senha" className="mt-2 block text-right text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-black">
              Esqueci minha senha
            </a>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-zinc-200 pt-6">
        <button
          onClick={onToggleMode}
          className="text-xs text-zinc-500 hover:text-black font-semibold uppercase tracking-wider cursor-pointer"
        >
          {isRegister ? 'Já possui conta? Faça Login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

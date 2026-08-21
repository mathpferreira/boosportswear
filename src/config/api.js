const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredApiUrl || '/api').replace(/\/$/, '');

let refreshEmAndamento = null;

export function limparTokensLegados() {
  ['token', '@BOO:token'].forEach((chave) => localStorage.removeItem(chave));
}

export function salvarUsuario(usuario) {
  if (!usuario) {
    ['usuario', '@BOO:usuario'].forEach((chave) => localStorage.removeItem(chave));
    return;
  }
  const valor = JSON.stringify(usuario);
  localStorage.setItem('usuario', valor);
  localStorage.setItem('@BOO:usuario', valor);
}

export function obterUsuarioSalvo() {
  const valor =
    localStorage.getItem('@BOO:usuario') || localStorage.getItem('usuario');
  if (!valor) return null;
  try {
    return JSON.parse(valor);
  } catch {
    salvarUsuario(null);
    return null;
  }
}

async function renovarSessao() {
  if (!refreshEmAndamento) {
    refreshEmAndamento = fetch(API_URL + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (resposta) => {
        if (!resposta.ok) {
          if (resposta.status === 401) salvarUsuario(null);
          return null;
        }
        const dados = await resposta.json();
        salvarUsuario(dados.usuario);
        return dados.usuario;
      })
      .finally(() => {
        refreshEmAndamento = null;
      });
  }
  return refreshEmAndamento;
}

export async function apiFetch(url, opcoes = {}, tentarRenovar = true) {
  const headers = new Headers(opcoes.headers || {});
  const authorization = headers.get('Authorization');
  if (
    authorization &&
    /^Bearer\s+(null|undefined)?$/i.test(authorization.trim())
  ) {
    headers.delete('Authorization');
  }

  const resposta = await fetch(url, {
    ...opcoes,
    headers,
    credentials: 'include',
  });

  const rotaAuth = String(url).includes('/auth/');
  const podeRenovar = !rotaAuth || String(url).includes('/auth/me');
  if (resposta.status === 401 && tentarRenovar && podeRenovar) {
    const usuario = await renovarSessao();
    if (usuario) return apiFetch(url, opcoes, false);
  }
  return resposta;
}

export async function encerrarSessao() {
  await apiFetch(
    API_URL + '/auth/logout',
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    false,
  ).catch(() => undefined);
  limparTokensLegados();
  salvarUsuario(null);
}

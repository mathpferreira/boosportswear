import { useState, useEffect, useMemo } from 'react';
import {
  FiUser, FiSearch, FiShoppingBag, FiMenu, FiX,
  FiInstagram, FiMail
} from 'react-icons/fi';

import logo from "../assets/logo.png";

// COMPONENTE: Card do Produto
function CardProduto({ produto, onAbrir }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fotos = produto.imagens?.length > 0 ? produto.imagens : [{ url: produto.imgUrl }];

  useEffect(() => {
    let timer;
    if (isHovered && fotos.length > 1) {
      timer = setInterval(() => {
        setImgIndex((prev) => (prev + 1) % fotos.length);
      }, 1200);
    } else {
      setImgIndex(0);
    }
    return () => clearInterval(timer);
  }, [isHovered, fotos.length]);

  return (
    <div 
      className="group cursor-pointer flex flex-col justify-between h-full"
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => onAbrir(produto)} 
        className="aspect-[3/4] bg-zinc-100 rounded overflow-hidden mb-4 relative"
      >
        <img 
          src={fotos[imgIndex]?.url || produto.imgUrl} 
          alt={produto.nome} 
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
        />
      </div>

      <div className="space-y-1.5">
        {produto.categoria && (
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{produto.categoria}</p>
        )}
        <h4 onClick={() => onAbrir(produto)} className="text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:text-black">
          {produto.nome}
        </h4>
        <p className="text-xs font-bold text-zinc-900">
          R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL: Loja
export default function Loja() {
  const [produtosBrazilian, setProdutosBrazilian] = useState([]);
  
  // Controle de visão
  const [visaoAtual, setVisaoAtual] = useState('home'); 

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tamanhoEscolhido, setTamanhoEscolhido] = useState("M");
  const [indiceImagemModal, setIndiceImagemModal] = useState(0);
  
  const [carrinho, setCarrinho] = useState([]);
  const [etapaSacola, setEtapaSacola] = useState("carrinho");
  const [cep, setCep] = useState("");
  const [freteResultado, setFreteResultado] = useState(null);

  // Catálogo — filtro e busca
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [isBuscaAberta, setIsBuscaAberta] = useState(false);

  // Menu mobile e Menu do Usuário
  const [isMenuAberto, setIsMenuAberto] = useState(false);
  const [isUserMenuAberto, setIsUserMenuAberto] = useState(false); 

  // Login e Cadastro (Lógica Integrada do Login.jsx)
  const [isLoginAberto, setIsLoginAberto] = useState(false);
  const [isRegistro, setIsRegistro] = useState(false); 
  const [nomeRegistro, setNomeRegistro] = useState(""); 
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [erroLogin, setErroLogin] = useState(null);
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Checkout interno
  const [dadosEntrega, setDadosEntrega] = useState({
    nome: "", email: "", telefone: "", cep: "", rua: "", numero: "",
    complemento: "", bairro: "", cidade: "", estado: ""
  });
  const [formaPagamento, setFormaPagamento] = useState("cartao");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState(null);

  // Configurações da Loja
  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    instagramUrl: "https://instagram.com/boosportwear",
    emailSuporte: "contato@boosportswear.com.br",
    lojaAberta: true
  });

  const API_URL = "http://167.148.161.90/api";

  // 1. CARREGAR USUÁRIO SALVO (Mantém logado ao dar F5)
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      setUsuarioLogado(JSON.parse(usuarioSalvo));
    }
  }, []);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const resposta = await fetch(`${API_URL}/produtos`);
        if (resposta.ok) {
          const dados = await resposta.json();
          setProdutosBrazilian(dados);
        }
      } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
      }
    }
    carregarProdutos();
  }, []);

  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const resposta = await fetch(`${API_URL}/configuracoes`);
        if (resposta.ok) {
          const dados = await resposta.json();
          setConfigLoja(prev => ({ ...prev, ...dados }));
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
      }
    }
    carregarConfiguracoes();
  }, []);

  const categorias = useMemo(() => {
    return [...new Set(produtosBrazilian.map(p => p.categoria).filter(Boolean))];
  }, [produtosBrazilian]);

  const produtosFiltrados = useMemo(() => {
    return produtosBrazilian.filter(produto => {
      const passaCategoria = categoriaAtiva === "Todos" || produto.categoria === categoriaAtiva;
      const passaBusca = !termoBusca || produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
      return passaCategoria && passaBusca;
    });
  }, [produtosBrazilian, categoriaAtiva, termoBusca]);

  const produtosRelacionados = useMemo(() => {
    if (!produtoSelecionado) return [];
    return produtosBrazilian
      .filter(p => p.categoria === produtoSelecionado.categoria && p.id !== produtoSelecionado.id)
      .slice(0, 4);
  }, [produtoSelecionado, produtosBrazilian]);

  const abrirProduto = (produto) => {
    setProdutoSelecionado(produto);
    setTamanhoEscolhido("M");
    setIndiceImagemModal(0);
    setVisaoAtual('produto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const adicionarAoCarrinho = (produto, tamanho) => {
    if (!configLoja.lojaAberta) return;

    const item = {
      ...produto,
      tamanhoEscolhido: tamanho,
      cartId: `${produto.id}-${tamanho}`
    };

    setCarrinho(prev => {
      const existe = prev.find(i => i.cartId === item.cartId);
      if (existe) {
        return prev.map(i => i.cartId === item.cartId ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });

    setVisaoAtual('carrinho');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removerDoCarrinho = (cartId) => {
    setCarrinho(prev => prev.filter(item => item.cartId !== cartId));
  };

  const calcularFrete = () => {
    if (!cep || cep.length < 8) return;
    setFreteResultado({ valor: 19.90, prazo: "3 a 5 dias úteis" });
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalComFrete = totalCarrinho + (freteResultado?.valor || 0);

  const irParaEntrega = () => {
    if (usuarioLogado) {
      setDadosEntrega(prev => ({
        ...prev,
        nome: prev.nome || usuarioLogado.nome || "",
        email: prev.email || usuarioLogado.email || ""
      }));
    }
    setEtapaSacola("checkout");
  };

  const handleChangeEntrega = (campo) => (e) => {
    setDadosEntrega(prev => ({ ...prev, [campo]: e.target.value }));
  };

  const finalizarPedido = async (e) => {
    e.preventDefault();
    setEnviandoPedido(true);
    setErroPedido(null);
    try {
      const resposta = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: carrinho,
          entrega: dadosEntrega,
          formaPagamento,
          frete: freteResultado,
          total: totalComFrete,
          usuarioId: usuarioLogado?.id || null
        })
      });
      if (!resposta.ok) throw new Error("Falha ao processar pedido");
      const dados = await resposta.json();
      setNumeroPedido(dados.numeroPedido || dados.id || "—");
      setCarrinho([]);
      setEtapaSacola("confirmado");
    } catch (erro) {
      setErroPedido("Não foi possível concluir o pedido agora. Tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  };

  const reiniciarSacola = () => {
    setEtapaSacola("carrinho");
    setNumeroPedido(null);
    setVisaoAtual('home');
  };

  const logout = () => {
    setUsuarioLogado(null);
    setIsUserMenuAberto(false);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // ==========================================
  // LÓGICA DE AUTENTICAÇÃO IMPORTADA DO LOGIN.JSX
  // ==========================================
  const handleAuth = async (e) => {
    e.preventDefault();
    setCarregandoLogin(true);
    setErroLogin(null);

    // BLINDAGEM E VALIDAÇÕES DO FORMULÁRIO
    if (isRegistro) {
      const palavrasNome = nomeRegistro.trim().split(/\s+/);
      if (palavrasNome.length < 2) {
        setErroLogin('Por favor, insira seu nome e sobrenome completos.');
        setCarregandoLogin(false);
        return; // Para a execução aqui
      }
    }

    try {
      const endpoint = isRegistro ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
      const body = isRegistro 
        ? JSON.stringify({ nome: nomeRegistro, email: emailLogin, senha: senhaLogin })
        : JSON.stringify({ email: emailLogin, senha: senhaLogin });

      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.message || (isRegistro ? "Erro ao criar conta. Tente outro e-mail." : "Credenciais inválidas."));
      }
      
      // Salva no LocalStorage (igual ao Login.jsx)
      if (dados.token) {
        localStorage.setItem('token', dados.token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
      }

      setUsuarioLogado(dados.usuario || { email: emailLogin, nome: nomeRegistro });
      setIsLoginAberto(false);
      setEmailLogin("");
      setSenhaLogin("");
      setNomeRegistro("");
    } catch (erro) {
      setErroLogin(erro.message);
    } finally {
      setCarregandoLogin(false);
    }
  };

  const imagensModal = produtoSelecionado?.imagens?.length > 0 
    ? produtoSelecionado.imagens 
    : (produtoSelecionado ? [{ url: produtoSelecionado.imgUrl }] : []);

  const inputClasses = "w-full border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black transition-colors";
  const labelClasses = "text-[10px] font-bold tracking-widest uppercase text-zinc-400 block mb-1.5";

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex flex-col justify-between">
      
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUpFade { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>

      <div>
        <div className={`text-white text-[10px] tracking-[0.2em] py-2.5 px-4 text-center font-medium uppercase transition-colors ${configLoja.lojaAberta ? "bg-black" : "bg-zinc-700"}`}>
          {configLoja.lojaAberta ? configLoja.fraseTopo : "LOJA TEMPORARIAMENTE FECHADA PARA NOVOS PEDIDOS"}
        </div>

        {/* Header */}
        <header className="bg-white border-b border-zinc-100 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuAberto(v => !v)} className="md:hidden cursor-pointer hover:opacity-75 transition-opacity">
                {isMenuAberto ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
              </button>
              <img
                onClick={() => setVisaoAtual('home')}
                src={logo}
                alt="BOO Sportswear"
                className="h-10 w-auto cursor-pointer select-none"
              />
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden sm:flex items-center">
                {isBuscaAberta ? (
                  <input
                    autoFocus
                    type="text"
                    value={termoBusca}
                    onChange={(e) => {
                      setTermoBusca(e.target.value);
                      if (visaoAtual !== 'home') setVisaoAtual('home');
                      if (e.target.value.length > 0) document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    onBlur={() => { if (!termoBusca) setIsBuscaAberta(false); }}
                    placeholder="Buscar..."
                    className="border-b border-zinc-300 focus:border-black text-xs py-1 w-40 focus:outline-none transition-colors"
                  />
                ) : (
                  <button onClick={() => setIsBuscaAberta(true)} className="cursor-pointer hover:opacity-75 transition-opacity">
                    <FiSearch className="text-base" />
                  </button>
                )}
              </div>

              {/* Menu do Usuário Dropdown */}
              <div className="relative">
                <button
                  onClick={() => usuarioLogado ? setIsUserMenuAberto(!isUserMenuAberto) : setIsLoginAberto(true)}
                  className="cursor-pointer hover:opacity-75 transition-opacity flex items-center"
                >
                  {usuarioLogado ? (
                    <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                      {(usuarioLogado.nome || usuarioLogado.email || "?").charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <FiUser className="text-base" />
                  )}
                </button>

                {isUserMenuAberto && usuarioLogado && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuAberto(false)}></div>
                    <div className="absolute right-0 mt-4 w-56 bg-white border border-zinc-100 rounded-lg shadow-xl py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-zinc-50 mb-2">
                        <p className="text-xs font-bold text-zinc-900 truncate">{usuarioLogado.nome || 'Cliente'}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{usuarioLogado.email}</p>
                      </div>
                      <button onClick={() => setIsUserMenuAberto(false)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black uppercase tracking-wider transition-colors">Minha Conta</button>
                      <button onClick={() => setIsUserMenuAberto(false)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black uppercase tracking-wider transition-colors">Meus Pedidos</button>
                      <button 
                        onClick={logout} 
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 uppercase tracking-wider mt-1 border-t border-zinc-50 transition-colors"
                      >
                        Sair da Conta
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => { setVisaoAtual('carrinho'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="relative cursor-pointer hover:opacity-75 transition-opacity"
              >
                <FiShoppingBag className="text-base" />
                {carrinho.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-fadeIn">
                    {carrinho.reduce((a, b) => a + b.quantidade, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="transition-opacity duration-300 ease-in-out">
          {visaoAtual === 'home' && (
            <>
              <section className="relative h-[70vh] bg-zinc-900 flex items-center justify-center text-center text-white px-6">
                <div className="max-w-2xl space-y-4 animate-slideUpFade">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase">Performance & Estilo</h2>
                </div>
              </section>

              <main id="catalogo" className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex flex-col gap-6 mb-12 border-b border-zinc-100 pb-6">
                  <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Catálogo</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setCategoriaAtiva("Todos")} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === "Todos" ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>Todos</button>
                    {categorias.map((cat) => (
                      <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === cat ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400 text-xs tracking-widest uppercase animate-fadeIn">Nenhum produto encontrado.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {produtosFiltrados.map((produto) => (
                      <CardProduto key={produto.id} produto={produto} onAbrir={abrirProduto} />
                    ))}
                  </div>
                )}
              </main>
            </>
          )}

          {visaoAtual === 'produto' && produtoSelecionado && (
            <div className="max-w-7xl mx-auto px-6 py-12 animate-slideUpFade">
              <button onClick={() => setVisaoAtual('home')} className="mb-8 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-black flex items-center gap-2 transition-colors">← Voltar</button>

              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2 flex flex-col gap-4">
                  <div className="aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden border">
                    <img src={imagensModal[indiceImagemModal]?.url} alt={produtoSelecionado.nome} className="w-full h-full object-cover animate-fadeIn" />
                  </div>
                  {imagensModal.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {imagensModal.map((img, idx) => (
                        <button key={idx} onClick={() => setIndiceImagemModal(idx)} className={`w-20 aspect-[3/4] rounded border-2 overflow-hidden flex-shrink-0 transition-colors ${indiceImagemModal === idx ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:w-1/2 flex flex-col justify-center">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">{produtoSelecionado.categoria}</p>
                      <h3 className="text-3xl font-black uppercase tracking-wider">{produtoSelecionado.nome}</h3>
                      <p className="text-2xl font-bold text-zinc-900 mt-2">R$ {Number(produtoSelecionado.preco).toFixed(2).replace('.', ',')}</p>
                    </div>

                    <div>
                      <label className={labelClasses}>Tamanho</label>
                      <div className="flex gap-2">
                        {["PP", "P", "M", "G", "GG"].map(tam => (
                          <button key={tam} onClick={() => setTamanhoEscolhido(tam)} className={`w-12 h-12 border rounded text-sm font-bold cursor-pointer transition-colors ${tamanhoEscolhido === tam ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-400"}`}>{tam}</button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-b border-zinc-100 py-6 my-6">
                      <label className={labelClasses}>Calcular Frete</label>
                      <div className="flex gap-2 max-w-sm">
                        <input type="text" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} className={inputClasses} />
                        <button type="button" onClick={calcularFrete} className="bg-black text-white hover:bg-zinc-800 px-6 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-colors">OK</button>
                      </div>
                      {freteResultado && (
                        <p className="text-xs text-green-700 font-bold uppercase mt-3 bg-green-50 p-3 rounded animate-fadeIn">Frete: R$ {freteResultado.valor.toFixed(2).replace('.', ',')} ({freteResultado.prazo})</p>
                      )}
                    </div>
                  </div>

                  <button onClick={() => adicionarAoCarrinho(produtoSelecionado, tamanhoEscolhido)} disabled={!configLoja.lojaAberta} className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors mt-8 cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed">
                    {configLoja.lojaAberta ? "Adicionar à Sacola" : "Loja Fechada no Momento"}
                  </button>
                </div>
              </div>

              {produtosRelacionados.length > 0 && (
                <div className="mt-24 border-t border-zinc-100 pt-16">
                  <h3 className="text-xl font-black tracking-[0.2em] uppercase text-center mb-10">Produtos Relacionados</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {produtosRelacionados.map((item) => (
                      <CardProduto key={item.id} produto={item} onAbrir={abrirProduto} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {visaoAtual === 'carrinho' && (
            <div className="max-w-5xl mx-auto px-6 py-12 animate-slideUpFade">
              <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
                <h2 className="text-2xl font-black uppercase tracking-wider">{etapaSacola === "carrinho" ? "Sua Sacola" : etapaSacola === "checkout" ? "Finalizar Pedido" : "Sucesso!"}</h2>
                <button onClick={() => setVisaoAtual('home')} className="text-xs font-bold uppercase text-zinc-500 hover:text-black transition-colors">Continuar Comprando</button>
              </div>

              {numeroPedido ? (
                <div className="text-center py-20 bg-zinc-50 rounded-lg animate-fadeIn">
                  <h4 className="text-2xl font-black uppercase mb-4 text-green-700">Pedido nº {numeroPedido} Realizado!</h4>
                  <p className="text-sm text-zinc-500 mb-8">Acompanhe os detalhes pelo seu e-mail.</p>
                  <button onClick={reiniciarSacola} className="bg-black text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">Voltar para a Loja</button>
                </div>
              ) : carrinho.length === 0 ? (
                <div className="text-center py-32 text-zinc-400 animate-fadeIn">
                  <p className="text-sm uppercase tracking-widest mb-6">Sua sacola está vazia.</p>
                  <button onClick={() => setVisaoAtual('home')} className="border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">Ver Produtos</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    {etapaSacola === "carrinho" ? (
                      carrinho.map(item => (
                        <div key={item.cartId} className="flex gap-4 border border-zinc-100 p-4 rounded-lg items-center shadow-sm animate-fadeIn">
                          <img src={item.imgUrl} alt={item.nome} className="w-20 h-24 object-cover rounded bg-zinc-100" />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold uppercase">{item.nome}</h4>
                            <p className="text-xs text-zinc-500 uppercase mt-1">Tamanho: {item.tamanhoEscolhido}</p>
                            <p className="text-sm font-black mt-2">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
                          </div>
                          <button onClick={() => removerDoCarrinho(item.cartId)} className="text-xs text-red-500 font-bold uppercase hover:underline transition-all">Remover</button>
                        </div>
                      ))
                    ) : (
                      <form id="form-checkout" onSubmit={finalizarPedido} className="border border-zinc-100 p-6 rounded-lg shadow-sm space-y-4 animate-slideUpFade">
                        <h3 className="font-bold uppercase border-b pb-2 mb-4">Dados de Entrega</h3>
                        <div><label className={labelClasses}>Nome Completo</label><input required value={dadosEntrega.nome} onChange={handleChangeEntrega("nome")} className={inputClasses} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={labelClasses}>E-mail</label><input type="email" required value={dadosEntrega.email} onChange={handleChangeEntrega("email")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Telefone</label><input required value={dadosEntrega.telefone} onChange={handleChangeEntrega("telefone")} className={inputClasses} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2"><label className={labelClasses}>Rua / Endereço</label><input required value={dadosEntrega.rua} onChange={handleChangeEntrega("rua")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Número</label><input required value={dadosEntrega.numero} onChange={handleChangeEntrega("numero")} className={inputClasses} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className={labelClasses}>Bairro</label><input required value={dadosEntrega.bairro} onChange={handleChangeEntrega("bairro")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Cidade</label><input required value={dadosEntrega.cidade} onChange={handleChangeEntrega("cidade")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Estado (UF)</label><input required value={dadosEntrega.estado} onChange={handleChangeEntrega("estado")} className={inputClasses} /></div>
                        </div>
                        <h3 className="font-bold uppercase border-b pb-2 mt-8 mb-4">Pagamento</h3>
                        <div className="flex gap-2">
                          {[{ id: "cartao", label: "Cartão de Crédito" }, { id: "pix", label: "Pix" }].map(op => (
                            <button type="button" key={op.id} onClick={() => setFormaPagamento(op.id)} className={`flex-1 border rounded px-3 py-4 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${formaPagamento === op.id ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-700 hover:border-black"}`}>{op.label}</button>
                          ))}
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="border border-zinc-100 p-6 rounded-lg shadow-sm h-fit bg-zinc-50">
                    <h3 className="font-bold uppercase border-b border-zinc-200 pb-3 mb-4">Resumo do Pedido</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span></div>
                      {freteResultado && <div className="flex justify-between text-sm text-zinc-600"><span>Frete</span><span>R$ {freteResultado.valor.toFixed(2).replace('.', ',')}</span></div>}
                      <div className="flex justify-between text-lg font-black pt-3 border-t border-zinc-200"><span>Total</span><span>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span></div>
                    </div>
                    {erroPedido && <p className="text-[10px] text-red-500 font-bold uppercase mb-4 text-center">{erroPedido}</p>}
                    {etapaSacola === "carrinho" ? (
                      <button onClick={irParaEntrega} className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors">Ir para a Entrega</button>
                    ) : (
                      <div className="space-y-3">
                        <button type="submit" form="form-checkout" disabled={enviandoPedido} className="w-full bg-green-700 text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-green-800 transition-colors disabled:opacity-50">{enviandoPedido ? "Processando..." : "Confirmar Pedido"}</button>
                        <button type="button" onClick={() => setEtapaSacola("carrinho")} className="w-full text-xs font-bold text-zinc-500 uppercase hover:text-black transition-colors">Voltar à Sacola</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Login e Cadastro (Agora blindado igual ao Login.jsx) */}
      {isLoginAberto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && setIsLoginAberto(false)}
        >
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 relative animate-slideUpFade">
            <button onClick={() => setIsLoginAberto(false)} className="absolute top-4 right-4 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
              <FiX className="text-xs" />
            </button>
            
            <h3 className="text-sm font-bold tracking-widest uppercase mb-1">
              {isRegistro ? "Criar nova conta" : "Entrar"}
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">
              {isRegistro ? "Preencha seus dados abaixo" : "Bem-vindo de volta"}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistro && (
                <div className="animate-fadeIn">
                  <label className={labelClasses}>Nome Completo</label>
                  <input type="text" required value={nomeRegistro} onChange={(e) => setNomeRegistro(e.target.value)} className={inputClasses} placeholder="Maria Silva" />
                </div>
              )}
              <div>
                <label className={labelClasses}>E-mail</label>
                <input type="email" required value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Senha</label>
                <input type="password" required value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)} className={inputClasses} />
              </div>
              
              {erroLogin && <p className="text-[10px] text-red-500 font-bold uppercase bg-red-50 p-2 rounded">{erroLogin}</p>}
              
              <button type="submit" disabled={carregandoLogin} className="w-full bg-black text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 disabled:opacity-50 transition-colors mt-2">
                {carregandoLogin ? "Aguarde..." : (isRegistro ? "Cadastrar" : "Entrar")}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-zinc-100 pt-6">
              <p className="text-xs text-zinc-500">
                {isRegistro ? "Já tem uma conta?" : "Ainda não tem conta?"}
              </p>
              <button
                type="button"
                onClick={() => { setIsRegistro(!isRegistro); setErroLogin(null); setNomeRegistro(''); }}
                className="text-xs font-bold uppercase tracking-wider text-black mt-2 hover:underline transition-all"
              >
                {isRegistro ? "Fazer Login" : "Criar Conta"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black text-white py-16 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xl font-black tracking-[0.3em] uppercase">BOO</h4>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">ALTA QUALIDADE E ESTILO LUXUOSO</p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
              <a href={configLoja.instagramUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href={`mailto:${configLoja.emailSuporte}`} className="text-zinc-400 hover:text-white transition-colors" aria-label="E-mail">
                <FiMail />
              </a>
            </div>
          </div>
          <div className="text-center md:text-right text-xs text-zinc-400 tracking-wider">
            © BOO SPORTWEAR. TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}
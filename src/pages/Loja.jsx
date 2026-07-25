import { useState, useEffect, useMemo } from 'react';

export default function Loja() {
  const [produtosBrazilian, setProdutosBrazilian] = useState([]);
  const [corSelecionadaPorProduto, setCorSelecionadaPorProduto] = useState({});

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tamanhoEscolhido, setTamanhoEscolhido] = useState("M");
  const [carrinho, setCarrinho] = useState([]);
  const [isSacolaAberta, setIsSacolaAberta] = useState(false);
  const [etapaSacola, setEtapaSacola] = useState("carrinho"); // carrinho | checkout | confirmado
  const [cep, setCep] = useState("");
  const [freteResultado, setFreteResultado] = useState(null);

  // Catálogo — filtro e busca
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [isBuscaAberta, setIsBuscaAberta] = useState(false);

  // Menu mobile
  const [isMenuAberto, setIsMenuAberto] = useState(false);

  // Login
  const [isLoginAberto, setIsLoginAberto] = useState(false);
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

  // Configurações da Loja (controladas pelo /admin)
  const [fraseTopo, setFraseTopo] = useState("FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS");
  const [whatsappLoja, setWhatsappLoja] = useState("5511999999999");

  // URL Base do Backend na sua VPS Debian
  const API_URL = "http://167.148.161.90/api";

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

  // Puxa a frase do topo e o WhatsApp da loja direto do /admin
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const resposta = await fetch(`${API_URL}/configuracoes`);
        if (resposta.ok) {
          const dados = await resposta.json();
          if (dados.fraseTopo) setFraseTopo(dados.fraseTopo);
          if (dados.whatsappLoja) setWhatsappLoja(dados.whatsappLoja);
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
      }
    }
    carregarConfiguracoes();
  }, []);

  // Lista de categorias vinda dos próprios produtos cadastrados no /admin
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

  const selecionarCategoria = (cat) => {
    setCategoriaAtiva(cat);
    setIsMenuAberto(false);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const selecionarCor = (produtoId, cor) => {
    setCorSelecionadaPorProduto(prev => ({
      ...prev,
      [produtoId]: cor
    }));
  };

  const abrirModalProduto = (produto) => {
    setProdutoSelecionado(produto);
    setTamanhoEscolhido("M");
  };

  const adicionarAoCarrinho = (produto, tamanho, cor) => {
    const item = {
      ...produto,
      tamanhoEscolhido: tamanho,
      corEscolhida: cor || produto.cores[0],
      cartId: `${produto.id}-${tamanho}-${cor || produto.cores[0]}`
    };

    setCarrinho(prev => {
      const existe = prev.find(i => i.cartId === item.cartId);
      if (existe) {
        return prev.map(i => i.cartId === item.cartId ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });

    setProdutoSelecionado(null);
    setIsSacolaAberta(true);
  };

  const removerDoCarrinho = (cartId) => {
    setCarrinho(prev => prev.filter(item => item.cartId !== cartId));
  };

  const calcularFrete = (e) => {
    e.preventDefault();
    if (!cep || cep.length < 8) return;
    setFreteResultado({
      valor: 19.90,
      prazo: "3 a 5 dias úteis"
    });
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalComFrete = totalCarrinho + (freteResultado?.valor || 0);

  const fecharSacola = () => {
    setIsSacolaAberta(false);
    if (etapaSacola !== "confirmado") setEtapaSacola("carrinho");
  };

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
      console.error("Erro ao finalizar pedido:", erro);
      setErroPedido("Não foi possível concluir o pedido agora. Tente novamente em instantes.");
    } finally {
      setEnviandoPedido(false);
    }
  };

  const reiniciarSacola = () => {
    setEtapaSacola("carrinho");
    setNumeroPedido(null);
    setIsSacolaAberta(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregandoLogin(true);
    setErroLogin(null);
    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin })
      });
      if (!resposta.ok) throw new Error("Credenciais inválidas");
      const dados = await resposta.json();
      setUsuarioLogado(dados.usuario || { email: emailLogin });
      setIsLoginAberto(false);
      setEmailLogin("");
      setSenhaLogin("");
    } catch (erro) {
      setErroLogin("E-mail ou senha inválidos.");
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLogout = () => setUsuarioLogado(null);

  const inputClasses = "w-full border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black";
  const labelClasses = "text-[10px] font-bold tracking-widest uppercase text-zinc-400 block mb-1.5";

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      {/* Tarja do Topo — controlada pelo /admin */}
      <div className="bg-black text-white text-[10px] tracking-[0.2em] py-2.5 px-4 text-center font-medium uppercase">
        {fraseTopo}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuAberto(v => !v)}
              className="md:hidden text-lg leading-none cursor-pointer hover:opacity-75 transition-opacity"
              aria-label="Abrir menu"
            >
              {isMenuAberto ? "✕" : "☰"}
            </button>
            <h1 className="text-2xl font-black tracking-[0.3em] uppercase">BOO</h1>
          </div>

          {/* Navegação central — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => selecionarCategoria("Todos")}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${categoriaAtiva === "Todos" ? "text-black" : "text-zinc-400 hover:text-black"}`}
            >
              Novidades
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => selecionarCategoria(cat)}
                className={`text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${categoriaAtiva === cat ? "text-black" : "text-zinc-400 hover:text-black"}`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Ações à direita */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center">
              {isBuscaAberta ? (
                <input
                  autoFocus
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  onBlur={() => { if (!termoBusca) setIsBuscaAberta(false); }}
                  placeholder="Buscar produto..."
                  className="border-b border-zinc-300 focus:border-black text-xs py-1 w-40 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsBuscaAberta(true)}
                  className="text-sm cursor-pointer hover:opacity-75 transition-opacity"
                  aria-label="Buscar"
                >
                  ⌕
                </button>
              )}
            </div>

            <button
              onClick={() => usuarioLogado ? handleLogout() : setIsLoginAberto(true)}
              className="text-[11px] font-bold uppercase tracking-widest cursor-pointer hover:opacity-75 transition-opacity whitespace-nowrap"
            >
              {usuarioLogado ? `Olá, ${(usuarioLogado.nome || usuarioLogado.email || "").split(" ")[0]}` : "Entrar"}
            </button>

            <button
              onClick={() => setIsSacolaAberta(true)}
              className="relative cursor-pointer hover:opacity-75 transition-opacity"
            >
              <span className="text-xs tracking-widest font-bold uppercase">Sacola</span>
              {carrinho.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {carrinho.reduce((a, b) => a + b.quantidade, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navegação — mobile */}
        {isMenuAberto && (
          <div className="md:hidden border-t border-zinc-100 px-6 py-5 space-y-4">
            <button
              onClick={() => selecionarCategoria("Todos")}
              className={`block text-xs font-bold uppercase tracking-widest ${categoriaAtiva === "Todos" ? "text-black" : "text-zinc-400"}`}
            >
              Novidades
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => selecionarCategoria(cat)}
                className={`block text-xs font-bold uppercase tracking-widest ${categoriaAtiva === cat ? "text-black" : "text-zinc-400"}`}
              >
                {cat}
              </button>
            ))}
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black mt-2"
            />
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] bg-zinc-900 flex items-center justify-center text-center text-white px-6">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs tracking-[0.4em] uppercase text-zinc-400">Nova Coleção</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase">Performance & Estilo</h2>
          <p className="text-xs text-zinc-300 tracking-widest uppercase font-light">Peças desenhadas para alta performance e conforto absoluto.</p>
        </div>
      </section>

      {/* Catálogo de Produtos */}
      <main id="catalogo" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col gap-6 mb-12 border-b border-zinc-100 pb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Catálogo Oficial</h3>
            <span className="text-xs text-zinc-400">{produtosFiltrados.length} produtos disponíveis</span>
          </div>

          {/* Filtro de categorias */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoriaAtiva("Todos")}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === "Todos" ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === cat ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-xs tracking-widest uppercase">
            Nenhum produto encontrado{termoBusca ? ` para "${termoBusca}"` : ""}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {produtosFiltrados.map((produto) => {
              const corAtiva = corSelecionadaPorProduto[produto.id] || produto.cores?.[0];
              const imagemAtual = produto.imagens?.find(img => img.cor === corAtiva)?.url || produto.imagens?.[0]?.url || produto.imgUrl;

              return (
                <div key={produto.id} className="group cursor-pointer">
                  <div
                    onClick={() => abrirModalProduto(produto)}
                    className="aspect-3/4 bg-zinc-100 rounded overflow-hidden mb-4 relative"
                  >
                    <img
                      src={imagemAtual}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {produto.categoria && (
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{produto.categoria}</p>
                    )}
                    <h4 onClick={() => abrirModalProduto(produto)} className="text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:text-black">
                      {produto.nome}
                    </h4>
                    <p className="text-xs font-bold text-zinc-900">
                      R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                    </p>

                    {/* Seleção de Cores na Vitrine */}
                    {produto.cores && produto.cores.length > 0 && (
                      <div className="flex gap-1.5 pt-1">
                        {produto.cores.map((cor, i) => (
                          <button
                            key={i}
                            onClick={() => selecionarCor(produto.id, cor)}
                            style={{ backgroundColor: cor }}
                            className={`w-3.5 h-3.5 rounded-full border ${corAtiva === cor ? 'border-black scale-110' : 'border-zinc-300'} transition-all cursor-pointer`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Produto */}
      {produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button
              onClick={() => setProdutoSelecionado(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 cursor-pointer text-xs"
            >
              ✕
            </button>

            <div className="md:w-1/2 aspect-3/4 bg-zinc-100">
              <img
                src={produtoSelecionado.imagens?.[0]?.url || produtoSelecionado.imgUrl}
                alt={produtoSelecionado.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:w-1/2 p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  {produtoSelecionado.categoria && (
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">{produtoSelecionado.categoria}</p>
                  )}
                  <h3 className="text-lg font-bold uppercase tracking-wider">{produtoSelecionado.nome}</h3>
                  <p className="text-base font-black text-zinc-900 mt-1">
                    R$ {Number(produtoSelecionado.preco).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 block mb-2">Tamanho</label>
                  <div className="flex gap-2">
                    {["PP", "P", "M", "G", "GG"].map(tam => (
                      <button
                        key={tam}
                        onClick={() => setTamanhoEscolhido(tam)}
                        className={`w-10 h-10 border rounded text-xs font-bold cursor-pointer transition-colors ${
                          tamanhoEscolhido === tam ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        {tam}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => adicionarAoCarrinho(produtoSelecionado, tamanhoEscolhido, corSelecionadaPorProduto[produtoSelecionado.id])}
                className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors mt-8 cursor-pointer"
              >
                Adicionar à Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Login */}
      {isLoginAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 relative">
            <button
              onClick={() => setIsLoginAberto(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 cursor-pointer text-xs"
            >
              ✕
            </button>

            <h3 className="text-sm font-bold tracking-widest uppercase mb-6">Entrar na sua conta</h3>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClasses}>E-mail</label>
                <input
                  type="email"
                  required
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Senha</label>
                <input
                  type="password"
                  required
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className={inputClasses}
                />
              </div>

              {erroLogin && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">{erroLogin}</p>
              )}

              <button
                type="submit"
                disabled={carregandoLogin}
                className="w-full bg-black text-white py-3 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {carregandoLogin ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="text-[10px] text-zinc-400 text-center mt-5 uppercase tracking-wide">
              Ainda não tem conta?{" "}
              <button className="underline font-bold text-zinc-700 cursor-pointer">Cadastre-se</button>
            </p>
          </div>
        </div>
      )}

      {/* Drawer do Carrinho / Sacola / Checkout */}
      {isSacolaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-6 flex flex-col h-full overflow-y-auto">
              <div className="flex justify-between items-center pb-6 border-b border-zinc-100">
                <h3 className="text-sm font-bold tracking-widest uppercase">
                  {etapaSacola === "carrinho" && "Sua Sacola"}
                  {etapaSacola === "checkout" && "Dados de Entrega"}
                  {etapaSacola === "confirmado" && "Pedido Confirmado"}
                </h3>
                <button onClick={fecharSacola} className="text-xs text-zinc-400 hover:text-black cursor-pointer">✕ FECHAR</button>
              </div>

              {/* Etapa 1 — Carrinho */}
              {etapaSacola === "carrinho" && (
                <>
                  <div className="py-6 space-y-4">
                    {carrinho.length === 0 ? (
                      <p className="text-center text-xs text-zinc-400 uppercase py-10">Sua sacola está vazia.</p>
                    ) : (
                      carrinho.map(item => (
                        <div key={item.cartId} className="flex justify-between items-center border-b border-zinc-50 pb-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase">{item.nome}</h4>
                            <p className="text-[10px] text-zinc-400 uppercase">Tamanho: {item.tamanhoEscolhido} | Qtd: {item.quantidade}</p>
                            <p className="text-xs font-semibold mt-1">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                          </div>
                          <button onClick={() => removerDoCarrinho(item.cartId)} className="text-[10px] text-red-500 font-bold uppercase hover:underline cursor-pointer">
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {carrinho.length > 0 && (
                    <form onSubmit={calcularFrete} className="pt-4 border-t border-zinc-100">
                      <label className={labelClasses}>Simular Frete</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) => setCep(e.target.value)}
                          className="flex-1 border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                        />
                        <button type="submit" className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer">
                          OK
                        </button>
                      </div>
                      {freteResultado && (
                        <p className="text-[10px] text-green-600 font-bold uppercase mt-2">
                          Frete Fixo: R$ {freteResultado.valor.toFixed(2)} ({freteResultado.prazo})
                        </p>
                      )}
                    </form>
                  )}

                  {carrinho.length > 0 && (
                    <div className="mt-auto pt-6 border-t border-zinc-100 space-y-4 bg-zinc-50 p-4 rounded">
                      <div className="flex justify-between text-sm font-bold">
                        <span>Subtotal:</span>
                        <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <button
                        onClick={irParaEntrega}
                        className="w-full bg-black text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Continuar para Entrega
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Etapa 2 — Checkout */}
              {etapaSacola === "checkout" && (
                <form onSubmit={finalizarPedido} className="flex flex-col flex-1 py-6 space-y-4">
                  <div>
                    <label className={labelClasses}>Nome Completo</label>
                    <input required value={dadosEntrega.nome} onChange={handleChangeEntrega("nome")} className={inputClasses} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>E-mail</label>
                      <input type="email" required value={dadosEntrega.email} onChange={handleChangeEntrega("email")} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Telefone</label>
                      <input required value={dadosEntrega.telefone} onChange={handleChangeEntrega("telefone")} className={inputClasses} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClasses}>CEP</label>
                      <input required value={dadosEntrega.cep} onChange={handleChangeEntrega("cep")} className={inputClasses} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClasses}>Rua</label>
                      <input required value={dadosEntrega.rua} onChange={handleChangeEntrega("rua")} className={inputClasses} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClasses}>Número</label>
                      <input required value={dadosEntrega.numero} onChange={handleChangeEntrega("numero")} className={inputClasses} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClasses}>Complemento</label>
                      <input value={dadosEntrega.complemento} onChange={handleChangeEntrega("complemento")} className={inputClasses} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className={labelClasses}>Bairro</label>
                      <input required value={dadosEntrega.bairro} onChange={handleChangeEntrega("bairro")} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Estado</label>
                      <input required value={dadosEntrega.estado} onChange={handleChangeEntrega("estado")} className={inputClasses} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Cidade</label>
                    <input required value={dadosEntrega.cidade} onChange={handleChangeEntrega("cidade")} className={inputClasses} />
                  </div>

                  <div>
                    <label className={labelClasses}>Forma de Pagamento</label>
                    <div className="flex gap-2">
                      {[{ id: "cartao", label: "Cartão" }, { id: "pix", label: "Pix" }].map(op => (
                        <button
                          type="button"
                          key={op.id}
                          onClick={() => setFormaPagamento(op.id)}
                          className={`flex-1 border rounded px-3 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                            formaPagamento === op.id ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {erroPedido && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">{erroPedido}</p>
                  )}

                  <div className="mt-auto pt-6 border-t border-zinc-100 space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total:</span>
                      <span>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={enviandoPedido}
                      className="w-full bg-black text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {enviandoPedido ? "Processando..." : "Confirmar Pedido"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEtapaSacola("carrinho")}
                      className="w-full text-[10px] text-zinc-400 uppercase tracking-widest hover:text-black cursor-pointer"
                    >
                      Voltar à Sacola
                    </button>
                  </div>
                </form>
              )}

              {/* Etapa 3 — Confirmação */}
              {etapaSacola === "confirmado" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                  <p className="text-xs uppercase tracking-widest text-zinc-400">Pedido nº {numeroPedido}</p>
                  <h4 className="text-lg font-black uppercase">Obrigado pela compra!</h4>
                  <p className="text-xs text-zinc-500 max-w-xs">Você receberá a confirmação e os detalhes de rastreio por e-mail em instantes.</p>
                  <button
                    onClick={reiniciarSacola}
                    className="text-xs font-bold uppercase tracking-widest underline cursor-pointer mt-4"
                  >
                    Continuar Comprando
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black text-white py-16 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black tracking-[0.3em] uppercase">BOO</h4>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">ALTA QUALIDADE E ESTILO LUXUOSO</p>
            <a
              href={`https://wa.me/${whatsappLoja}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[10px] text-zinc-500 tracking-widest uppercase hover:text-white transition-colors mt-2"
            >
              Dúvidas? Fale conosco
            </a>
          </div>
          <div className="text-center md:text-right text-xs text-zinc-400 tracking-wider">
            © BOO SPORTWEAR. TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}
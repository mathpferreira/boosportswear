import { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiSettings, 
  FiLogOut, 
  FiPlus, 
  FiCheckCircle, 
  FiSearch,
  FiAlertTriangle,
  FiLayers
} from 'react-icons/fi';

export default function Admin() {
  const [isVerificando, setIsVerificando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novaCorHex, setNovaCorHex] = useState("#000000");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  // Busca e Filtros da Tabela
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  // Abas: 'produtos' ou 'configuracoes'
  const [abaAtiva, setAbaAtiva] = useState('produtos');

  // Configurações de Aparência e Operação
  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    instagramUrl: "https://instagram.com/boosportswear",
    emailSuporte: "contato@boosportswear.com.br",
    lojaAberta: true
  });

  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const API_URL = "http://167.148.161.90/api";

  const dispararToast = (msg) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 3000);
  };

  const carregarProdutos = async () => {
    try {
      const res = await fetch(`${API_URL}/produtos`);
      if (res.ok) {
        const data = await res.json();
        const produtosFormatados = data.map(p => ({
          ...p,
          imagens: p.imagens ? p.imagens.map(img => typeof img === 'string' ? { url: img, cor: p.cores ? p.cores[0] : "#000000" } : img) : [{ url: p.imgUrl, cor: "#000000" }],
          cores: p.cores || ["#000000"],
          preco: p.preco?.toString().replace('.', ',') || "0,00"
        }));
        setProdutos(produtosFormatados);
      }
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('@BOO:token');
    const usuarioSalvo = localStorage.getItem('@BOO:usuario');

    if (!token || !usuarioSalvo) {
      window.location.href = '/login';
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);
    if (usuario.role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    setIsVerificando(false); 
    carregarProdutos();

    const configSalva = localStorage.getItem('@LojaDaBia:config');
    if (configSalva) {
      setConfigLoja(JSON.parse(configSalva));
    }
  }, []);

  const criarNovoProduto = () => {
    const produtoVazio = {
      id: Date.now(),
      isNew: true,
      nome: "",
      preco: "",
      estoque: "",
      categoria: "Conjuntos",
      cores: ["#000000"],
      imagens: []
    };
    setProdutos([produtoVazio, ...produtos]);
    setProdutoEditando(produtoVazio);
    setPaginaAtual(1);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    if (produtoParaExcluir.isNew) {
      setProdutos(produtos.filter(prod => prod.id !== produtoParaExcluir.id));
    } else {
      try {
        await fetch(`${API_URL}/produtos/${produtoParaExcluir.id}`, { method: 'DELETE' });
        setProdutos(produtos.filter(prod => prod.id !== produtoParaExcluir.id));
      } catch (e) {
        console.error(e);
      }
    }

    if (produtoEditando && produtoEditando.id === produtoParaExcluir.id) {
      setProdutoEditando(null);
    }
    setProdutoParaExcluir(null);
    dispararToast("Produto excluído com sucesso!");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdutoEditando(prev => ({
          ...prev,
          imagens: [...prev.imagens, { url: reader.result, cor: prev.cores[0] || "#000000" }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const atualizarCorDaImagem = (index, novaCor) => {
    const novasImagens = [...produtoEditando.imagens];
    novasImagens[index].cor = novaCor;
    setProdutoEditando({ ...produtoEditando, imagens: novasImagens });
  };

  const removerImagem = (index) => {
    const novas = [...produtoEditando.imagens];
    novas.splice(index, 1);
    setProdutoEditando({ ...produtoEditando, imagens: novas });
  };

  const moverImagem = (index, direcao) => {
    const novas = [...produtoEditando.imagens];
    if (direcao === 'cima' && index > 0) {
      [novas[index - 1], novas[index]] = [novas[index], novas[index - 1]];
    } else if (direcao === 'baixo' && index < novas.length - 1) {
      [novas[index + 1], novas[index]] = [novas[index], novas[index + 1]];
    }
    setProdutoEditando({ ...produtoEditando, imagens: novas });
  };

  const adicionarCor = () => {
    if (!produtoEditando.cores.includes(novaCorHex)) {
      setProdutoEditando({
        ...produtoEditando,
        cores: [...produtoEditando.cores, novaCorHex]
      });
    }
  };

  const removerCor = (index) => {
    const novasCores = produtoEditando.cores.filter((_, i) => i !== index);
    setProdutoEditando({ ...produtoEditando, cores: novasCores });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (produtoEditando.imagens.length === 0) {
      alert("Adicione pelo menos uma imagem ao produto!");
      return;
    }

    const estoqueNum = parseInt(produtoEditando.estoque, 10);
    const precoFloat = parseFloat(produtoEditando.preco.toString().replace(',', '.'));

    const payload = {
      nome: produtoEditando.nome,
      preco: isNaN(precoFloat) ? 0 : precoFloat,
      estoque: isNaN(estoqueNum) ? 0 : estoqueNum,
      categoria: produtoEditando.categoria || "Conjuntos",
      cores: produtoEditando.cores,
      imagens: produtoEditando.imagens,
      imgUrl: produtoEditando.imagens[0]?.url || ""
    };

    try {
      const endpoint = produtoEditando.isNew ? `${API_URL}/produtos` : `${API_URL}/produtos/${produtoEditando.id}`;
      const method = produtoEditando.isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await carregarProdutos();
        setProdutoEditando(null);
        dispararToast("Alterações salvas com sucesso!");
      } else {
        dispararToast("Erro ao salvar produto no banco.");
      }
    } catch(e) {
      console.error(e);
      dispararToast("Erro de conexão com el servidor.");
    }
  };

  const salvarConfiguracoes = (e) => {
    e.preventDefault();
    localStorage.setItem('@LojaDaBia:config', JSON.stringify(configLoja));
    dispararToast("Configurações atualizadas com sucesso!");
  };

  // Filtragem e Paginação
  const produtosFiltrados = produtos.filter(produto => {
    const bateNome = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    const bateCategoria = filtroCategoria === "Todas" || produto.categoria === filtroCategoria;
    return bateNome && bateCategoria;
  });

  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const produtosAtuais = produtosFiltrados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);

  // Métricas
  const totalProdutos = produtos.length;
  const produtosEstoqueBaixo = produtos.filter(p => parseInt(p.estoque || 0, 10) < 5).length;

  if (isVerificando) {
    return (
      <div className="h-screen bg-zinc-50 flex items-center justify-center text-xs font-bold tracking-widest uppercase text-zinc-500">
        Autenticando...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans relative overflow-hidden">
      
      {mensagemSucesso && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-3 rounded-lg shadow-xl text-xs uppercase tracking-widest font-medium flex items-center gap-2">
          <FiCheckCircle className="text-emerald-400 text-base" />
          {mensagemSucesso}
        </div>
      )}

      {/* SIDEBAR COM HEADER CENTRALIZADO COMO ANTES */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col justify-between flex-shrink-0 p-6">
        <div>
          {/* LOGO CENTRALIZADA COM DIVISOR */}
          <div className="h-20 flex items-center justify-center border-b border-zinc-100 -mx-6 -mt-6 mb-6">
            <h1 className="text-xl tracking-[0.05em] uppercase">
              <span className="font-light text-zinc-400">BOO</span><span className="font-bold text-black">ADMIN</span>
            </h1>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => { setAbaAtiva('produtos'); setProdutoEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'produtos' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiPackage className="text-base" />
              Produtos
            </button>
            <button 
              onClick={() => { setAbaAtiva('configuracoes'); setProdutoEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'configuracoes' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiSettings className="text-base" />
              Configurações
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-100">
          <button 
            onClick={() => { localStorage.clear(); window.location.href='/login'; }}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer"
          >
            <FiLogOut className="text-base" />
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-10">
        
        {abaAtiva === 'produtos' && (
          <>
            {!produtoEditando ? (
              <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight text-zinc-900">Catálogo de Produtos</h2>
                    <p className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">Gerenciamento e controle geral do estoque</p>
                  </div>
                  <button onClick={criarNovoProduto} className="bg-black text-white px-6 py-3 rounded-lg font-medium text-xs tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs flex items-center gap-2">
                    <FiPlus className="text-base" /> Novo Produto
                  </button>
                </header>

                {/* CARDS DE RESUMO RÁPIDO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700"><FiPackage className="text-xl" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Total de Produtos</p>
                      <p className="text-xl font-bold text-zinc-900">{totalProdutos} itens</p>
                    </div>
                  </div>

{/* CARD INTELIGENTE DE STATUS DO ESTOQUE */}
{totalProdutos === 0 ? (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-zinc-100 text-zinc-500 rounded-lg">
      <FiPackage className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Status do Estoque</p>
      <p className="text-xl font-bold text-zinc-500">Sem Produtos</p>
    </div>
  </div>
) : produtosEstoqueBaixo > 0 ? (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
      <FiAlertTriangle className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Estoque Crítico (&lt; 5 un)</p>
      <p className="text-xl font-bold text-amber-600">{produtosEstoqueBaixo} produtos</p>
    </div>
  </div>
) : (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
      <FiCheckCircle className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Status do Estoque</p>
      <p className="text-xl font-bold text-emerald-600">Cheio</p>
    </div>
  </div>
)}

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700"><FiLayers className="text-xl" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Categorias</p>
                      <p className="text-xl font-bold text-zinc-900">4 categorias</p>
                    </div>
                  </div>
                </div>

                {/* BARRA DE BUSCA E FILTROS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome do produto..." 
                      value={termoBusca}
                      onChange={(e) => { setTermoBusca(e.target.value); setPaginaAtual(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <select 
                      value={filtroCategoria}
                      onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Todas">Todas Categorias</option>
                      <option value="Conjuntos">Conjuntos</option>
                      <option value="Regatas">Regatas</option>
                      <option value="Shorts">Shorts</option>
                      <option value="Leggings">Leggings</option>
                    </select>
                  </div>
                </div>

                {/* TABELA DE PRODUTOS COM ALERTAS DE ESTOQUE */}
                <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                        <th className="px-6 py-4 font-semibold">Produto</th>
                        <th className="px-6 py-4 font-semibold">Categoria</th>
                        <th className="px-6 py-4 font-semibold">Preço</th>
                        <th className="px-6 py-4 font-semibold">Estoque</th>
                        <th className="px-6 py-4 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-sm">
                      {produtosAtuais.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-zinc-400 text-xs uppercase tracking-wider">
                            Nenhum produto encontrado.
                          </td>
                        </tr>
                      ) : (
                        produtosAtuais.map((produto) => {
                          const QtdEstoque = parseInt(produto.estoque || 0, 10);
                          return (
                            <tr key={produto.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <img src={produto.imagens?.[0]?.url || produto.imgUrl} alt={produto.nome} className="w-10 h-12 object-cover rounded-md bg-zinc-100 border border-zinc-200" />
                                  <span className="font-medium text-zinc-800 text-sm">{produto.nome || "Produto sem nome"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider">{produto.categoria || "Geral"}</td>
                              <td className="px-6 py-4 text-zinc-600 text-sm">R$ {produto.preco}</td>
                              <td className="px-6 py-4 text-sm">
                                {QtdEstoque === 0 ? (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold uppercase tracking-wider">Esgotado</span>
                                ) : QtdEstoque < 5 ? (
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold uppercase tracking-wider">{QtdEstoque} un. (Baixo)</span>
                                ) : (
                                  <span className="text-zinc-600">{QtdEstoque} un.</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right space-x-4">
                                <button onClick={() => setProdutoEditando({ ...produto })} className="text-black font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Editar</button>
                                <button onClick={() => setProdutoParaExcluir(produto)} className="text-red-500 font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Excluir</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/30">
                      <span className="text-xs text-zinc-400 uppercase tracking-wider">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-medium uppercase tracking-wider disabled:opacity-30 cursor-pointer hover:bg-zinc-50"
                        >
                          Anterior
                        </button>
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-medium uppercase tracking-wider disabled:opacity-30 cursor-pointer hover:bg-zinc-50"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TELA DE EDICÃO / CADASTRO DE PRODUTO */
              <div className="max-w-3xl mx-auto pb-20">
                <button onClick={() => setProdutoEditando(null)} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-black mb-6 uppercase tracking-wider font-semibold cursor-pointer">
                  ← Voltar para listagem
                </button>

                <header className="mb-8 flex justify-between items-center border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight">
                      {produtoEditando.isNew ? "Novo Produto" : `Editar: ${produtoEditando.nome}`}
                    </h2>
                  </div>
                  <button type="button" onClick={() => setProdutoParaExcluir(produtoEditando)} className="text-red-500 text-xs font-semibold uppercase tracking-wider hover:underline cursor-pointer">
                    Excluir Produto
                  </button>
                </header>

                <form onSubmit={salvarEdicao} className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Informações Principais</h3>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Nome do Produto</label>
                      <input type="text" value={produtoEditando.nome} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="Ex: Legging Sculpt Alta Compressão" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Preço (R$)</label>
                        <input type="text" value={produtoEditando.preco} onChange={(e) => setProdutoEditando({...produtoEditando, preco: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="00,00" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Estoque</label>
                        <input type="number" min="0" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({...produtoEditando, estoque: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="0" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Categoria</label>
                        <select 
                          value={produtoEditando.categoria || "Conjuntos"} 
                          onChange={(e) => setProdutoEditando({...produtoEditando, categoria: e.target.value})} 
                          className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30 cursor-pointer"
                        >
                          <option value="Conjuntos">Conjuntos</option>
                          <option value="Regatas">Regatas</option>
                          <option value="Shorts">Shorts</option>
                          <option value="Leggings">Leggings</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">Cores Disponíveis</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {produtoEditando.cores.map((corHex, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-xs">
                          <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-2xs" style={{ backgroundColor: corHex }} />
                          <span className="font-mono text-zinc-700">{corHex}</span>
                          <button type="button" onClick={() => removerCor(idx)} className="text-zinc-400 hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-10 h-10 border border-zinc-200 rounded-lg cursor-pointer bg-white p-1" />
                      <input type="text" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-32 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-mono uppercase" />
                      <button type="button" onClick={adicionarCor} className="bg-zinc-100 text-black px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-zinc-200 hover:bg-zinc-200 cursor-pointer">Adicionar Cor</button>
                    </div>
                  </div>

                  {/* Upload de Imagens */}
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Galeria de Imagens</h3>
                      <span className="text-xs text-zinc-400">{produtoEditando.imagens?.length || 0} foto(s)</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {produtoEditando.imagens?.map((imgObj, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border border-zinc-100 rounded-lg bg-zinc-50/50">
                          <img src={imgObj.url} alt="Miniatura" className="w-12 h-14 object-cover rounded-md border border-zinc-200" />
                          
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500 font-semibold">{index === 0 ? "Capa Principal" : `Foto ${index + 1}`}</span>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-zinc-400 uppercase">Cor:</label>
                              <select 
                                value={imgObj.cor} 
                                onChange={(e) => atualizarCorDaImagem(index, e.target.value)}
                                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
                              >
                                {produtoEditando.cores.map((c, i) => (
                                  <option key={i} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moverImagem(index, 'cima')} disabled={index === 0} className="p-1.5 text-xs text-zinc-500 hover:text-black disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moverImagem(index, 'baixo')} disabled={index === produtoEditando.imagens.length - 1} className="p-1.5 text-xs text-zinc-500 hover:text-black disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removerImagem(index)} className="p-1.5 text-xs text-red-500 hover:text-red-700 ml-1">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer bg-zinc-50/30 relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiPlus className="w-6 h-6 text-zinc-400" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Clique para selecionar fotos do computador</p>
                        <p className="text-[11px] text-zinc-400">Seleção múltipla de arquivos</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs">
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* ABA CONFIGURAÇÕES */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-normal tracking-tight">Configurações da Loja</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Gerencie cabeçalho e canais oficiais.</p>
            </header>

            <form onSubmit={salvarConfiguracoes} className="bg-white p-8 rounded-xl border border-zinc-200 shadow-2xs space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Frase do Topo (Barra de Anúncios)</label>
                <input 
                  type="text" 
                  value={configLoja.fraseTopo} 
                  onChange={(e) => setConfigLoja({...configLoja, fraseTopo: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Link do Instagram</label>
                <input 
                  type="text" 
                  value={configLoja.instagramUrl} 
                  onChange={(e) => setConfigLoja({...configLoja, instagramUrl: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">E-mail de Suporte</label>
                <input 
                  type="email" 
                  value={configLoja.emailSuporte} 
                  onChange={(e) => setConfigLoja({...configLoja, emailSuporte: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-100">
                <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs">
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* MODAL DE EXCLUSÃO */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-zinc-100">
            <h3 className="text-base font-medium text-zinc-900 mb-2">Excluir produto</h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Deseja realmente remover "{produtoParaExcluir.nome || 'este produto'}" do catálogo?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setProdutoParaExcluir(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Cancelar</button>
              <button onClick={confirmarExclusao} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';

export default function Admin() {
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novaImagemCor, setNovaImagemCor] = useState("#000000");
  const [novaCorHex, setNovaCorHex] = useState("#000000");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  const [abaAtiva, setAbaAtiva] = useState('produtos');

  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    whatsappContato: "5511999999999",
    nomeLoja: "BOO SPORTWEAR"
  });

  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // URL da API na VPS Debian
  const API_URL = "http://167.148.161.90/api";

  const dispararToast = (msg) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 3000);
  };

  // 1. Carregar produtos do banco de dados na VPS
  const carregarProdutos = async () => {
    try {
      const resposta = await fetch(`${API_URL}/produtos`);
      if (resposta.ok) {
        const dados = await resposta.json();
        const produtosFormatados = dados.map(p => ({
          ...p,
          preco: Number(p.preco) || 0,
          cores: Array.isArray(p.cores) ? p.cores : [],
          imagens: p.imagens 
            ? p.imagens.map(img => typeof img === 'string' ? { url: img, cor: p.cores?.[0] || "#000000" } : img) 
            : [{ url: p.imgUrl || '', cor: p.cores?.[0] || "#000000" }]
        }));
        setProdutos(produtosFormatados);
      }
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
      dispararToast("Erro ao conectar com o servidor!");
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const abrirNovoProduto = () => {
    setProdutoEditando({
      id: null,
      nome: '',
      preco: '',
      imgUrl: '',
      categoria: 'Leggings',
      cores: ['#000000'],
      imagens: []
    });
  };

  // 2. Salvar / Atualizar Produto no Banco
  const salvarProduto = async (e) => {
    e.preventDefault();

    if (!produtoEditando.nome || !produtoEditando.preco) {
      alert("Por favor, preencha nome e preço do produto.");
      return;
    }

    const payload = {
      nome: produtoEditando.nome,
      preco: parseFloat(produtoEditando.preco),
      categoria: produtoEditando.categoria || 'Geral',
      imgUrl: produtoEditando.imgUrl || (produtoEditando.imagens?.[0]?.url || ''),
      cores: produtoEditando.cores || ['#000000'],
      imagens: produtoEditando.imagens || []
    };

    try {
      if (produtoEditando.id) {
        // PUT: Atualiza produto existente
        const resposta = await fetch(`${API_URL}/produtos/${produtoEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resposta.ok) {
          dispararToast("Produto atualizado com sucesso!");
          await carregarProdutos();
        } else {
          dispararToast("Erro ao atualizar o produto!");
        }
      } else {
        // POST: Cria novo produto
        const resposta = await fetch(`${API_URL}/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resposta.ok) {
          dispararToast("Produto cadastrado no banco com sucesso!");
          await carregarProdutos();
        } else {
          dispararToast("Erro ao cadastrar produto!");
        }
      }
      setProdutoEditando(null);
    } catch (erro) {
      console.error("Erro ao salvar produto:", erro);
      dispararToast("Erro ao conectar com a VPS!");
    }
  };

  // 3. Excluir Produto do Banco
  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    try {
      const resposta = await fetch(`${API_URL}/produtos/${produtoParaExcluir.id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        dispararToast("Produto removido do banco!");
        await carregarProdutos();
      } else {
        dispararToast("Erro ao excluir produto!");
      }
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
      dispararToast("Erro ao conectar com o servidor!");
    } finally {
      setProdutoParaExcluir(null);
    }
  };

  // Adicionar URL de imagem extra vinculada a cor
  const adicionarImagemUrl = (url) => {
    if (!url.trim()) return;
    setProdutoEditando(prev => ({
      ...prev,
      imagens: [...(prev.imagens || []), { url: url.trim(), cor: novaImagemCor }],
      imgUrl: prev.imgUrl || url.trim()
    }));
  };

  const removerImagem = (index) => {
    setProdutoEditando(prev => {
      const novasImagens = prev.imagens.filter((_, i) => i !== index);
      return {
        ...prev,
        imagens: novasImagens,
        imgUrl: novasImagens.length > 0 ? novasImagens[0].url : ''
      };
    });
  };

  const adicionarCorHex = () => {
    if (produtoEditando.cores.includes(novaCorHex)) return;
    setProdutoEditando(prev => ({
      ...prev,
      cores: [...prev.cores, novaCorHex]
    }));
  };

  const removerCorHex = (corRemover) => {
    setProdutoEditando(prev => ({
      ...prev,
      cores: prev.cores.filter(c => c !== corRemover)
    }));
  };

  const salvarConfiguracoesLoja = (e) => {
    e.preventDefault();
    dispararToast("Configurações da loja salvas!");
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20 antialiased">
      {/* Toast Notificação */}
      {mensagemSucesso && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-3 rounded shadow-2xl text-xs font-bold tracking-widest uppercase animate-bounce">
          ✓ {mensagemSucesso}
        </div>
      )}

      {/* Header do Admin */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black tracking-widest uppercase">BOO</h1>
            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
              Painel Gestor VPS
            </span>
          </div>

          <a href="/" target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-black font-semibold uppercase tracking-wider">
            Ver Loja ao Vivo ↗
          </a>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* Navegação entre Abas */}
        <div className="flex gap-4 border-b border-zinc-200 mb-8">
          <button 
            onClick={() => setAbaAtiva('produtos')}
            className={`pb-3 text-xs font-bold tracking-widest uppercase border-b-2 cursor-pointer transition-colors ${
              abaAtiva === 'produtos' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Gestão de Produtos ({produtos.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('config')}
            className={`pb-3 text-xs font-bold tracking-widest uppercase border-b-2 cursor-pointer transition-colors ${
              abaAtiva === 'config' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Configurações da Loja
          </button>
        </div>

        {/* ABA 1: PRODUTOS */}
        {abaAtiva === 'produtos' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider">Catálogo do Banco de Dados</h2>
                <p className="text-xs text-zinc-500 mt-1">Sincronizado diretamente com o PostgreSQL da VPS.</p>
              </div>

              <button 
                onClick={abrirNovoProduto}
                className="bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                + Cadastrar Produto
              </button>
            </div>

            {/* Tabela de Produtos */}
            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Produto</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Preço</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {produtos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-zinc-400 uppercase tracking-widest">
                        Nenhum produto encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    produtos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-4">
                          <img 
                            src={prod.imgUrl || prod.imagens?.[0]?.url || 'https://via.placeholder.com/100'} 
                            alt={prod.nome} 
                            className="w-12 h-14 object-cover rounded bg-zinc-100"
                          />
                          <span className="font-semibold uppercase text-zinc-900">{prod.nome}</span>
                        </td>
                        <td className="py-4 px-6 text-zinc-600 font-medium uppercase">{prod.categoria || 'Geral'}</td>
                        <td className="py-4 px-6 font-bold text-zinc-900">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</td>
                        <td className="py-4 px-6 text-right space-x-3">
                          <button 
                            onClick={() => setProdutoEditando(prod)}
                            className="text-zinc-700 hover:text-black font-bold uppercase cursor-pointer"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => setProdutoParaExcluir(prod)}
                            className="text-red-600 hover:text-red-800 font-bold uppercase cursor-pointer"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: CONFIGURAÇÕES DA LOJA */}
        {abaAtiva === 'config' && (
          <div className="bg-white rounded-lg border border-zinc-200 p-8 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Informações da Loja</h2>
            <form onSubmit={salvarConfiguracoesLoja} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">
                  Frase da Tarja do Topo
                </label>
                <input 
                  type="text" 
                  value={configLoja.fraseTopo}
                  onChange={(e) => setConfigLoja({ ...configLoja, fraseTopo: e.target.value })}
                  className="w-full border border-zinc-200 rounded px-4 py-3 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">
                  WhatsApp da Loja (DDD + Número sem espaços)
                </label>
                <input 
                  type="text" 
                  value={configLoja.whatsappContato}
                  onChange={(e) => setConfigLoja({ ...configLoja, whatsappContato: e.target.value })}
                  className="w-full border border-zinc-200 rounded px-4 py-3 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <button type="submit" className="bg-black text-white px-8 py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer">
                Salvar Configurações
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL DE EDICÃO / CADASTRO */}
      {produtoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-zinc-200">
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-base font-bold uppercase tracking-wider">
                {produtoEditando.id ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setProdutoEditando(null)} className="text-zinc-400 hover:text-black cursor-pointer text-xs font-bold">
                ✕ FECHAR
              </button>
            </div>

            <form onSubmit={salvarProduto} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={produtoEditando.nome}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                    className="w-full border border-zinc-200 rounded px-4 py-2.5 text-xs focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={produtoEditando.preco}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, preco: e.target.value })}
                    className="w-full border border-zinc-200 rounded px-4 py-2.5 text-xs focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              {/* Cores Hexadecimal */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Cores Disponíveis</label>
                <div className="flex gap-2 items-center mb-3">
                  <input 
                    type="color" 
                    value={novaCorHex}
                    onChange={(e) => setNovaCorHex(e.target.value)}
                    className="w-9 h-9 border-none cursor-pointer rounded"
                  />
                  <button 
                    type="button" 
                    onClick={adicionarCorHex}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer"
                  >
                    + Adicionar Cor
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {produtoEditando.cores?.map((cor, i) => (
                    <div key={i} className="flex items-center gap-1.5 border border-zinc-200 px-3 py-1 rounded bg-zinc-50">
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: cor }} />
                      <span className="text-[10px] font-mono">{cor}</span>
                      <button type="button" onClick={() => removerCorHex(cor)} className="text-red-500 text-xs font-bold ml-1 cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Imagens URLs */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Adicionar Foto (URL da Imagem)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    id="inputUrlImg"
                    className="flex-1 border border-zinc-200 rounded px-4 py-2.5 text-xs focus:outline-none focus:border-black"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const el = document.getElementById('inputUrlImg');
                      if (el) {
                        adicionarImagemUrl(el.value);
                        el.value = '';
                      }
                    }}
                    className="bg-black text-white px-5 py-2.5 rounded text-xs font-bold uppercase cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Galeria de Fotos Adicionadas */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {produtoEditando.imagens?.map((img, i) => (
                    <div key={i} className="relative aspect-3/4 bg-zinc-100 rounded overflow-hidden border border-zinc-200 group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removerImagem(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                <button type="button" onClick={() => setProdutoEditando(null)} className="px-6 py-3 rounded text-xs font-bold uppercase text-zinc-600 hover:bg-zinc-100 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="bg-black text-white px-8 py-3 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 cursor-pointer">
                  Salvar no Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center border border-zinc-100">
            <h3 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wider">Excluir Produto</h3>
            <p className="text-xs text-zinc-500 mb-6">Deseja remover permanentemente "<strong>{produtoParaExcluir.nome}</strong>" do banco de dados?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setProdutoParaExcluir(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-xs uppercase font-bold tracking-wider cursor-pointer">
                Cancelar
              </button>
              <button onClick={confirmarExclusao} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs uppercase font-bold tracking-wider cursor-pointer">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
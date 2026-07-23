import { useState, useEffect } from 'react';

export default function Admin() {
  const [isVerificando, setIsVerificando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novaImagemLink, setNovaImagemLink] = useState("");
  const [novaImagemCor, setNovaImagemCor] = useState("#000000");
  const [novaCorHex, setNovaCorHex] = useState("#000000");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  // Abas: 'produtos' ou 'configuracoes'
  const [abaAtiva, setAbaAtiva] = useState('produtos');

  // Configurações de Aparência da Loja
  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    whatsappContato: "5511999999999",
    nomeLoja: "BOO SPORTWEAR"
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
    // PROTEÇÃO DA ROTA: Verifica se é a Bia (Admin) acessando
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

    // Se chegou aqui, a pessoa é a Bia e está autorizada! Libera a tela:
    setIsVerificando(false); 

    // Carrega produtos da VPS
    carregarProdutos();

    // Carrega configurações da loja
    const configSalva = localStorage.getItem('@LojaDaBia:config');
    if (configSalva) {
      setConfigLoja(JSON.parse(configSalva));
    }
  }, []);

  const criarNovoProduto = () => {
    const produtoVazio = {
      id: Date.now(), // Temporário até salvar no banco
      isNew: true, // Flag para sabermos que ainda não está no banco
      nome: "Novo Produto",
      preco: "99,90",
      estoque: 10,
      cores: ["#000000", "#FFFFFF"],
      status: "Ativo",
      imagens: [{ url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600", cor: "#000000" }]
    };
    setProdutos([produtoVazio, ...produtos]);
    setProdutoEditando(produtoVazio);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    // Se o produto for novo e ainda não foi salvo, só apaga da tela
    if (produtoParaExcluir.isNew) {
      setProdutos(produtos.filter(prod => prod.id !== produtoParaExcluir.id));
    } else {
      // Se já estiver no banco, manda deletar na VPS
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

  const adicionarImagem = () => {
    if (novaImagemLink.trim() !== "") {
      setProdutoEditando({
        ...produtoEditando,
        imagens: [...produtoEditando.imagens, { url: novaImagemLink, cor: novaImagemCor }]
      });
      setNovaImagemLink("");
    }
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
    setProdutoEditando({
      ...produtoEditando,
      cores: [...produtoEditando.cores, novaCorHex]
    });
  };

  const removerCor = (index) => {
    const novasCores = [...produtoEditando.cores];
    novasCores.splice(index, 1);
    setProdutoEditando({ ...produtoEditando, cores: novasCores });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (produtoEditando.imagens.length === 0) {
      alert("Adicione pelo menos uma imagem!");
      return;
    }

    const estoqueNum = parseInt(produtoEditando.estoque, 10);
    const precoFloat = parseFloat(produtoEditando.preco.replace(',', '.'));

    const payload = {
      nome: produtoEditando.nome,
      preco: isNaN(precoFloat) ? 0 : precoFloat,
      estoque: estoqueNum,
      cores: produtoEditando.cores,
      imagens: produtoEditando.imagens,
      imgUrl: produtoEditando.imagens[0]?.url || "",
      categoria: "Geral"
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
        await carregarProdutos(); // Puxa os dados atualizados com o ID real do banco
        setProdutoEditando(null);
        dispararToast("Alterações salvas com sucesso!");
      } else {
        dispararToast("Erro ao salvar produto no banco.");
      }
    } catch(e) {
      console.error(e);
      dispararToast("Erro de conexão com o servidor.");
    }
  };

  const salvarConfiguracoes = (e) => {
    e.preventDefault();
    localStorage.setItem('@LojaDaBia:config', JSON.stringify(configLoja));
    dispararToast("Configurações atualizadas com sucesso!");
  };

  // BLOCO DE SEGURANÇA: Mostra isso enquanto verifica o Token!
  if (isVerificando) {
    return (
      <div className="h-screen bg-zinc-50 flex items-center justify-center text-xs font-bold tracking-widest uppercase text-zinc-500">
        Autenticando...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans relative">
      
      {mensagemSucesso && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-3 rounded-lg shadow-xl text-xs uppercase tracking-widest font-medium animate-fade-in">
          {mensagemSucesso}
        </div>
      )}

      {/* SIDEBAR COM ÍCONES E TIPOGRAFIA AJUSTADA */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-zinc-100">
            <h1 className="text-xl tracking-[0.05em] uppercase">
            <span className="font-light text-zinc-400">BOO</span><span className="font-bold text-black">ADMIN</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => { setAbaAtiva('produtos'); setProdutoEditando(null); }} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors cursor-pointer ${abaAtiva === 'produtos' ? 'bg-zinc-100 text-black font-semibold' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            Produtos
          </button>
          
          <button 
            onClick={() => { setAbaAtiva('configuracoes'); setProdutoEditando(null); }} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-sm transition-colors cursor-pointer ${abaAtiva === 'configuracoes' ? 'bg-zinc-100 text-black font-semibold' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Configurações
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 relative">
        
        {abaAtiva === 'produtos' && (
          <>
            {!produtoEditando ? (
              <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight">Catálogo</h2>
                    <p className="text-sm text-zinc-400 mt-0.5">Gerencie os produtos da loja</p>
                  </div>
                  <button onClick={criarNovoProduto} className="bg-black text-white px-5 py-2 rounded-md font-medium text-xs tracking-wider uppercase hover:bg-zinc-800 transition-colors cursor-pointer">
                    + Novo Produto
                  </button>
                </header>

                <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                        <th className="px-6 py-4 font-medium">Produto</th>
                        <th className="px-6 py-4 font-medium">Preço</th>
                        <th className="px-6 py-4 font-medium">Estoque</th>
                        <th className="px-6 py-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-sm">
                      {produtos.map((produto) => (
                        <tr key={produto.id} className="hover:bg-zinc-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img src={produto.imagens?.[0]?.url || produto.imgUrl} alt={produto.nome} className="w-10 h-12 object-cover rounded bg-zinc-100" />
                              <span className="font-medium text-zinc-800">{produto.nome}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">R$ {produto.preco}</td>
                          <td className="px-6 py-4 text-zinc-600">{produto.estoque || 0} un.</td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button onClick={() => setProdutoEditando({ ...produto })} className="text-black font-medium hover:underline text-xs tracking-wider uppercase cursor-pointer">Editar</button>
                            <button onClick={() => setProdutoParaExcluir(produto)} className="text-red-500 font-medium hover:underline text-xs tracking-wider uppercase cursor-pointer">Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto pb-20">
                <button onClick={() => setProdutoEditando(null)} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-black mb-6 uppercase tracking-wider font-medium cursor-pointer">
                  ← Voltar para listagem
                </button>

                <header className="mb-8 flex justify-between items-center border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight">Editar: {produtoEditando.nome}</h2>
                  </div>
                  <button type="button" onClick={() => setProdutoParaExcluir(produtoEditando)} className="text-red-500 text-xs font-medium uppercase tracking-wider hover:underline cursor-pointer">
                    Excluir Produto
                  </button>
                </header>

                <form onSubmit={salvarEdicao} className="space-y-6">
                  
                  <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-2xs space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2">Detalhes</h3>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Nome</label>
                      <input type="text" value={produtoEditando.nome} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Preço (R$)</label>
                        <input type="text" value={produtoEditando.preco} onChange={(e) => setProdutoEditando({...produtoEditando, preco: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Estoque</label>
                        <input type="number" min="0" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({...produtoEditando, estoque: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-2xs">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-3">Cores da Peça</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {produtoEditando.cores.map((corHex, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full text-xs">
                          <span className="w-3 h-3 rounded-full border border-zinc-300" style={{ backgroundColor: corHex }} />
                          <span className="font-mono text-zinc-600">{corHex}</span>
                          <button type="button" onClick={() => removerCor(idx)} className="text-zinc-400 hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-9 h-9 border border-zinc-200 rounded cursor-pointer bg-white p-0.5" />
                      <input type="text" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-28 border border-zinc-200 rounded px-3 py-2 text-xs font-mono" />
                      <button type="button" onClick={adicionarCor} className="bg-zinc-100 text-black px-4 py-2 rounded text-xs font-medium uppercase tracking-wider border border-zinc-200 hover:bg-zinc-200 cursor-pointer">Adicionar Cor</button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Galeria & Cores das Fotos</h3>
                      <span className="text-xs text-zinc-400">{produtoEditando.imagens?.length || 0} foto(s)</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {produtoEditando.imagens?.map((imgObj, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border border-zinc-100 rounded bg-zinc-50/50">
                          <img src={imgObj.url} alt="Miniatura" className="w-12 h-14 object-cover rounded border border-zinc-200" />
                          
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500 font-medium">{index === 0 ? "Capa Principal" : `Foto ${index + 1}`}</span>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-zinc-400">Cor:</label>
                              <select 
                                value={imgObj.cor} 
                                onChange={(e) => atualizarCorDaImagem(index, e.target.value)}
                                className="border border-zinc-200 rounded px-2 py-1 text-xs bg-white"
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

                    <div className="space-y-3 pt-3 border-t border-zinc-100">
                      <input type="text" placeholder="Cole o link (URL) da nova foto..." value={novaImagemLink} onChange={(e) => setNovaImagemLink(e.target.value)} className="w-full border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black" />
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-zinc-500">Pertence à cor:</span>
                        <select value={novaImagemCor} onChange={(e) => setNovaImagemCor(e.target.value)} className="border border-zinc-200 rounded px-2 py-1 text-xs bg-white">
                          {produtoEditando.cores.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                        <button type="button" onClick={adicionarImagem} className="bg-zinc-100 text-black px-4 py-1.5 rounded text-xs font-medium uppercase tracking-wider border border-zinc-200 hover:bg-zinc-200 cursor-pointer">Adicionar Foto</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-black text-white px-8 py-3 rounded text-xs font-medium tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer">Salvar Alterações</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* ABA: CONFIGURAÇÕES DA LOJA */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-normal tracking-tight">Configurações da Loja</h2>
              <p className="text-sm text-zinc-400 mt-0.5">Gerencie o cabeçalho, slogans e dados de atendimento.</p>
            </header>

            <form onSubmit={salvarConfiguracoes} className="bg-white p-8 rounded-lg border border-zinc-200 shadow-2xs space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Frase Personalizada (Header)</label>
                <input 
                  type="text" 
                  value={configLoja.fraseTopo} 
                  onChange={(e) => setConfigLoja({...configLoja, fraseTopo: e.target.value})} 
                  className="w-full border border-zinc-200 rounded px-4 py-3 text-sm focus:outline-none focus:border-black"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Número do WhatsApp para Pedidos</label>
                <input 
                  type="text" 
                  value={configLoja.whatsappContato} 
                  onChange={(e) => setConfigLoja({...configLoja, whatsappContato: e.target.value})} 
                  className="w-full border border-zinc-200 rounded px-4 py-3 text-sm focus:outline-none focus:border-black"
                  required 
                />
                <p className="text-xs text-zinc-400 mt-1">Insira o DDI + DDD + Número (Ex: 5511999999999)</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-100">
                <button type="submit" className="bg-black text-white px-8 py-3 rounded text-xs font-medium tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer">
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Modal de Exclusão */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center border border-zinc-100">
            <h3 className="text-lg font-normal text-zinc-900 mb-2">Excluir produto</h3>
            <p className="text-xs text-zinc-500 mb-6">Deseja remover "{produtoParaExcluir.nome}" do catálogo?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setProdutoParaExcluir(null)} className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-xs uppercase tracking-wider font-medium cursor-pointer">Cancelar</button>
              <button onClick={confirmarExclusao} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs uppercase tracking-wider font-medium cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
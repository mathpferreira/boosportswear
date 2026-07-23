import { useState, useEffect } from 'react';

export default function Loja() {
  const [produtosBrazilian, setProdutosBrazilian] = useState([]);
  const [corSelecionadaPorProduto, setCorSelecionadaPorProduto] = useState({});
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tamanhoEscolhido, setTamanhoEscolhido] = useState("M");
  const [carrinho, setCarrinho] = useState([]);
  const [isSacolaAberta, setIsSacolaAberta] = useState(false);
  const [cep, setCep] = useState("");
  const [freteResultado, setFreteResultado] = useState(null);
  
  // Configurações da Loja
  const [fraseTopo, setFraseTopo] = useState("FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS");
  const [whatsappLoja, setWhatsappLoja] = useState("5511999999999");

  // URL Base do Backend na sua VPS Debian
  const API_URL = "http://167.148.161.90/api";

  useEffect(() => {
    // Carrega produtos vindos diretamente da API no PostgreSQL da VPS
    async function carregarProdutos() {
      try {
        const resposta = await fetch(`${API_URL}/produtos`);
        if (resposta.ok) {
          const dados = await resposta.json();
          const produtosFormatados = dados.map(p => ({
            ...p,
            imagens: p.imagens 
              ? p.imagens.map(img => typeof img === 'string' ? { url: img, cor: p.cores[0] } : img) 
              : [{ url: p.imgUrl || '', cor: p.cores[0] }]
          }));
          setProdutosBrazilian(produtosFormatados);
        } else {
          console.warn("API respondeu com status de erro:", resposta.status);
        }
      } catch (erro) {
        console.error("Erro ao carregar produtos da VPS:", erro);
      }
    }

    carregarProdutos();
  }, []);

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

  const finalizarWhatsApp = () => {
    let mensagem = `*NOVO PEDIDO - BOO SPORTWEAR*\n\n`;
    carrinho.forEach(item => {
      mensagem += `• ${item.nome} (${item.tamanhoEscolhido} / ${item.corEscolhida}) x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
    });
    mensagem += `\n*Subtotal:* R$ ${totalCarrinho.toFixed(2)}`;
    if (freteResultado) {
      mensagem += `\n*Frete:* R$ ${freteResultado.valor.toFixed(2)}`;
      mensagem += `\n*Total com Frete:* R$ ${(totalCarrinho + freteResultado.valor).toFixed(2)}`;
    }

    const url = `https://wa.me/${whatsappLoja}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      {/* Tarja do Topo */}
      <div className="bg-black text-white text-[10px] tracking-[0.2em] py-2.5 px-4 text-center font-medium uppercase">
        {fraseTopo}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-[0.3em] uppercase">BOO</h1>
          
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
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-center mb-12 border-b border-zinc-100 pb-4">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Catálogo Oficial</h3>
          <span className="text-xs text-zinc-400">{produtosBrazilian.length} produtos disponíveis</span>
        </div>

        {produtosBrazilian.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-xs tracking-widest uppercase">
            Nenhum produto cadastrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {produtosBrazilian.map((produto) => {
              const corAtiva = corSelecionadaPorProduto[produto.id] || produto.cores[0];
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

      {/* Drawer do Carrinho / Sacola */}
      {isSacolaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-zinc-100">
                <h3 className="text-sm font-bold tracking-widest uppercase">Sua Sacola</h3>
                <button onClick={() => setIsSacolaAberta(false)} className="text-xs text-zinc-400 hover:text-black cursor-pointer">✕ FECHAR</button>
              </div>

              <div className="py-6 space-y-4 max-h-[50vh] overflow-y-auto">
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

              {/* Cálculo de Frete */}
              {carrinho.length > 0 && (
                <form onSubmit={calcularFrete} className="pt-4 border-t border-zinc-100">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 block mb-2">Simular Frete</label>
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
            </div>

            {carrinho.length > 0 && (
              <div className="pt-6 border-t border-zinc-100 space-y-4 bg-zinc-50 p-4 rounded">
                <div className="flex justify-between text-sm font-bold">
                  <span>Subtotal:</span>
                  <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  onClick={finalizarWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Finalizar Pedido via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black text-white py-16 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black tracking-[0.3em] uppercase">BOO</h4>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">ALTA QUALIDADE E ESTILO LUXUOSO</p>
          </div>
          <div className="text-center md:text-right text-xs text-zinc-400 tracking-wider">
            © BOO SPORTWEAR. TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect } from 'react'

export default function Loja() {
  const [produtosBrazilian, setProdutosBrazilian] = useState([])
  const [corSelecionadaPorProduto, setCorSelecionadaPorProduto] = useState({})
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [tamanhoEscolhido, setTamanhoEscolhido] = useState("M")
  const [carrinho, setCarrinho] = useState([])
  const [isSacolaAberta, setIsSacolaAberta] = useState(false)
  const [cep, setCep] = useState("")
  const [freteResultado, setFreteResultado] = useState(null)
  
  // Configurações puxadas do Admin
  const [fraseTopo, setFraseTopo] = useState("FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS")
  const [whatsappLoja, setWhatsappLoja] = useState("5511999999999")

  useEffect(() => {
    // Carrega produtos
    const dadosSalvos = localStorage.getItem('@LojaDaBia:produtos');
    if (dadosSalvos) {
      const produtosFormatados = JSON.parse(dadosSalvos).map(p => ({
        ...p,
        imagens: p.imagens ? p.imagens.map(img => typeof img === 'string' ? { url: img, cor: p.cores[0] } : img) : [{ url: p.imgUrl, cor: "#000000" }]
      }));
      setProdutosBrazilian(produtosFormatados);
    } else {
      const produtosIniciais = [
        { 
          id: 1, 
          nome: "Conjunto Brazilcore", 
          preco: "200,00", 
          estoque: 5, 
          cores: ["#ffbb00", "#1D4ED8"], 
          imagens: [
            { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600", cor: "#ffbb00" },
            { url: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?q=80&w=600", cor: "#1D4ED8" }
          ] 
        }
      ];
      setProdutosBrazilian(produtosIniciais);
      localStorage.setItem('@LojaDaBia:produtos', JSON.stringify(produtosIniciais));
    }

    // Carrega configurações da loja
    const configSalva = localStorage.getItem('@LojaDaBia:config');
    if (configSalva) {
      const config = JSON.parse(configSalva);
      if (config.fraseTopo) setFraseTopo(config.fraseTopo);
      if (config.whatsappContato) setWhatsappLoja(config.whatsappContato);
    }
  }, []);

  const selecionarCorProduto = (produtoId, corHex, e) => {
    if (e) e.stopPropagation();
    setCorSelecionadaPorProduto(prev => ({ ...prev, [produtoId]: corHex }));
  };

  const adicionarAoCarrinho = (produto, cor, tamanho) => {
    const itemExistente = carrinho.find(i => i.id === produto.id && i.cor === cor && i.tamanho === tamanho);
    if (itemExistente) {
      setCarrinho(carrinho.map(i => i === itemExistente ? { ...i, qtd: i.qtd + 1 } : i));
    } else {
      setCarrinho([...carrinho, { ...produto, cor, tamanho, qtd: 1, imagemCapa: produto.imagens[0].url }]);
    }
    setIsSacolaAberta(true);
    setProdutoSelecionado(null);
  };

  const calcularFrete = (e) => {
    e.preventDefault();
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    const prefixo = parseInt(cepLimpo.substring(0, 2), 10);
    let valorFrete = "38,00";
    let prazo = "8 a 12 dias úteis";

    if (prefixo >= 1 && prefixo <= 9) {
      valorFrete = "15,00";
      prazo = "2 a 3 dias úteis";
    } else if (prefixo >= 10 && prefixo <= 19) {
      valorFrete = "20,00";
      prazo = "3 a 5 dias úteis";
    } else if (prefixo >= 20 && prefixo <= 34) {
      valorFrete = "25,00";
      prazo = "4 a 7 dias úteis";
    }

    setFreteResultado({ valor: valorFrete, prazo: prazo });
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco.replace(',', '.')) * item.qtd), 0);

  const finalizarWhatsApp = () => {
    if (carrinho.length === 0) return;
    let mensagem = "Olá! Gostaria de finalizar o seguinte pedido na BOO:\n\n";
    carrinho.forEach(item => {
      mensagem += `• ${item.qtd}x ${item.nome} (Tam: ${item.tamanho}) - R$ ${item.preco}\n`;
    });
    mensagem += `\n*Total dos Produtos:* R$ ${totalCarrinho.toFixed(2).replace('.', ',')}`;
    
    window.open(`https://wa.me/${whatsappLoja}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white text-black antialiased font-sans relative">
      
      <div className="bg-black text-white text-[10px] font-bold tracking-[0.25em] uppercase text-center py-3 px-4">
        {fraseTopo}
      </div>

      <header className="border-b border-zinc-100 bg-white relative z-40">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 relative">
          <nav className="hidden md:flex space-x-8 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">
            <a href="#" className="hover:text-black transition-colors">Novidades</a>
            <a href="#" className="hover:text-black transition-colors">Coleções</a>
            <a href="#" className="hover:text-black transition-colors">TENDÊNCIA</a>
          </nav>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center">
            <img src="https://i.imgur.com/7SkAZrX.jpeg" className="h-14 w-auto object-contain" alt="Logo" />
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-bold tracking-[0.2em] uppercase text-black">
            <button onClick={() => setIsSacolaAberta(true)} className="hover:opacity-50 cursor-pointer flex items-center gap-1 font-bold">
              SACOLA ({carrinho.reduce((a, b) => a + b.qtd, 0)})
            </button>
          </div>
        </div>
      </header>

      <section className="w-full relative h-[65vh] md:h-[75vh] bg-zinc-900 overflow-hidden flex items-center justify-center">
        <img src="https://i.imgur.com/blqb9nx.jpeg" alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/90 mb-4 block">MARCA FITNESSWEAR</span>
          <h1 className="text-4xl sm:text-6xl font-light tracking-widest text-white uppercase mb-8 leading-tight font-serif not-italic">ESCULPIDO PARA O MOVIMENTO</h1>
          <button className="bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase px-12 py-4 hover:bg-black hover:text-white transition-all rounded-none duration-300 cursor-pointer">CONFIRA O DROP</button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h2 className="text-lg font-bold tracking-[0.25em] uppercase text-black">COLEÇÃO BRAZILIAN</h2>
          <p className="text-xs text-zinc-400 tracking-wide mt-1">Clique em qualquer peça para ver os detalhes</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {produtosBrazilian.map((prod) => {
            const isEsgotado = prod.estoque === 0;
            const corAtual = corSelecionadaPorProduto[prod.id] || (prod.cores && prod.cores[0]);
            const fotoCorrespondente = prod.imagens.find(img => img.cor === corAtual);
            const imagemAtual = fotoCorrespondente ? fotoCorrespondente.url : prod.imagens[0].url;

            return (
              <div 
                key={prod.id} 
                onClick={() => setProdutoSelecionado({ ...prod, corSelecionada: corAtual })}
                className="group flex flex-col relative cursor-pointer"
              >
                <div className="aspect-[3/4] w-full bg-[#F6F6F6] relative flex items-center justify-center overflow-hidden">
                  {isEsgotado && (
                    <span className="absolute top-3 left-3 bg-[#B0B0B0] text-white text-[9px] tracking-wider uppercase px-2 py-0.5 font-medium z-10">ESGOTADO</span>
                  )}
                  <img src={imagemAtual} alt={prod.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 duration-500 transition-all" />
                </div>

                <div className="mt-4 flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  {prod.cores && prod.cores.map((corHex, idx) => (
                    <button 
                      key={idx}
                      onClick={(e) => selecionarCorProduto(prod.id, corHex, e)}
                      style={{ backgroundColor: corHex }} 
                      className={`w-3.5 h-3.5 rounded-full block cursor-pointer transition-transform ${
                        corAtual === corHex ? 'scale-125 ring-1 ring-black ring-offset-2' : 'border border-zinc-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-2.5 flex flex-col space-y-0.5 text-left">
                  <h3 className="text-sm font-normal text-zinc-700 tracking-wide">{prod.nome}</h3>
                  <p className="text-sm font-bold text-black">R$ {prod.preco}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden relative animate-fade-in grid grid-cols-1 md:grid-cols-2">
            
            <button 
              onClick={() => { setProdutoSelecionado(null); setFreteResultado(null); setCep(""); }} 
              className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="bg-zinc-100 aspect-[3/4] relative">
              <img 
                src={produtoSelecionado.imagens.find(img => img.cor === produtoSelecionado.corSelecionada)?.url || produtoSelecionado.imagens[0].url} 
                alt={produtoSelecionado.nome} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-normal tracking-tight text-zinc-900">{produtoSelecionado.nome}</h2>
                <p className="text-xl font-bold text-black">R$ {produtoSelecionado.preco}</p>
                
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Cor Selecionada</label>
                  <div className="flex gap-2">
                    {produtoSelecionado.cores.map((corHex, idx) => (
                      <button
                        key={idx}
                        onClick={() => setProdutoSelecionado({ ...produtoSelecionado, corSelecionada: corHex })}
                        style={{ backgroundColor: corHex }}
                        className={`w-6 h-6 rounded-full border cursor-pointer ${produtoSelecionado.corSelecionada === corHex ? 'ring-2 ring-black ring-offset-2' : 'border-zinc-300'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Tamanho</label>
                  <div className="flex gap-2">
                    {['P', 'M', 'G', 'GG'].map(tam => (
                      <button
                        key={tam}
                        onClick={() => setTamanhoEscolhido(tam)}
                        className={`w-10 h-10 rounded border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${tamanhoEscolhido === tam ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'}`}
                      >
                        {tam}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Calcular Frete</label>
                  <form onSubmit={calcularFrete} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Digite o CEP" 
                      maxLength="8"
                      value={cep} 
                      onChange={(e) => setCep(e.target.value)} 
                      className="border border-zinc-200 rounded px-3 py-1.5 text-xs flex-1 focus:outline-none focus:border-black"
                    />
                    <button type="submit" className="bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-1.5 rounded text-xs font-medium uppercase tracking-wider cursor-pointer">OK</button>
                  </form>
                  {freteResultado && (
                    <div className="mt-2 text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded border border-zinc-100">
                      <p>Envio para o CEP informado:</p>
                      <p className="font-bold text-black mt-0.5">R$ {freteResultado.valor} — Prazo: {freteResultado.prazo}</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => adicionarAoCarrinho(produtoSelecionado, produtoSelecionado.corSelecionada, tamanhoEscolhido)}
                className="w-full bg-black text-white py-3.5 rounded text-xs font-medium tracking-widest uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Adicionar à Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {isSacolaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-left">
            
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-sm uppercase tracking-widest font-bold">Sua Sacola ({carrinho.reduce((a, b) => a + b.qtd, 0)})</h3>
              <button onClick={() => setIsSacolaAberta(false)} className="text-zinc-400 hover:text-black text-xl cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {carrinho.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-20 uppercase tracking-widest">Sua sacola está vazia.</p>
              ) : (
                carrinho.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center pb-4 border-b border-zinc-100">
                    <img src={item.imagemCapa} alt={item.nome} className="w-16 h-20 object-cover rounded bg-zinc-100" />
                    <div className="flex-1">
                      <h4 className="text-xs font-medium text-zinc-900">{item.nome}</h4>
                      <p className="text-[11px] text-zinc-400">Tam: {item.tamanho} | Qtd: {item.qtd}</p>
                      <p className="text-xs font-bold text-black mt-1">R$ {item.preco}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrinho.length > 0 && (
              <div className="p-6 border-t border-zinc-100 space-y-4 bg-zinc-50">
                <div className="flex justify-between text-sm font-bold">
                  <span>Subtotal:</span>
                  <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  onClick={finalizarWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-black text-white py-16 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black tracking-[0.3em] uppercase">BOO</h4>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">ALTA QUALIDADE E ESTILO LUXUOSO</p>
          </div>
          <div className="text-center md:text-right text-xs text-zinc-400 tracking-wider font-light space-y-1">
            <p>© 2026 BOO SPORTWEAR</p>
            <p className="text-[10px] text-zinc-500">Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
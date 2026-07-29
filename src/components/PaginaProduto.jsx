export default function PaginaProduto({
  produto,
  imagensModal,
  indiceImagemModal,
  setIndiceImagemModal,
  tamanhoEscolhido,
  setTamanhoEscolhido,
  cep,
  setCep,
  freteResultado,
  onCalcularFrete,
  lojaAberta,
  onAdicionarAoCarrinho,
  onVoltar,
  produtosRelacionados,
  onSelecionarProdutoRelacionado
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Botão de Voltar */}
      <button 
        onClick={onVoltar}
        className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500 hover:text-black flex items-center gap-2"
      >
        ← Voltar para a loja
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Galeria de Imagens */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden border">
            <img 
              src={imagensModal[indiceImagemModal]?.url || produto.imgUrl} 
              alt={produto.nome}
              className="w-full h-full object-cover transition-opacity duration-300" 
            />
          </div>
          {imagensModal.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagensModal.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndiceImagemModal(idx)}
                  className={`w-20 aspect-[3/4] rounded border-2 overflow-hidden flex-shrink-0 ${
                    indiceImagemModal === idx ? "border-black" : "border-transparent opacity-60"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">{produto.categoria}</span>
            <h1 className="text-3xl font-bold mt-1 text-zinc-900">{produto.nome}</h1>
            <p className="text-2xl font-semibold mt-3 text-zinc-900">
              R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
            </p>
          </div>

          <p className="text-zinc-600 text-sm leading-relaxed">{produto.descricao}</p>

          {/* Seleção de Tamanho */}
          {produto.tamanhos?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Tamanho</label>
              <div className="flex gap-2">
                {produto.tamanhos.map((tam) => (
                  <button
                    key={tam}
                    onClick={() => setTamanhoEscolhido(tam)}
                    className={`w-12 h-12 rounded border text-sm font-semibold transition-all ${
                      tamanhoEscolhido === tam
                        ? "bg-black text-white border-black"
                        : "bg-white text-zinc-800 border-zinc-300 hover:border-black"
                    }`}
                  >
                    {tam}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cálculo de Frete (Sem Ícone no Botão OK) */}
          <div className="border-t border-b py-4 my-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Calcular Frete</label>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
              <button
                onClick={onCalcularFrete}
                className="bg-zinc-900 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-black transition-colors"
              >
                OK
              </button>
            </div>
            {freteResultado && (
              <div className="mt-3 text-sm text-zinc-700 bg-zinc-50 p-3 rounded">
                Frete: <strong>R$ {freteResultado.valor?.toFixed(2).replace('.', ',')}</strong> ({freteResultado.prazo} dias úteis)
              </div>
            )}
          </div>

          {/* Botão de Adicionar ao Carrinho */}
          <button
            disabled={!lojaAberta}
            onClick={onAdicionarAoCarrinho}
            className={`w-full py-4 uppercase tracking-widest text-sm font-bold rounded-md transition-all ${
              lojaAberta 
                ? "bg-black text-white hover:bg-zinc-800" 
                : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {lojaAberta ? "Adicionar à Sacola" : "Loja Fechada"}
          </button>
        </div>
      </div>

      {/* Produtos Relacionados */}
      {produtosRelacionados.length > 0 && (
        <section className="mt-20 border-t pt-12">
          <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-8">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {produtosRelacionados.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelecionarProdutoRelacionado(item)}
                className="group cursor-pointer border rounded-lg overflow-hidden p-3 transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[3/4] bg-zinc-100 rounded overflow-hidden mb-3">
                  <img src={item.imgUrl} alt={item.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-sm text-zinc-800 group-hover:underline truncate">{item.nome}</h3>
                <p className="text-sm font-bold text-zinc-900 mt-1">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
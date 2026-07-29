export default function PaginaCarrinho({
  etapaSacola,
  onVoltarParaLoja,
  carrinho,
  onRemover,
  totalCarrinho,
  totalComFrete,
  freteResultado,
  onIrParaEntrega,
  dadosEntrega,
  onChangeEntrega,
  formaPagamento,
  setFormaPagamento,
  erroPedido,
  enviandoPedido,
  onFinalizarPedido,
  onVoltarParaCarrinho,
  numeroPedido,
  onReiniciarSacola
}) {
  if (numeroPedido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="bg-emerald-50 text-emerald-800 p-8 rounded-xl border border-emerald-200">
          <h2 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h2>
          <p className="text-sm mb-4">Número do seu pedido: <strong>#{numeroPedido}</strong></p>
          <button
            onClick={onReiniciarSacola}
            className="mt-4 px-6 py-3 bg-black text-white text-xs uppercase font-bold tracking-widest rounded-md"
          >
            Voltar para a Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Sua Sacola</h1>
        <button onClick={onVoltarParaLoja} className="text-sm text-zinc-500 hover:text-black uppercase font-semibold">
          Continuar Comprando
        </button>
      </div>

      {carrinho.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-6">Sua sacola está vazia.</p>
          <button onClick={onVoltarParaLoja} className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-md">
            Ver Produtos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Itens ou Dados de Entrega */}
          <div className="lg:col-span-2 space-y-6">
            {etapaSacola === "carrinho" ? (
              <div className="space-y-4">
                {carrinho.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border p-4 rounded-lg bg-white items-center">
                    <img src={item.imgUrl} alt={item.nome} className="w-20 h-24 object-cover rounded bg-zinc-100" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900">{item.nome}</h3>
                      <p className="text-xs text-zinc-500 mt-1">Tamanho: {item.tamanho}</p>
                      <p className="font-bold text-sm mt-2">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button 
                      onClick={() => onRemover(idx)} 
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border p-6 rounded-lg bg-white space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Dados de Entrega</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={dadosEntrega.nome}
                    onChange={(e) => onChangeEntrega('nome', e.target.value)}
                    className="border p-2.5 text-sm rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={dadosEntrega.telefone}
                    onChange={(e) => onChangeEntrega('telefone', e.target.value)}
                    className="border p-2.5 text-sm rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Endereço e Número"
                    value={dadosEntrega.endereco}
                    onChange={(e) => onChangeEntrega('endereco', e.target.value)}
                    className="border p-2.5 text-sm rounded w-full sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={dadosEntrega.cidade}
                    onChange={(e) => onChangeEntrega('cidade', e.target.value)}
                    className="border p-2.5 text-sm rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={dadosEntrega.estado}
                    onChange={(e) => onChangeEntrega('estado', e.target.value)}
                    className="border p-2.5 text-sm rounded w-full"
                  />
                </div>

                <h2 className="text-lg font-bold border-b pt-4 pb-3">Forma de Pagamento</h2>
                <div className="flex gap-4">
                  {['pix', 'cartao'].map((forma) => (
                    <button
                      key={forma}
                      onClick={() => setFormaPagamento(forma)}
                      className={`flex-1 py-3 border rounded text-sm font-bold uppercase tracking-wider ${
                        formaPagamento === forma ? "border-black bg-zinc-900 text-white" : "border-zinc-300 bg-white"
                      }`}
                    >
                      {forma === 'pix' ? 'Pix' : 'Cartão de Crédito'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Resumo do Pedido */}
          <div className="border p-6 rounded-lg bg-zinc-50 h-fit space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Resumo do Pedido</h2>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
            </div>
            {freteResultado && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Frete</span>
                <span className="font-semibold">R$ {freteResultado.valor?.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span>
            </div>

            {erroPedido && <p className="text-xs text-red-600">{erroPedido}</p>}

            {etapaSacola === "carrinho" ? (
              <button
                onClick={onIrParaEntrega}
                className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors"
              >
                Ir para a Entrega
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  disabled={enviandoPedido}
                  onClick={onFinalizarPedido}
                  className="w-full py-3.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-emerald-800 transition-colors"
                >
                  {enviandoPedido ? "Finalizando..." : "Confirmar Pedido"}
                </button>
                <button
                  onClick={onVoltarParaCarrinho}
                  className="w-full py-2 text-zinc-600 text-xs font-semibold hover:underline"
                >
                  Voltar para os itens
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
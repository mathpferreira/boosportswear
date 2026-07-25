import React from 'react';
import { X, Trash2, Plus, Minus, Lock } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onRemoveItem }) {
  const freeShippingThreshold = 600;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const diffToFreeShipping = freeShippingThreshold - subtotal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-[#1A1A1A]/30 backdrop-blur-xs" />

      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#FBFBFA] shadow-2xl flex flex-col justify-between">
        {/* Header do Drawer */}
        <div className="p-6 border-b border-[#EFECE6] flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-wider text-[#1A1A1A]">Sua Sacola</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F2EB] rounded-full transition-colors">
            <X className="h-5 w-5 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Frete Grátis Progress Bar */}
        <div className="px-6 py-4 bg-[#F5F2EB] border-b border-[#EFECE6]">
          {diffToFreeShipping > 0 ? (
            <div>
              <p className="text-xs text-[#1A1A1A]/80 mb-2 leading-relaxed">
                Falta apenas <strong className="font-semibold">R$ {diffToFreeShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para ganhar <strong className="font-semibold">Frete Grátis</strong>!
              </p>
              <div className="w-full bg-[#EFECE6] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1A1A1A] h-full transition-all duration-500" 
                  style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }} 
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-green-700 font-medium">✨ Parabéns! Você garantiu Frete Grátis no seu pedido!</p>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-sm text-[#1A1A1A]/50 font-light mb-4">Sua sacola de compras está vazia.</p>
              <button onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5">
                Voltar à Vitrine
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.color.name}-${item.size}`} className="flex space-x-4 border-b border-[#EFECE6]/40 pb-4">
                <img
                  src={item.color.img}
                  alt={item.name}
                  className="w-20 h-24 object-cover object-center bg-[#F5F2EB] rounded-sm flex-shrink-0"
                />
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between">
                      <h3 className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">{item.name}</h3>
                      <button 
                        onClick={() => onRemoveItem(item.id, item.color.name, item.size)}
                        className="text-[#1A1A1A]/40 hover:text-red-500 transition-colors ml-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/50 mt-1 uppercase tracking-wider">
                      Cor: {item.color.name} | Tam: {item.size}
                    </p>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    {/* Contador de Quantidade */}
                    <div className="flex items-center border border-[#EFECE6] rounded-sm">
                      <button 
                        onClick={() => onUpdateQty(item.id, item.color.name, item.size, item.quantity - 1)}
                        className="p-1 hover:bg-[#F5F2EB] text-[#1A1A1A]/60"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-medium text-[#1A1A1A]">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.id, item.color.name, item.size, item.quantity + 1)}
                        className="p-1 hover:bg-[#F5F2EB] text-[#1A1A1A]/60"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer do Checkout */}
        <div className="p-6 border-t border-[#EFECE6] bg-[#FBFBFA]">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Subtotal</span>
            <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs text-[#1A1A1A]/50 mb-6">
            <span>Frete</span>
            <span>{subtotal >= freeShippingThreshold ? 'Grátis' : 'Calculado no Checkout'}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            className="w-full bg-[#1A1A1A] hover:bg-black disabled:bg-[#1A1A1A]/40 text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-sm flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            <Lock className="h-4 w-4" />
            <span>Finalizar Compra Segura</span>
          </button>
        </div>

      </div>
    </div>
  );
}

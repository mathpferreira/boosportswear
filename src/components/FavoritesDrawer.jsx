import React from 'react';
import { X, Heart, ShoppingBag } from 'lucide-react';

export default function FavoritesDrawer({ isOpen, onClose, favorites, onRemoveFav, onMoveToCart }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-[#1A1A1A]/30 backdrop-blur-xs" />

      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#FBFBFA] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#EFECE6] flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-wider text-[#1A1A1A] flex items-center gap-2">
            <Heart className="h-5 w-5 fill-[#1A1A1A]" />
            Lista de Desejos
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F2EB] rounded-full transition-colors">
            <X className="h-5 w-5 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-sm text-[#1A1A1A]/50 font-light">Sua lista de desejos está vazia.</p>
            </div>
          ) : (
            favorites.map((product) => (
              <div key={product.id} className="flex space-x-4 border-b border-[#EFECE6]/40 pb-4">
                <img
                  src={product.colors[0].img}
                  alt={product.name}
                  className="w-16 h-20 object-cover object-center bg-[#F5F2EB] rounded-sm flex-shrink-0"
                />
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-semibold text-[#1A1A1A]">{product.name}</h3>
                      <button 
                        onClick={() => onRemoveFav(product)}
                        className="text-[10px] text-red-500 uppercase tracking-widest font-semibold hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    <p className="text-xs font-medium text-[#1A1A1A] mt-1">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <button
                    onClick={() => onMoveToCart(product)}
                    className="w-full mt-3 bg-transparent border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[10px] uppercase tracking-widest font-semibold py-2 rounded-sm transition-colors flex items-center justify-center space-x-1"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>Mover para Sacola</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

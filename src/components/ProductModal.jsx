import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, Star } from 'lucide-react';

export default function ProductModal({ product, initialColorIdx, onClose, onAddToCart, onToggleFav, isFav }) {
  const [activeColorIdx, setActiveColorIdx] = useState(initialColorIdx);
  const [selectedSize, setSelectedSize] = useState('');

  const activeColor = product.colors[activeColorIdx];

  useEffect(() => {
    setActiveColorIdx(initialColorIdx);
    setSelectedSize(product.sizes[0] || '');
  }, [product, initialColorIdx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dimmer */}
      <div onClick={onClose} className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="relative bg-[#FBFBFA] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl flex flex-col md:flex-row">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#1A1A1A] transition-colors shadow-sm">
          <X className="h-5 w-5" />
        </button>

        {/* Galeria de Fotos */}
        <div className="w-full md:w-1/2 bg-[#F5F2EB] aspect-[4/5] md:aspect-auto">
          <img
            src={activeColor.img}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Detalhes do Produto */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-semibold mb-2 block">
              {product.category}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] mb-3 leading-tight">
              {product.name}
            </h2>

            {/* Avaliações */}
            <div className="flex items-center space-x-1.5 mb-6">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-[#1A1A1A]">{product.rating}</span>
              <span className="text-xs text-[#1A1A1A]/40">({product.reviews} avaliações do studio)</span>
            </div>

            <p className="font-serif text-2xl font-light text-[#1A1A1A] mb-6">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>

            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-light mb-8">
              {product.description}
            </p>

            {/* Seletor de Cores */}
            <div className="mb-6">
              <span className="text-xs font-semibold text-[#1A1A1A] block mb-3 uppercase tracking-wider">
                Cor: {activeColor.name}
              </span>
              <div className="flex space-x-3">
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    onClick={() => setActiveColorIdx(idx)}
                    style={{ backgroundColor: color.code }}
                    className={`w-6 h-6 rounded-full border transition-all duration-200 ${
                      activeColorIdx === idx 
                        ? 'border-[#1A1A1A] scale-125 ring-2 ring-[#1A1A1A]/15' 
                        : 'border-transparent hover:scale-110'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Seletor de Tamanhos */}
            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Tamanho</span>
                <button className="text-xs text-[#1A1A1A]/50 underline hover:text-[#1A1A1A] transition-colors">
                  Guia de Tamanhos
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-xs border rounded-sm transition-all ${
                      selectedSize === size
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-medium'
                        : 'border-[#EFECE6] bg-transparent text-[#1A1A1A] hover:border-[#1A1A1A]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ações de Botões */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => {
                onAddToCart(product, activeColor, selectedSize);
                onClose();
              }}
              className="flex-grow bg-[#1A1A1A] hover:bg-black text-white text-xs uppercase tracking-widest font-semibold py-4 px-6 rounded-sm flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Adicionar ao Carrinho</span>
            </button>

            <button
              onClick={() => onToggleFav(product)}
              className="p-4 border border-[#EFECE6] hover:border-[#1A1A1A] rounded-sm transition-colors text-[#1A1A1A]"
            >
              <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500 border-none' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

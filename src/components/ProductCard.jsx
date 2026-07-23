import React, { useState, useEffect } from 'react';
import { Eye, Heart, Plus } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct, onAddToCart, onToggleFav, isFav }) {
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const activeColor = product.colors[activeColorIdx];

  // Garante que o index resete caso os dados do produto mudem de forma inesperada
  useEffect(() => {
    setActiveColorIdx(0);
  }, [product]);

  return (
    <div className="group relative bg-[#FBFBFA] flex flex-col justify-between transition-all duration-300">
      
      {/* Imagem do Produto */}
      <div className="relative w-full aspect-[3/4] bg-[#F5F2EB] overflow-hidden rounded-md mb-4">
        <img
          src={activeColor.img}
          alt={`${product.name} - ${activeColor.name}`}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge de Categoria */}
        <span className="absolute top-3 left-3 bg-[#FBFBFA]/90 backdrop-blur-sm text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm text-[#1A1A1A] font-medium shadow-sm">
          {product.category}
        </span>

        {/* Botão de Favoritar */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(product); }}
          className="absolute top-3 right-3 p-2 bg-[#FBFBFA]/90 backdrop-blur-sm rounded-full shadow-sm text-[#1A1A1A] hover:bg-white transition-colors"
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#1A1A1A]/80'}`} />
        </button>

        {/* Overlay de Interações Rápidas */}
        <div className="absolute inset-0 bg-[#1A1A1A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => onSelectProduct(product, activeColorIdx)}
              className="bg-[#FBFBFA] hover:bg-white text-[#1A1A1A] p-3 rounded-full shadow-lg transition-transform hover:scale-110"
              title="Detalhes Rápidos"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAddToCart(product, activeColor, product.sizes[0] || 'Tamanho Único')}
              className="bg-[#1A1A1A] hover:bg-black text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110"
              title="Adicionar ao Carrinho"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info do Card */}
      <div className="flex flex-col flex-grow">
        {/* Swatch de Cores Ativo */}
        <div className="flex space-x-2 mb-2">
          {product.colors.map((color, idx) => (
            <button
              key={color.name}
              onClick={() => setActiveColorIdx(idx)}
              style={{ backgroundColor: color.code }}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                activeColorIdx === idx 
                  ? 'border-[#1A1A1A] scale-125 ring-1 ring-[#1A1A1A]/20' 
                  : 'border-transparent hover:scale-110'
              }`}
              title={color.name}
            />
          ))}
        </div>

        <h3 className="text-sm font-medium text-[#1A1A1A] mb-1 leading-tight line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-xs text-[#1A1A1A]/60 font-light mb-1">
          {activeColor.name}
        </p>

        <p className="text-sm font-medium mt-auto text-[#1A1A1A]">
          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

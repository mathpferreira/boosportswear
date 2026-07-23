import React from 'react';
import { Search, ShoppingBag, Heart, Menu } from 'lucide-react';

export default function Navbar({ 
  cartCount, 
  favCount, 
  onOpenCart, 
  onOpenFavs, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory 
}) {
  const categories = ['Todos', 'Feminino', 'Masculino', 'Novidades', 'Equipamentos'];

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/80 backdrop-blur-md border-b border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="font-serif text-2xl tracking-[0.2em] font-medium text-[#1A1A1A]">
              AURA
            </span>
            <span className="font-serif text-xs tracking-widest text-[#D4CFC5] ml-2 self-end mb-1">
              STUDIO
            </span>
          </div>

          {/* Categorias (Desktop) */}
          <nav className="hidden md:flex space-x-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs tracking-widest uppercase transition-colors duration-200 ${
                  (selectedCategory === cat || (cat === 'Todos' && selectedCategory === ''))
                    ? 'text-[#1A1A1A] font-semibold border-b border-[#1A1A1A] pb-1'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Busca & Ícones */}
          <div className="flex items-center space-x-6">
            
            {/* Barra de Busca Slim */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder="Buscar no studio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F5F2EB] text-xs px-4 py-2 pl-9 rounded-full border border-transparent focus:outline-none focus:border-[#D4CFC5] transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1A1A1A]/40" />
            </div>

            {/* Favoritos */}
            <button onClick={onOpenFavs} className="relative p-1 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors">
              <Heart className="h-5 w-5" />
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {favCount}
                </span>
              )}
            </button>

            {/* Sacola/Carrinho */}
            <button onClick={onOpenCart} className="relative p-1 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

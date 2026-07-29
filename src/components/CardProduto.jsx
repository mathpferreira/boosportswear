import { useState, useEffect } from 'react';

export default function CardProduto({ produto, onAbrirModal }) {
  const [indiceImg, setIndiceImg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fotos = produto.imagens?.length > 0 
    ? produto.imagens 
    : [{ url: produto.imgUrl }];

  useEffect(() => {
    let timer;
    if (isHovered && fotos.length > 1) {
      timer = setInterval(() => {
        setIndiceImg((prev) => (prev + 1) % fotos.length);
      }, 1200); // Alterna a cada 1.2 segundos
    } else {
      setIndiceImg(0);
    }
    return () => clearInterval(timer);
  }, [isHovered, fotos.length]);

  return (
    <div
      onClick={() => onAbrirModal(produto)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col justify-between"
    >
      <div className="aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden relative">
        <img
          src={fotos[indiceImg]?.url || produto.imgUrl}
          alt={produto.nome}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
        />
      </div>

      <div className="mt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{produto.categoria}</span>
        <h3 className="text-sm font-semibold text-zinc-800 group-hover:underline truncate">{produto.nome}</h3>
        <p className="text-sm font-bold text-zinc-900 mt-0.5">
          R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
}
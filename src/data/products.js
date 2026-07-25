// Banco de dados dos produtos da loja (inspirado na Alo Yoga)
export const products = [
  {
    id: 1,
    name: 'Top Alabaster Scoop Neck',
    category: 'Feminino',
    price: 389.00,
    rating: 4.8,
    reviews: 124,
    description: 'Top confeccionado em tecido de altíssima compressão e toque aveludado. Ideal para yoga, pilates ou para compor um look streetwear minimalista.',
    colors: [
      { name: 'Alabaster Off-white', code: '#F5F2EB', img: '[https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Pure Black', code: '#1A1A1A', img: '[https://images.unsplash.com/photo-134367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-134367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Soft Sage', code: '#A3B19B', img: '[https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['XP', 'P', 'M', 'G', 'XG']
  },
  {
    id: 2,
    name: 'Legging High-Waist Airbrush',
    category: 'Feminino',
    price: 549.00,
    rating: 4.9,
    reviews: 312,
    description: 'Nossa clássica legging modeladora de cintura alta. Sem costuras laterais para máximo conforto, oferecendo efeito lifting natural.',
    colors: [
      { name: 'Soft Sage', code: '#A3B19B', img: '[https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Alabaster Off-white', code: '#F5F2EB', img: '[https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Pure Black', code: '#1A1A1A', img: '[https://images.unsplash.com/photo-1506126279646-a9af08a63fbe?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1506126279646-a9af08a63fbe?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['XP', 'P', 'M', 'G']
  },
  {
    id: 3,
    name: 'Jaqueta Studio Bomber Unissex',
    category: 'Novidades',
    price: 899.00,
    rating: 4.7,
    reviews: 68,
    description: 'Uma jaqueta bomber leve de caimento oversized e resistente à água. Perfeita para transição fluida entre a prática de exercícios e a cidade.',
    colors: [
      { name: 'Pure Black', code: '#1A1A1A', img: '[https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Warm Sand', code: '#D4CFC5', img: '[https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['P', 'M', 'G', 'XG']
  },
  {
    id: 4,
    name: 'Casaco Hoodie Chill Oversized',
    category: 'Masculino',
    price: 649.00,
    rating: 4.9,
    reviews: 95,
    description: 'Moletom francês ultra-premium com toque macio escovado. Conforto incomparável e design estruturado minimalista.',
    colors: [
      { name: 'Warm Sand', code: '#D4CFC5', img: '[https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Alabaster Off-white', code: '#F5F2EB', img: '[https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['P', 'M', 'G', 'XG']
  },
  {
    id: 5,
    name: 'Calça Studio Sweatpant Premium',
    category: 'Masculino',
    price: 599.00,
    rating: 4.6,
    reviews: 54,
    description: 'Modelagem moderna afunilada, com bolsos embutidos invisíveis e tecido tecnológico respirável de alta durabilidade.',
    colors: [
      { name: 'Warm Sand', code: '#D4CFC5', img: '[https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Pure Black', code: '#1A1A1A', img: '[https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['P', 'M', 'G', 'XG']
  },
  {
    id: 6,
    name: 'Tapete de Yoga Pro Grip Warrior',
    category: 'Equipamentos',
    price: 789.00,
    rating: 5.0,
    reviews: 245,
    description: 'Tapete de borracha natural com aderência seca inigualável. Amortecimento ideal para proteção de articulações em asanas exigentes.',
    colors: [
      { name: 'Soft Sage', code: '#A3B19B', img: '[https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=800)' },
      { name: 'Pure Black', code: '#1A1A1A', img: '[https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=800)' }
    ],
    sizes: ['Tamanho Único']
  }
];

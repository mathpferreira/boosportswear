import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  FiUser, FiSearch, FiShoppingBag, FiMenu, FiX,
  FiInstagram, FiMail, FiMapPin, FiCreditCard,
  FiShield, FiPackage, FiChevronRight
} from 'react-icons/fi';

import AuthCard from "../components/AuthCard";
import { API_URL } from "../config/api";
import logo from "../assets/logo.png";

// COMPONENTE: Card do Produto
function CardProduto({ produto, onAbrir }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fotos = produto.imagens?.length > 0 ? produto.imagens : [{ url: produto.imgUrl }];

  useEffect(() => {
    let timer;
    if (isHovered && fotos.length > 1) {
      timer = setInterval(() => {
        setImgIndex((prev) => (prev + 1) % fotos.length);
      }, 1200);
    } else {
      setImgIndex(0);
    }
    return () => clearInterval(timer);
  }, [isHovered, fotos.length]);

  return (
    <div 
      className="group cursor-pointer flex flex-col justify-between h-full"
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => onAbrir(produto)} 
        className="aspect-[3/4] bg-zinc-100 rounded overflow-hidden mb-4 relative"
      >
        <img
          key={`${produto.id}-${imgIndex}`}
          src={fotos[imgIndex]?.url || produto.imgUrl} 
          alt={produto.nome} 
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 animate-imageSwap" 
        />
      </div>

      <div className="space-y-1.5">
        {produto.categoria && (
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{produto.categoria}</p>
        )}
        {produto.ultimaPeca && (
          <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Últimas peças</p>
        )}
        <h4 onClick={() => onAbrir(produto)} className="text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:text-black">
          {produto.nome}
        </h4>
        <p className="text-xs font-bold text-zinc-900">
          R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisivel(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`${className} reveal-section ${visivel ? 'is-visible' : ''}`}>{children}</div>;
}

// COMPONENTE PRINCIPAL: Loja
export default function Loja() {
  const { slugId: produtoSlugRota } = useParams();
  const [produtosBrazilian, setProdutosBrazilian] = useState([]);
  
  // Controle de visão
  const [visaoAtual, setVisaoAtual] = useState('home'); 

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [tamanhoEscolhido, setTamanhoEscolhido] = useState("M");
  const [indiceImagemModal, setIndiceImagemModal] = useState(0);
  
  const [carrinho, setCarrinho] = useState([]);
  const [etapaSacola, setEtapaSacola] = useState("carrinho");
  const [cep, setCep] = useState("");
  const [freteResultado, setFreteResultado] = useState(null);

  // Catálogo — filtro e busca
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [isBuscaAberta, setIsBuscaAberta] = useState(false);
  const [isSugestoesBuscaAberta, setIsSugestoesBuscaAberta] = useState(false);

  // Menu mobile e Menu do Usuário
  const [isMenuAberto, setIsMenuAberto] = useState(false);
  const [isUserMenuAberto, setIsUserMenuAberto] = useState(false); 

  // Login e Cadastro (Lógica Integrada do Login.jsx)
  const [isLoginAberto, setIsLoginAberto] = useState(false);
  const [isRegistro, setIsRegistro] = useState(false); 
  const [nomeRegistro, setNomeRegistro] = useState(""); 
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [aceitouTermosLogin, setAceitouTermosLogin] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [erroLogin, setErroLogin] = useState(null);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [avisoConta, setAvisoConta] = useState(null);

  // Checkout interno
  const [dadosEntrega, setDadosEntrega] = useState({
    nome: "", email: "", telefone: "", cep: "", rua: "", numero: "",
    complemento: "", bairro: "", cidade: "", estado: ""
  });
  const [formaPagamento, setFormaPagamento] = useState("cartao");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState(null);
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [erroCupom, setErroCupom] = useState(null);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);
  const [miniCarrinhoAberto, setMiniCarrinhoAberto] = useState(false);

  // Meus Pedidos
  const [meusPedidos, setMeusPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const [erroPedidos, setErroPedidos] = useState(null);

  // Minha Conta
  const [dadosConta, setDadosConta] = useState({
    nome: "",
    email: "",
    telefone: "",
    enderecoPadrao: {
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: ""
    },
    preferenciasConta: {
      novidadesEmail: true,
      statusPedidoWhatsApp: true,
      statusPedidoEmail: true
    }
  });
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [mensagemConta, setMensagemConta] = useState(null);

  // Configurações da Loja
  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    instagramUrl: "https://instagram.com/boosportwear",
    emailSuporte: "contato@boosportswear.com.br",
    lojaAberta: true,
    frete: {
      ativo: true,
      valorBase: 19.9,
      valorGratisApos: 250,
      prazo: "3 a 5 dias úteis"
    }
  });

  const TAMANHOS_PADRAO = ["P", "M", "G", "U"];

  const slugificarProduto = (texto = "") =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const normalizarTamanho = (label = "") =>
    String(label).toLowerCase().includes("nico") ? "U" : String(label);

  const extrairIdDaRotaProduto = (valor = "") => {
    if (!valor) return "";
    const partes = valor.split("--");
    return partes[partes.length - 1] || "";
  };

  // 1. CARREGAR USUÁRIO SALVO (Mantém logado ao dar F5)
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      setUsuarioLogado(JSON.parse(usuarioSalvo));
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'conta' || hash === 'pedidos' || hash === 'carrinho') {
      setVisaoAtual(hash);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setVisaoAtual(hash || 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const tituloOriginal = 'BOO Sportwear';
    const mensagens = [
      'Seu look novo te espera!',
      'As novidades chegaram 🛍️',
      'Volte para finalizar sua compra!',
    ];

    let indiceMensagem = 0;
    let intervalId = null;

    const trocarTitulo = () => {
      document.title = mensagens[indiceMensagem];
      indiceMensagem = (indiceMensagem + 1) % mensagens.length;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trocarTitulo();
        intervalId = window.setInterval(trocarTitulo, 1400);
        return;
      }

      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      document.title = tituloOriginal;
    };

    document.title = tituloOriginal;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = tituloOriginal;
    };
  }, []);

  useEffect(() => {
    const quantidadeCarrinho = carrinho.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const favicon = document.querySelector("link[rel='icon']") || document.querySelector("link[rel='shortcut icon']");
    if (!favicon) return;

    if (quantidadeCarrinho <= 0) {
      favicon.setAttribute('href', logo);
      return;
    }

    const img = new Image();
    img.src = logo;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(49, 15, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      const quantidadeLabel = quantidadeCarrinho > 9 ? '9+' : String(quantidadeCarrinho);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(quantidadeLabel, 49, 15);

      favicon.setAttribute('href', canvas.toDataURL('image/png'));
    };
  }, [carrinho]);

  const navegarParaVisao = (proximaVisao, { replace = false, produtoId = null, produtoNome = "" } = {}) => {
    const rotaHash = {
      home: '',
      produto: 'produto',
      carrinho: 'carrinho',
      conta: 'conta',
      pedidos: 'pedidos'
    };

    const proximoHash = rotaHash[proximaVisao] || '';
    const pathname = proximaVisao === 'produto' && produtoId
      ? `/produto/${slugificarProduto(produtoNome || produtoSelecionado?.nome || '') || 'produto'}--${produtoId}`
      : '/';
    const novaUrl = `${pathname}${proximoHash && proximaVisao !== 'produto' ? `#${proximoHash}` : ''}`;
    if (replace) {
      window.history.replaceState({ visao: proximaVisao }, '', novaUrl);
    } else {
      window.history.pushState({ visao: proximaVisao }, '', novaUrl);
    }
    setVisaoAtual(proximaVisao);
  };

  useEffect(() => {
    setIsMenuAberto(false);
    setIsUserMenuAberto(false);
  }, [visaoAtual]);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const resposta = await fetch(`${API_URL}/produtos`);
        if (resposta.ok) {
          const dados = await resposta.json();
          setProdutosBrazilian(dados);
        }
      } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
      }
    }
    carregarProdutos();
  }, []);

  useEffect(() => {
    const produtoIdRota = extrairIdDaRotaProduto(produtoSlugRota);
    if (!produtoIdRota || produtosBrazilian.length === 0) return;
    const produto = produtosBrazilian.find((item) => item.id === produtoIdRota);
    if (!produto) return;
    setProdutoSelecionado(produto);
    setTamanhoEscolhido("M");
    setIndiceImagemModal(0);
    setVisaoAtual('produto');
  }, [produtoSlugRota, produtosBrazilian]);

  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const resposta = await fetch(`${API_URL}/configuracoes`);
        if (resposta.ok) {
          const dados = await resposta.json();
          setConfigLoja(prev => ({ ...prev, ...dados }));
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
      }
    }
    carregarConfiguracoes();
  }, []);

  const categorias = useMemo(() => {
    return [...new Set(produtosBrazilian.map(p => p.categoria).filter(Boolean))];
  }, [produtosBrazilian]);

  const produtosNovidades = useMemo(() => [...produtosBrazilian].slice(0, 4), [produtosBrazilian]);
  const produtosUltimasPecas = useMemo(
    () => produtosBrazilian.filter((produto) => produto.ultimaPeca && Number(produto.estoque || 0) > 0).slice(0, 4),
    [produtosBrazilian]
  );

  const sugestoesBusca = useMemo(() => {
    const termoNormalizado = termoBusca.trim().toLowerCase();
    if (!termoNormalizado) return [];

    return produtosBrazilian
      .filter((produto) => {
        const nome = (produto.nome || "").toLowerCase();
        const categoria = (produto.categoria || "").toLowerCase();
        return nome.includes(termoNormalizado) || categoria.includes(termoNormalizado);
      })
      .slice(0, 6);
  }, [produtosBrazilian, termoBusca]);

  const produtosFiltrados = useMemo(() => {
    return produtosBrazilian.filter(produto => {
      const passaCategoria = categoriaAtiva === "Todos" || produto.categoria === categoriaAtiva;
      const passaBusca = !termoBusca || produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
      return passaCategoria && passaBusca;
    });
  }, [produtosBrazilian, categoriaAtiva, termoBusca]);

  const selecionarSugestaoBusca = (produto) => {
    setTermoBusca(produto.nome || "");
    setIsSugestoesBuscaAberta(false);
    setIsBuscaAberta(false);
    setCategoriaAtiva("Todos");
    abrirProduto(produto);
  };

  const produtosRelacionados = useMemo(() => {
    if (!produtoSelecionado) return [];
    return produtosBrazilian
      .filter(p => p.categoria === produtoSelecionado.categoria && p.id !== produtoSelecionado.id)
      .slice(0, 4);
  }, [produtoSelecionado, produtosBrazilian]);

  const abrirProduto = (produto) => {
    setProdutoSelecionado(produto);
    const tamanhosDisponiveis = Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0
      ? produto.tamanhos.map((tam) => ({ ...tam, label: normalizarTamanho(tam.label) }))
      : TAMANHOS_PADRAO.map((label) => ({ label, estoque: label === "M" ? 1 : 0 }));
    const primeiroDisponivel = tamanhosDisponiveis.find((item) => Number(item.estoque || 0) > 0);
    setTamanhoEscolhido(primeiroDisponivel?.label || "M");
    setIndiceImagemModal(0);
    navegarParaVisao('produto', { produtoId: produto.id, produtoNome: produto.nome });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const adicionarAoCarrinho = (produto, tamanho) => {
    if (!configLoja.lojaAberta) return;

    const item = {
      ...produto,
      tamanhoEscolhido: tamanho,
      cartId: `${produto.id}-${tamanho}`
    };

    setCarrinho(prev => {
      const existe = prev.find(i => i.cartId === item.cartId);
      if (existe) {
        return prev.map(i => i.cartId === item.cartId ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
    setMiniCarrinhoAberto(true);
  };

  const removerDoCarrinho = (cartId) => {
    setCarrinho(prev => prev.filter(item => item.cartId !== cartId));
  };

  const calcularFrete = () => {
    if (!cep || cep.length < 8) return;
    setFreteResultado({ valor: 19.90, prazo: "3 a 5 dias úteis" });
  };

  const buscarEnderecoPorCep = async (cepInformado) => {
    const cepLimpo = (cepInformado || "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) return null;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();
      if (dados.erro) return null;
      return {
        cep: cepLimpo,
        rua: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
        estado: dados.uf || "",
      };
    } catch (erro) {
      console.error("Erro ao buscar CEP:", erro);
      return null;
    }
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const descontoCupom = cupomAplicado?.descontoAplicado || 0;
  const totalComFrete = Math.max(totalCarrinho - descontoCupom, 0) + (freteResultado?.valor || 0);

  const calcularFreteConfigurado = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setFreteResultado({ erro: 'Informe um CEP válido.' });
      return;
    }

    setFreteResultado({ carregando: true });
    const itensCotacao = carrinho.length > 0
      ? carrinho
      : produtoSelecionado ? [{ ...produtoSelecionado, quantidade: 1 }] : [];
    const subtotalCotacao = itensCotacao.reduce((total, item) => total + Number(item.preco || 0) * Number(item.quantidade || 1), 0);

    try {
      const resposta = await fetch(`${API_URL}/frete/cotar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: cepLimpo,
          subtotal: subtotalCotacao,
          itens: itensCotacao.map((item) => ({ id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantidade || 1 })),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.message || 'Não foi possível calcular o frete.');
      const melhorOpcao = dados.opcoes?.[0];
      setFreteResultado(melhorOpcao ? { ...melhorOpcao, opcoes: dados.opcoes } : { erro: 'Nenhum frete disponível para este CEP.' });
    } catch (erro) {
      setFreteResultado({ erro: erro.message });
    }
  };

  const irParaEntrega = () => {
    if (usuarioLogado) {
      setDadosEntrega(prev => ({
        ...prev,
        nome: prev.nome || usuarioLogado.nome || "",
        email: prev.email || usuarioLogado.email || "",
        telefone: prev.telefone || dadosConta.telefone || "",
        cep: prev.cep || dadosConta.enderecoPadrao?.cep || "",
        rua: prev.rua || dadosConta.enderecoPadrao?.rua || "",
        numero: prev.numero || dadosConta.enderecoPadrao?.numero || "",
        complemento: prev.complemento || dadosConta.enderecoPadrao?.complemento || "",
        bairro: prev.bairro || dadosConta.enderecoPadrao?.bairro || "",
        cidade: prev.cidade || dadosConta.enderecoPadrao?.cidade || "",
        estado: prev.estado || dadosConta.enderecoPadrao?.estado || ""
      }));
    }
    setEtapaSacola("checkout");
  };

  const handleChangeEntrega = (campo) => (e) => {
    setDadosEntrega(prev => ({ ...prev, [campo]: e.target.value }));
  };

  const preencherCepEntrega = async () => {
    const endereco = await buscarEnderecoPorCep(dadosEntrega.cep);
    if (!endereco) return;
    setDadosEntrega(prev => ({
      ...prev,
      cep: endereco.cep,
      rua: prev.rua || endereco.rua,
      bairro: prev.bairro || endereco.bairro,
      cidade: prev.cidade || endereco.cidade,
      estado: prev.estado || endereco.estado,
    }));
  };

  const preencherCepConta = async () => {
    const endereco = await buscarEnderecoPorCep(dadosConta.enderecoPadrao?.cep);
    if (!endereco) return;
    setDadosConta(prev => ({
      ...prev,
      enderecoPadrao: {
        ...prev.enderecoPadrao,
        cep: endereco.cep,
        rua: prev.enderecoPadrao.rua || endereco.rua,
        bairro: prev.enderecoPadrao.bairro || endereco.bairro,
        cidade: prev.enderecoPadrao.cidade || endereco.cidade,
        estado: prev.enderecoPadrao.estado || endereco.estado,
      }
    }));
  };

  const aplicarCupom = async () => {
    if (!codigoCupom.trim()) return;
    setAplicandoCupom(true);
    setErroCupom(null);
    try {
      const resposta = await fetch(`${API_URL}/cupons/validar?codigo=${encodeURIComponent(codigoCupom.trim())}&subtotal=${totalCarrinho}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.message || "Cupom inválido.");
      setCupomAplicado(dados);
    } catch (erro) {
      setCupomAplicado(null);
      setErroCupom(erro.message);
    } finally {
      setAplicandoCupom(false);
    }
  };

  const removerCupom = () => {
    setCodigoCupom("");
    setCupomAplicado(null);
    setErroCupom(null);
  };

  const carregarMeusPedidos = async () => {
    setCarregandoPedidos(true);
    setErroPedidos(null);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch(`${API_URL}/meus-pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setMeusPedidos(dados);
      } else {
        setErroPedidos("Não foi possível carregar seus pedidos agora.");
      }
    } catch (erro) {
      console.error("Erro ao carregar pedidos:", erro);
      setErroPedidos("Erro de conexão ao buscar seus pedidos.");
    } finally {
      setCarregandoPedidos(false);
    }
  };

  const carregarMinhaConta = async () => {
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch(`${API_URL}/minha-conta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setDadosConta({
          nome: dados.nome || "",
          email: dados.email || "",
          telefone: dados.telefone || "",
          enderecoPadrao: {
            cep: dados.enderecoPadrao?.cep || "",
            rua: dados.enderecoPadrao?.rua || "",
            numero: dados.enderecoPadrao?.numero || "",
            complemento: dados.enderecoPadrao?.complemento || "",
            bairro: dados.enderecoPadrao?.bairro || "",
            cidade: dados.enderecoPadrao?.cidade || "",
            estado: dados.enderecoPadrao?.estado || ""
          },
          preferenciasConta: {
            novidadesEmail: dados.preferenciasConta?.novidadesEmail ?? true,
            statusPedidoWhatsApp: dados.preferenciasConta?.statusPedidoWhatsApp ?? true,
            statusPedidoEmail: dados.preferenciasConta?.statusPedidoEmail ?? true
          }
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar conta:", erro);
    }
  };

  const salvarMinhaConta = async (e) => {
    e.preventDefault();
    setSalvandoConta(true);
    setMensagemConta(null);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch(`${API_URL}/minha-conta`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dadosConta)
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.message || "Erro ao salvar.");

      setMensagemConta({ tipo: "sucesso", texto: "Dados atualizados com sucesso!" });
      const usuarioAtualizado = { ...usuarioLogado, ...dados };
      setUsuarioLogado(usuarioAtualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
    } catch (erro) {
      setMensagemConta({ tipo: "erro", texto: erro.message });
    } finally {
      setSalvandoConta(false);
    }
  };

  const statusLabels = {
    aguardando_pagamento: { texto: "Aguardando Pagamento", cor: "text-amber-600 bg-amber-50" },
    pago: { texto: "Pago", cor: "text-green-700 bg-green-50" },
    enviado: { texto: "Enviado", cor: "text-blue-700 bg-blue-50" },
    entregue: { texto: "Entregue", cor: "text-zinc-700 bg-zinc-100" },
    cancelado: { texto: "Cancelado", cor: "text-red-700 bg-red-50" }
  };

  const finalizarPedido = async (e) => {
    e.preventDefault();
    setEnviandoPedido(true);
    setErroPedido(null);
    try {
      const resposta = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: carrinho,
          entrega: dadosEntrega,
          formaPagamento,
          frete: freteResultado,
          cupom: cupomAplicado,
          total: totalComFrete,
          usuarioId: usuarioLogado?.id || null
        })
      });
      if (!resposta.ok) throw new Error("Falha ao processar pedido");
      const dados = await resposta.json();
      setNumeroPedido(dados.numeroPedido || dados.id || "—");
      setCarrinho([]);
      setCupomAplicado(null);
      setCodigoCupom("");
      setEtapaSacola("confirmado");
    } catch (erro) {
      setErroPedido("Não foi possível concluir o pedido agora. Tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  };

  const reiniciarSacola = () => {
    setEtapaSacola("carrinho");
    setNumeroPedido(null);
    navegarParaVisao('home');
  };

  const logout = () => {
    setUsuarioLogado(null);
    setIsUserMenuAberto(false);
    setAvisoConta(null);
    setMeusPedidos([]);
    setPedidoExpandido(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('@BOO:token');
    localStorage.removeItem('@BOO:usuario');
  };

  const abrirMinhaConta = async () => {
    setMensagemConta(null);
    navegarParaVisao('conta');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await Promise.allSettled([carregarMinhaConta(), carregarMeusPedidos()]);
  };

  const abrirMeusPedidos = async () => {
    setPedidoExpandido(null);
    navegarParaVisao('pedidos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await carregarMeusPedidos();
  };

  // ==========================================
  // LÓGICA DE AUTENTICAÇÃO IMPORTADA DO LOGIN.JSX
  // ==========================================
  const handleAuth = async (e) => {
    e.preventDefault();
    setCarregandoLogin(true);
    setErroLogin(null);

    // BLINDAGEM E VALIDAÇÕES DO FORMULÁRIO
    if (isRegistro) {
      const palavrasNome = nomeRegistro.trim().split(/\s+/);
      if (!aceitouTermosLogin) {
        setErroLogin('Voce precisa aceitar as Politicas da Loja.');
        setCarregandoLogin(false);
        return;
      }
      if (palavrasNome.length < 2) {
        setErroLogin('Por favor, insira seu nome e sobrenome completos.');
        setCarregandoLogin(false);
        return; // Para a execução aqui
      }
    }

    try {
      const endpoint = isRegistro ? `${API_URL}/auth/cadastro` : `${API_URL}/auth/login`;
      const body = isRegistro 
        ? JSON.stringify({ nome: nomeRegistro, email: emailLogin, senha: senhaLogin })
        : JSON.stringify({ email: emailLogin, senha: senhaLogin });

      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.message || (isRegistro ? "Erro ao criar conta. Tente outro e-mail." : "Credenciais inválidas."));
      }
      
      // Salva no LocalStorage para loja e painel compartilharem a mesma sessão
      if (dados.token) {
        localStorage.setItem('token', dados.token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        localStorage.setItem('@BOO:token', dados.token);
        localStorage.setItem('@BOO:usuario', JSON.stringify(dados.usuario));
      }

      const usuarioAutenticado = dados.usuario || { email: emailLogin, nome: nomeRegistro };
      setUsuarioLogado(usuarioAutenticado);
      setIsLoginAberto(false);
      setEmailLogin("");
      setSenhaLogin("");
      setNomeRegistro("");
      setAvisoConta({
        tipo: usuarioAutenticado.role === 'ADMIN' ? 'admin' : 'sucesso',
        texto: usuarioAutenticado.role === 'ADMIN'
          ? 'Login realizado. Seu acesso de administrador está liberado.'
          : `Bem-vinda${usuarioAutenticado.nome ? `, ${usuarioAutenticado.nome.split(' ')[0]}` : ''}. Sua área da conta foi preparada para você.`
      });
      setPedidoExpandido(null);
      navegarParaVisao('conta');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      carregarMinhaConta();
      carregarMeusPedidos();
    } catch (erro) {
      setErroLogin(erro.message);
    } finally {
      setCarregandoLogin(false);
    }
  };

  const imagensModal = produtoSelecionado?.imagens?.length > 0 
    ? produtoSelecionado.imagens 
    : (produtoSelecionado ? [{ url: produtoSelecionado.imgUrl }] : []);
  const tamanhosProdutoSelecionado = useMemo(() => {
    if (!produtoSelecionado) return [];
    if (Array.isArray(produtoSelecionado.tamanhos) && produtoSelecionado.tamanhos.length > 0) {
      return produtoSelecionado.tamanhos.map((tam) => ({ ...tam, label: normalizarTamanho(tam.label) }));
    }
    return TAMANHOS_PADRAO.map((label) => ({ label: normalizarTamanho(label), estoque: label === "M" ? 1 : 0 }));
  }, [produtoSelecionado]);
  const tamanhoSelecionadoInfo = tamanhosProdutoSelecionado.find((item) => item.label === tamanhoEscolhido);

  const isAdmin = usuarioLogado?.role === 'ADMIN';
  const totalPedidosCliente = meusPedidos.length;
  const contaCompleta = Boolean(
    dadosConta.nome &&
    dadosConta.email &&
    dadosConta.telefone &&
    dadosConta.enderecoPadrao?.cep &&
    dadosConta.enderecoPadrao?.rua &&
    dadosConta.enderecoPadrao?.numero &&
    dadosConta.enderecoPadrao?.bairro &&
    dadosConta.enderecoPadrao?.cidade &&
    dadosConta.enderecoPadrao?.estado
  );

  const inputClasses = "w-full border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black transition-colors";
  const labelClasses = "text-[10px] font-bold tracking-widest uppercase text-zinc-400 block mb-1.5";

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex flex-col justify-between">
      
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUpFade { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>

      <div>
        <div className={`text-white text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] py-2.5 px-3 sm:px-4 text-center font-medium uppercase transition-colors ${configLoja.lojaAberta ? "bg-black" : "bg-zinc-700"}`}>
          {configLoja.lojaAberta ? configLoja.fraseTopo : "LOJA TEMPORARIAMENTE FECHADA PARA NOVOS PEDIDOS"}
        </div>

        {/* Header */}
        <header className="bg-white border-b border-zinc-100 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button onClick={() => setIsMenuAberto(v => !v)} className="md:hidden cursor-pointer hover:opacity-75 transition-opacity">
                {isMenuAberto ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
              </button>
              <img
                onClick={() => navegarParaVisao('home')}
                src={logo}
                alt="BOO Sportswear"
                className="h-[22px] sm:h-9 w-auto cursor-pointer select-none"
              />
            </div>

            <div className="md:hidden flex justify-center justify-self-center text-center">
              <span className="font-serif text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-zinc-900 whitespace-nowrap">
                BOO SPORTWEAR
              </span>
            </div>

            <div className="flex items-center justify-end gap-4 sm:gap-5">
              <div className="hidden sm:flex items-center relative">
                {isBuscaAberta ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={termoBusca}
                      onFocus={() => setIsSugestoesBuscaAberta(true)}
                      onChange={(e) => {
                        setTermoBusca(e.target.value);
                        setIsSugestoesBuscaAberta(true);
                        if (visaoAtual !== 'home') setVisaoAtual('home');
                        if (e.target.value.length > 0) document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          if (!termoBusca) setIsBuscaAberta(false);
                          setIsSugestoesBuscaAberta(false);
                        }, 120);
                      }}
                      placeholder="Buscar..."
                      className="border-b border-zinc-300 focus:border-black text-xs py-1 w-48 focus:outline-none transition-colors"
                    />
                    {isSugestoesBuscaAberta && sugestoesBusca.length > 0 && (
                      <div className="absolute right-0 top-8 w-72 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden z-50">
                        {sugestoesBusca.map((produto) => (
                          <button
                            key={produto.id}
                            type="button"
                            onMouseDown={() => selecionarSugestaoBusca(produto)}
                            className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50 transition-colors"
                          >
                            <img
                              src={produto.imagens?.[0]?.url || produto.imgUrl}
                              alt={produto.nome}
                              className="w-10 h-12 rounded-md object-cover bg-zinc-100"
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-zinc-900 truncate">{produto.nome}</span>
                              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 mt-1">{produto.categoria || 'Loja'}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={() => setIsBuscaAberta(true)} className="cursor-pointer hover:opacity-75 transition-opacity">
                    <FiSearch className="text-base" />
                  </button>
                )}
              </div>

              {/* Menu do Usuário Dropdown */}
              <div className="relative">
                <button
                  onClick={() => usuarioLogado ? setIsUserMenuAberto(!isUserMenuAberto) : setIsLoginAberto(true)}
                  className="cursor-pointer hover:opacity-75 transition-opacity flex items-center"
                >
                  {usuarioLogado ? (
                    <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                      {(usuarioLogado.nome || usuarioLogado.email || "?").charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <FiUser className="text-base" />
                  )}
                </button>

                {isUserMenuAberto && usuarioLogado && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuAberto(false)}></div>
                    <div className="absolute right-0 mt-4 w-72 bg-white border border-zinc-100 rounded-lg shadow-xl py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-zinc-50 mb-2">
                        <p className="text-xs font-bold text-zinc-900 truncate">{usuarioLogado.nome || 'Cliente'}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{usuarioLogado.email}</p>
                      </div>
                      <button
                        onClick={async () => {
                          setIsUserMenuAberto(false);
                          await abrirMinhaConta();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black uppercase tracking-wider transition-colors"
                      >
                        Minha Conta
                      </button>
                      <button
                        onClick={async () => {
                          setIsUserMenuAberto(false);
                          await abrirMeusPedidos();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black uppercase tracking-wider transition-colors"
                      >
                        Meus Pedidos
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsUserMenuAberto(false);
                            window.open('/admin', '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-black uppercase tracking-wider transition-colors"
                        >
                          Painel Administrativo
                        </button>
                      )}
                      <button 
                        onClick={logout} 
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 uppercase tracking-wider mt-1 border-t border-zinc-50 transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => { navegarParaVisao('carrinho'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="relative cursor-pointer hover:opacity-75 transition-opacity"
              >
                <FiShoppingBag className="text-base" />
                {carrinho.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-fadeIn">
                    {carrinho.reduce((a, b) => a + b.quantidade, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        {isMenuAberto && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setIsMenuAberto(false)}></div>
            <aside className="md:hidden fixed left-0 top-0 z-50 h-full w-[88vw] max-w-sm bg-white shadow-2xl border-r border-zinc-200 animate-slideUpFade">
              <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100">
                <button onClick={() => setIsMenuAberto(false)} className="w-10 h-10 rounded-full border border-zinc-200 inline-flex items-center justify-center">
                  <FiX className="text-lg" />
                </button>
              </div>
              <div className="px-4 py-4 space-y-4 overflow-y-auto h-[calc(100%-73px)]">
                <div className="relative">
                  <div className="flex items-center gap-2 px-1 py-1">
                    <FiSearch className="text-sm text-zinc-400" />
                    <input
                      type="text"
                      value={termoBusca}
                      onFocus={() => setIsSugestoesBuscaAberta(true)}
                      onChange={(e) => {
                        setTermoBusca(e.target.value);
                        setIsSugestoesBuscaAberta(true);
                        if (visaoAtual !== 'home') navegarParaVisao('home');
                      }}
                      onBlur={() => {
                        window.setTimeout(() => setIsSugestoesBuscaAberta(false), 120);
                      }}
                      placeholder="Buscar produto..."
                      className="w-full bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                  {isSugestoesBuscaAberta && sugestoesBusca.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                      {sugestoesBusca.map((produto) => (
                        <button
                          key={produto.id}
                          type="button"
                          onMouseDown={() => {
                            setIsMenuAberto(false);
                            selecionarSugestaoBusca(produto);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50 transition-colors"
                        >
                          <img
                            src={produto.imagens?.[0]?.url || produto.imgUrl}
                            alt={produto.nome}
                            className="w-10 h-12 rounded-md object-cover bg-zinc-100"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-zinc-900 truncate">{produto.nome}</span>
                            <span className="block text-[10px] uppercase tracking-wider text-zinc-400 mt-1">{produto.categoria || 'Loja'}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => { navegarParaVisao('home'); setIsMenuAberto(false); }}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <p>Início</p>
                  </button>
                  <button
                    onClick={() => {
                      navegarParaVisao('carrinho');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hidden"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Sacola</p>
                    <p className="text-sm font-semibold text-zinc-900 mt-2">Ver carrinho</p>
                  </button>
                </div>

                <div className="overflow-hidden">
                  <button
                    onClick={async () => {
                      if (!usuarioLogado) {
                        setIsMenuAberto(false);
                        setIsLoginAberto(true);
                        return;
                      }
                      await abrirMinhaConta();
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Minha Conta
                  </button>
                  <button
                    onClick={async () => {
                      if (!usuarioLogado) {
                        setIsMenuAberto(false);
                        setIsLoginAberto(true);
                        return;
                      }
                      await abrirMeusPedidos();
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                  >
                    Meus Pedidos
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMenuAberto(false);
                        window.open('/admin', '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                    >
                      Painel Administrativo
                    </button>
                  )}
                </div>

                {!usuarioLogado && (
                  <button
                    onClick={() => {
                      setIsMenuAberto(false);
                      setIsLoginAberto(true);
                    }}
                    className="w-full rounded-2xl bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-widest"
                  >
                    Entrar ou criar conta
                  </button>
                )}
              </div>
            </aside>
          </>
        )}

        <div className="transition-opacity duration-300 ease-in-out">
          {visaoAtual === 'home' && (
            <>
              <section className="relative h-[52vh] sm:h-[60vh] md:h-[70vh] bg-zinc-900 flex items-center justify-center text-center text-white px-4 sm:px-6">
                <div className="max-w-2xl space-y-4 animate-slideUpFade">
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight uppercase">Performance & Estilo</h2>
                </div>
              </section>

              <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                {produtosNovidades.length > 0 && (
                  <Reveal className="mb-14"><section>
                    <div className="mb-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">Curadoria Boo</p>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-2">Novidades</h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8">
                      {produtosNovidades.map((produto) => (
                        <CardProduto key={`novo-${produto.id}`} produto={produto} onAbrir={abrirProduto} />
                      ))}
                    </div>
                  </section></Reveal>
                )}

                {produtosUltimasPecas.length > 0 && (
                  <Reveal className="mb-14"><section>
                    <div className="mb-6">
                      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Últimas Peças</h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8">
                      {produtosUltimasPecas.map((produto) => (
                        <CardProduto key={`ultimas-${produto.id}`} produto={produto} onAbrir={abrirProduto} />
                      ))}
                    </div>
                  </section></Reveal>
                )}

                <div className="flex flex-col gap-6 mb-12 border-b border-zinc-100 pb-6">
                  <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Catálogo</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setCategoriaAtiva("Todos")} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === "Todos" ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>Todos</button>
                    {categorias.map((cat) => (
                      <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${categoriaAtiva === cat ? "bg-black text-white border-black" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400 text-xs tracking-widest uppercase animate-fadeIn">Nenhum produto encontrado.</div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                    {produtosFiltrados.map((produto) => (
                      <CardProduto key={produto.id} produto={produto} onAbrir={abrirProduto} />
                    ))}
                  </div>
                )}
              </main>
            </>
          )}

          {visaoAtual === 'produto' && produtoSelecionado && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-slideUpFade">
              <button onClick={() => setVisaoAtual('home')} className="mb-8 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-black flex items-center gap-2 transition-colors">← Voltar</button>

              <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)] gap-8 lg:gap-16 items-start">
                <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
                  <div className="aspect-[4/5] max-h-[680px] bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-100">
                    <img src={imagensModal[indiceImagemModal]?.url} alt={produtoSelecionado.nome} className="w-full h-full object-cover animate-fadeIn" />
                  </div>
                  {imagensModal.length > 1 && (
                      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                      {imagensModal.map((img, idx) => (
                        <button key={idx} onClick={() => setIndiceImagemModal(idx)} className={`w-20 aspect-[3/4] rounded border-2 overflow-hidden flex-shrink-0 transition-colors ${indiceImagemModal === idx ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:sticky md:top-28 flex flex-col justify-center bg-white md:border md:border-zinc-100 md:rounded-2xl md:p-7 lg:p-9">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">{produtoSelecionado.categoria}</p>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">{produtoSelecionado.nome}</h3>
                      <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-2">R$ {Number(produtoSelecionado.preco).toFixed(2).replace('.', ',')}</p>
                    </div>

                    <div>
                      <label className={labelClasses}>Tamanho</label>
                      <div className="flex flex-wrap gap-2">
                        {tamanhosProdutoSelecionado.map((tam) => {
                          const indisponivel = Number(tam.estoque || 0) <= 0;
                          return (
                            <button
                              key={tam.label}
                              type="button"
                              disabled={indisponivel}
                              onClick={() => setTamanhoEscolhido(tam.label)}
                              className={`relative min-w-[3.25rem] h-12 px-3 border rounded text-xs font-bold cursor-pointer transition-colors overflow-hidden ${
                                tamanhoEscolhido === tam.label
                                  ? "border-black bg-black text-white"
                                  : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                              } ${indisponivel ? "opacity-50 cursor-not-allowed bg-zinc-50 text-zinc-400" : ""}`}
                            >
                              <span>{normalizarTamanho(tam.label)}</span>
                              {indisponivel && <span className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] rotate-[-35deg] bg-red-500"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-b border-zinc-100 py-6 my-6">
                      <label className={labelClasses}>Calcular Frete</label>
                       <div className="flex flex-col sm:flex-row gap-2 max-w-sm">
                        <input type="text" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} className={inputClasses} />
                        <button type="button" onClick={calcularFreteConfigurado} className="bg-black text-white hover:bg-zinc-800 px-6 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-colors">OK</button>
                      </div>
                      {freteResultado && (
                        <div className="mt-3 text-xs animate-fadeIn">
                          {freteResultado.carregando && <p className="text-zinc-500">Consultando transportadoras...</p>}
                          {freteResultado.erro && <p className="text-red-600">{freteResultado.erro}</p>}
                          {freteResultado.valor !== undefined && <p className="font-bold text-green-700">{freteResultado.nome}: R$ {freteResultado.valor.toFixed(2).replace('.', ',')} · {freteResultado.prazo}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={() => adicionarAoCarrinho(produtoSelecionado, tamanhoEscolhido)} disabled={!configLoja.lojaAberta || Number(tamanhoSelecionadoInfo?.estoque || 0) <= 0} className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors mt-8 cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed">
                    {configLoja.lojaAberta ? "Adicionar à Sacola" : "Loja Fechada no Momento"}
                  </button>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] uppercase tracking-wider font-bold text-zinc-600">
                    <div className="border border-zinc-100 rounded-xl p-4"><FiShield className="mb-2 text-base text-black" />Compra protegida</div>
                    <div className="border border-zinc-100 rounded-xl p-4"><FiPackage className="mb-2 text-base text-black" />Envio acompanhado</div>
                  </div>
                </div>
              </div>

              {produtosRelacionados.length > 0 && (
                <div className="mt-24 border-t border-zinc-100 pt-16">
                  <h3 className="text-xl font-black tracking-[0.2em] uppercase text-center mb-10">Produtos Relacionados</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {produtosRelacionados.map((item) => (
                      <CardProduto key={item.id} produto={item} onAbrir={abrirProduto} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {visaoAtual === 'carrinho' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-slideUpFade">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">{etapaSacola === "carrinho" ? "Sua Sacola" : etapaSacola === "checkout" ? "Finalizar Pedido" : "Sucesso!"}</h2>
                <button onClick={() => setVisaoAtual('home')} className="text-xs font-bold uppercase text-zinc-500 hover:text-black transition-colors text-left sm:text-right">Continuar Comprando</button>
              </div>

              {numeroPedido ? (
                <div className="text-center py-20 bg-zinc-50 rounded-lg animate-fadeIn">
                  <h4 className="text-2xl font-black uppercase mb-4 text-green-700">Pedido nº {numeroPedido} Realizado!</h4>
                  <p className="text-sm text-zinc-500 mb-8">Acompanhe os detalhes pelo seu e-mail.</p>
                  <button onClick={reiniciarSacola} className="bg-black text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">Voltar para a Loja</button>
                </div>
              ) : carrinho.length === 0 ? (
                <div className="text-center py-32 text-zinc-400 animate-fadeIn">
                  <p className="text-sm uppercase tracking-widest mb-6">Sua sacola está vazia.</p>
                  <button onClick={() => setVisaoAtual('home')} className="border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">Ver Produtos</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    {etapaSacola === "carrinho" ? (
                      carrinho.map(item => (
                        <div key={item.cartId} className="flex flex-col sm:flex-row gap-4 py-5 items-start sm:items-center animate-fadeIn">
                          <div className="w-full sm:w-24 h-64 sm:h-28 bg-zinc-50 flex-shrink-0">
                            <img src={item.imagens?.[0]?.url || item.imgUrl} alt={item.nome} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 w-full">
                            <h4 className="text-sm font-bold uppercase">{item.nome}</h4>
                            <p className="text-xs text-zinc-500 uppercase mt-1">Tamanho: {item.tamanhoEscolhido}</p>
                            <p className="text-sm font-black mt-2">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
                          </div>
                          <button onClick={() => removerDoCarrinho(item.cartId)} className="text-xs text-red-500 font-bold uppercase hover:underline transition-all self-end sm:self-auto">Remover</button>
                        </div>
                      ))
                    ) : (
                      <form id="form-checkout" onSubmit={finalizarPedido} className="py-6 space-y-4 animate-slideUpFade">
                        <h3 className="font-bold uppercase border-b pb-2 mb-4">Dados de Entrega</h3>
                        <div><label className={labelClasses}>Nome Completo</label><input required value={dadosEntrega.nome} onChange={handleChangeEntrega("nome")} className={inputClasses} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className={labelClasses}>E-mail</label><input type="email" required value={dadosEntrega.email} onChange={handleChangeEntrega("email")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Telefone</label><input required value={dadosEntrega.telefone} onChange={handleChangeEntrega("telefone")} className={inputClasses} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="col-span-2"><label className={labelClasses}>Rua / Endereço</label><input required value={dadosEntrega.rua} onChange={handleChangeEntrega("rua")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Número</label><input required value={dadosEntrega.numero} onChange={handleChangeEntrega("numero")} className={inputClasses} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className={labelClasses}>Bairro</label><input required value={dadosEntrega.bairro} onChange={handleChangeEntrega("bairro")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Cidade</label><input required value={dadosEntrega.cidade} onChange={handleChangeEntrega("cidade")} className={inputClasses} /></div>
                          <div><label className={labelClasses}>Estado (UF)</label><input required value={dadosEntrega.estado} onChange={handleChangeEntrega("estado")} className={inputClasses} /></div>
                        </div>
                        <h3 className="font-bold uppercase border-b pb-2 mt-8 mb-4">Pagamento</h3>
                        <div className="flex gap-2">
                          {[{ id: "cartao", label: "Cartão de Crédito" }, { id: "pix", label: "Pix" }].map(op => (
                            <button type="button" key={op.id} onClick={() => setFormaPagamento(op.id)} className={`flex-1 border rounded px-3 py-4 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${formaPagamento === op.id ? "border-black bg-black text-white" : "border-zinc-200 text-zinc-700 hover:border-black"}`}>{op.label}</button>
                          ))}
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="py-6 h-fit">
                    <h3 className="font-bold uppercase border-b border-zinc-200 pb-3 mb-4">Resumo do Pedido</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span></div>
                      <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cupom</p>
                        {cupomAplicado ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold">{cupomAplicado.codigo}</span>
                              <button onClick={removerCupom} className="text-[10px] font-bold uppercase text-red-500 hover:underline">Remover</button>
                            </div>
                            <div className="flex justify-between text-sm text-green-700">
                              <span>Desconto aplicado</span>
                              <span>- R$ {descontoCupom.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              value={codigoCupom}
                              onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                              placeholder="Digite seu cupom"
                              className="flex-1 border border-zinc-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                            />
                            <button type="button" onClick={aplicarCupom} disabled={aplicandoCupom} className="px-4 py-2 bg-black text-white rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                              {aplicandoCupom ? "..." : "Aplicar"}
                            </button>
                          </div>
                        )}
                        {erroCupom && <p className="text-[10px] font-bold uppercase text-red-500">{erroCupom}</p>}
                      </div>
                      {cupomAplicado && <div className="flex justify-between text-sm text-green-700"><span>Desconto</span><span>- R$ {descontoCupom.toFixed(2).replace('.', ',')}</span></div>}
                      {freteResultado && <div className="flex justify-between text-sm text-zinc-600"><span>Frete</span><span>R$ {freteResultado.valor.toFixed(2).replace('.', ',')}</span></div>}
                      <div className="flex justify-between text-lg font-black pt-3 border-t border-zinc-200"><span>Total</span><span>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span></div>
                    </div>
                    {erroPedido && <p className="text-[10px] text-red-500 font-bold uppercase mb-4 text-center">{erroPedido}</p>}
                    {etapaSacola === "carrinho" ? (
                      <button onClick={irParaEntrega} className="w-full bg-black text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors">Ir para a Entrega</button>
                    ) : (
                      <div className="space-y-3">
                        <button type="submit" form="form-checkout" disabled={enviandoPedido} className="w-full bg-green-700 text-white py-4 rounded text-xs font-bold tracking-widest uppercase hover:bg-green-800 transition-colors disabled:opacity-50">{enviandoPedido ? "Processando..." : "Confirmar Pedido"}</button>
                        <button type="button" onClick={() => setEtapaSacola("carrinho")} className="w-full text-xs font-bold text-zinc-500 uppercase hover:text-black transition-colors">Voltar à Sacola</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {visaoAtual === 'conta' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-slideUpFade">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Minha Conta</h2>
                <button onClick={() => navegarParaVisao('home')} className="text-xs font-bold uppercase text-zinc-500 hover:text-black transition-colors text-left sm:text-right">Voltar</button>
              </div>

              {avisoConta && (
                <div className={`mb-6 rounded-2xl border px-5 py-4 flex items-start justify-between gap-4 ${avisoConta.tipo === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                      {avisoConta.tipo === 'admin' ? 'Acesso administrativo' : 'Conta conectada'}
                    </p>
                    <p className="text-sm font-medium">{avisoConta.texto}</p>
                  </div>
                  <button onClick={() => setAvisoConta(null)} className="text-xs font-bold uppercase opacity-70 hover:opacity-100 transition-opacity">
                    Fechar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6 xl:items-start">
                <aside className="space-y-4 xl:sticky xl:top-28">
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center">
                        {(usuarioLogado?.nome || usuarioLogado?.email || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{usuarioLogado?.nome || 'Cliente Boo'}</p>
                        <p className="text-xs text-zinc-500 truncate">{usuarioLogado?.email}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <button
                        onClick={() => abrirMeusPedidos()}
                        className="w-full flex items-center justify-between rounded-2xl bg-white border border-zinc-200 px-4 py-3 text-left hover:border-black transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">Acompanhar pedidos</p>
                          <p className="text-[11px] text-zinc-500 mt-1">Detalhes, status e entrega.</p>
                        </div>
                        <FiChevronRight className="text-zinc-400" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => { window.open('/admin', '_blank', 'noopener,noreferrer'); }}
                          className="w-full flex items-center justify-between rounded-2xl bg-black text-white px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider">Gerenciador</p>
                            <p className="text-[11px] text-zinc-300 mt-1">Abrir painel administrativo.</p>
                          </div>
                          <FiShield />
                        </button>
                      )}
                    </div>
                  </div>

                </aside>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => abrirMeusPedidos()}
                      className="text-left rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-black transition-colors"
                    >
                      <FiPackage className="text-lg mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Pedidos</p>
                      <p className="text-2xl font-black mt-2">{totalPedidosCliente}</p>
                      <p className="text-xs text-zinc-500 mt-2">Veja andamento, itens e status.</p>
                    </button>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <FiMapPin className="text-lg mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Endereço padrão</p>
                      <p className="text-sm font-semibold mt-2 text-zinc-900">{dadosConta.enderecoPadrao?.rua ? `${dadosConta.enderecoPadrao.rua}, ${dadosConta.enderecoPadrao.numero}` : 'Cadastre seu endereço'}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        {dadosConta.enderecoPadrao?.bairro ? `${dadosConta.enderecoPadrao.bairro} • ${dadosConta.enderecoPadrao.cidade}/${dadosConta.enderecoPadrao.estado}` : 'Salve antes do primeiro pedido para agilizar o checkout.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <FiCreditCard className="text-lg mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Pagamentos</p>
                      <p className="text-sm font-semibold mt-2 text-zinc-900">Em breve</p>
                      <p className="text-xs text-zinc-500 mt-2">Salvamento de cartões, Pix favorito e histórico de pagamentos.</p>
                    </div>
                  </div>

                  <form onSubmit={salvarMinhaConta} className="border border-zinc-100 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4 bg-white">
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider">Seus Dados</p>
                        <p className="text-xs text-zinc-500 mt-1">Atualize suas informações principais de cadastro.</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full ${contaCompleta ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {contaCompleta ? 'Perfil completo' : 'Perfil incompleto'}
                      </span>
                    </div>
                <div>
                  <label className={labelClasses}>Nome Completo</label>
                  <input
                    required
                    value={dadosConta.nome}
                    onChange={(e) => setDadosConta(prev => ({ ...prev, nome: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>E-mail</label>
                  <input
                    type="email"
                    required
                    value={dadosConta.email}
                    onChange={(e) => setDadosConta(prev => ({ ...prev, email: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Telefone</label>
                  <input
                    value={dadosConta.telefone}
                    onChange={(e) => setDadosConta(prev => ({ ...prev, telefone: e.target.value }))}
                    className={inputClasses}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm font-black uppercase tracking-wider mb-4">Endereço</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>CEP</label>
                      <input
                        value={dadosConta.enderecoPadrao.cep}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, cep: e.target.value } }))}
                        onBlur={preencherCepConta}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Estado</label>
                      <input
                        value={dadosConta.enderecoPadrao.estado}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, estado: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="md:col-span-2">
                      <label className={labelClasses}>Rua</label>
                      <input
                        value={dadosConta.enderecoPadrao.rua}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, rua: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Número</label>
                      <input
                        value={dadosConta.enderecoPadrao.numero}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, numero: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className={labelClasses}>Complemento</label>
                      <input
                        value={dadosConta.enderecoPadrao.complemento}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, complemento: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Bairro</label>
                      <input
                        value={dadosConta.enderecoPadrao.bairro}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, bairro: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Cidade</label>
                      <input
                        value={dadosConta.enderecoPadrao.cidade}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, enderecoPadrao: { ...prev.enderecoPadrao, cidade: e.target.value } }))}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-sm font-black uppercase tracking-wider mb-4">Notificações</p>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Novidades por e-mail</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Lançamentos, coleções e avisos especiais.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={dadosConta.preferenciasConta.novidadesEmail}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, preferenciasConta: { ...prev.preferenciasConta, novidadesEmail: e.target.checked } }))}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Status do pedido por e-mail</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Confirmação, envio e entrega.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={dadosConta.preferenciasConta.statusPedidoEmail}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, preferenciasConta: { ...prev.preferenciasConta, statusPedidoEmail: e.target.checked } }))}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Status do pedido por WhatsApp</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Estrutura salva agora para ativarmos no backend.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={dadosConta.preferenciasConta.statusPedidoWhatsApp}
                        onChange={(e) => setDadosConta(prev => ({ ...prev, preferenciasConta: { ...prev.preferenciasConta, statusPedidoWhatsApp: e.target.checked } }))}
                      />
                    </label>
                  </div>
                </div>

                {mensagemConta && (
                  <p className={`text-[10px] font-bold uppercase p-3 rounded ${mensagemConta.tipo === "sucesso" ? "text-green-700 bg-green-50" : "text-red-500 bg-red-50"}`}>
                    {mensagemConta.texto}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={salvandoConta}
                  className="w-full bg-black text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 disabled:opacity-50 transition-colors mt-2"
                >
                  {salvandoConta ? "Salvando..." : "Salvar Alterações"}
                </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {visaoAtual === 'pedidos' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-slideUpFade">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Meus Pedidos</h2>
                <button onClick={() => navegarParaVisao('home')} className="text-xs font-bold uppercase text-zinc-500 hover:text-black transition-colors text-left sm:text-right">Voltar</button>
              </div>

              {carregandoPedidos ? (
                <div className="text-center py-20 text-zinc-400 text-xs tracking-widest uppercase">Carregando pedidos...</div>
              ) : erroPedidos ? (
                <div className="text-center py-20 animate-fadeIn">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-5">{erroPedidos}</p>
                  <button onClick={() => abrirMeusPedidos()} className="border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">
                    Tentar Novamente
                  </button>
                </div>
              ) : meusPedidos.length === 0 ? (
                <div className="text-center py-32 text-zinc-400 animate-fadeIn">
                  <p className="text-sm uppercase tracking-widest mb-6">Você ainda não fez nenhum pedido.</p>
                  <button onClick={() => setVisaoAtual('home')} className="border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">Ver Produtos</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {meusPedidos.map((pedido) => {
                    const status = statusLabels[pedido.status] || { texto: pedido.status, cor: "text-zinc-700 bg-zinc-100" };
                    const aberto = pedidoExpandido === pedido.id;
                    return (
                      <div key={pedido.id} className="border border-zinc-100 rounded-lg shadow-sm overflow-hidden">
                        <button
                          onClick={() => setPedidoExpandido(aberto ? null : pedido.id)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold uppercase">Pedido nº {pedido.numero}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                              {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full ${status.cor}`}>
                              {status.texto}
                            </span>
                            <span className="text-sm font-black">
                              R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </button>

                        {aberto && (
                          <div className="border-t border-zinc-100 p-5 space-y-5 animate-fadeIn bg-zinc-50">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Itens</p>
                              <div className="space-y-3">
                                {(pedido.itens || []).map((item, idx) => (
                                  <div key={idx} className="flex gap-3 items-center">
                                    <img src={item.imgUrl} alt={item.nome} className="w-14 h-16 object-cover rounded bg-zinc-100" />
                                    <div className="flex-1">
                                      <p className="text-xs font-bold uppercase">{item.nome}</p>
                                      <p className="text-[10px] text-zinc-500 uppercase mt-0.5">
                                        Tamanho: {item.tamanhoEscolhido} · Qtd: {item.quantidade}
                                      </p>
                                    </div>
                                    <p className="text-xs font-bold">
                                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {pedido.entrega && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Endereço de Entrega</p>
                                <p className="text-xs text-zinc-700">
                                  {pedido.entrega.rua}, {pedido.entrega.numero}
                                  {pedido.entrega.complemento ? ` - ${pedido.entrega.complemento}` : ""}
                                  <br />
                                  {pedido.entrega.bairro} · {pedido.entrega.cidade}/{pedido.entrega.estado}
                                  <br />
                                  CEP: {pedido.entrega.cep}
                                </p>
                              </div>
                            )}

                            <div className="flex justify-between text-xs pt-3 border-t border-zinc-200">
                              <span className="text-zinc-500 uppercase font-bold">Forma de Pagamento</span>
                              <span className="font-bold uppercase">{pedido.formaPagamento === "pix" ? "Pix" : "Cartão de Crédito"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {miniCarrinhoAberto && (
        <>
          <button aria-label="Fechar minicarrinho" onClick={() => setMiniCarrinhoAberto(false)} className="fixed inset-0 z-50 bg-black/40" />
          <aside className="fixed right-0 top-0 z-[60] h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideUpFade">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Adicionado com sucesso</p><h2 className="mt-1 text-lg font-black uppercase tracking-wider">Sua sacola</h2></div>
              <button onClick={() => setMiniCarrinhoAberto(false)} className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center" aria-label="Fechar"><FiX /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {carrinho.map((item) => (
                <div key={item.cartId} className="flex gap-4 py-5 border-b border-zinc-100">
                  <img src={item.imagens?.[0]?.url || item.imgUrl} alt={item.nome} className="h-24 w-20 rounded-lg object-cover bg-zinc-100" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider line-clamp-2">{item.nome}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">Tamanho {normalizarTamanho(item.tamanhoEscolhido)} · Qtd. {item.quantidade}</p>
                    <p className="mt-2 text-sm font-bold">R$ {(Number(item.preco) * item.quantidade).toFixed(2).replace('.', ',')}</p>
                    <button onClick={() => removerDoCarrinho(item.cartId)} className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-500">Remover</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm font-bold uppercase"><span>Subtotal</span><span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span></div>
              <button onClick={() => { setMiniCarrinhoAberto(false); navegarParaVisao('carrinho'); setEtapaSacola('carrinho'); }} className="mt-5 w-full bg-black text-white py-4 rounded-lg text-xs font-bold uppercase tracking-widest">Ir para a sacola</button>
              <button onClick={() => setMiniCarrinhoAberto(false)} className="mt-3 w-full py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Continuar comprando</button>
            </div>
          </aside>
        </>
      )}

      {/* Modal de Login e Cadastro (Agora blindado igual ao Login.jsx) */}
      {isLoginAberto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && setIsLoginAberto(false)}
        >
          <AuthCard
            isRegister={isRegistro}
            onToggleMode={() => {
              setIsRegistro(!isRegistro);
              setErroLogin(null);
              setNomeRegistro('');
              setAceitouTermosLogin(false);
            }}
            onSubmit={handleAuth}
            loading={carregandoLogin}
            error={erroLogin}
            name={nomeRegistro}
            email={emailLogin}
            password={senhaLogin}
            onNameChange={setNomeRegistro}
            onEmailChange={setEmailLogin}
            onPasswordChange={setSenhaLogin}
            termsAccepted={aceitouTermosLogin}
            onTermsChange={setAceitouTermosLogin}
            onClose={() => setIsLoginAberto(false)}
            compact
          />
          <div className="hidden bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 relative animate-slideUpFade">
            <button onClick={() => setIsLoginAberto(false)} className="absolute top-4 right-4 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
              <FiX className="text-xs" />
            </button>
            
            <h3 className="text-sm font-bold tracking-widest uppercase mb-1">
              {isRegistro ? "Criar nova conta" : "Entrar"}
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">
              {isRegistro ? "Preencha seus dados abaixo" : "Bem-vindo de volta"}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistro && (
                <div className="animate-fadeIn">
                  <label className={labelClasses}>Nome Completo</label>
                  <input type="text" required value={nomeRegistro} onChange={(e) => setNomeRegistro(e.target.value)} className={inputClasses} placeholder="Maria Silva" />
                </div>
              )}
              <div>
                <label className={labelClasses}>E-mail</label>
                <input type="email" required value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Senha</label>
                <input type="password" required value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)} className={inputClasses} />
              </div>
              
              {erroLogin && <p className="text-[10px] text-red-500 font-bold uppercase bg-red-50 p-2 rounded">{erroLogin}</p>}
              
              <button type="submit" disabled={carregandoLogin} className="w-full bg-black text-white py-3.5 rounded text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 disabled:opacity-50 transition-colors mt-2">
                {carregandoLogin ? "Aguarde..." : (isRegistro ? "Cadastrar" : "Entrar")}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-zinc-100 pt-6">
              <p className="text-xs text-zinc-500">
                {isRegistro ? "Já tem uma conta?" : "Ainda não tem conta?"}
              </p>
              <button
                type="button"
                onClick={() => { setIsRegistro(!isRegistro); setErroLogin(null); setNomeRegistro(''); }}
                className="text-xs font-bold uppercase tracking-wider text-black mt-2 hover:underline transition-all"
              >
                {isRegistro ? "Fazer Login" : "Criar Conta"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black text-white py-16 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xl font-black tracking-[0.3em] uppercase">BOO</h4>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">ALTA QUALIDADE E ESTILO LUXUOSO</p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
              <a href={configLoja.instagramUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href={`mailto:${configLoja.emailSuporte}`} className="text-zinc-400 hover:text-white transition-colors" aria-label="E-mail">
                <FiMail />
              </a>
            </div>
          </div>
          <div className="text-center md:text-right text-xs text-zinc-400 tracking-wider">
            <nav className="mb-6 flex flex-col gap-3 text-[10px] font-bold uppercase">
              <a href="/politicas" className="hover:text-white">Politicas da Loja</a>
            </nav>
            © BOO SPORTWEAR. TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}

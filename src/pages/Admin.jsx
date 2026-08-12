import { useState, useEffect } from 'react';
import { 
  FiMenu,
  FiX,
  FiPackage, 
  FiSettings, 
  FiLogOut, 
  FiPlus, 
  FiCheckCircle, 
  FiSearch,
  FiAlertTriangle,
  FiLayers,
  FiTag,
  FiHome,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiClock,
  FiChevronDown,
  FiUsers,
  FiShield,
  FiMoreVertical,
  FiArrowLeft
} from 'react-icons/fi';

export default function Admin() {
  const TAMANHOS_PADRAO = ["P", "M", "G", "Tamanho Único"];
  const [isVerificando, setIsVerificando] = useState(true);
  const [isMenuAberto, setIsMenuAberto] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novaCorHex, setNovaCorHex] = useState("#000000");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  
  // Busca e Filtros da Tabela
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  // Abas: 'home', 'produtos', 'pedidos', 'categorias', 'usuarios', 'cupons' ou 'configuracoes'
  const [abaAtiva, setAbaAtiva] = useState('home');

  // Pedidos
  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [filtroStatusPedido, setFiltroStatusPedido] = useState("Todos");

  const STATUS_PEDIDO = [
    { valor: "pendente", label: "Pendente", cor: "bg-amber-100 text-amber-700" },
    { valor: "pago", label: "Pago", cor: "bg-blue-100 text-blue-700" },
    { valor: "enviado", label: "Enviado", cor: "bg-indigo-100 text-indigo-700" },
    { valor: "entregue", label: "Entregue", cor: "bg-emerald-100 text-emerald-700" },
    { valor: "cancelado", label: "Cancelado", cor: "bg-red-100 text-red-700" },
  ];

  // Categorias
  const [categorias, setCategorias] = useState([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);

  // Usuários (gerenciamento de acesso admin)
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [termoBuscaUsuario, setTermoBuscaUsuario] = useState("");
  const [usuarioParaAlterarRole, setUsuarioParaAlterarRole] = useState(null);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(null);

  // Cupons
  const [cupons, setCupons] = useState([]);
  const [carregandoCupons, setCarregandoCupons] = useState(true);
  const [novoCupom, setNovoCupom] = useState({
    nome: "",
    codigo: "",
    tipo: "PERCENTUAL",
    valor: "",
    expiraEm: "",
    usosMaximos: ""
  });

  // Configurações de Aparência e Operação
  const [configLoja, setConfigLoja] = useState({
    fraseTopo: "FRETE GRÁTIS A PARTIR DE R$ 250 • PARCELAMENTO EM ATÉ 3X SEM JUROS",
    instagramUrl: "https://instagram.com/boosportswear",
    emailSuporte: "contato@boosportswear.com.br",
    lojaAberta: true,
    frete: {
      ativo: true,
      valorBase: 19.9,
      valorGratisApos: 250,
      prazo: "3 a 5 dias úteis"
    }
  });

const [toast, setToast] = useState({ show: false, msg: "", tipo: "sucesso" });

const API_URL = "http://167.148.161.90/api";

const dispararToast = (msg, tipo = "sucesso") => {
  setToast({ show: true, msg, tipo });
  setTimeout(() => setToast({ show: false, msg: "", tipo: "sucesso" }), 3500);
};

  const normalizarInstagram = (valor) => {
    const texto = valor.trim();
    if (!texto) return "";
    if (texto.startsWith('@')) return `https://instagram.com/${texto.slice(1)}`;
    if (!texto.startsWith('http')) return `https://instagram.com/${texto.replace(/^\/+/, '')}`;
    return texto;
  };

  const carregarProdutos = async () => {
    try {
      const res = await fetch(`${API_URL}/produtos`);
      if (res.ok) {
        const data = await res.json();
        const produtosFormatados = data.map(p => ({
          ...p,
          imagens: p.imagens ? p.imagens.map(img => typeof img === 'string' ? { url: img, cor: p.cores ? p.cores[0] : "#000000" } : img) : [{ url: p.imgUrl, cor: "#000000" }],
          cores: p.cores || ["#000000"],
          tamanhos: Array.isArray(p.tamanhos) && p.tamanhos.length > 0
            ? p.tamanhos
            : TAMANHOS_PADRAO.map((label) => ({ label, estoque: label === "M" ? 1 : 0 })),
          preco: p.preco?.toString().replace('.', ',') || "0,00"
        }));
        setProdutos(produtosFormatados);
      }
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    }
  };

  // Busca as categorias cadastradas no backend (NestJS + Prisma)
  const carregarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/categorias`);
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
    }
  };

  // Busca os pedidos no backend.
  // ATENÇÃO: este endpoint ainda precisa existir na API (GET /api/pedidos).
  // Formato esperado por item: { id, numero, cliente: { nome, email, telefone },
  // itens: [{ nome, tamanho, quantidade, preco }], total, frete, status,
  // formaPagamento, endereco, criadoEm }
  const carregarPedidos = async () => {
    setCarregandoPedidos(true);
    try {
      const token = localStorage.getItem('@BOO:token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/pedidos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
      } else {
        dispararToast("Não foi possível carregar os pedidos.", "erro");
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
      dispararToast("Erro de conexão ao carregar pedidos.", "erro");
    } finally {
      setCarregandoPedidos(false);
    }
  };

  // Atualiza o status de um pedido (ex: pendente -> pago -> enviado -> entregue)
  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      const token = localStorage.getItem('@BOO:token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/pedidos/${pedidoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
        if (pedidoSelecionado?.id === pedidoId) {
          setPedidoSelecionado(prev => ({ ...prev, status: novoStatus }));
        }
        dispararToast("Status do pedido atualizado!");
      } else {
        dispararToast("Erro ao atualizar status do pedido.", "erro");
      }
    } catch (e) {
      console.error(e);
      dispararToast("Erro de conexão ao atualizar pedido.", "erro");
    }
  };

  // Busca a lista de usuários (rota protegida: exige token de ADMIN)
  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      } else if (res.status === 403) {
        dispararToast("Você não tem permissão para ver os usuários.", "erro");
      } else {
        dispararToast("Não foi possível carregar os usuários.", "erro");
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      dispararToast("Erro de conexão ao carregar usuários.", "erro");
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/configuracoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigLoja({
          fraseTopo: data.fraseTopo || "",
          instagramUrl: data.instagramUrl || "",
          emailSuporte: data.emailSuporte || "",
          lojaAberta: data.lojaAberta ?? true,
          frete: data.frete || {
            ativo: true,
            valorBase: 19.9,
            valorGratisApos: 250,
            prazo: "3 a 5 dias úteis"
          }
        });
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
      dispararToast("Erro de conexão ao carregar configurações.", "erro");
    }
  };

  const carregarCupons = async () => {
    setCarregandoCupons(true);
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/cupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCupons(data);
      } else {
        dispararToast("Não foi possível carregar os cupons.", "erro");
      }
    } catch (e) {
      console.error("Erro ao carregar cupons:", e);
      dispararToast("Erro de conexão ao carregar cupons.", "erro");
    } finally {
      setCarregandoCupons(false);
    }
  };

  // Promove ou rebaixa um usuário (CLIENTE <-> ADMIN)
  const alterarRoleUsuario = async (usuarioId, novaRole) => {
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: novaRole })
      });
      if (res.ok) {
        setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, role: novaRole } : u));
        dispararToast(novaRole === 'ADMIN' ? "Usuário promovido a administrador!" : "Acesso de administrador removido.");
      } else {
        const erro = await res.json().catch(() => ({}));
        dispararToast(erro.message || "Erro ao atualizar permissão do usuário.", "erro");
      }
    } catch (e) {
      console.error("Erro ao atualizar role:", e);
      dispararToast("Erro de conexão ao atualizar usuário.", "erro");
    } finally {
      setUsuarioParaAlterarRole(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('@BOO:token') || localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('@BOO:usuario') || localStorage.getItem('usuario');

    if (!token || !usuarioSalvo) {
      window.location.href = '/login';
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);
    localStorage.setItem('@BOO:token', token);
    localStorage.setItem('@BOO:usuario', usuarioSalvo);

    if (usuario.role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    setIsVerificando(false); 
    carregarProdutos();
    carregarCategorias();
    carregarPedidos();
    carregarUsuarios();
    carregarConfiguracoes();
    carregarCupons();
  }, []);

  useEffect(() => {
    setIsMenuAberto(false);
  }, [abaAtiva]);

  const criarNovoProduto = () => {
    const produtoVazio = {
      id: Date.now(),
      isNew: true,
      nome: "",
      preco: "",
      estoque: "",
      categoria: categorias[0]?.nome || "Conjuntos",
      cores: ["#000000"],
      imagens: [],
      tamanhos: TAMANHOS_PADRAO.map((label) => ({ label, estoque: label === "M" ? 1 : 0 }))
    };
    setProdutos([produtoVazio, ...produtos]);
    setProdutoEditando(produtoVazio);
    setPaginaAtual(1);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    if (produtoParaExcluir.isNew) {
      setProdutos(produtos.filter(prod => prod.id !== produtoParaExcluir.id));
    } else {
      try {
        await fetch(`${API_URL}/produtos/${produtoParaExcluir.id}`, { method: 'DELETE' });
        setProdutos(produtos.filter(prod => prod.id !== produtoParaExcluir.id));
      } catch (e) {
        console.error(e);
      }
    }

    if (produtoEditando && produtoEditando.id === produtoParaExcluir.id) {
      setProdutoEditando(null);
    }
    setProdutoParaExcluir(null);
    dispararToast("Produto excluído com sucesso!");
  };

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);

  for (const file of files) {
    const formData = new FormData();
    formData.append('arquivo', file);

    try {
      const res = await fetch(`${API_URL}/produtos/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProdutoEditando(prev => ({
          ...prev,
          imagens: [...prev.imagens, { url: data.url, cor: prev.cores[0] || "#000000" }]
        }));
      } else {
        dispararToast("Erro ao enviar imagem.", "erro");
      }
    } catch (err) {
      console.error(err);
      dispararToast("Erro de conexão ao enviar imagem.", "erro");
    }
  }
};

  const atualizarCorDaImagem = (index, novaCor) => {
    const novasImagens = [...produtoEditando.imagens];
    novasImagens[index].cor = novaCor;
    setProdutoEditando({ ...produtoEditando, imagens: novasImagens });
  };

  const removerImagem = (index) => {
    const novas = [...produtoEditando.imagens];
    novas.splice(index, 1);
    setProdutoEditando({ ...produtoEditando, imagens: novas });
  };

  const moverImagem = (index, direcao) => {
    const novas = [...produtoEditando.imagens];
    if (direcao === 'cima' && index > 0) {
      [novas[index - 1], novas[index]] = [novas[index], novas[index - 1]];
    } else if (direcao === 'baixo' && index < novas.length - 1) {
      [novas[index + 1], novas[index]] = [novas[index], novas[index + 1]];
    }
    setProdutoEditando({ ...produtoEditando, imagens: novas });
  };

  const adicionarCor = () => {
    if (!produtoEditando.cores.includes(novaCorHex)) {
      setProdutoEditando({
        ...produtoEditando,
        cores: [...produtoEditando.cores, novaCorHex]
      });
    }
  };

  const removerCor = (index) => {
    const novasCores = produtoEditando.cores.filter((_, i) => i !== index);
    setProdutoEditando({ ...produtoEditando, cores: novasCores });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (produtoEditando.imagens.length === 0) {
      alert("Adicione pelo menos uma imagem ao produto!");
      return;
    }

    const tamanhosNormalizados = (produtoEditando.tamanhos || []).map((item) => ({
      label: item.label,
      estoque: Number(item.estoque || 0),
    }));
    const estoqueNum = tamanhosNormalizados.reduce((acc, item) => acc + item.estoque, 0);
    const precoFloat = parseFloat(produtoEditando.preco.toString().replace(',', '.'));

    const payload = {
      nome: produtoEditando.nome,
      preco: isNaN(precoFloat) ? 0 : precoFloat,
      estoque: isNaN(estoqueNum) ? 0 : estoqueNum,
      tamanhos: tamanhosNormalizados,
      categoria: produtoEditando.categoria || (categorias[0]?.nome || "Conjuntos"),
      cores: produtoEditando.cores,
      imagens: produtoEditando.imagens,
      imgUrl: produtoEditando.imagens[0]?.url || ""
    };

    try {
      const endpoint = produtoEditando.isNew ? `${API_URL}/produtos` : `${API_URL}/produtos/${produtoEditando.id}`;
      const method = produtoEditando.isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await carregarProdutos();
        setProdutoEditando(null);
        dispararToast("Alterações salvas com sucesso!");
      } else {
        dispararToast("Erro ao salvar produto no banco.");
      }
    } catch(e) {
      console.error(e);
      dispararToast("Erro de conexão com el servidor.");
    }
  };

  const salvarConfiguracoes = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('@BOO:token');
      const payload = {
        ...configLoja,
        instagramUrl: normalizarInstagram(configLoja.instagramUrl),
      };

      const res = await fetch(`${API_URL}/admin/configuracoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setConfigLoja({
          fraseTopo: data.fraseTopo || "",
          instagramUrl: data.instagramUrl || "",
          emailSuporte: data.emailSuporte || "",
          lojaAberta: data.lojaAberta ?? true,
          frete: data.frete || {
            ativo: true,
            valorBase: 19.9,
            valorGratisApos: 250,
            prazo: "3 a 5 dias úteis"
          }
        });
        dispararToast("Configurações atualizadas com sucesso!");
      } else {
        dispararToast("Não foi possível salvar as configurações.", "erro");
      }
    } catch (e) {
      console.error("Erro ao salvar configurações:", e);
      dispararToast("Erro de conexão ao salvar configurações.", "erro");
    }
  };

  const criarCupom = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/cupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: novoCupom.nome,
          codigo: novoCupom.codigo,
          tipo: novoCupom.tipo,
          valor: Number(novoCupom.valor),
          expiraEm: novoCupom.expiraEm || undefined,
          usosMaximos: novoCupom.usosMaximos ? Number(novoCupom.usosMaximos) : null
        })
      });

      if (res.ok) {
        setNovoCupom({
          nome: "",
          codigo: "",
          tipo: "PERCENTUAL",
          valor: "",
          expiraEm: "",
          usosMaximos: ""
        });
        await carregarCupons();
        dispararToast("Cupom criado com sucesso!");
      } else {
        const erro = await res.json().catch(() => ({}));
        dispararToast(erro.message || "Erro ao criar cupom.", "erro");
      }
    } catch (e) {
      console.error("Erro ao criar cupom:", e);
      dispararToast("Erro de conexão ao criar cupom.", "erro");
    }
  };

  const alternarStatusCupom = async (cupom) => {
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/cupons/${cupom.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ativo: !cupom.ativo })
      });
      if (res.ok) {
        await carregarCupons();
        dispararToast(!cupom.ativo ? "Cupom ativado!" : "Cupom pausado!");
      } else {
        dispararToast("Erro ao atualizar cupom.", "erro");
      }
    } catch (e) {
      console.error("Erro ao atualizar cupom:", e);
      dispararToast("Erro de conexão ao atualizar cupom.", "erro");
    }
  };

  const excluirCupom = async (cupomId) => {
    try {
      const token = localStorage.getItem('@BOO:token');
      const res = await fetch(`${API_URL}/admin/cupons/${cupomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await carregarCupons();
        dispararToast("Cupom excluído com sucesso!");
      } else {
        dispararToast("Erro ao excluir cupom.", "erro");
      }
    } catch (e) {
      console.error("Erro ao excluir cupom:", e);
      dispararToast("Erro de conexão ao excluir cupom.", "erro");
    }
  };

  // ---- Gerenciamento de Categorias ----

  const criarCategoria = async (e) => {
    e.preventDefault();
    const nome = novaCategoriaNome.trim();
    if (!nome) return;

    if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
      dispararToast("Essa categoria já existe.", "erro");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });

      if (res.ok) {
        await carregarCategorias();
        setNovaCategoriaNome("");
        dispararToast("Categoria criada com sucesso!");
      } else {
        dispararToast("Erro ao criar categoria.", "erro");
      }
    } catch (e) {
      console.error(e);
      dispararToast("Erro de conexão ao criar categoria.", "erro");
    }
  };

  const salvarEdicaoCategoria = async () => {
    if (!categoriaEditando || !categoriaEditando.nome.trim()) return;

    try {
      const res = await fetch(`${API_URL}/categorias/${categoriaEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: categoriaEditando.nome.trim() })
      });

      if (res.ok) {
        await carregarCategorias();
        setCategoriaEditando(null);
        dispararToast("Categoria atualizada com sucesso!");
      } else {
        dispararToast("Erro ao atualizar categoria.", "erro");
      }
    } catch (e) {
      console.error(e);
      dispararToast("Erro de conexão ao atualizar categoria.", "erro");
    }
  };

  const confirmarExclusaoCategoria = async () => {
    if (!categoriaParaExcluir) return;

    try {
      const res = await fetch(`${API_URL}/categorias/${categoriaParaExcluir.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategorias(categorias.filter(c => c.id !== categoriaParaExcluir.id));
        dispararToast("Categoria excluída com sucesso!");
      } else {
        dispararToast("Erro ao excluir categoria.", "erro");
      }
    } catch (e) {
      console.error(e);
      dispararToast("Erro de conexão ao excluir categoria.", "erro");
    } finally {
      setCategoriaParaExcluir(null);
    }
  };

  // Lista de nomes de categoria usada nos <select>. Usa as categorias cadastradas
  // no backend e cai para uma lista padrão caso ainda não tenha sido carregada.
  const nomesCategorias = categorias.length > 0 
    ? categorias.map(c => c.nome) 
    : ["Conjuntos"];

  // Filtragem e Paginação
  const produtosFiltrados = produtos.filter(produto => {
    const bateNome = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    const bateCategoria = filtroCategoria === "Todas" || produto.categoria === filtroCategoria;
    return bateNome && bateCategoria;
  });

  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const produtosAtuais = produtosFiltrados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);

  // Métricas
  const totalProdutos = produtos.length;
  const produtosEstoqueBaixo = produtos.filter(p => parseInt(p.estoque || 0, 10) < 5).length;

  // Pedidos filtrados (aba Pedidos)
  const pedidosFiltrados = pedidos.filter(p =>
    filtroStatusPedido === "Todos" || p.status === filtroStatusPedido
  ).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  const statusInfo = (statusValor) =>
    STATUS_PEDIDO.find(s => s.valor === statusValor) || { label: statusValor || "—", cor: "bg-zinc-100 text-zinc-600" };

  // Métricas para o Dashboard (Home)
  const pedidosPendentes = pedidos.filter(p => p.status === "pendente").length;
  const hoje = new Date();
  const ehMesmoDia = (dataStr) => {
    const d = new Date(dataStr);
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  };
  const ehMesmoMes = (dataStr) => {
    const d = new Date(dataStr);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  };
  const pedidosHoje = pedidos.filter(p => p.criadoEm && ehMesmoDia(p.criadoEm));
  const pedidosMes = pedidos.filter(p => p.criadoEm && ehMesmoMes(p.criadoEm));
  const faturamentoMes = pedidosMes
    .filter(p => p.status !== "cancelado")
    .reduce((soma, p) => soma + (Number(p.total) || 0), 0);
  const ultimosPedidos = [...pedidos]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5);

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(termoBuscaUsuario.toLowerCase()) ||
    u.email.toLowerCase().includes(termoBuscaUsuario.toLowerCase())
  );

  const abrirConfirmacaoRole = (usuario, roleDestino) => {
    setMenuUsuarioAberto(null);
    setUsuarioParaAlterarRole({ ...usuario, roleDestino });
  };

  if (isVerificando) {
    return (
      <div className="h-screen bg-zinc-50 flex items-center justify-center text-xs font-bold tracking-widest uppercase text-zinc-500">
        Autenticando...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 font-sans relative overflow-hidden lg:h-screen lg:flex-row">
      
{toast.show && (
  <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 text-white px-4 sm:px-6 py-3 rounded-lg shadow-xl text-[10px] sm:text-xs uppercase tracking-widest font-medium flex items-center gap-2 transition-all ${toast.tipo === 'erro' ? 'bg-red-600' : 'bg-black'}`}>
    {toast.tipo === 'erro' ? (
      <FiAlertTriangle className="text-white text-base" />
    ) : (
      <FiCheckCircle className="text-emerald-400 text-base" />
    )}
    {toast.msg}
  </div>
)}

      {/* SIDEBAR COM HEADER CENTRALIZADO COMO ANTES */}
      <aside className="hidden lg:flex w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 flex-col justify-between flex-shrink-0 p-4 lg:p-6">
        <div>
          {/* LOGO CENTRALIZADA COM DIVISOR */}
          <div className="h-16 lg:h-20 flex items-center justify-center border-b border-zinc-100 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-4 lg:mb-6">
            <h1 className="text-xl tracking-[0.05em] uppercase">
              <span className="font-light text-zinc-400">BOO</span><span className="font-bold text-black">ADMIN</span>
            </h1>
          </div>

          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:space-y-1">
            <button 
              onClick={() => { setAbaAtiva('home'); setProdutoEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'home' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiHome className="text-base" />
              Início
            </button>
            <button 
              onClick={() => { setAbaAtiva('produtos'); setProdutoEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'produtos' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiPackage className="text-base" />
              Produtos
            </button>
            <button 
              onClick={() => { setAbaAtiva('pedidos'); setPedidoSelecionado(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'pedidos' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiShoppingBag className="text-base" />
              Pedidos
              {pedidosPendentes > 0 && (
                <span className="ml-auto bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pedidosPendentes}</span>
              )}
            </button>
            <button 
              onClick={() => { setAbaAtiva('categorias'); setProdutoEditando(null); setCategoriaEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'categorias' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiTag className="text-base" />
              Categorias
            </button>
            <button 
              onClick={() => { setAbaAtiva('usuarios'); setUsuarioParaAlterarRole(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'usuarios' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiUsers className="text-base" />
              Usuários
            </button>
            <button 
              onClick={() => { setAbaAtiva('configuracoes'); setProdutoEditando(null); }} 
              className={`hidden w-full items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'configuracoes' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiSettings className="text-base" />
              Configurações
            </button>
            <button 
              onClick={() => { setAbaAtiva('cupons'); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'cupons' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiDollarSign className="text-base" />
              Cupons
            </button>
            <button 
              onClick={() => { setAbaAtiva('configuracoes'); setProdutoEditando(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer ${abaAtiva === 'configuracoes' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <FiSettings className="text-base" />
              Configurações
            </button>
          </nav>
        </div>

        <div className="pt-4 lg:pt-6 border-t border-zinc-100 mt-4 lg:mt-6">
          <button
            onClick={() => { window.open('/', '_blank', 'noopener,noreferrer'); }}
            className="w-full flex items-center gap-3 px-4 py-2 mb-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer"
          >
            <FiArrowLeft className="text-base" />
            Voltar ao Site
          </button>
          <button 
            onClick={() => { localStorage.clear(); window.location.href='/login'; }}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer"
          >
            <FiLogOut className="text-base" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm uppercase tracking-[0.05em]"><span className="font-light text-zinc-400">BOO</span><span className="font-bold text-black">ADMIN</span></h1>
        </div>
        <button
          onClick={() => setIsMenuAberto((prev) => !prev)}
          className="w-10 h-10 rounded-full border border-zinc-200 inline-flex items-center justify-center text-zinc-700"
          aria-label="Abrir menu do painel"
        >
          {isMenuAberto ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
        </button>
      </div>

      {isMenuAberto && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/35" onClick={() => setIsMenuAberto(false)}></div>
          <aside className="lg:hidden fixed top-0 left-0 z-50 h-full w-[88vw] max-w-xs bg-white border-r border-zinc-200 p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">BOO</p>
                  <h2 className="text-base uppercase tracking-[0.05em]"><span className="font-light text-zinc-400">BOO</span><span className="font-bold text-black">ADMIN</span></h2>
                </div>
                <button
                  onClick={() => setIsMenuAberto(false)}
                  className="w-9 h-9 rounded-full border border-zinc-200 inline-flex items-center justify-center text-zinc-700"
                >
                  <FiX />
                </button>
              </div>

              <nav className="space-y-2 mt-5">
                <button onClick={() => { setAbaAtiva('home'); setProdutoEditando(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'home' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiHome className="text-base" />
                  Início
                </button>
                <button onClick={() => { setAbaAtiva('produtos'); setProdutoEditando(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'produtos' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiPackage className="text-base" />
                  Produtos
                </button>
                <button onClick={() => { setAbaAtiva('pedidos'); setPedidoSelecionado(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'pedidos' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiShoppingBag className="text-base" />
                  Pedidos
                  {pedidosPendentes > 0 && (
                    <span className="ml-auto bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pedidosPendentes}</span>
                  )}
                </button>
                <button onClick={() => { setAbaAtiva('categorias'); setProdutoEditando(null); setCategoriaEditando(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'categorias' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiTag className="text-base" />
                  Categorias
                </button>
                <button onClick={() => { setAbaAtiva('usuarios'); setUsuarioParaAlterarRole(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'usuarios' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiUsers className="text-base" />
                  Usuários
                </button>
                <button onClick={() => { setAbaAtiva('cupons'); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'cupons' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiDollarSign className="text-base" />
                  Cupons
                </button>
                <button onClick={() => { setAbaAtiva('configuracoes'); setProdutoEditando(null); setIsMenuAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors ${abaAtiva === 'configuracoes' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  <FiSettings className="text-base" />
                  Configurações
                </button>
              </nav>
            </div>

            <div className="pt-5 border-t border-zinc-100">
              <button
                onClick={() => { window.open('/', '_blank', 'noopener,noreferrer'); }}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer"
              >
                <FiArrowLeft className="text-base" />
                Voltar ao Site
              </button>
              <button 
                onClick={() => { localStorage.clear(); window.location.href='/login'; }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer"
              >
                <FiLogOut className="text-base" />
                Sair
              </button>
            </div>
          </aside>
        </>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        
        {/* ABA HOME / DASHBOARD */}
        {abaAtiva === 'home' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <header>
              <h2 className="text-2xl font-normal tracking-tight text-zinc-900">Visão Geral</h2>
              <p className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">Resumo da loja em tempo real</p>
            </header>

            {/* CARDS PRINCIPAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><FiDollarSign className="text-xl" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Faturamento do Mês</p>
                  <p className="text-xl font-bold text-zinc-900">R$ {faturamentoMes.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-zinc-100 text-zinc-700 rounded-lg"><FiShoppingBag className="text-xl" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Pedidos Hoje</p>
                  <p className="text-xl font-bold text-zinc-900">{pedidosHoje.length}</p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><FiClock className="text-xl" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Pedidos Pendentes</p>
                  <p className="text-xl font-bold text-amber-600">{pedidosPendentes}</p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-zinc-100 text-zinc-700 rounded-lg"><FiPackage className="text-xl" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Total de Produtos</p>
                  <p className="text-xl font-bold text-zinc-900">{totalProdutos}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ÚLTIMOS PEDIDOS */}
              <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Últimos Pedidos</h3>
                  <button onClick={() => setAbaAtiva('pedidos')} className="text-xs font-semibold text-black hover:underline cursor-pointer">Ver todos</button>
                </div>
                {carregandoPedidos ? (
                  <p className="px-6 py-10 text-center text-zinc-400 text-xs uppercase tracking-wider">Carregando pedidos...</p>
                ) : ultimosPedidos.length === 0 ? (
                  <p className="px-6 py-10 text-center text-zinc-400 text-xs uppercase tracking-wider">Nenhum pedido registrado ainda.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {ultimosPedidos.map((pedido) => {
                      const st = statusInfo(pedido.status);
                      return (
                        <li
                          key={pedido.id}
                          onClick={() => { setAbaAtiva('pedidos'); setPedidoSelecionado(pedido); }}
                          className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-zinc-800">Pedido #{pedido.numero || pedido.id}</p>
                            <p className="text-xs text-zinc-400">{pedido.cliente?.nome || "Cliente não identificado"}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold">R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${st.cor}`}>{st.label}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* STATUS DO ESTOQUE */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-6 h-fit">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Status do Estoque</h3>
                {totalProdutos === 0 ? (
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">Sem produtos cadastrados.</p>
                ) : produtosEstoqueBaixo > 0 ? (
                  <div className="flex items-center gap-3 text-amber-600">
                    <FiAlertTriangle className="text-2xl flex-shrink-0" />
                    <p className="text-sm">
                      <strong>{produtosEstoqueBaixo}</strong> produto(s) com estoque abaixo de 5 unidades.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-emerald-600">
                    <FiCheckCircle className="text-2xl flex-shrink-0" />
                    <p className="text-sm">Todos os produtos com estoque saudável.</p>
                  </div>
                )}
                <button onClick={() => setAbaAtiva('produtos')} className="mt-5 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer">
                  Gerenciar Produtos
                </button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'produtos' && (
          <>
            {!produtoEditando ? (
              <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight text-zinc-900">Catálogo de Produtos</h2>
                    <p className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">Gerenciamento e controle geral do estoque</p>
                  </div>
                  <button onClick={criarNovoProduto} className="bg-black text-white px-6 py-3 rounded-lg font-medium text-xs tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs flex items-center gap-2">
                    <FiPlus className="text-base" /> Novo Produto
                  </button>
                </header>

                {/* CARDS DE RESUMO RÁPIDO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700"><FiPackage className="text-xl" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Total de Produtos</p>
                      <p className="text-xl font-bold text-zinc-900">{totalProdutos} itens</p>
                    </div>
                  </div>

{/* CARD INTELIGENTE DE STATUS DO ESTOQUE */}
{totalProdutos === 0 ? (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-zinc-100 text-zinc-500 rounded-lg">
      <FiPackage className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Status do Estoque</p>
      <p className="text-xl font-bold text-zinc-500">Sem Produtos</p>
    </div>
  </div>
) : produtosEstoqueBaixo > 0 ? (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
      <FiAlertTriangle className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Estoque Crítico (&lt; 5 un)</p>
      <p className="text-xl font-bold text-amber-600">{produtosEstoqueBaixo} produtos</p>
    </div>
  </div>
) : (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4 transition-all">
    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
      <FiCheckCircle className="text-xl" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Status do Estoque</p>
      <p className="text-xl font-bold text-emerald-600">Cheio</p>
    </div>
  </div>
)}

                  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700"><FiLayers className="text-xl" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Categorias</p>
                      <p className="text-xl font-bold text-zinc-900">{categorias.length || nomesCategorias.length} categorias</p>
                    </div>
                  </div>
                </div>

                {/* BARRA DE BUSCA E FILTROS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome do produto..." 
                      value={termoBusca}
                      onChange={(e) => { setTermoBusca(e.target.value); setPaginaAtual(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <select 
                      value={filtroCategoria}
                      onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Todas">Todas Categorias</option>
                      {nomesCategorias.map((nome) => (
                        <option key={nome} value={nome}>{nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TABELA DE PRODUTOS COM ALERTAS DE ESTOQUE */}
                <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                        <th className="px-6 py-4 font-semibold">Produto</th>
                        <th className="px-6 py-4 font-semibold">Categoria</th>
                        <th className="px-6 py-4 font-semibold">Preço</th>
                        <th className="px-6 py-4 font-semibold">Estoque</th>
                        <th className="px-6 py-4 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-sm">
                      {produtosAtuais.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-zinc-400 text-xs uppercase tracking-wider">
                            Nenhum produto encontrado.
                          </td>
                        </tr>
                      ) : (
                        produtosAtuais.map((produto) => {
                          const QtdEstoque = parseInt(produto.estoque || 0, 10);
                          return (
                            <tr key={produto.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <img src={produto.imagens?.[0]?.url || produto.imgUrl} alt={produto.nome} className="w-10 h-12 object-cover rounded-md bg-zinc-100 border border-zinc-200" />
                                  <span className="font-medium text-zinc-800 text-sm">{produto.nome || "Produto sem nome"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider">{produto.categoria || "Geral"}</td>
                              <td className="px-6 py-4 text-zinc-600 text-sm">R$ {produto.preco}</td>
                              <td className="px-6 py-4 text-sm">
                                {QtdEstoque === 0 ? (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold uppercase tracking-wider">Esgotado</span>
                                ) : QtdEstoque < 5 ? (
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold uppercase tracking-wider">{QtdEstoque} un. (Baixo)</span>
                                ) : (
                                  <span className="text-zinc-600">{QtdEstoque} un.</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right space-x-4">
                                <button onClick={() => setProdutoEditando({ ...produto })} className="text-black font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Editar</button>
                                <button onClick={() => setProdutoParaExcluir(produto)} className="text-red-500 font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Excluir</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/30">
                      <span className="text-xs text-zinc-400 uppercase tracking-wider">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-medium uppercase tracking-wider disabled:opacity-30 cursor-pointer hover:bg-zinc-50"
                        >
                          Anterior
                        </button>
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-medium uppercase tracking-wider disabled:opacity-30 cursor-pointer hover:bg-zinc-50"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TELA DE EDICÃO / CADASTRO DE PRODUTO */
              <div className="max-w-3xl mx-auto pb-20">
                <button onClick={() => setProdutoEditando(null)} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-black mb-6 uppercase tracking-wider font-semibold cursor-pointer">
                  ← Voltar para listagem
                </button>

                <header className="mb-8 flex justify-between items-center border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-normal tracking-tight">
                      {produtoEditando.isNew ? "Novo Produto" : `Editar: ${produtoEditando.nome}`}
                    </h2>
                  </div>
                  <button type="button" onClick={() => setProdutoParaExcluir(produtoEditando)} className="text-red-500 text-xs font-semibold uppercase tracking-wider hover:underline cursor-pointer">
                    Excluir Produto
                  </button>
                </header>

                <form onSubmit={salvarEdicao} className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Informações Principais</h3>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Nome do Produto</label>
                      <input type="text" value={produtoEditando.nome} onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="Ex: Legging Sculpt Alta Compressão" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Preço (R$)</label>
                        <input type="text" value={produtoEditando.preco} onChange={(e) => setProdutoEditando({...produtoEditando, preco: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="00,00" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Estoque</label>
                        <input type="number" min="0" value={produtoEditando.estoque} onChange={(e) => setProdutoEditando({...produtoEditando, estoque: e.target.value})} className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30" placeholder="0" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Categoria</label>
                        <select 
                          value={produtoEditando.categoria || nomesCategorias[0]} 
                          onChange={(e) => setProdutoEditando({...produtoEditando, categoria: e.target.value})} 
                          className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30 cursor-pointer"
                        >
                          {nomesCategorias.map((nome) => (
                            <option key={nome} value={nome}>{nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Tamanhos e Estoque</h3>
                      <span className="text-[11px] text-zinc-400">
                        Total: {(produtoEditando.tamanhos || []).reduce((acc, item) => acc + Number(item.estoque || 0), 0)} un.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(produtoEditando.tamanhos || []).map((tam, index) => (
                        <label key={tam.label} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 bg-zinc-50/50">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">{tam.label}</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Disponível para venda</p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={tam.estoque}
                            onChange={(e) => {
                              const valor = Number(e.target.value || 0);
                              setProdutoEditando({
                                ...produtoEditando,
                                tamanhos: produtoEditando.tamanhos.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, estoque: valor } : item
                                )
                              });
                            }}
                            className="w-24 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-black bg-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">Cores Disponíveis</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {produtoEditando.cores.map((corHex, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-xs">
                          <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-2xs" style={{ backgroundColor: corHex }} />
                          <span className="font-mono text-zinc-700">{corHex}</span>
                          <button type="button" onClick={() => removerCor(idx)} className="text-zinc-400 hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-10 h-10 border border-zinc-200 rounded-lg cursor-pointer bg-white p-1" />
                      <input type="text" value={novaCorHex} onChange={(e) => setNovaCorHex(e.target.value)} className="w-32 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs font-mono uppercase" />
                      <button type="button" onClick={adicionarCor} className="bg-zinc-100 text-black px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-zinc-200 hover:bg-zinc-200 cursor-pointer">Adicionar Cor</button>
                    </div>
                  </div>

                  {/* Upload de Imagens */}
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Galeria de Imagens</h3>
                      <span className="text-xs text-zinc-400">{produtoEditando.imagens?.length || 0} foto(s)</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {produtoEditando.imagens?.map((imgObj, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border border-zinc-100 rounded-lg bg-zinc-50/50">
                          <img src={imgObj.url} alt="Miniatura" className="w-12 h-14 object-cover rounded-md border border-zinc-200" />
                          
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500 font-semibold">{index === 0 ? "Capa Principal" : `Foto ${index + 1}`}</span>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-zinc-400 uppercase">Cor:</label>
                              <select 
                                value={imgObj.cor} 
                                onChange={(e) => atualizarCorDaImagem(index, e.target.value)}
                                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
                              >
                                {produtoEditando.cores.map((c, i) => (
                                  <option key={i} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moverImagem(index, 'cima')} disabled={index === 0} className="p-1.5 text-xs text-zinc-500 hover:text-black disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moverImagem(index, 'baixo')} disabled={index === produtoEditando.imagens.length - 1} className="p-1.5 text-xs text-zinc-500 hover:text-black disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removerImagem(index)} className="p-1.5 text-xs text-red-500 hover:text-red-700 ml-1">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer bg-zinc-50/30 relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiPlus className="w-6 h-6 text-zinc-400" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Clique para selecionar fotos do computador</p>
                        <p className="text-[11px] text-zinc-400">Seleção múltipla de arquivos</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs">
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* ABA PEDIDOS */}
        {abaAtiva === 'pedidos' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-normal tracking-tight text-zinc-900">Pedidos</h2>
                <p className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">Acompanhe e gerencie os pedidos da loja</p>
              </div>
              <div className="w-full sm:w-56">
                <select
                  value={filtroStatusPedido}
                  onChange={(e) => setFiltroStatusPedido(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="Todos">Todos os status</option>
                  {STATUS_PEDIDO.map(s => (
                    <option key={s.valor} value={s.valor}>{s.label}</option>
                  ))}
                </select>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LISTA DE PEDIDOS */}
              <div className={`bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden ${pedidoSelecionado ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {carregandoPedidos ? (
                  <p className="px-6 py-16 text-center text-zinc-400 text-xs uppercase tracking-wider">Carregando pedidos...</p>
                ) : pedidosFiltrados.length === 0 ? (
                  <p className="px-6 py-16 text-center text-zinc-400 text-xs uppercase tracking-wider">Nenhum pedido encontrado.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[11px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                        <th className="px-6 py-4 font-semibold">Pedido</th>
                        <th className="px-6 py-4 font-semibold">Cliente</th>
                        <th className="px-6 py-4 font-semibold">Total</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-sm">
                      {pedidosFiltrados.map((pedido) => {
                        const st = statusInfo(pedido.status);
                        return (
                          <tr
                            key={pedido.id}
                            onClick={() => setPedidoSelecionado(pedido)}
                            className={`cursor-pointer hover:bg-zinc-50/50 transition-colors ${pedidoSelecionado?.id === pedido.id ? 'bg-zinc-50' : ''}`}
                          >
                            <td className="px-6 py-4 font-medium text-zinc-800">#{pedido.numero || pedido.id}</td>
                            <td className="px-6 py-4 text-zinc-600">{pedido.cliente?.nome || "—"}</td>
                            <td className="px-6 py-4 font-bold text-zinc-900">R$ {Number(pedido.total || 0).toFixed(2).replace('.', ',')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${st.cor}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAINEL DE DETALHES DO PEDIDO */}
              {pedidoSelecionado && (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs p-6 h-fit space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider">Pedido #{pedidoSelecionado.numero || pedidoSelecionado.id}</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        {pedidoSelecionado.criadoEm ? new Date(pedidoSelecionado.criadoEm).toLocaleString('pt-BR') : "Data não informada"}
                      </p>
                    </div>
                    <button onClick={() => setPedidoSelecionado(null)} className="text-zinc-400 hover:text-black text-xs cursor-pointer">✕</button>
                  </div>

                  {/* Alterar status */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Status do Pedido</label>
                    <div className="relative">
                      <select
                        value={pedidoSelecionado.status}
                        onChange={(e) => atualizarStatusPedido(pedidoSelecionado.id, e.target.value)}
                        className="w-full appearance-none border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30 cursor-pointer"
                      >
                        {STATUS_PEDIDO.map(s => (
                          <option key={s.valor} value={s.valor}>{s.label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-4 top-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Dados do cliente */}
                  <div className="border-t border-zinc-100 pt-4">
                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Cliente</h4>
                    <p className="text-sm text-zinc-800">{pedidoSelecionado.cliente?.nome}</p>
                    <p className="text-xs text-zinc-500">{pedidoSelecionado.cliente?.email}</p>
                    <p className="text-xs text-zinc-500">{pedidoSelecionado.cliente?.telefone}</p>
                  </div>

                  {/* Endereço de entrega */}
                  {pedidoSelecionado.endereco && (
                    <div className="border-t border-zinc-100 pt-4">
                      <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2 flex items-center gap-2">
                        <FiTruck /> Entrega
                      </h4>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {pedidoSelecionado.endereco.rua}, {pedidoSelecionado.endereco.numero} — {pedidoSelecionado.endereco.bairro}<br />
                        {pedidoSelecionado.endereco.cidade}/{pedidoSelecionado.endereco.estado}
                      </p>
                    </div>
                  )}

                  {/* Itens do pedido */}
                  <div className="border-t border-zinc-100 pt-4">
                    <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">Itens</h4>
                    <div className="space-y-2">
                      {(pedidoSelecionado.itens || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-zinc-700">{item.quantidade}x {item.nome} <span className="text-zinc-400">({item.tamanho})</span></span>
                          <span className="font-semibold text-zinc-800">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-4 flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>R$ {Number(pedidoSelecionado.total || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA CATEGORIAS */}
        {abaAtiva === 'categorias' && (
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-normal tracking-tight">Categorias de Produtos</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Gerencie as categorias disponíveis na loja</p>
            </header>

            {/* Nova categoria */}
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs mb-6">
              <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">Nova Categoria</h3>
              <form onSubmit={criarCategoria} className="flex gap-2">
                <input
                  type="text"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  placeholder="Ex: Tops"
                  className="flex-1 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required
                />
                <button type="submit" className="bg-black text-white px-6 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer shadow-xs flex items-center gap-2">
                  <FiPlus className="text-base" /> Adicionar
                </button>
              </form>
            </div>

            {/* Lista de categorias */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
              {categorias.length === 0 ? (
                <p className="px-6 py-12 text-center text-zinc-400 text-xs uppercase tracking-wider">
                  Nenhuma categoria cadastrada ainda.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {categorias.map((cat) => (
                    <li key={cat.id} className="flex items-center justify-between px-6 py-4">
                      {categoriaEditando?.id === cat.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={categoriaEditando.nome}
                          onChange={(e) => setCategoriaEditando({ ...categoriaEditando, nome: e.target.value })}
                          className="flex-1 mr-4 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                      ) : (
                        <span className="text-sm font-medium text-zinc-800">{cat.nome}</span>
                      )}

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {categoriaEditando?.id === cat.id ? (
                          <>
                            <button onClick={salvarEdicaoCategoria} className="text-black font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Salvar</button>
                            <button onClick={() => setCategoriaEditando(null)} className="text-zinc-400 font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setCategoriaEditando({ ...cat })} className="text-black font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Editar</button>
                            <button onClick={() => setCategoriaParaExcluir(cat)} className="text-red-500 font-semibold hover:underline text-xs tracking-wider uppercase cursor-pointer">Excluir</button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ABA USUÁRIOS */}
        {abaAtiva === 'usuarios' && (
          <div className="max-w-4xl mx-auto">
            <header className="mb-6 flex flex-col gap-4 sm:mb-8">
              <div>
                <h2 className="text-2xl font-normal tracking-tight">Usuários</h2>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={termoBuscaUsuario}
                  onChange={(e) => setTermoBuscaUsuario(e.target.value)}
                  className="pl-9 pr-4 py-3 border border-zinc-200 rounded-xl text-sm w-full bg-white focus:outline-none focus:border-black"
                />
              </div>
            </header>

            {carregandoUsuarios ? (
              <p className="text-sm text-zinc-400">Carregando usuários...</p>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-[10px] uppercase tracking-wider text-zinc-400">
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">E-mail</th>
                      <th className="px-4 py-3 font-medium">Cadastrado em</th>
                      <th className="px-6 py-3 font-medium">Permissão</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                        <tr key={u.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-800 text-xs sm:text-sm">{u.nome}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs sm:text-sm">{u.email}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs sm:text-sm">
                            {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                <FiShield className="text-[11px]" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Cliente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative inline-flex justify-end">
                              <button
                                onClick={() => setMenuUsuarioAberto(menuUsuarioAberto === u.id ? null : u.id)}
                                className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors cursor-pointer"
                                aria-label={`Abrir ações de ${u.nome}`}
                              >
                                <FiMoreVertical />
                              </button>

                              {menuUsuarioAberto === u.id && (
                                <div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
                                  <button
                                    onClick={() => abrirConfirmacaoRole(u, 'ADMIN')}
                                    className={`${u.role === 'ADMIN' ? 'hidden' : 'w-full'} text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors`}
                                  >
                                    Tornar Administrador
                                  </button>
                                  <button
                                    onClick={() => abrirConfirmacaoRole(u, 'CLIENTE')}
                                    className={`${u.role === 'CLIENTE' ? 'hidden' : 'w-full'} text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors`}
                                  >
                                    Tornar Usuário
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {usuariosFiltrados.length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-10">Nenhum usuário encontrado.</p>
                )}
              </div>
            )}

            {/* Modal de confirmação para alterar permissão */}
            {usuarioParaAlterarRole && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-lg">
                      <FiAlertTriangle className="text-lg" />
                    </div>
                    <h3 className="font-semibold text-zinc-800">Confirmar alteração</h3>
                  </div>
                  <p className="text-sm text-zinc-500 mb-6">
                    {usuarioParaAlterarRole.roleDestino === 'CLIENTE' ? (
                      <>Tem certeza que deseja remover o acesso de administrador de <strong>{usuarioParaAlterarRole.nome}</strong>?</>
                    ) : (
                      <>Tem certeza que deseja tornar <strong>{usuarioParaAlterarRole.nome}</strong> um administrador? Essa pessoa passará a ter acesso total ao painel.</>
                    )}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setUsuarioParaAlterarRole(null)}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => alterarRoleUsuario(
                        usuarioParaAlterarRole.id,
                        usuarioParaAlterarRole.roleDestino
                      )}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-black text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA CONFIGURAÇÕES */}
        {abaAtiva === 'cupons' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-2xl font-normal tracking-tight">Cupons</h2>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Crie descontos reais para o site.</p>
            </header>

            <form onSubmit={criarCupom} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-2xs grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              <input value={novoCupom.nome} onChange={(e) => setNovoCupom(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome do cupom" className="xl:col-span-2 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black" required />
              <input value={novoCupom.codigo} onChange={(e) => setNovoCupom(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))} placeholder="Código" className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black" required />
              <select value={novoCupom.tipo} onChange={(e) => setNovoCupom(prev => ({ ...prev, tipo: e.target.value }))} className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-white">
                <option value="PERCENTUAL">Percentual</option>
                <option value="FIXO">Numérico</option>
              </select>
              <input value={novoCupom.valor} onChange={(e) => setNovoCupom(prev => ({ ...prev, valor: e.target.value }))} placeholder="Valor" type="number" step="0.01" className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black" required />
              <button type="submit" className="bg-black text-white px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors">Criar Cupom</button>
              <input value={novoCupom.expiraEm} onChange={(e) => setNovoCupom(prev => ({ ...prev, expiraEm: e.target.value }))} type="date" className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black" />
              <input value={novoCupom.usosMaximos} onChange={(e) => setNovoCupom(prev => ({ ...prev, usosMaximos: e.target.value }))} placeholder="Limite de usos" type="number" className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </form>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
              {carregandoCupons ? (
                <p className="px-6 py-10 text-sm text-zinc-400">Carregando cupons...</p>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-[10px] uppercase tracking-wider text-zinc-400">
                      <th className="px-6 py-3 font-medium">Nome</th>
                      <th className="px-6 py-3 font-medium">Código</th>
                      <th className="px-6 py-3 font-medium">Desconto</th>
                      <th className="px-6 py-3 font-medium">Criação</th>
                      <th className="px-6 py-3 font-medium">Expiração</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cupons.map((cupom) => (
                      <tr key={cupom.id} className="border-b border-zinc-50 last:border-0">
                        <td className="px-6 py-4 font-medium text-zinc-800">{cupom.nome}</td>
                        <td className="px-6 py-4 text-zinc-500 font-mono">{cupom.codigo}</td>
                        <td className="px-6 py-4 text-zinc-500">{cupom.tipo === 'PERCENTUAL' ? `${cupom.valor}%` : `R$ ${Number(cupom.valor).toFixed(2).replace('.', ',')}`}</td>
                        <td className="px-6 py-4 text-zinc-500">{new Date(cupom.criadoEm).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-zinc-500">{cupom.expiraEm ? new Date(cupom.expiraEm).toLocaleDateString('pt-BR') : 'Sem expiração'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cupom.ativo ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                            {cupom.ativo ? 'Ativo' : 'Pausado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => alternarStatusCupom(cupom)} className="text-xs font-semibold uppercase tracking-wider text-black hover:underline cursor-pointer">
                            {cupom.ativo ? 'Pausar' : 'Ativar'}
                          </button>
                          <button onClick={() => excluirCupom(cupom.id)} className="text-xs font-semibold uppercase tracking-wider text-red-500 hover:underline cursor-pointer">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'configuracoes' && (
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-normal tracking-tight">Configurações da Loja</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Gerencie cabeçalho e canais oficiais.</p>
            </header>

            <form onSubmit={salvarConfiguracoes} className="bg-white p-8 rounded-xl border border-zinc-200 shadow-2xs space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Frase do Topo (Barra de Anúncios)</label>
                <input 
                  type="text" 
                  value={configLoja.fraseTopo} 
                  onChange={(e) => setConfigLoja({...configLoja, fraseTopo: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Instagram (@ ou link)</label>
                <input 
                  type="text" 
                  value={configLoja.instagramUrl} 
                  onChange={(e) => setConfigLoja({...configLoja, instagramUrl: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">E-mail de Suporte</label>
                <input 
                  type="email" 
                  value={configLoja.emailSuporte} 
                  onChange={(e) => setConfigLoja({...configLoja, emailSuporte: e.target.value})} 
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  required 
                />
              </div>

              <div className="border-t border-zinc-100 pt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Frete da Loja</p>
                  <p className="text-xs text-zinc-500 mt-1">Defina frete base, faixa de frete grátis e prazo exibido.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Valor base</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configLoja.frete?.valorBase ?? 19.9}
                      onChange={(e) => setConfigLoja({ ...configLoja, frete: { ...configLoja.frete, valorBase: Number(e.target.value || 0) } })}
                      className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Frete grátis após</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configLoja.frete?.valorGratisApos ?? 250}
                      onChange={(e) => setConfigLoja({ ...configLoja, frete: { ...configLoja.frete, valorGratisApos: Number(e.target.value || 0) } })}
                      className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">Prazo exibido</label>
                  <input
                    type="text"
                    value={configLoja.frete?.prazo || "3 a 5 dias úteis"}
                    onChange={(e) => setConfigLoja({ ...configLoja, frete: { ...configLoja.frete, prazo: e.target.value } })}
                    className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black bg-zinc-50/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-100">
                <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-all cursor-pointer shadow-xs">
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* MODAL DE EXCLUSÃO DE PRODUTO */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-zinc-100">
            <h3 className="text-base font-medium text-zinc-900 mb-2">Excluir produto</h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Deseja realmente remover "{produtoParaExcluir.nome || 'este produto'}" do catálogo?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setProdutoParaExcluir(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Cancelar</button>
              <button onClick={confirmarExclusao} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO DE CATEGORIA */}
      {categoriaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-zinc-100">
            <h3 className="text-base font-medium text-zinc-900 mb-2">Excluir categoria</h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Deseja realmente remover a categoria "{categoriaParaExcluir.nome}"? Produtos já cadastrados nela manterão o nome antigo até serem editados.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCategoriaParaExcluir(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Cancelar</button>
              <button onClick={confirmarExclusaoCategoria} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

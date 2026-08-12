import { Link, useLocation } from 'react-router-dom';

const paginas = {
  '/termos': {
    titulo: 'Termos e Condicoes',
    introducao: 'Ao acessar a Boo Sportwear, criar uma conta ou realizar uma compra, voce concorda com estes termos.',
    secoes: [
      ['Cadastro e conta', 'Os dados informados devem ser verdadeiros e atualizados. O cliente e responsavel por manter sua senha protegida e pelas atividades realizadas em sua conta.'],
      ['Pedidos e precos', 'Pedidos dependem de confirmacao de estoque e pagamento. Precos, campanhas e cupons podem ter prazo e regras proprias, apresentados antes da compra.'],
      ['Entrega', 'O prazo comeca apos a confirmacao do pagamento. Eventos externos, dados incorretos ou ausencia no endereco podem alterar a previsao.'],
      ['Cancelamento e devolucao', 'O cliente pode exercer os direitos previstos no Codigo de Defesa do Consumidor e na Politica de Trocas e Devolucoes.'],
      ['Contato', 'Duvidas podem ser enviadas pelos canais oficiais exibidos no rodape da loja.'],
    ],
  },
  '/privacidade': {
    titulo: 'Politica de Privacidade',
    introducao: 'Tratamos somente os dados necessarios para operar a loja, atender clientes e cumprir obrigacoes legais.',
    secoes: [
      ['Dados coletados', 'Podemos tratar nome, e-mail, telefone, endereco, dados do pedido e informacoes tecnicas essenciais para seguranca e funcionamento do site.'],
      ['Como usamos', 'Os dados sao usados para autenticar a conta, processar pedidos, entregar produtos, prestar suporte, prevenir fraudes e enviar comunicacoes autorizadas.'],
      ['Compartilhamento', 'Dados podem ser compartilhados somente com fornecedores indispensaveis, como transporte, pagamento e infraestrutura, dentro da finalidade contratada.'],
      ['Seguranca e retencao', 'Aplicamos controles tecnicos e mantemos os dados pelo periodo necessario ao servico e ao cumprimento de obrigacoes legais.'],
      ['Seus direitos', 'O titular pode solicitar confirmacao, acesso, correcao ou outras medidas previstas na LGPD pelos canais oficiais da Boo Sportwear.'],
    ],
  },
  '/trocas-e-devolucoes': {
    titulo: 'Trocas e Devolucoes',
    introducao: 'Queremos que a compra vista bem e chegue em perfeito estado. Consulte abaixo as regras gerais de atendimento.',
    secoes: [
      ['Arrependimento', 'Compras online podem ser devolvidas em ate 7 dias corridos apos o recebimento, conforme a legislacao aplicavel.'],
      ['Condicoes do produto', 'A peca deve estar sem sinais de uso, lavagem ou alteracao, com etiquetas, acessorios e embalagem recebidos.'],
      ['Defeito ou item incorreto', 'Entre em contato assim que identificar o problema, enviando o numero do pedido e imagens que ajudem na analise.'],
      ['Como solicitar', 'Fale com o atendimento oficial informando numero do pedido, item e motivo. As instrucoes serao enviadas apos a analise.'],
      ['Reembolso', 'Quando aplicavel, o reembolso sera solicitado pelo mesmo meio de pagamento, respeitando os prazos da instituicao responsavel.'],
    ],
  },
  '/envios-e-prazos': {
    titulo: 'Envios e Prazos',
    introducao: 'O valor e a estimativa de entrega sao apresentados conforme o CEP e as regras disponiveis no momento da compra.',
    secoes: [
      ['Preparacao', 'A separacao do pedido ocorre depois da confirmacao do pagamento. O prazo informado considera preparacao e transporte quando indicado.'],
      ['Rastreamento', 'Quando disponibilizado pela transportadora, o codigo de rastreio sera vinculado ao pedido e enviado pelos canais cadastrados.'],
      ['Endereco', 'Revise CEP, numero e complemento antes de finalizar. Custos causados por endereco incorreto ou nova tentativa podem ser cobrados do cliente.'],
      ['Atrasos', 'Greves, clima, areas com restricao e outros eventos externos podem alterar a previsao. O atendimento auxiliara no acompanhamento.'],
    ],
  },
};

export default function Institucional() {
  const { pathname } = useLocation();
  const pagina = paginas[pathname] || paginas['/termos'];

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-zinc-900 px-5 py-10 sm:py-16">
      <article className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-3xl px-6 py-9 sm:px-12 sm:py-12 shadow-sm">
        <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 hover:text-black">Voltar para a loja</Link>
        <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">Boo Sportwear</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-black uppercase tracking-tight">{pagina.titulo}</h1>
        <p className="mt-5 text-sm sm:text-base leading-7 text-zinc-600">{pagina.introducao}</p>
        <div className="mt-10 space-y-8">
          {pagina.secoes.map(([titulo, texto]) => (
            <section key={titulo} className="border-t border-zinc-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider">{titulo}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{texto}</p>
            </section>
          ))}
        </div>
        <p className="mt-12 text-[11px] text-zinc-400">Ultima atualizacao: 12 de agosto de 2026.</p>
      </article>
    </main>
  );
}

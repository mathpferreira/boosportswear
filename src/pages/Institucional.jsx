import { Link } from 'react-router-dom';

const secoes = [
  ['Termos e Condicoes', 'Ao acessar a Boo Sportwear, criar uma conta ou realizar uma compra, o cliente declara que os dados informados sao verdadeiros e concorda com os precos, prazos e condicoes apresentados antes da finalizacao do pedido. Pedidos dependem da confirmacao de estoque e pagamento.'],
  ['Privacidade', 'Tratamos nome, e-mail, telefone, endereco e dados do pedido somente para autenticar a conta, processar compras, realizar entregas, prestar suporte, prevenir fraudes e cumprir obrigacoes legais. O titular pode solicitar acesso ou correcao pelos canais oficiais da loja.'],
  ['Trocas e Devolucoes', 'Compras online podem ser devolvidas em ate 7 dias corridos apos o recebimento, conforme a legislacao aplicavel. A peca deve estar sem sinais de uso, lavagem ou alteracao, com etiquetas e acessorios. Para solicitar atendimento, informe o numero do pedido e o motivo.'],
  ['Envios e Prazos', 'O valor e a previsao de entrega sao calculados pelo CEP. O prazo comeca depois da confirmacao do pagamento. Revise o endereco antes de comprar; greves, clima, areas com restricao e outros eventos externos podem alterar a previsao da transportadora.'],
];

export default function Institucional() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 sm:py-16 text-zinc-900">
      <article className="max-w-3xl mx-auto">
        <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 hover:text-black">Voltar para a loja</Link>
        <p className="mt-14 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">Boo Sportwear</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-black uppercase tracking-tight">Politicas da Loja</h1>
        <div className="mt-12 space-y-12">
          {secoes.map(([titulo, texto]) => (
            <section key={titulo}>
              <h2 className="text-sm font-bold uppercase tracking-wider">{titulo}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{texto}</p>
            </section>
          ))}
        </div>
        <p className="mt-16 text-[11px] text-zinc-400">Ultima atualizacao: 12 de agosto de 2026.</p>
      </article>
    </main>
  );
}

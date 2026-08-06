require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PASTA_UPLOADS = path.join(__dirname, 'uploads', 'produtos');
const LARGURA_MAXIMA = 1200;
const QUALIDADE = 78;

function formatarKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function salvarBase64ComoArquivo(dataUrl, nomeBase) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const buffer = Buffer.from(match[2], 'base64');
  const tamanhoAntes = buffer.length;

  const nomeArquivo = `${nomeBase}.webp`;
  const caminhoCompleto = path.join(PASTA_UPLOADS, nomeArquivo);

  await sharp(buffer)
    .resize({ width: LARGURA_MAXIMA, withoutEnlargement: true })
    .webp({ quality: QUALIDADE })
    .toFile(caminhoCompleto);

  const tamanhoDepois = (await fs.stat(caminhoCompleto)).size;

  return {
    url: `/uploads/produtos/${nomeArquivo}`,
    tamanhoAntes,
    tamanhoDepois,
  };
}

async function main() {
  await fs.mkdir(PASTA_UPLOADS, { recursive: true });

  const produtos = await prisma.produto.findMany();
  console.log(`${produtos.length} produto(s) encontrado(s). Verificando imagens em base64...\n`);

  let totalAntes = 0;
  let totalDepois = 0;
  let totalImagensMigradas = 0;

  for (const produto of produtos) {
    const imagensAtuais = Array.isArray(produto.imagens) ? produto.imagens : [];
    let precisaAtualizar = false;
    const novasImagens = [];

    for (let i = 0; i < imagensAtuais.length; i++) {
      const img = imagensAtuais[i];
      const urlAtual = typeof img === 'string' ? img : img?.url;

      if (urlAtual && urlAtual.startsWith('data:image/')) {
        const nomeBase = `${produto.id}-${i}-${Date.now()}`;
        try {
          const resultado = await salvarBase64ComoArquivo(urlAtual, nomeBase);
          if (resultado) {
            totalAntes += resultado.tamanhoAntes;
            totalDepois += resultado.tamanhoDepois;
            totalImagensMigradas++;
            precisaAtualizar = true;
            novasImagens.push({
              ...(typeof img === 'object' ? img : {}),
              url: resultado.url,
            });
            console.log(
              `✔ ${produto.nome} (imagem ${i + 1}): ${formatarKB(resultado.tamanhoAntes)} → ${formatarKB(resultado.tamanhoDepois)}`
            );
            continue;
          }
        } catch (erro) {
          console.error(`✘ Erro ao migrar imagem de "${produto.nome}":`, erro.message);
        }
      }

      // Se não era base64 (já é uma URL normal) ou deu erro, mantém como estava
      novasImagens.push(img);
    }

    if (precisaAtualizar) {
      const novoImgUrl = novasImagens[0]?.url || novasImagens[0] || produto.imgUrl;

      await prisma.produto.update({
        where: { id: produto.id },
        data: {
          imagens: novasImagens,
          imgUrl: typeof novoImgUrl === 'string' ? novoImgUrl : produto.imgUrl,
        },
      });
    }
  }

  console.log(`\n--- Resumo ---`);
  console.log(`Produtos verificados: ${produtos.length}`);
  console.log(`Imagens migradas (base64 → arquivo): ${totalImagensMigradas}`);
  console.log(`Tamanho total antes (base64 no banco): ${formatarKB(totalAntes)}`);
  console.log(`Tamanho total depois (arquivo comprimido): ${formatarKB(totalDepois)}`);
  if (totalAntes > 0) {
    console.log(
      `Economia: ${formatarKB(totalAntes - totalDepois)} (${(((totalAntes - totalDepois) / totalAntes) * 100).toFixed(1)}%)`
    );
  }

  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error('Erro geral no script:', erro);
  await prisma.$disconnect();
  process.exit(1);
});

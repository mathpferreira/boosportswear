# Deploy seguro da BOO Sportwear

Execute na VPS como `root`, nesta ordem. A migracao e aditiva e nao apaga produtos, pedidos ou usuarios.

## 1. Backup antes de alterar

```bash
cd /var/www/boosportswear
chmod 700 deploy/scripts/backup-boo.sh
deploy/scripts/backup-boo.sh
pg_restore --list "$(ls -1t /var/backups/boo-sportwear/boo_db_*.dump | head -n 1)" >/dev/null
sudo -u postgres psql -d boo_db -c 'SELECT (SELECT COUNT(*) FROM "Produto") AS produtos, (SELECT COUNT(*) FROM "Pedido") AS pedidos, (SELECT COUNT(*) FROM "User") AS usuarios;'
```

## 2. Atualizar e compilar

```bash
cd /var/www/boosportswear
git pull
npm ci
npm run build

cd /var/www/boosportswear/boo-api
npm ci
npx prisma generate
npx prisma validate
npm run build
```

## 3. Aplicar a migracao preservando os dados

```bash
sudo -u postgres psql -d boo_db -v ON_ERROR_STOP=1 \
  -f /var/www/boosportswear/boo-api/prisma/manual-migrations/20260820_hardening.sql
sudo -u postgres psql -d boo_db -c 'SELECT (SELECT COUNT(*) FROM "Produto") AS produtos, (SELECT COUNT(*) FROM "Pedido") AS pedidos, (SELECT COUNT(*) FROM "User") AS usuarios;'
```

Nunca use `prisma db push --accept-data-loss` em producao.

## 4. Separar o usuario de runtime

```bash
read -rsp "Senha nova do usuario boo_app: " BOO_APP_PASSWORD; echo
sudo -u postgres psql -d boo_db \
  -v app_password="$BOO_APP_PASSWORD" \
  -f /var/www/boosportswear/deploy/postgres/least-privilege.sql
unset BOO_APP_PASSWORD
```

Atualize `DATABASE_URL` no `boo-api/.env` para o usuario `boo_app`. Guarde a credencial de `boo_user` fora da aplicacao e use-a apenas em migracoes.

## 5. Restringir o processo da API

```bash
id -u booapp >/dev/null 2>&1 || useradd --system --home /nonexistent --shell /usr/sbin/nologin booapp
install -d -o booapp -g booapp -m 0750 /var/www/boosportswear/boo-api/uploads/produtos
chown root:booapp /var/www/boosportswear/boo-api/.env
chmod 0640 /var/www/boosportswear/boo-api/.env
```

O codigo e o `.env` ficam somente para leitura; apenas `uploads/` fica gravavel pelo processo `booapp`.

## 6. Reiniciar e validar

```bash
cd /var/www/boosportswear
pm2 startOrReload deploy/pm2/ecosystem.config.cjs --update-env
pm2 save
curl --fail --silent https://boosportwear.com/api/health
```

## 7. Nginx e backup diario

```bash
cp deploy/nginx/boosportwear.com.conf /etc/nginx/sites-available/boosportwear.com
nginx -t
systemctl reload nginx

cp deploy/systemd/boo-backup.service /etc/systemd/system/
cp deploy/systemd/boo-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now boo-backup.timer
systemctl start boo-backup.service
systemctl status boo-backup.timer --no-pager
```

Mantenha tambem uma copia criptografada dos backups fora da VPS. Backup no mesmo disco nao protege contra perda total do servidor.

## 8. Teste operacional depois do deploy

1. Abra `Painel administrativo > Configuracoes`, envie um e-mail de teste e confirme o status `SENT` no historico.
2. Cadastre uma conta de cliente, confirme o e-mail e teste a recuperacao de senha.
3. Calcule um CEP da Grande Sao Paulo e outro de fora da regiao; confirme motoboy no primeiro e Frenet no segundo.
4. Faca um pedido real de baixo valor na InfinitePay e confira valor, webhook, estoque, pedido, e-mails do cliente e do administrador.
5. Cancele um pedido ainda nao pago e confirme que estoque e uso do cupom retornaram uma unica vez.
6. Execute novamente a consulta de contagens e confirme que produtos, pedidos e usuarios anteriores continuam presentes.

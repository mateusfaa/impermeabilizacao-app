# Como iniciar o projeto

## Pré-requisitos

1. **Node.js 18+** — https://nodejs.org/
2. **PostgreSQL** — https://www.postgresql.org/ (ou use Docker: `docker run --name imperm-db -e POSTGRES_PASSWORD=senha123 -e POSTGRES_DB=impermeabilizacao -p 5432:5432 -d postgres`)

## Passo a passo

### 1. Instalar dependências
```bash
cd impermeabilizacao-app
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# Copie o exemplo e edite com suas credenciais
cp .env.example .env.local
```

Edite `.env.local`:
```
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/impermeabilizacao"
NEXTAUTH_SECRET="cole-aqui-uma-chave-aleatória-longa"
NEXTAUTH_URL="http://localhost:3000"
```

Para gerar o NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Criar o banco de dados e rodar as migrations
```bash
npm run db:push
```

### 4. Popular o banco com dados iniciais
```bash
npm run db:seed
```

Usuários criados pelo seed:
| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@impermeabilizacao.com | admin123 | Administrador |
| financeiro@impermeabilizacao.com | fin123 | Financeiro |

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincronizar schema com o banco |
| `npm run db:migrate` | Criar migration formal |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:seed` | Popular dados iniciais |

## Estrutura das telas

- `/login` — Tela de login
- `/dashboard` — Visão geral / KPIs
- `/obras` — Lista de obras com barras de progresso
- `/obras/nova` — Cadastrar nova obra
- `/obras/[id]` — Detalhe da obra + medições + notas
- `/obras/[id]/medicoes` — Gerenciar medições de mão de obra
- `/obras/[id]/materiais` — Gerenciar notas de material (com upload PDF)
- `/contratantes` — Lista de contratantes
- `/contratantes/novo` — Cadastrar contratante
- `/fornecedores` — Lista de fornecedores
- `/fornecedores/novo` — Cadastrar fornecedor
- `/alertas` — Central de alertas automáticos
- `/usuarios` — Gerenciar usuários (só Administrador)
- `/usuarios/novo` — Criar usuário

## Níveis de acesso

| Perfil | Visualizar | Criar/Editar | Excluir | Usuários |
|--------|-----------|--------------|---------|----------|
| Administrador | ✓ | ✓ | ✓ | ✓ |
| Financeiro | ✓ | ✓ | ✗ | ✗ |
| Operacional | ✓ | ✓ | ✗ | ✗ |
| Visualização | ✓ | ✗ | ✗ | ✗ |

## Alertas automáticos

Os alertas são gerados automaticamente ao salvar medições ou notas de material:

- **80% M.O.**: mão de obra atingiu 80% do saldo → verificar saldo de material
- **90% M.O.**: mão de obra atingiu 90% → cobrar Termo de Conclusão
- **100% Contrato**: total geral atingiu 100% → obra marcada como "Próximo Encerramento"

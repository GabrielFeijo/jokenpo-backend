# 🪨📄✂️ Jokenpo API - Backend

API para o jogo **Pedra, Papel e Tesoura** construída com NestJS, TypeScript e WebSocket para suporte a partidas multijogador em tempo real. Backend completo com sistema de salas, estatísticas avançadas e comunicação WebSocket para uma experiência de jogo fluida e responsiva.

## ✨ Funcionalidades

### 🎮 Sistema de Jogo Multiplayer

- **🏟️ Salas Privadas**: Criação de salas com códigos únicos de convite
- **🎯 Dois Modos de Jogo**: Clássico (3 opções) e Estendido (5 opções)
- **🔄 Sistema de Rematch**: Revanche automática entre jogadores

### 🌐 Comunicação WebSocket

- **🔄 Eventos em Tempo Real**: Sincronização instantânea entre clientes
- **🎯 Gerenciamento de Salas**: Entrada/saída automática de jogadores
- **⚡ Estado do Jogo**: Recuperação automática de estado perdido
- **📡 Reconexão Automática**: Sistema robusto de reconexão

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- MongoDB (local ou cloud)
- npm ou yarn

## 🚀 Instalação

1. **Clone o repositório**

   ```bash
   git clone hthttps://github.com/GabrielFeijo/jokenpo-backend.git
   cd rock-paper-scissors-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto:

   ```env
   # 🗄️ Banco de Dados
   DATABASE_URL="mongodb://localhost:27017/rock-paper-scissors"

   # 🌐 Configurações do Servidor
   PORT=3333
   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3333"
   ```

4. **Configuração do Banco de Dados**

   ```bash
   # Gerar cliente Prisma
   npm run prisma:generate

   # Aplicar schema no banco (desenvolvimento)
   npm run prisma:push

   # Ou executar migrações (produção)
   npm run prisma:migrate
   ```

5. **Inicie a aplicação**

   ```bash
   # Modo de desenvolvimento
   npm run start:dev

   # Modo de produção
   npm run build
   npm run start:prod
   ```

## ⚙️ Variáveis de Ambiente

| Variável       | Descrição                  | Exemplo                         | Obrigatória |
| -------------- | -------------------------- | ------------------------------- | ----------- |
| `DATABASE_URL` | URL de conexão com MongoDB | `mongodb://localhost:27017/rps` | ✅          |
| `PORT`         | Porta do servidor          | `3333`                          | ❌          |
| `FRONTEND_URL` | URL do frontend para CORS  | `http://localhost:5173`         | ✅          |
| `BACKEND_URL`  | URL do backend             | `http://localhost:3333`         | ❌          |

## 🏗️ Estrutura do Projeto

```
src/
├── common/                  # Utilitários e interfaces compartilhadas
│   ├── interfaces/         # Interfaces do WebSocket e jogo
│   │   └── socket.interfaces.ts
│   └── types/              # Tipos e regras do jogo
│       └── game.types.ts
├── game/                   # Gateway WebSocket do jogo
│   ├── dto/               # DTOs dos eventos WebSocket
│   │   └── game-events.dto.ts
│   ├── game.gateway.ts    # Gateway principal WebSocket
│   └── game.module.ts
├── users/                  # Gerenciamento de usuários
│   ├── dto/               # DTOs de usuário
│   │   └── create-user.dto.ts
│   ├── users.controller.ts # Endpoints REST de usuários
│   ├── users.service.ts    # Lógica de negócio de usuários
│   └── users.module.ts
├── rooms/                  # Gerenciamento de salas
│   ├── dto/               # DTOs de salas
│   │   └── create-room.dto.ts
│   ├── rooms.controller.ts # Endpoints REST de salas
│   ├── rooms.service.ts    # Lógica de negócio de salas
│   └── rooms.module.ts
├── matches/                # Sistema de partidas
│   ├── dto/               # DTOs de partidas
│   │   └── create-match.dto.ts
│   ├── matches.controller.ts # Endpoints REST de partidas
│   ├── matches.service.ts   # Lógica de jogo e regras
│   └── matches.module.ts
├── stats/                  # Sistema de estatísticas
│   ├── dto/               # DTOs de estatísticas
│   │   └── stats-query.dto.ts
│   ├── stats.controller.ts # Endpoints REST de estatísticas
│   ├── stats.service.ts    # Análise de dados e métricas
│   └── stats.module.ts
├── prisma/                 # Configuração do banco de dados
│   ├── prisma.service.ts  # Serviço Prisma
│   ├── prisma.module.ts   # Módulo Prisma
│   └── schema.prisma      # Schema do banco de dados
├── main.ts                 # Arquivo principal da aplicação
└── app.module.ts          # Módulo raiz
```

## 🗄️ Schema do Banco de Dados

### Entidades Principais

- **👤 User**: Usuários do sistema (convidados e registrados)
- **🏟️ Room**: Salas de jogo com códigos únicos
- **⚔️ Match**: Partidas individuais dentro das salas
- **🎯 Play**: Jogadas específicas dos jogadores
- **🏆 Result**: Resultados das partidas

### Relacionamentos

```
User 1:N Room (criador)
User N:M Room (jogadores)
Room 1:N Match
Match 1:N Play
Match 1:N Result
User 1:N Play
```

## 🔧 Endpoints da API

### 👥 Usuários

| Método  | Endpoint               | Descrição               |
| ------- | ---------------------- | ----------------------- |
| `POST`  | `/api/users/guest`     | Criar usuário convidado |
| `GET`   | `/api/users/:id`       | Obter dados do usuário  |
| `GET`   | `/api/users/:id/stats` | Estatísticas do usuário |
| `PATCH` | `/api/users/:id`       | Atualizar usuário       |

### 🏟️ Salas

| Método | Endpoint                  | Descrição                |
| ------ | ------------------------- | ------------------------ |
| `POST` | `/api/rooms`              | Criar nova sala          |
| `POST` | `/api/rooms/join`         | Entrar em sala existente |
| `GET`  | `/api/rooms/:id`          | Obter dados da sala      |
| `GET`  | `/api/rooms/invite/:code` | Buscar sala por código   |
| `GET`  | `/api/rooms/:id/stats`    | Estatísticas da sala     |

### ⚔️ Partidas

| Método | Endpoint                       | Descrição              |
| ------ | ------------------------------ | ---------------------- |
| `POST` | `/api/matches`                 | Criar nova partida     |
| `GET`  | `/api/matches/:id`             | Obter dados da partida |
| `GET`  | `/api/matches/history/:userId` | Histórico de partidas  |

### 📊 Estatísticas

| Método | Endpoint                     | Descrição                   |
| ------ | ---------------------------- | --------------------------- |
| `GET`  | `/api/stats/dashboard`       | Dados do dashboard          |
| `GET`  | `/api/stats/user/:userId`    | Estatísticas do usuário     |
| `GET`  | `/api/stats/global`          | Estatísticas globais        |
| `GET`  | `/api/stats/choices/:userId` | Análise de escolhas         |
| `GET`  | `/api/stats/winrate/:userId` | Taxa de vitória por escolha |

## 📡 Eventos WebSocket

### 📤 Eventos Enviados pelo Cliente

```typescript
// Entrar em uma sala
socket.emit('join-room', {
	roomId: 'room-id',
	userId: 'user-id',
});

// Sinalizar que está pronto
socket.emit('player-ready', {
	roomId: 'room-id',
	userId: 'user-id',
});

// Fazer uma jogada
socket.emit('make-play', {
	roomId: 'room-id',
	userId: 'user-id',
	choice: 'ROCK' | 'PAPER' | 'SCISSORS' | 'LIZARD' | 'SPOCK',
});

// Solicitar revanche
socket.emit('rematch', {
	roomId: 'room-id',
	userId: 'user-id',
});

// Sair da sala
socket.emit('leave-room', {
	roomId: 'room-id',
	userId: 'user-id',
});
```

### 📥 Eventos Recebidos pelo Cliente

```typescript
// Conectado com sucesso
socket.on('connected', (data) => {
	console.log('Socket ID:', data.socketId);
});

// Entrou na sala
socket.on('room-joined', (data) => {
	console.log('Sala:', data.room);
});

// Sala atualizada
socket.on('room-updated', (data) => {
	console.log('Estado da sala:', data.room);
});

// Jogador entrou
socket.on('player-joined', (data) => {
	console.log('Novo jogador:', data.user);
});

// Jogador saiu
socket.on('player-left', (data) => {
	console.log('Jogador saiu:', data.userId);
});

// Jogo iniciado
socket.on('game-started', (data) => {
	console.log('Partida:', data.match);
});

// Jogada realizada
socket.on('play-made', (data) => {
	console.log('Jogada:', data.play);
});

// Partida finalizada
socket.on('match-finished', (data) => {
	console.log('Resultado:', data.result);
	console.log('Partida:', data.match);
	console.log('Jogadas:', data.plays);
});

// Revanche iniciada
socket.on('rematch-started', (data) => {
	console.log('Nova partida na sala:', data.roomId);
});

// Erro do jogo
socket.on('game-error', (error) => {
	console.error('Erro:', error.message);
	console.error('Código:', error.code);
});
```

## 🎮 Regras do Jogo

### 🎯 Modo Clássico

```typescript
const CLASSIC_RULES = {
	ROCK: ['SCISSORS'], // Pedra esmaga Tesoura
	PAPER: ['ROCK'], // Papel embrulha Pedra
	SCISSORS: ['PAPER'], // Tesoura corta Papel
};
```

### ⚡ Modo Estendido

```typescript
const EXTENDED_RULES = {
	ROCK: ['SCISSORS', 'LIZARD'], // Pedra esmaga Tesoura e Lagarto
	PAPER: ['ROCK', 'SPOCK'], // Papel embrulha Pedra e refuta Spock
	SCISSORS: ['PAPER', 'LIZARD'], // Tesoura corta Papel e decapita Lagarto
	LIZARD: ['SPOCK', 'PAPER'], // Lagarto envenena Spock e come Papel
	SPOCK: ['SCISSORS', 'ROCK'], // Spock quebra Tesoura e vaporiza Pedra
};
```

## 📝 Scripts Disponíveis

```bash
# 🔧 Desenvolvimento
npm run start:dev        # Iniciar com hot-reload
npm run start:debug      # Iniciar com debug habilitado

# 🏗️ Build e Produção
npm run build           # Build para produção
npm run start:prod      # Iniciar em modo produção

# 🗄️ Banco de Dados
npm run prisma:generate # Gerar cliente Prisma
npm run prisma:push     # Aplicar schema (desenvolvimento)
npm run prisma:migrate  # Executar migrações (produção)
npm run prisma:studio   # Interface visual do banco

# 🔍 Qualidade de Código
npm run lint            # Executar ESLint
npm run format          # Formatar código com Prettier
npm run test            # Executar testes unitários
npm run test:e2e        # Executar testes E2E
```

## 🛠️ Tecnologias Utilizadas

<div align="left">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg" width="50" height="50" alt="NestJS"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" width="50" height="50" alt="TypeScript"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" width="50" height="50" alt="MongoDB"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg" width="50" height="50" alt="Prisma"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/socketio/socketio-original.svg" width="50" height="50" alt="Socket.IO"/>
</div>

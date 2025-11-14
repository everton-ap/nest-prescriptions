# Prescrições Médicas

Sistema para leitura e processamento de arquivos CSV contendo prescrições médicas.

## Descrição

Este projeto é uma API desenvolvida com NestJS para importar e gerenciar prescrições médicas através de arquivos CSV. O sistema realiza validação de dados, evita duplicações e persiste as informações em um banco de dados MySQL.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 18 ou superior)
- **npm** (gerenciador de pacotes do Node.js)
- **Docker** e **Docker Compose**
- **NestJS**

## Configuração do Ambiente

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto utilizando as variáveis do `.env-example`

### 2. Subir o banco de dados com Docker

O projeto utiliza MySQL 8.0 como banco de dados. Para iniciar o container:

```bash
# Iniciar o container do MySQL
docker compose up -d

# Verificar se o container está rodando
docker ps
```

O banco de dados estará disponível em `localhost:3307` (porta configurável via `.env`).

**Comandos úteis do Docker:**

```bash
# Parar o container
docker compose down

# Ver logs do container
docker compose logs -f mysql

# Reiniciar o container
docker compose restart
```

## Instalação do Projeto

```bash
npm install
```

## Executar o Projeto

### Modo de desenvolvimento

```bash
# Desenvolvimento normal
npm run start

# Modo watch (reinicia automaticamente ao detectar mudanças)
npm run start:dev
```

A API estará disponível em `http://localhost:3000` (porta padrão do NestJS).

## Funcionalidades

- Upload e processamento de arquivos CSV com prescrições médicas
- Validação de dados (CPF, formato de data, campos obrigatórios)
- Validação de cabeçalhos do CSV
- Prevenção de duplicação de prescrições
- Consulta de prescrições por ID
- Persistência de dados em MySQL

## Estrutura do CSV

O arquivo CSV deve conter os seguintes campos:

```
id, date, patient_cpf, doctor_crm, doctor_uf, medication, controlled, dosage, frequency, duration, notes

```

## Tecnologias Utilizadas

- **NestJS** - Framework Node.js progressivo
- **TypeORM** - ORM para TypeScript e JavaScript
- **MySQL** - Banco de dados relacional
- **Docker** - Containerização
- **Zod** - Validação de schemas
- **csv-parse** - Parser de arquivos CSV
- **cpf-cnpj-validator** - Validação de CPF/CNPJ

## Troubleshooting

### Erro de conexão com o banco de dados

Verifique se:
1. O container Docker está rodando: `docker ps`
2. As variáveis de ambiente no `.env` estão corretas
3. A porta configurada não está sendo usada por outro serviço

### Problemas com Docker

```bash
# Remover containers e volumes
docker compose down -v

# Recriar containers
docker compose up -d --force-recreate
```

## Testes

### Cenários de Teste

A aplicação deve ser testada nos seguintes cenários:

- [ ] CSV corrompido
- [ ] CSV com cabeçalhos inválidos
- [ ] CSV com CPF inválido
- [ ] CSV com data de nascimento em formato incorreto
- [ ] CSV com campos obrigatórios faltando
- [ ] CSV com prescrições duplicadas
- [ ] CSV válido com importação bem-sucedida
- [ ] Busca de prescrição por ID existente
- [ ] Busca de prescrição por ID inexistente
- [ ] Upload sem arquivo anexado

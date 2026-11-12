# Site do Corretor Alex Veloso

Site institucional estático para apresentação e divulgação de imóveis em Recife e região. A página inicial monta a vitrine a partir das páginas de detalhes dos imóveis e das configurações salvas no navegador.

## Tecnologias

- **HTML5**: estrutura e conteúdo das páginas.
- **CSS3**: estilos responsivos em `style.css`.
- **JavaScript**: carrosséis, vitrine, filtros, painel de edição e interações em `script.js` e `painel.js`.
- **Bootstrap 5**, **Font Awesome** e a fonte **Outfit** são carregados por CDN.
- **Python** pode servir os arquivos durante o desenvolvimento, mas não é necessário para executar o site publicado.
- **Docker** empacota os arquivos estáticos e usa Nginx para servi-los.

Não há compilação, dependências npm, banco de dados ou aplicação de backend. É necessário acessar o site por HTTP; abrir os arquivos diretamente com `file://` impede o carregamento das páginas dos imóveis.

## Estrutura do projeto

```text
.
├── index.html          # Página inicial, carrossel, filtros e vitrine
├── quem-somos.html     # Apresentação do corretor
├── imovel.html         # Modelo de detalhes para imóveis cadastrados no painel
├── imoveis/            # Páginas de detalhes dos imóveis existentes
├── painel.html         # Painel administrativo
├── painel.js           # Login demonstrativo, edição e armazenamento no navegador
├── script.js           # Carregamento da vitrine e interações do site
├── style.css           # Estilos e layout responsivo
├── assets/             # Fotos, logotipo e imagens do site
└── Dockerfile           # Imagem Nginx para executar em Docker
```

## Executar em Linux

Instale Python 3 (se ainda não estiver instalado), abra um terminal na pasta do projeto e inicie o servidor:

```bash
python3 --version
python3 -m http.server 8000 --bind 0.0.0.0
```

No próprio computador, acesse `http://localhost:8000`. Para abrir em outro dispositivo da mesma rede, descubra o IP local do computador servidor (por exemplo, com `hostname -I`) e acesse `http://IP_DO_COMPUTADOR:8000`.

Para encerrar o servidor, pressione `Ctrl+C` no terminal. Se outro dispositivo não conseguir conectar, confira se o firewall do Linux permite conexões TCP na porta 8000 pela rede privada. O servidor simples do Python é indicado para desenvolvimento e rede confiável, não para publicar o site diretamente na internet.

## Executar com Docker

Com Docker instalado e iniciado, execute na raiz do projeto:

```bash
docker build -t corretor-imoveis .
docker run -d --name corretor-imoveis --restart unless-stopped -p 8000:80 corretor-imoveis
```

O site ficará disponível em `http://localhost:8000`. Para acessá-lo por celular ou outro computador na mesma rede, use `http://IP_DO_COMPUTADOR:8000` e permita a porta 8000 no firewall, se necessário.

Comandos úteis:

```bash
docker logs corretor-imoveis
docker stop corretor-imoveis
docker start corretor-imoveis
docker rm -f corretor-imoveis
```

O conteúdo do site é copiado para a imagem durante `docker build`. Depois de alterar os arquivos do projeto, reconstrua a imagem e recrie o contêiner para publicar as alterações.

## Painel administrativo e armazenamento

Abra `painel.html` pelo site e entre no painel para cadastrar ou editar imóveis. Marque **Promoção** para incluir o imóvel no carrossel **Imóveis Destaques**; esse carrossel exibe somente imóveis marcados para promoção. Também é possível escolher se o imóvel aparece em **Imóveis imperdíveis**, **Destaques de venda** ou **Destaques de locação**, e indicar **Lançamento (sem preço)**. Os destaques de venda e locação respeitam também a finalidade selecionada no formulário. Imóveis marcados como lançamento não exibem o preço na vitrine nem na página de detalhes.

Este projeto não tem backend: alterações, imagens enviadas, imóveis criados e sessão do painel ficam no `localStorage` ou `sessionStorage` do navegador. Esses dados pertencem ao navegador e à origem do site e **não são publicados nos arquivos nem compartilhados automaticamente com outros visitantes ou dispositivos**. O catálogo que vem nos arquivos do projeto continua disponível para todos.

O login do painel é somente demonstrativo: como o código roda no navegador, não oferece autenticação segura. Não use o painel atual para proteger informações ou operações reais. Para publicar alterações para todos, compartilhar dados entre dispositivos, ou operar em produção com segurança, será necessário implementar um backend/API, armazenamento persistente e autenticação no servidor.

## Catálogo e contato

As páginas em `imoveis/` e suas imagens em `assets/imoveis/` compõem o catálogo demonstrativo. O conteúdo não é sincronizado com os anunciantes; preços, imagens e disponibilidade podem mudar. Confirme os dados e a representação do imóvel diretamente antes de divulgar uma oferta.

Os contatos e solicitações de visita/proposta encaminham uma mensagem ao WhatsApp do corretor. O site não envia nem armazena os dados do formulário: a pessoa revisa e confirma o envio no WhatsApp.

## Dependências externas

Bootstrap, Font Awesome e Google Fonts são obtidos por CDN. É necessária conexão com a internet para carregar esses recursos; as páginas, scripts, estilos e imagens do projeto são servidos localmente.

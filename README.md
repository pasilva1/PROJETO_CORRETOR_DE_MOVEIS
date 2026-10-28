# Site do Corretor Alex Veloso

Site institucional de apresentação e divulgação de imóveis em Recife e região.

## Páginas

- `index.html`: página inicial, apresentação e vitrine de imóveis.
- `quem-somos.html`: informações sobre o corretor.
- `imovel.html`: página de detalhes de imóvel.
- `imoveis/`: páginas individuais dos imóveis.

## Executar localmente

O projeto é estático e não requer instalação de dependências. Como a página inicial lê os dados das páginas de imóveis, sirva a pasta com um servidor HTTP local (por exemplo, a extensão Live Server do VS Code). Abrir `index.html` diretamente como arquivo não permite que o navegador carregue essas páginas.

## Catálogo demonstrativo da OLX

As 15 páginas em `imoveis/` apresentam anúncios encontrados na OLX, em Recife/Boa Viagem, Gravatá e Olinda. As imagens estão salvas localmente em `assets/imoveis/`; cada página inclui título, preço e características disponíveis na listagem.

Esse catálogo não é sincronizado com a OLX. Preços, imagens e disponibilidade podem mudar ou os anúncios podem ser removidos; confirme os dados diretamente na fonte. A presença de um imóvel nesta demonstração não indica que faça parte da carteira do corretor ou que exista vínculo com o anunciante.

## Contato e solicitações

Os botões para falar com o corretor, solicitar visita ou fazer proposta abrem o WhatsApp `+55 81 98930-4727`, identificando o anúncio como de terceiro e pedindo confirmação de representação, dados e disponibilidade. O formulário de nome e telefone valida os campos e prepara uma mensagem com esses dados para envio pelo WhatsApp. Como o site é estático, os dados não são gravados nem enviados até que a pessoa confirme a mensagem no WhatsApp.

A página inicial lê a imagem, o título, a localização, o preço e as características diretamente das páginas dos imóveis para manter os destaques alinhados com os detalhes.

## Arquivos principais

- `style.css`: estilos e layout responsivo.
- `script.js`: carrosséis e interações da página inicial.
- `assets/`: imagens e logotipo utilizados pelo site.

Bootstrap, Font Awesome e a fonte Outfit são carregados por CDN; é necessária conexão à internet para esses recursos.

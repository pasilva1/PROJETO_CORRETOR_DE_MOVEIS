/* =====================================================
   JAVASCRIPT - Imobiliária
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // 1. HEADER CAROUSEL (5 segundos)
    // =====================================================
    const bgSlides = document.querySelectorAll('.bg-slide');
    if (bgSlides.length > 0) {
        let currentBg = 0;
        setInterval(() => {
            bgSlides[currentBg].classList.remove('active');
            currentBg = (currentBg + 1) % bgSlides.length;
            bgSlides[currentBg].classList.add('active');
        }, 5000); // 5 segundos conforme solicitado
    }

    // =====================================================
    // 2. CARROSSEL IMÓVEIS DESTAQUES (15 imóveis)
    // =====================================================
    const carouselImoveis = document.getElementById('carousel-destaques-imoveis');
    if (carouselImoveis) {
        // Seeds usados na primeira imagem de cada imovel-N.html
        // Todos usam "imovelA" como seed da primeira foto, mas usamos seed único por imóvel para variedade visual
        const seeds = [
            'imovelA','imovelB','imovelC','imovelD','imovelE',
            'imovelF','imovelG','imovelH','imovelI','imovelJ',
            'imovelK','imovelL','imovelM','imovelN','imovelO'
        ];
        let slidesHTML = '';
        for (let i = 1; i <= 15; i++) {
            const activeClass = i === 1 ? 'active' : '';
            const seed = seeds[i - 1];
            slidesHTML += `
                <div class="carousel-item ${activeClass}" style="cursor:pointer;" onclick="window.location.href='imoveis/imovel-${i}.html'">
                    <div style="position:relative;">
                        <img src="https://picsum.photos/seed/${seed}/900/420" class="d-block w-100" alt="Imóvel Destaque ${i}" style="object-fit:cover; height:420px;">
                        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.65));padding:24px 32px 20px;">
                            <span class="badge bg-primary mb-2" style="font-size:0.85rem;">Imóvel ${i}</span>
                            <h5 class="text-white fw-bold mb-0" style="font-size:1.2rem;">Residencial Get Like ${i}</h5>
                            <p class="text-white-50 mb-0 small">Boa Viagem, Recife — Clique para ver detalhes</p>
                        </div>
                    </div>
                </div>
            `;
        }
        carouselImoveis.innerHTML = slidesHTML;
    }

    // =====================================================
    // 3. VITRINE DE 15 IMÓVEIS (Card Decks)
    // =====================================================
    const gridImoveis = document.getElementById('properties-grid');
    if (gridImoveis) {
        let cardsHTML = '';
        for (let i = 1; i <= 15; i++) {
            // Gerando valores aleatórios para simular imóveis reais
            const area = Math.floor(Math.random() * 150) + 40;
            const quartos = Math.floor(Math.random() * 4) + 1;
            const vagas = Math.floor(Math.random() * 3);
            const ref = Math.floor(Math.random() * 90000) + 10000;
            const price = (Math.random() * 800000 + 150000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Classes solicitadas no prompt: col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3 card-deck
            cardsHTML += `
                <div class="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3 card-deck fade-in" style="cursor: pointer;" onclick="window.location.href='imoveis/imovel-${i}.html';">
                    <div class="card h-100 shadow-sm border-0 position-relative">
                        <!-- Imagem do Imóvel com Conteúdo Deslizante (Hover) -->
                        <div class="property-image-wrapper w-100 position-relative bg-light">
                            <span class="badge bg-primary position-absolute top-0 start-0 m-3 p-2 fs-6 z-2">Venda</span>
                            <img src="https://picsum.photos/seed/card${i}/500/400" class="w-100 h-100" alt="Imóvel Vitrine ${i}" style="object-fit: cover;">
                            
                            <!-- Overlay que sobe ao passar o mouse -->
                            <div class="property-overlay-info">
                                <h5 class="card-title fw-bold text-dark mb-2">Residencial Get Like ${i}</h5>
                                <p class="card-text text-secondary mb-3 small" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">Experimente o melhor de Recife com alto padrão e conforto no coração de Boa Viagem!</p>
                                <div class="d-flex align-items-baseline gap-2 mb-1">
                                    <span class="fs-6 text-muted">R$</span>
                                    <h4 class="text-dark fw-bolder mb-0">${price}</h4>
                                </div>
                                <p class="text-secondary small mb-0">Boa Viagem, Recife</p>
                            </div>
                        </div>
                        <div class="card-footer bg-white p-3">
                            <div class="d-flex justify-content-between text-center w-100 mb-3">
                                <div class="c49icon-area-1 flex-fill">
                                    <div class="text-secondary fs-4 mb-1"><i class="fa fa-ruler-combined"></i></div>
                                    <div class="text-primary fw-medium" style="font-size: 0.85rem;">${area} m²</div>
                                </div>
                                <div class="c49icon-bedroom-1 flex-fill">
                                    <div class="text-secondary fs-4 mb-1"><i class="fa fa-bed"></i></div>
                                    <div class="text-primary fw-medium" style="font-size: 0.85rem;">${quartos} quarto${quartos !== 1 ? 's' : ''}</div>
                                </div>
                                <div class="c49icon-bathroom-1 flex-fill">
                                    <div class="text-secondary fs-4 mb-1"><i class="fa fa-shower"></i></div>
                                    <div class="text-primary fw-medium" style="font-size: 0.85rem;">${Math.max(1, quartos - 1)} banh.</div>
                                </div>
                                <div class="c49icon-garage-1 flex-fill">
                                    <div class="text-secondary fs-4 mb-1"><i class="fa fa-car"></i></div>
                                    <div class="text-primary fw-medium" style="font-size: 0.85rem;">${vagas} vaga${vagas !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            
                            <div class="c49-property-number-wrap w-100 text-center pt-2" style="border-top: 1px solid #eee;">
                                <span class="c49-property-number text-muted" style="font-size: 0.8rem;">REF: ${ref}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        gridImoveis.innerHTML = cardsHTML;
    }

    // =====================================================
    // 4. ANO ATUAL (Footer)
    // =====================================================
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // =====================================================
    // 5. SCROLL ANIMATION (Fade-In)
    // =====================================================
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Usa setTimeout para garantir que elementos dinâmicos foram renderizados
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 500);

    // =====================================================
    // 6. WIDGET WHATSAPP LOGIC
    // =====================================================
    const whatsappBtn   = document.getElementById('whatsapp-btn');
    const whatsappPopup = document.getElementById('whatsapp-popup');
    const whatsappClose = document.getElementById('whatsapp-close');
    const whatsappBody  = document.getElementById('whatsapp-body');

    if (whatsappBtn && whatsappPopup) {
        const whatsappNumber = '5581988888888'; // Phone requested
        const whatsappMessage = 'Olá! Gostaria de falar com o corretor responsável sobre os imóveis.';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        whatsappBtn.addEventListener('click', () => {
            whatsappPopup.classList.toggle('active');
        });

        if (whatsappClose) {
            whatsappClose.addEventListener('click', (e) => {
                e.stopPropagation();
                whatsappPopup.classList.remove('active');
            });
        }

        if (whatsappBody) {
            whatsappBody.addEventListener('click', () => {
                window.open(whatsappUrl, '_blank');
            });
        }

        setTimeout(() => {
            whatsappPopup.classList.add('active');
        }, 3000);
        
        // Evitar que o widget fique por cima do footer preto
        const blackFooter = document.querySelector('.bg-black.py-4');
        const widgetWrapper = document.getElementById('whatsapp-widget');
        
        if (blackFooter && widgetWrapper) {
            window.addEventListener('scroll', () => {
                const footerRect = blackFooter.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                // Se o topo do footer subir além do final da janela, ele está visível
                if (footerRect.top < windowHeight) {
                    const overlap = windowHeight - footerRect.top;
                    widgetWrapper.style.bottom = (30 + overlap) + 'px';
                } else {
                    widgetWrapper.style.bottom = '30px';
                }
            });
        }
    }

});

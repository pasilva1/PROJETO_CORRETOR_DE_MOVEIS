/* =====================================================
   JAVASCRIPT - Imobiliária
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const whatsappNumber = '5581989304727';
    const whatsappDisplayNumber = '(81) 98930-4727';

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
    // 2. IMÓVEIS (carregados das páginas de detalhes)
    // =====================================================
    const carouselImoveis = document.getElementById('carousel-destaques-imoveis');
    const gridImoveis = document.getElementById('properties-grid');
    const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    const loadPropertyDetails = async () => {
        const properties = await Promise.all(
            Array.from({ length: 15 }, async (_, index) => {
                const id = index + 1;
                const detailUrl = new URL(`imoveis/imovel-${id}.html`, document.baseURI);
                const response = await fetch(detailUrl);
                if (!response.ok) {
                    throw new Error(`Falha ao carregar ${detailUrl.pathname}: HTTP ${response.status}`);
                }

                const page = new DOMParser().parseFromString(await response.text(), 'text/html');
                const readText = (selector) => {
                    const element = page.querySelector(selector);
                    if (!element) {
                        throw new Error(`${detailUrl.pathname}: elemento "${selector}" não encontrado`);
                    }
                    return element.textContent.trim();
                };
                const mainImage = page.querySelector('.property-gallery-main');
                if (!mainImage?.getAttribute('src')) {
                    throw new Error(`${detailUrl.pathname}: imagem principal do imóvel não encontrada`);
                }

                return {
                    id,
                    url: detailUrl.href,
                    title: readText('.property-details h2'),
                    summary: readText('.property-details > p.text-secondary.fs-6'),
                    price: readText('.property-details > p.text-dark.fw-bold'),
                    reference: readText('.property-icons-row .badge-ref'),
                    features: Array.from(page.querySelectorAll('.property-icons-row span:not(.badge-ref)'))
                        .map((feature) => feature.textContent.trim()),
                    image: new URL(mainImage.getAttribute('src'), detailUrl).href
                };
            })
        );

        if (carouselImoveis) {
            carouselImoveis.innerHTML = properties.map((property, index) => `
                <div class="carousel-item${index === 0 ? ' active' : ''}">
                    <a class="d-block position-relative text-decoration-none" href="${property.url}">
                        <img src="${escapeHtml(property.image)}" class="d-block w-100"
                            alt="${escapeHtml(property.title)}" style="object-fit:cover; height:420px;">
                        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:24px 32px 20px;">
                            <span class="badge bg-primary mb-2">${escapeHtml(property.reference)}</span>
                            <h5 class="text-white fw-bold mb-1">${escapeHtml(property.title)}</h5>
                            <p class="text-white-50 mb-1 small">${escapeHtml(property.summary)}</p>
                            <span class="text-white fw-bold">${escapeHtml(property.price)}</span>
                        </div>
                    </a>
                </div>
            `).join('');

            const carousel = document.getElementById('imoveisCarousel');
            if (carousel && window.bootstrap?.Carousel) {
                window.bootstrap.Carousel.getOrCreateInstance(carousel).cycle();
            }
        }

        if (gridImoveis) {
            gridImoveis.innerHTML = properties.map((property) => `
                <div class="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3 card-deck fade-in">
                    <a class="card h-100 shadow-sm border-0 position-relative text-decoration-none text-dark"
                        href="${property.url}">
                        <div class="property-image-wrapper w-100 position-relative bg-light">
                            <span class="badge bg-primary position-absolute top-0 start-0 m-3 p-2 fs-6 z-2">${escapeHtml(property.reference)}</span>
                            <img src="${escapeHtml(property.image)}" class="w-100 h-100"
                                alt="${escapeHtml(property.title)}" style="object-fit:cover;">
                            <div class="property-overlay-info">
                                <h5 class="card-title fw-bold text-dark mb-2">${escapeHtml(property.title)}</h5>
                                <p class="card-text text-secondary mb-3 small">${escapeHtml(property.summary)}</p>
                                <h4 class="text-dark fw-bolder mb-0">${escapeHtml(property.price)}</h4>
                            </div>
                        </div>
                        <div class="card-footer bg-white p-3">
                            <div class="d-flex flex-wrap justify-content-around gap-2 text-center w-100 mb-3">
                                ${property.features.map((feature) => `
                                    <span class="text-primary fw-medium small">${escapeHtml(feature)}</span>
                                `).join('')}
                            </div>
                            <div class="w-100 text-center pt-2 border-top">
                                <span class="text-muted small">${escapeHtml(property.reference)}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `).join('');

            gridImoveis.querySelectorAll('.fade-in').forEach((element) => observer.observe(element));
        }
    };

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

    if (carouselImoveis || gridImoveis) {
        loadPropertyDetails().catch((error) => {
            console.error('Não foi possível carregar os imóveis das páginas de detalhes.', error);
            const message = '<p class="alert alert-danger" role="alert">Não foi possível carregar os imóveis. Abra o site usando um servidor local ou acesse pelo site publicado.</p>';
            if (carouselImoveis) {
                carouselImoveis.innerHTML = message;
            }
            if (gridImoveis) {
                gridImoveis.innerHTML = message;
            }
        });
    }

    // Usa setTimeout para garantir que elementos dinâmicos foram renderizados
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 500);

    // =====================================================
    // 6. CONTATO DO IMÓVEL VIA WHATSAPP
    // =====================================================
    const propertyPanel = document.querySelector('.position-sticky');
    if (propertyPanel) {
        const propertyTitle = document.querySelector('.property-details h2')?.textContent.trim() || document.title;
        const propertyReference = document.querySelector('.badge-ref')?.textContent.trim();
        const propertyLabel = propertyReference
            ? `${propertyTitle} (${propertyReference})`
            : propertyTitle;
        const createWhatsAppUrl = (message) =>
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        const openWhatsApp = (message) => {
            window.open(createWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
        };
        const baseMessage = (request) =>
            `Olá, Alex! Vi este anúncio de terceiro exibido como demonstração no site: ${propertyLabel}. Gostaria de ${request}. Você representa este imóvel e pode confirmar os dados e a disponibilidade?`;

        const brokerPhone = propertyPanel.querySelector('.card-body .text-success');
        if (brokerPhone) {
            const icon = brokerPhone.querySelector('i');
            brokerPhone.textContent = '';
            if (icon) {
                brokerPhone.append(icon);
            }
            brokerPhone.append(` ${whatsappDisplayNumber}`);
        }

        const whatsappLink = propertyPanel.querySelector('a.btn-whatsapp-custom');
        if (whatsappLink) {
            whatsappLink.href = createWhatsAppUrl(baseMessage('falar'));
            whatsappLink.rel = 'noopener noreferrer';
        }

        const visitButton = propertyPanel.querySelector('.d-grid button .fa-home')?.closest('button');
        visitButton?.addEventListener('click', () => {
            openWhatsApp(baseMessage('solicitar uma visita'));
        });

        const proposalButton = propertyPanel.querySelector('.d-grid button .fa-thumbs-up')?.closest('button');
        proposalButton?.addEventListener('click', () => {
            openWhatsApp(baseMessage('fazer uma proposta'));
        });

        const contactForm = propertyPanel.querySelector('form');
        const [nameInput, phoneInput] = contactForm?.querySelectorAll('input') || [];
        if (contactForm && nameInput && phoneInput) {
            nameInput.required = true;
            nameInput.autocomplete = 'name';
            nameInput.setAttribute('aria-label', 'Seu nome');
            phoneInput.required = true;
            phoneInput.autocomplete = 'tel';
            phoneInput.setAttribute('aria-label', 'Seu telefone com DDD');
            phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));

            contactForm.addEventListener('submit', (event) => {
                event.preventDefault();
                nameInput.setCustomValidity('');
                phoneInput.setCustomValidity('');

                const name = nameInput.value.trim();
                const phone = phoneInput.value.trim();
                const phoneDigits = phone.replace(/\D/g, '');

                if (!name) {
                    nameInput.setCustomValidity('Informe seu nome.');
                    nameInput.reportValidity();
                    return;
                }

                if (phoneDigits.length < 10 || phoneDigits.length > 13) {
                    phoneInput.setCustomValidity('Informe um telefone válido com DDD.');
                    phoneInput.reportValidity();
                    return;
                }

                openWhatsApp(
                    `${baseMessage('deixar meu contato')}\nNome: ${name}\nTelefone: ${phone}`
                );
            });
        }
    }

    // =====================================================
    // 7. WIDGET WHATSAPP LOGIC
    // =====================================================
    const whatsappBtn   = document.getElementById('whatsapp-btn');
    const whatsappPopup = document.getElementById('whatsapp-popup');
    const whatsappClose = document.getElementById('whatsapp-close');
    const whatsappBody  = document.getElementById('whatsapp-body');

    if (whatsappBtn && whatsappPopup) {
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

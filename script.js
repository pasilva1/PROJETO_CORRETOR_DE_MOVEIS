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
    const paginationImoveis = document.getElementById('properties-pagination');
    const propertiesPerPage = 12;
    let currentPropertyPage = 1;
    let loadedProperties = [];
    const propertyOverridesKey = 'corretor_property_overrides';
    const propertyImagesKey = 'corretor_property_images';
    const deletedPropertiesKey = 'corretor_deleted_properties';
    const createdPropertiesKey = 'corretor_created_properties';
    const readJson = (key, fallback = {}) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`Não foi possível ler ${key}.`, error);
            return fallback;
        }
    };
    const getPropertyOverrides = () => readJson(propertyOverridesKey, {});
    const getPropertyImages = () => readJson(propertyImagesKey, {});
    const getDeletedProperties = () => readJson(deletedPropertiesKey, []);
    const normalizeText = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const inferPropertyType = (title) => {
        const normalizedTitle = normalizeText(title);
        if (/\b(apartamento|apart|flat|kitnet|studio)\b/.test(normalizedTitle)) return 'Apartamento';
        if (/\b(sala comercial|salao comercial|loja|escritorio)\b/.test(normalizedTitle)) return 'Sala Comercial';
        if (/\b(barracao|galpao|armazem)\b/.test(normalizedTitle)) return 'Barracão';
        if (/\b(casa|chacara|sitio|condominio|prive)\b/.test(normalizedTitle)) return 'Casa';
        return 'Outros';
    };
    const inferOperations = (text) => {
        const normalizedText = normalizeText(text);
        const operations = [];
        if (/\b(venda|vender|vende|venda-se|a venda)\b/.test(normalizedText)) operations.push('Venda');
        if (/\b(aluguel|alugar|aluga|locacao|locar)\b/.test(normalizedText)) operations.push('Aluguel');
        return operations.length > 0 ? operations : ['Venda'];
    };
    const typeFilters = document.getElementById('property-type-filters');
    const applyOverridesToProperty = (property) => {
        const overrides = getPropertyOverrides()[property.id] || {};
        const images = getPropertyImages();
        const savedGallery = images[property.id];
        const galleryImages = Array.isArray(savedGallery)
            ? savedGallery
            : savedGallery?.dataUrl
                ? [{ src: savedGallery.dataUrl, filename: savedGallery.filename || '' }]
                : property.galleryImages || [];
        const image = Array.isArray(savedGallery)
            ? (galleryImages[0]?.src || '')
            : (galleryImages[0]?.src || overrides.image || property.image);

        return {
            ...property,
            ...overrides,
            image,
            galleryImages,
            title: overrides.title || property.title,
            summary: overrides.summary || property.summary,
            reference: property.reference,
            city: overrides.city || property.city,
            features: overrides.features || property.features,
            type: overrides.type || property.type || inferPropertyType(property.title),
            operations: overrides.operations || property.operations || ['Venda'],
            featured: Boolean(overrides.featured ?? property.featured),
            mustSee: Boolean(overrides.mustSee ?? property.mustSee),
            saleHighlight: Boolean(overrides.saleHighlight ?? property.saleHighlight),
            rentHighlight: Boolean(overrides.rentHighlight ?? property.rentHighlight),
            launch: Boolean(overrides.launch ?? property.launch),
            price: overrides.launch ? null : (overrides.price ?? property.price)
        };
    };
    let activePropertyType = 'Todos';
    const getFilteredProperties = () => activePropertyType === 'Todos'
        ? loadedProperties
        : loadedProperties.filter((property) => property.type === activePropertyType);
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
    const formatAdvertisedPrice = (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return `Preço anunciado: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value)}`;
        }

        const priceText = String(value ?? '').trim();
        const numericText = priceText.replace(/[^\d,.-]/g, '');
        const normalizedPrice = numericText.includes(',')
            ? numericText.replace(/\./g, '').replace(',', '.')
            : numericText.replace(/\./g, '');
        const price = Number(normalizedPrice);

        if (!Number.isFinite(price)) {
            return priceText ? `Preço anunciado: ${priceText}` : 'Preço anunciado: Consulte';
        }

        return `Preço anunciado: ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)}`;
    };
    const formatPropertyFeature = (feature, index) => {
        const formats = [
            { pattern: /^(\d+)\s*(?:quartos?|dormitórios?)(.*)$/i, singular: 'Quarto', plural: 'Quartos' },
            { pattern: /^(\d+)\s*(?:banheiros?|banh\.?)(.*)$/i, singular: 'Banheiro', plural: 'Banheiros' },
            { pattern: /^(\d+)\s*vagas?(.*)$/i, singular: 'Vaga', plural: 'Vagas' }
        ];
        const text = String(feature ?? '').trim();
        const format = formats.find(({ pattern }) => pattern.test(text)) || formats[index - 1];
        const match = format?.pattern.exec(text) || text.match(/^(\d+)$/);
        if (!format || !match) return text;

        const label = match[1] === '1' ? format.singular : format.plural;
        return `${match[1]} ${label}${match[2] || ''}`;
    };
    const applyCurrentPageOverride = () => {
        const propertyIdMatch = window.location.pathname.match(/imovel-(\d+)\.html/i);
        const queryPropertyId = new URLSearchParams(window.location.search).get('id');
        const propertyId = propertyIdMatch ? Number(propertyIdMatch[1]) : Number(queryPropertyId);
        if (!Number.isInteger(propertyId) || propertyId < 1) {
            return;
        }

        const isGenericDetailPage = window.location.pathname.endsWith('/imovel.html');
        const createdProperty = isGenericDetailPage
            ? readJson(createdPropertiesKey, []).find((property) => property.id === propertyId)
            : null;
        if (isGenericDetailPage && !createdProperty) {
            return;
        }

        const overrides = getPropertyOverrides()[propertyId];
        if (!overrides && !createdProperty) {
            return;
        }

        const titleElement = document.querySelector('.property-details h2');
        const summaryElement = document.querySelector('.property-details > p.text-secondary.fs-6');
        const descriptionElement = document.querySelector('.property-details > p.text-secondary.lh-lg');
        const priceElement = document.querySelector('.property-details > p.text-dark.fw-bold');
        const mainImageElement = document.querySelector('.property-gallery-main');
        const galleryImages = getPropertyImages()[propertyId];
        const featureElements = document.querySelectorAll('.property-icons-row span:not(.badge-ref)');
        const updateGalleryPromotionTag = (isFeatured) => {
            const gallery = document.getElementById('propertyGallery');
            if (!gallery) return;

            let promotionTag = document.getElementById('property-gallery-promotion-tag');
            if (!isFeatured) {
                promotionTag?.remove();
                return;
            }

            if (!promotionTag) {
                promotionTag = document.createElement('div');
                promotionTag.id = 'property-gallery-promotion-tag';
                promotionTag.className = 'property-promotion-tag';
                promotionTag.textContent = 'Promoção';
                gallery.insertAdjacentElement('afterend', promotionTag);
            }
        };
        updateGalleryPromotionTag(Boolean(overrides?.featured ?? createdProperty?.featured));

        if (createdProperty) {
            const property = { ...createdProperty, ...overrides };
            const images = Array.isArray(galleryImages) ? galleryImages : [];
            const carouselInner = document.querySelector('#propertyGallery .carousel-inner');
            const thumbnailContainer = document.querySelector('.gallery-thumbs');

            if (carouselInner) {
                carouselInner.innerHTML = images.map((image, index) => `
                    <div class="carousel-item${index === 0 ? ' active' : ''}">
                        <img src="${escapeHtml(image.src)}" class="property-gallery-main img-fluid w-100"
                            alt="Imagem ${index + 1} do imóvel ${propertyId}">
                    </div>
                `).join('');
            }
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = images.map((image, index) => `
                    <img src="${escapeHtml(image.src)}" class="img-fluid${index === 0 ? ' active' : ''}"
                        style="width: 120px;" alt="Miniatura ${index + 1} do imóvel ${propertyId}"
                        data-gallery-index="${index}">
                `).join('');
                thumbnailContainer.addEventListener('click', (event) => {
                    const thumbnail = event.target.closest('img[data-gallery-index]');
                    if (!thumbnail) return;
                    const carousel = document.getElementById('propertyGallery');
                    window.bootstrap?.Carousel.getOrCreateInstance(carousel).to(Number(thumbnail.dataset.galleryIndex));
                });
            }

            const details = document.querySelector('.property-details');
            const titleElement = details?.querySelector('h2');
            const cityElement = details?.querySelector('p.text-secondary.fs-6');
            const descriptionElement = details?.querySelector('p.text-secondary.lh-lg');
            const priceElement = details?.querySelector('p.text-dark.fw-bold');
            const referenceElement = details?.querySelector('.badge-ref');
            const iconsRow = details?.querySelector('.property-icons-row');
            if (titleElement) titleElement.textContent = property.title;
            if (cityElement) cityElement.textContent = property.city;
            if (descriptionElement) descriptionElement.textContent = property.summary;
            if (priceElement) {
                priceElement.hidden = Boolean(property.launch);
                if (!property.launch) priceElement.textContent = formatAdvertisedPrice(property.price);
            }
            if (referenceElement) referenceElement.textContent = `Cod.: ${property.reference}`;
            if (iconsRow) {
                const icons = ['fa-ruler-combined', 'fa-bed', 'fa-shower', 'fa-car'];
                iconsRow.innerHTML = (property.features || []).map((feature, index) => `
                <span><i class="fa ${icons[index] || 'fa-circle-info'}" aria-hidden="true"></i> ${escapeHtml(formatPropertyFeature(feature, index))}</span>
                `).join('') + `<span class="badge-ref ms-auto mt-2 mt-sm-0">Cod.: ${escapeHtml(property.reference)}</span>`;
            }
            details?.querySelectorAll('p, ul').forEach((element) => {
                if (element !== cityElement && element !== descriptionElement && element !== priceElement &&
                    !element.closest('.property-icons-row')) {
                    element.hidden = true;
                }
            });

            document.title = `${property.title} | Imobiliária`;
            return;
        }

        if (titleElement) titleElement.textContent = overrides.title || titleElement.textContent;
        if (summaryElement) summaryElement.textContent = overrides.city || summaryElement.textContent;
        if (descriptionElement) descriptionElement.textContent = overrides.summary || descriptionElement.textContent;
        if (priceElement) {
            priceElement.hidden = Boolean(overrides.launch);
            if (!overrides.launch && overrides.price !== undefined) {
                priceElement.textContent = formatAdvertisedPrice(overrides.price);
            }
        }
        if (Array.isArray(overrides.features)) {
            overrides.features.forEach((feature, index) => {
                if (featureElements[index]) featureElements[index].lastChild.textContent = ` ${feature}`;
            });
        }
        if (Array.isArray(galleryImages)) {
            const carouselInner = document.querySelector('#propertyGallery .carousel-inner');
            if (carouselInner) {
                carouselInner.innerHTML = galleryImages.map((image, index) => `
                    <div class="carousel-item${index === 0 ? ' active' : ''}">
                        <img src="${escapeHtml(image.src)}" class="property-gallery-main img-fluid w-100"
                            alt="Imagem ${index + 1} do imóvel ${propertyId}">
                    </div>
                `).join('');
            }
        } else if (mainImageElement) {
            const imageSource = galleryImages?.dataUrl || overrides.image;
            if (imageSource) mainImageElement.src = imageSource;
        }

        const title = overrides.title || document.title;
        document.title = title;
    };

    applyCurrentPageOverride();

    const renderPropertyPage = () => {
        if (!gridImoveis) {
            return;
        }

        const filteredProperties = getFilteredProperties();
        if (filteredProperties.length === 0) {
            gridImoveis.innerHTML = '<div class="col-12"><p class="alert alert-info mb-0">Nenhum imóvel disponível no momento.</p></div>';
            if (paginationImoveis) paginationImoveis.innerHTML = '';
            return;
        }

        const pageCount = Math.ceil(filteredProperties.length / propertiesPerPage);
        currentPropertyPage = Math.min(currentPropertyPage, pageCount);
        const startIndex = (currentPropertyPage - 1) * propertiesPerPage;
        const pageProperties = filteredProperties.slice(startIndex, startIndex + propertiesPerPage);

        gridImoveis.innerHTML = pageProperties.map((property) => `
            <div class="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-4 card-deck fade-in">
                <a class="card h-100 shadow-sm border-0 position-relative text-decoration-none text-dark"
                    href="${property.url}">
                    <div class="property-image-wrapper w-100 position-relative bg-light${property.status && property.status !== 'Disponível' ? ' has-status' : ''}${property.featured ? ' has-promotion' : ''}">
                        <span class="badge bg-primary position-absolute top-0 start-0 m-3 p-2 fs-6 z-2">${escapeHtml(property.reference)}</span>
                        ${(property.status && property.status !== 'Disponível') ? `<span class="property-status-ribbon">${escapeHtml(property.status)}</span>` : ''}
                        <div class="property-operation-tags">
                            ${(property.operations || ['Venda']).map((operation) => `<span class="property-operation-tag">${escapeHtml(operation)}</span>`).join('')}
                        </div>
                        <img src="${escapeHtml(property.image)}" class="w-100 h-100"
                            alt="${escapeHtml(property.title)}" style="object-fit:cover;">
                        ${property.featured ? '<span class="property-promotion-tag property-promotion-tag--overlay">Promoção</span>' : ''}
                        <div class="property-overlay-info">
                            <h5 class="card-title fw-bold text-dark mb-2">${escapeHtml(property.title)}</h5>
                            <p class="card-text text-secondary mb-3 small">${escapeHtml(property.summary)}</p>
                            ${property.launch ? '<span class="badge text-bg-info">Lançamento</span>' : `<h4 class="text-dark fw-bolder mb-0">${escapeHtml(formatAdvertisedPrice(property.price))}</h4>`}
                        </div>
                    </div>
                    <div class="card-footer bg-white p-3">
                        <div class="d-flex flex-wrap justify-content-around gap-2 text-center w-100 mb-3">
                            ${(property.features || []).map((feature, index) => `
                                <span class="text-primary fw-medium small">${escapeHtml(formatPropertyFeature(feature, index))}</span>
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

        if (!paginationImoveis) {
            return;
        }

        if (pageCount <= 1) {
            paginationImoveis.innerHTML = '';
            return;
        }

        const firstItem = startIndex + 1;
        const lastItem = Math.min(startIndex + propertiesPerPage, filteredProperties.length);
        const visiblePages = [];
        const windowStart = Math.max(1, currentPropertyPage - 2);
        const windowEnd = Math.min(pageCount, currentPropertyPage + 2);

        if (windowStart > 1) {
            visiblePages.push(1);
            if (windowStart > 2) {
                visiblePages.push(null);
            }
        }

        for (let page = windowStart; page <= windowEnd; page++) {
            visiblePages.push(page);
        }

        if (windowEnd < pageCount) {
            if (windowEnd < pageCount - 1) {
                visiblePages.push(null);
            }
            visiblePages.push(pageCount);
        }

        const pageButtons = visiblePages.map((page) => page === null
            ? '<li class="page-item disabled"><span class="page-link" aria-hidden="true">&hellip;</span></li>'
            : `<li class="page-item${page === currentPropertyPage ? ' active' : ''}">
                <button class="page-link" type="button" data-page="${page}"
                    aria-label="Página ${page}"${page === currentPropertyPage ? ' aria-current="page"' : ''}>
                    ${page}
                </button>
            </li>`
        ).join('');

        paginationImoveis.innerHTML = `
            <div class="d-flex flex-column align-items-center gap-2">
                <p class="mb-0 text-muted small" aria-live="polite">
                    Exibindo ${firstItem}–${lastItem} de ${filteredProperties.length} imóveis
                </p>
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item${currentPropertyPage === 1 ? ' disabled' : ''}">
                        <button class="page-link" type="button" data-page="${currentPropertyPage - 1}"
                            aria-label="Página anterior"${currentPropertyPage === 1 ? ' disabled' : ''}>
                            Anterior
                        </button>
                    </li>
                    ${pageButtons}
                    <li class="page-item${currentPropertyPage === pageCount ? ' disabled' : ''}">
                        <button class="page-link" type="button" data-page="${currentPropertyPage + 1}"
                            aria-label="Próxima página"${currentPropertyPage === pageCount ? ' disabled' : ''}>
                            Próxima
                        </button>
                    </li>
                </ul>
            </div>
        `;
    };

    const renderCuratedSection = (sectionId, gridId, properties) => {
        const section = document.getElementById(sectionId);
        const grid = document.getElementById(gridId);
        if (!section || !grid) return;

        section.hidden = properties.length === 0;
        grid.innerHTML = properties.map((property) => `
            <div class="col-sm-6 col-lg-4">
                <a class="card h-100 shadow-sm border-0 text-decoration-none text-dark" href="${escapeHtml(property.url)}">
                    <div class="property-image-wrapper bg-light${property.status && property.status !== 'Disponível' ? ' has-status' : ''}">
                        ${property.launch ? '<span class="badge text-bg-info position-absolute top-0 end-0 m-3">Lançamento</span>' : ''}
                        <img src="${escapeHtml(property.image)}" class="w-100 h-100"
                            alt="${escapeHtml(property.title)}" style="object-fit:cover;">
                        ${property.featured ? '<span class="property-promotion-tag property-promotion-tag--overlay">Promoção</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h3 class="h5 card-title fw-bold">${escapeHtml(property.title)}</h3>
                        <p class="card-text text-secondary small">${escapeHtml(property.city)}</p>
                        <div class="d-flex flex-wrap gap-2 mb-2">
                            ${(property.features || []).map((feature, index) => `
                                <span class="text-primary fw-medium small">${escapeHtml(formatPropertyFeature(feature, index))}</span>
                            `).join('')}
                        </div>
                        <p class="card-text mb-0">${property.launch ? 'Lançamento' : escapeHtml(formatAdvertisedPrice(property.price))}</p>
                    </div>
                </a>
            </div>
        `).join('');
    };

    if (paginationImoveis) {
        paginationImoveis.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-page]');
            if (!button || button.disabled) {
                return;
            }

            const page = Number(button.dataset.page);
            const pageCount = Math.ceil(getFilteredProperties().length / propertiesPerPage);
            if (Number.isInteger(page) && page >= 1 && page <= pageCount) {
                currentPropertyPage = page;
                renderPropertyPage();
            }
        });
    }

    typeFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-property-type]');
        if (!button) return;

        activePropertyType = button.dataset.propertyType;
        typeFilters.querySelectorAll('button[data-property-type]').forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });
        currentPropertyPage = 1;
        renderPropertyPage();
    });

    const loadPropertyDetails = async () => {
        const properties = [];
        let nextPropertyId = 1;

        while (true) {
            const propertyBatch = await Promise.all(
                Array.from({ length: propertiesPerPage }, async (_, index) => {
                    const id = nextPropertyId + index;
                    const detailUrl = new URL(`imoveis/imovel-${id}.html`, document.baseURI);
                    const response = await fetch(detailUrl);
                    if (response.status === 404) {
                        return null;
                    }
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

                    const title = readText('.property-details h2');
                    const summary = readText('.property-details > p.text-secondary.lh-lg');
                    const city = readText('.property-details > p.text-secondary.fs-6');
                    const rawProperty = {
                        id,
                        url: detailUrl.href,
                        title,
                        summary: readText('.property-details > p.text-secondary.lh-lg'),
                        city,
                        price: readText('.property-details > p.text-dark.fw-bold'),
                        reference: readText('.property-icons-row .badge-ref'),
                        features: Array.from(page.querySelectorAll('.property-icons-row span:not(.badge-ref)'))
                            .map((feature) => feature.textContent.trim()),
                        image: new URL(mainImage.getAttribute('src'), detailUrl).href,
                        galleryImages: Array.from(page.querySelectorAll('.property-gallery-main'))
                            .map((image) => ({
                                src: new URL(image.getAttribute('src'), detailUrl).href,
                                filename: new URL(image.getAttribute('src'), detailUrl).pathname.split('/').pop()
                            })),
                        type: inferPropertyType(title),
                        operations: inferOperations(`${title} ${city} ${summary}`),
                        status: 'Disponível'
                    };

                    return applyOverridesToProperty(rawProperty);
                })
            );
            const availableProperties = propertyBatch.filter((property) => property !== null);
            if (availableProperties.length === 0) {
                if (properties.length === 0) {
                    throw new Error('Nenhuma página de imóvel foi encontrada em /imoveis/.');
                }
                break;
            }

            properties.push(...availableProperties);
            nextPropertyId += propertiesPerPage;
        }

        const createdProperties = readJson(createdPropertiesKey, []);
        const savedImages = getPropertyImages();
        properties.push(...createdProperties.map((property) => {
            const galleryImages = savedImages[property.id] || [];
            return applyOverridesToProperty({
                ...property,
                id: property.id,
                url: `imovel.html?id=${property.id}`,
                galleryImages,
                image: galleryImages[0]?.src || '',
                custom: true
            });
        }));

        const deletedProperties = new Set(getDeletedProperties());
        const visibleProperties = properties.filter((property) => !deletedProperties.has(property.id));

        renderCuratedSection(
            'must-see-section',
            'must-see-properties',
            visibleProperties.filter((property) => property.mustSee)
        );
        renderCuratedSection(
            'sale-highlights-section',
            'sale-highlight-properties',
            visibleProperties.filter((property) =>
                property.saleHighlight && (property.operations || []).includes('Venda')
            )
        );
        renderCuratedSection(
            'rent-highlights-section',
            'rent-highlight-properties',
            visibleProperties.filter((property) =>
                property.rentHighlight && (property.operations || []).includes('Aluguel')
            )
        );

        const carouselProperties = visibleProperties.filter((property) => property.featured);
        if (carouselImoveis) {
            carouselImoveis.innerHTML = carouselProperties.length > 0
                ? carouselProperties.map((property, index) => `
                <div class="carousel-item${index === 0 ? ' active' : ''}">
                    <a class="d-block text-decoration-none" href="${property.url}">
                        <div class="property-image-wrapper property-carousel-image bg-light${property.status && property.status !== 'Disponível' ? ' has-status' : ''}">
                            <img src="${escapeHtml(property.image)}" class="d-block w-100 h-100"
                                alt="${escapeHtml(property.title)}" style="object-fit:cover;">
                            ${property.status && property.status !== 'Disponível' ? `<span class="property-status-ribbon">${escapeHtml(property.status)}</span>` : ''}
                            ${property.launch ? '<span class="badge text-bg-info position-absolute bottom-0 end-0 m-3">Lançamento</span>' : ''}
                            <div class="property-operation-tags carousel-operation-tags${property.featured ? ' has-promotion' : ''}">
                                ${(property.operations || ['Venda']).map((operation) => `<span class="property-operation-tag">${escapeHtml(operation)}</span>`).join('')}
                            </div>
                            <div class="property-carousel-caption">
                                <span class="badge bg-primary mb-2">${escapeHtml(property.reference)}</span>
                                <h5 class="text-white fw-bold mb-1">${escapeHtml(property.title)}</h5>
                                <p class="text-white-50 mb-1 small">${escapeHtml(property.summary)}</p>
                                ${property.launch ? '' : `<span class="text-white fw-bold">${escapeHtml(formatAdvertisedPrice(property.price))}</span>`}
                            </div>
                        </div>
                        ${property.featured ? '<span class="property-promotion-tag">Promoção</span>' : ''}
                    </a>
                </div>
            `).join('')
                : '<p class="alert alert-info mb-0">Nenhum imóvel em promoção para exibir nos destaques.</p>';

            const carousel = document.getElementById('imoveisCarousel');
            if (carousel && window.bootstrap?.Carousel) {
                const carouselInstance = window.bootstrap.Carousel.getOrCreateInstance(carousel);
                if (carouselProperties.length > 0) {
                    carouselInstance.cycle();
                } else {
                    carouselInstance.pause();
                }
            }
        }

        if (gridImoveis) {
            loadedProperties = visibleProperties;
            renderPropertyPage();
        }
    };

    window.addEventListener('storage', (event) => {
        if ((!carouselImoveis && !gridImoveis) ||
            ![propertyOverridesKey, propertyImagesKey, deletedPropertiesKey, createdPropertiesKey].includes(event.key)) {
            return;
        }

        loadPropertyDetails().catch((error) => {
            console.error('Não foi possível atualizar os imóveis após uma alteração no painel.', error);
        });
    });

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

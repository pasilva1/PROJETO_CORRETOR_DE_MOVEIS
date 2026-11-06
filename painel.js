document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_USER = 'pasilva1';
    const ADMIN_PASSWORD = '123@Qwe@!';
    const propertyOverridesKey = 'corretor_property_overrides';
    const propertyImagesKey = 'corretor_property_images';
    const deletedPropertiesKey = 'corretor_deleted_properties';
    const createdPropertiesKey = 'corretor_created_properties';
    const authKey = 'corretor_admin_auth';

    const readJson = (key, fallback = {}) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`Não foi possível ler ${key}.`, error);
            return fallback;
        }
    };

    const saveJson = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(value) || 0);

    const parseCurrencyValue = (value) => {
        if (!value && value !== 0) return 0;
        const sanitized = String(value)
            .replace(/[^0-9,.-]/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        const number = Number(sanitized);
        return Number.isFinite(number) ? number : 0;
    };

    const state = {
        properties: [],
        editingId: null,
        isCreating: false,
        galleryImages: [],
        draggingImageIndex: null
    };

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const propertyForm = document.getElementById('property-form');
    const editorModalElement = document.getElementById('property-editor-modal');
    const editorModal = editorModalElement && window.bootstrap?.Modal
        ? window.bootstrap.Modal.getOrCreateInstance(editorModalElement)
        : null;
    const tableBody = document.getElementById('property-table-body');
    const emptyState = document.getElementById('empty-state');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit');
    const deletePropertyButton = document.getElementById('delete-property');
    const newPropertyButton = document.getElementById('new-property-button');
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('property-image');
    const propertyImageName = document.getElementById('property-image-name');

    const summaryCards = {
        total: document.getElementById('stats-total'),
        available: document.getElementById('stats-available'),
        pending: document.getElementById('stats-pending'),
        featured: document.getElementById('stats-featured')
    };

    const setAuthState = (isLoggedIn) => {
        if (isLoggedIn) {
            sessionStorage.setItem(authKey, 'true');
        } else {
            sessionStorage.removeItem(authKey);
        }

        if (loginSection) loginSection.hidden = isLoggedIn;
        if (dashboardSection) dashboardSection.hidden = !isLoggedIn;
    };

    const getPropertyOverrides = () => readJson(propertyOverridesKey, {});
    const getPropertyImages = () => readJson(propertyImagesKey, {});
    const getDeletedProperties = () => readJson(deletedPropertiesKey, []);
    const getCreatedProperties = () => readJson(createdPropertiesKey, []);
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

    const applyOverridesToProperty = (property) => {
        const overrides = getPropertyOverrides()[property.id] || {};
        const images = getPropertyImages();
        const savedGallery = images[property.id];
        const galleryImages = Array.isArray(savedGallery)
            ? savedGallery
            : savedGallery?.dataUrl
                ? [{ src: savedGallery.dataUrl, filename: savedGallery.filename || '' }]
                : property.galleryImages || [];

        return {
            ...property,
            ...overrides,
            galleryImages,
            reference: property.reference,
            image: Array.isArray(savedGallery)
                ? (galleryImages[0]?.src || '')
                : (galleryImages[0]?.src || overrides.image || property.image),
            title: overrides.title || property.title,
            city: overrides.city || property.city,
            price: overrides.price ?? property.price,
            summary: overrides.summary || property.summary
        };
    };

    const buildPropertyList = async () => {
        const properties = [];
        let currentId = 1;

        while (true) {
            const detailUrl = `imoveis/imovel-${currentId}.html`;
            const response = await fetch(detailUrl, { cache: 'no-store' });

            if (response.status === 404) {
                break;
            }

            if (!response.ok) {
                throw new Error(`Falha ao carregar ${detailUrl}: ${response.status}`);
            }

            const html = await response.text();
            const documentFromPage = new DOMParser().parseFromString(html, 'text/html');

            const title = documentFromPage.querySelector('.property-details h2')?.textContent.trim() || `Imóvel ${currentId}`;
            const city = documentFromPage.querySelector('.property-details > p.text-secondary.fs-6')?.textContent.trim() || 'Recife';
            const summary = documentFromPage.querySelector('.property-details > p.text-secondary.lh-lg')?.textContent.trim() || 'Imóvel em destaque na carteira da imobiliária.';
            const priceText = documentFromPage.querySelector('.property-details > p.text-dark.fw-bold')?.textContent.trim() || 'Preço indisponível';
            const reference = (documentFromPage.querySelector('.badge-ref')?.textContent || '').replace(/Cod\.?\s*/i, '').trim() || `Cod.: ${currentId}`;
            const image = documentFromPage.querySelector('.property-gallery-main')?.getAttribute('src') || `assets/imoveis/imovel-${currentId}.webp`;
            const galleryImages = Array.from(documentFromPage.querySelectorAll('.property-gallery-main')).map((element) => {
                const source = new URL(element.getAttribute('src'), new URL(detailUrl, document.baseURI));
                return {
                    src: source.href,
                    filename: source.pathname.split('/').pop()
                };
            });
            const featureValues = Array.from(documentFromPage.querySelectorAll('.property-icons-row span:not(.badge-ref)'))
                .map((feature) => feature.textContent.trim());
            const operations = inferOperations(`${title} ${city} ${summary}`);
            const price = parseCurrencyValue(priceText);
            const codeFromPage = reference.match(/\d+/)?.[0];

            properties.push({
                id: currentId,
                title,
                city,
                summary,
                price,
                reference: codeFromPage || reference,
                features: featureValues,
                type: inferPropertyType(title),
                operations,
                image,
                galleryImages,
                status: 'Disponível',
                featured: false
            });

            currentId += 1;
        }

        const createdProperties = getCreatedProperties();
        const savedImages = getPropertyImages();
        properties.push(...createdProperties.map((property) => {
            const galleryImages = savedImages[property.id] || [];
            return {
                ...property,
                url: `imovel.html?id=${property.id}`,
                galleryImages,
                image: galleryImages[0]?.src || '',
                custom: true
            };
        }));

        const deletedProperties = new Set(getDeletedProperties());
        state.properties = properties
            .filter((property) => !deletedProperties.has(property.id))
            .map((property) => applyOverridesToProperty(property));
        renderStats();
        renderTable();
    };

    const renderStats = () => {
        const total = state.properties.length;
        const available = state.properties.filter((item) => item.status === 'Disponível').length;
        const pending = state.properties.filter((item) => item.status !== 'Disponível' && item.status !== 'Vendido').length;
        const featured = state.properties.filter((item) => item.featured).length;

        if (summaryCards.total) summaryCards.total.textContent = total;
        if (summaryCards.available) summaryCards.available.textContent = available;
        if (summaryCards.pending) summaryCards.pending.textContent = pending;
        if (summaryCards.featured) summaryCards.featured.textContent = featured;
    };

    const renderTable = () => {
        if (!tableBody) return;

        if (state.properties.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        tableBody.innerHTML = state.properties.map((item) => {
            const statusClass = item.status === 'Disponível'
                ? 'bg-success-subtle text-success'
                : item.status === 'Reservado'
                    ? 'bg-warning-subtle text-warning'
                    : item.status === 'Vendido'
                        ? 'bg-dark-subtle text-dark'
                        : 'bg-primary-subtle text-primary';

            return `
                <tr>
                    <td>
                        <div class="admin-listing d-flex align-items-center gap-3">
                            <img src="${item.image || `assets/imoveis/imovel-${item.id}.webp`}" alt="${item.title}" class="admin-listing-thumb">
                            <div>
                                <div class="fw-semibold">${item.title}</div>
                                <small class="text-muted">Cod.: ${item.reference}</small>
                            </div>
                        </div>
                    </td>
                    <td>${item.city}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td><span class="badge rounded-pill ${statusClass}">${item.status}</span></td>
                    <td>${item.featured ? '<span class="text-success fw-semibold">Sim</span>' : 'Não'}</td>
                    <td>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-sm btn-outline-primary edit-property" data-id="${item.id}">Editar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const populateForm = (property) => {
        if (!propertyForm) return;

        propertyForm.dataset.propertyId = String(property.id);
        document.getElementById('property-title').value = property.title || '';
        document.getElementById('property-reference').value = property.reference || '';
        document.getElementById('property-city').value = property.city || '';
        document.getElementById('property-type').value = property.type || 'Outros';
        document.getElementById('operation-sale').checked = (property.operations || ['Venda']).includes('Venda');
        document.getElementById('operation-rent').checked = (property.operations || []).includes('Aluguel');
        const area = String(property.features?.[0] || '').match(/\d+(?:[.,]\d+)?/)?.[0] || '';
        document.getElementById('property-area').value = area.replace(',', '.');
        document.getElementById('property-bedrooms').value = property.features?.[1] || '';
        document.getElementById('property-bathrooms').value = property.features?.[2] || '';
        document.getElementById('property-parking').value = property.features?.[3] || '';
        document.getElementById('property-price').value = property.price || 0;
        document.getElementById('property-status').value = property.status || 'Disponível';
        document.getElementById('property-featured').checked = Boolean(property.featured);
        document.getElementById('property-summary').value = property.summary || '';

        state.editingId = property.id;
        state.isCreating = false;
        state.galleryImages = (property.galleryImages || []).map((image) => ({ ...image }));
        renderImageGallery();
        if (propertyImageName) {
            propertyImageName.textContent = `Novos arquivos serão nomeados imovel-${property.id}-<posição>.<extensão>.`;
        }
        if (formTitle) formTitle.textContent = 'Editar imóvel';
        if (cancelEditButton) cancelEditButton.hidden = false;
        if (deletePropertyButton) deletePropertyButton.hidden = false;
        editorModal?.show();
    };

    const renumberGalleryImages = () => {
        state.galleryImages = state.galleryImages.map((image, index) => {
            const extension = /^(jpg|jpeg|png|webp|gif|avif)$/i.test(image.filename?.split('.').pop() || '')
                ? image.filename.split('.').pop()
                : 'webp';
            return {
                ...image,
                filename: `imovel-${state.editingId}-${index + 1}.${extension}`
            };
        });
    };

    const renderImageGallery = () => {
        const galleryContainer = document.getElementById('image-gallery');
        if (!galleryContainer) return;

        if (state.galleryImages.length === 0) {
            galleryContainer.innerHTML = '<p class="text-muted small mb-0">Este imóvel está sem imagens.</p>';
            return;
        }

        galleryContainer.innerHTML = state.galleryImages.map((image, index) => `
            <div class="admin-gallery-image" draggable="true" data-index="${index}" aria-label="Imagem ${index + 1}; arraste para mudar a posição">
                <img src="${image.src}" alt="Imagem ${index + 1} do imóvel ${state.editingId}">
                <span>imovel-${state.editingId}-${index + 1}.${image.filename?.split('.').pop() || 'webp'}</span>
                <div class="admin-gallery-image-actions">
                    <button type="button" class="btn btn-sm btn-outline-secondary move-gallery-image" data-index="${index}" data-direction="-1" aria-label="Mover imagem ${index + 1} para cima" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary move-gallery-image" data-index="${index}" data-direction="1" aria-label="Mover imagem ${index + 1} para baixo" ${index === state.galleryImages.length - 1 ? 'disabled' : ''}>↓</button>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-gallery-image" data-index="${index}" aria-label="Apagar imagem ${index + 1}">Apagar</button>
                </div>
            </div>
        `).join('');
    };

    const resetForm = () => {
        if (!propertyForm) return;

        propertyForm.reset();
        propertyForm.dataset.propertyId = '';
        state.editingId = null;
        state.isCreating = false;
        state.galleryImages = [];

        if (propertyImageName) {
            propertyImageName.textContent = 'Selecione uma ou mais imagens.';
        }
        renderImageGallery();

        if (formTitle) formTitle.textContent = 'Novo imóvel';
        if (cancelEditButton) cancelEditButton.hidden = true;
        if (deletePropertyButton) deletePropertyButton.hidden = true;
        const featuredField = document.getElementById('property-featured');
        if (featuredField) featuredField.checked = false;
    };

    const persistPropertyUpdate = () => {
        if (!state.editingId) return;

        const propertyId = state.editingId;
        const title = document.getElementById('property-title').value.trim();
        const city = document.getElementById('property-city').value.trim();
        const type = document.getElementById('property-type').value;
        const operations = Array.from(document.querySelectorAll('input[name="property-operation"]:checked'))
            .map((input) => input.value);
        const area = document.getElementById('property-area').value.trim();
        const features = [
            area ? `${area} m²` : '',
            document.getElementById('property-bedrooms').value.trim(),
            document.getElementById('property-bathrooms').value.trim(),
            document.getElementById('property-parking').value.trim()
        ].filter(Boolean);
        const price = Number(document.getElementById('property-price').value || 0);
        const status = document.getElementById('property-status').value;
        const featured = document.getElementById('property-featured').checked;
        const summary = document.getElementById('property-summary').value.trim();

        if (!title || !city) {
            window.alert('Preencha o título e a cidade para continuar.');
            return;
        }

        if (state.isCreating && state.galleryImages.length === 0) {
            window.alert('Adicione ao menos uma imagem para cadastrar o imóvel.');
            return;
        }

        if (operations.length === 0) {
            window.alert('Selecione Venda, Aluguel ou as duas opções.');
            return;
        }

        const propertyData = {
            title,
            city,
            type,
            operations,
            features,
            price,
            status,
            featured,
            summary: summary || 'Imóvel em destaque na carteira da imobiliária.'
        };

        try {
            const propertyImages = getPropertyImages();
            propertyImages[propertyId] = state.galleryImages;
            saveJson(propertyImagesKey, propertyImages);

            if (state.isCreating) {
                const createdProperties = getCreatedProperties();
                createdProperties.push({
                    id: propertyId,
                    reference: String(propertyId),
                    ...propertyData,
                    custom: true
                });
                saveJson(createdPropertiesKey, createdProperties);
                state.properties.push({
                    ...propertyData,
                    id: propertyId,
                    reference: String(propertyId),
                    image: state.galleryImages[0]?.src || '',
                    galleryImages: state.galleryImages,
                    url: `imovel.html?id=${propertyId}`,
                    custom: true
                });
            } else {
                const propertyOverrides = getPropertyOverrides();
                propertyOverrides[propertyId] = propertyData;
                saveJson(propertyOverridesKey, propertyOverrides);

                const currentIndex = state.properties.findIndex((item) => item.id === propertyId);
                if (currentIndex >= 0) {
                    state.properties[currentIndex] = applyOverridesToProperty({
                        ...state.properties[currentIndex],
                        ...propertyData,
                        galleryImages: state.galleryImages,
                        image: state.galleryImages[0]?.src || state.properties[currentIndex].image
                    });
                }
            }
        } catch (error) {
            console.error('Não foi possível salvar o imóvel neste navegador.', error);
            window.alert('Não foi possível salvar. O armazenamento do navegador pode estar cheio; tente usar imagens menores.');
            return;
        }

        renderStats();
        renderTable();
        window.dispatchEvent(new CustomEvent('property-overrides-updated'));
        editorModal?.hide();
        resetForm();
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
                setAuthState(true);
                if (loginError) loginError.hidden = true;
                buildPropertyList().catch((error) => {
                    console.error('Não foi possível carregar os imóveis para edição.', error);
                    if (emptyState) {
                        emptyState.hidden = false;
                        emptyState.textContent = 'Não foi possível carregar os imóveis cadastrados. Verifique se o site está aberto em um servidor local.';
                    }
                });
                return;
            }

            if (loginError) {
                loginError.hidden = false;
                loginError.textContent = 'Usuário ou senha inválidos.';
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            setAuthState(false);
            if (loginForm) loginForm.reset();
            if (loginError) loginError.hidden = true;
            resetForm();
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            const button = event.target.closest('.edit-property');
            if (!button) return;
            const propertyId = Number(button.dataset.id);
            const property = state.properties.find((item) => item.id === propertyId);
            if (property) populateForm(property);
        });
    }

    newPropertyButton?.addEventListener('click', () => {
        resetForm();
        const deletedProperties = new Set(getDeletedProperties());
        const highestId = state.properties.reduce((highest, property) => Math.max(highest, property.id), 0);
        const propertyId = Math.max(highestId, state.properties.length) + 1;
        let nextId = propertyId;
        while (deletedProperties.has(nextId) || state.properties.some((property) => property.id === nextId)) {
            nextId += 1;
        }

        state.editingId = nextId;
        state.isCreating = true;
        if (propertyForm) propertyForm.dataset.propertyId = String(nextId);
        document.getElementById('property-reference').value = String(nextId);
        if (propertyImageName) propertyImageName.textContent = `Imagens do imóvel ${nextId}.`;
        if (formTitle) formTitle.textContent = 'Cadastrar novo imóvel';
        editorModal?.show();
    });

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            editorModal?.hide();
            resetForm();
        });
    }

    if (deletePropertyButton) {
        deletePropertyButton.addEventListener('click', () => {
            if (!state.editingId) return;

            const property = state.properties.find((item) => item.id === state.editingId);
            const propertyLabel = property ? `“${property.title}” (código ${property.reference})` : `código ${state.editingId}`;
            if (!window.confirm(`Remover ${propertyLabel} da listagem deste navegador?`)) return;

            const deletedProperties = getDeletedProperties();
            if (!deletedProperties.includes(state.editingId)) {
                deletedProperties.push(state.editingId);
                saveJson(deletedPropertiesKey, deletedProperties);
            }

            const propertyOverrides = getPropertyOverrides();
            delete propertyOverrides[state.editingId];
            saveJson(propertyOverridesKey, propertyOverrides);

            const propertyImages = getPropertyImages();
            delete propertyImages[state.editingId];
            saveJson(propertyImagesKey, propertyImages);
            const createdProperties = getCreatedProperties().filter((item) => item.id !== state.editingId);
            saveJson(createdPropertiesKey, createdProperties);

            state.properties = state.properties.filter((item) => item.id !== state.editingId);
            renderStats();
            renderTable();
            window.dispatchEvent(new CustomEvent('property-overrides-updated'));
            editorModal?.hide();
            resetForm();
        });
    }

    if (propertyForm) {
        propertyForm.addEventListener('submit', (event) => {
            event.preventDefault();
            persistPropertyUpdate();
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files || []);
            if (files.length === 0 || !state.editingId) {
                return;
            }

            const firstPosition = state.galleryImages.length + 1;
            Promise.all(files.map((file, fileIndex) => new Promise((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    reject(new Error(`${file.name} não é um arquivo de imagem.`));
                    return;
                }

                const fileReader = new FileReader();
                fileReader.onload = () => {
                    const fileExtension = (file.name.split('.').pop() || '').toLowerCase();
                    const extension = /^(jpg|jpeg|png|webp|gif|avif)$/.test(fileExtension) ? fileExtension : 'webp';
                    const position = firstPosition + fileIndex;
                    resolve({
                        src: fileReader.result,
                        filename: `imovel-${state.editingId}-${position}.${extension}`
                    });
                };
                fileReader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
                fileReader.readAsDataURL(file);
            }))).then((images) => {
                state.galleryImages.push(...images);
                renumberGalleryImages();
                renderImageGallery();
                if (propertyImageName) {
                    propertyImageName.textContent = `${images.length} imagem(ns) adicionada(s). Salve para aplicar.`;
                }
                imageInput.value = '';
            }).catch((error) => {
                console.error('Não foi possível adicionar as imagens selecionadas.', error);
                window.alert(error.message);
                imageInput.value = '';
            });
        });
    }

    document.getElementById('image-gallery')?.addEventListener('click', (event) => {
        const moveButton = event.target.closest('.move-gallery-image');
        if (moveButton) {
            const index = Number(moveButton.dataset.index);
            const nextIndex = index + Number(moveButton.dataset.direction);
            if (nextIndex < 0 || nextIndex >= state.galleryImages.length) return;

            [state.galleryImages[index], state.galleryImages[nextIndex]] =
                [state.galleryImages[nextIndex], state.galleryImages[index]];
            renumberGalleryImages();
            renderImageGallery();
            if (propertyImageName) propertyImageName.textContent = 'Posição atualizada. Salve para aplicar.';
            return;
        }

        const removeButton = event.target.closest('.remove-gallery-image');
        if (!removeButton) return;

        const index = Number(removeButton.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index >= state.galleryImages.length) return;

        state.galleryImages.splice(index, 1);
        renumberGalleryImages();
        renderImageGallery();
        if (propertyImageName) {
            propertyImageName.textContent = 'Imagem removida da edição. Salve para aplicar.';
        }
    });

    const imageGallery = document.getElementById('image-gallery');
    imageGallery?.addEventListener('dragstart', (event) => {
        if (event.target.closest('button')) {
            event.preventDefault();
            return;
        }

        const imageCard = event.target.closest('.admin-gallery-image');
        if (!imageCard) return;

        state.draggingImageIndex = Number(imageCard.dataset.index);
        imageCard.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(state.draggingImageIndex));
    });

    imageGallery?.addEventListener('dragend', () => {
        state.draggingImageIndex = null;
        imageGallery.querySelectorAll('.is-dragging, .is-drop-target').forEach((element) => {
            element.classList.remove('is-dragging', 'is-drop-target');
        });
    });

    imageGallery?.addEventListener('dragover', (event) => {
        if (!event.target.closest('.admin-gallery-image')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.target.closest('.admin-gallery-image').classList.add('is-drop-target');
    });

    imageGallery?.addEventListener('dragleave', (event) => {
        const imageCard = event.target.closest('.admin-gallery-image');
        if (imageCard && !imageCard.contains(event.relatedTarget)) {
            imageCard.classList.remove('is-drop-target');
        }
    });

    imageGallery?.addEventListener('drop', (event) => {
        const targetCard = event.target.closest('.admin-gallery-image');
        if (!targetCard) return;

        event.preventDefault();
        const sourceIndex = state.draggingImageIndex;
        const targetIndex = Number(targetCard.dataset.index);
        if (sourceIndex === null || sourceIndex === targetIndex ||
            sourceIndex < 0 || sourceIndex >= state.galleryImages.length ||
            targetIndex < 0 || targetIndex >= state.galleryImages.length) {
            return;
        }

        const [image] = state.galleryImages.splice(sourceIndex, 1);
        state.galleryImages.splice(targetIndex, 0, image);
        renumberGalleryImages();
        renderImageGallery();
        if (propertyImageName) propertyImageName.textContent = 'Posição atualizada. Salve para aplicar.';
    });

    setAuthState(sessionStorage.getItem(authKey) === 'true');
    resetForm();

    if (sessionStorage.getItem(authKey) === 'true') {
        buildPropertyList().catch((error) => {
            console.error('Não foi possível carregar os imóveis para edição.', error);
            if (emptyState) {
                emptyState.hidden = false;
                emptyState.textContent = 'Não foi possível carregar os imóveis cadastrados.';
            }
        });
    }
});

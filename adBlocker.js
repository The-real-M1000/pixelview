// adBlocker.js
const AdBlocker = {
    // Lista de dominios comunes de publicidad (mantener lista anterior)
    adDomains: [
        'doubleclick.net',
        'google-analytics.com',
        'googlesyndication.com',
        'adnxs.com',
        'facebook.com/tr',
        'amazon-adsystem.com',
        'criteo.com',
        'outbrain.com',
        'taboola.com',
        'adroll.com',
        'pubmatic.com',
        'rubiconproject.com',
        'advertising.com',
        'adtechus.com',
        'moatads.com',
        'bidswitch.net',
        'openx.net',
        'casalemedia.com'
        'kaarheciqa.xyz'
    ],

    // Lista de selectores CSS comunes de anuncios (mantener lista anterior)
    adSelectors: [
        '[id*="google_ads"]',
        '[id*="ad-"]',
        '[class*="ad-"]',
        '[id*="banner"]',
        '[class*="banner"]',
        '[id*="advert"]',
        '[class*="advert"]',
        'iframe[src*="ad"]',
        'iframe[id*="google_ads"]',
        '[id*="sponsored"]',
        '[class*="sponsored"]',
        '[data-ad]',
        '[id*="taboola"]',
        '[class*="taboola"]',
        '[id*="outbrain"]',
        '[class*="outbrain"]'
    ],

    // Configuración del sistema anti-popups
    popupConfig: {
        maxPopupsPerSecond: 2,
        blockNewWindows: true,
        blockTabHijacking: true,
        preventRedirects: true,
        blockBackgroundTabs: true,
        preventWindowManipulation: true
    },

    // Estado del sistema anti-popups
    popupState: {
        popupCount: 0,
        lastPopupTime: 0,
        originalWindowFeatures: {
            location: window.location,
            opener: window.opener
        },
        isFirstUserInteraction: true
    },

    init() {
        this.setupRequestInterception();
        this.removeAdsFromDOM();
        this.setupMutationObserver();
        
        // Inicializar nuevo sistema agresivo anti-popups
        this.initAggressivePopupBlocker();
        
        console.log('Enhanced AdBlocker initialized with aggressive popup blocking');
    },

    setupRequestInterception() {
        // Crear un nuevo URLPattern para cada dominio de publicidad
        const adPatterns = this.adDomains.map(domain => 
            new URLPattern({ hostname: `*.${domain}` })
        );

        // Interceptar las solicitudes de red
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0] instanceof Request ? args[0].url : args[0];
            
            if (adPatterns.some(pattern => pattern.test(url))) {
                console.log(`Blocked request to: ${url}`);
                return new Response('', { status: 200 });
            }
            
            return originalFetch.apply(window, args);
        };

        // Interceptar XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            const url = args[1];
            
            if (adPatterns.some(pattern => pattern.test(url))) {
                console.log(`Blocked XHR request to: ${url}`);
                args[1] = 'about:blank';
            }
            
            return originalXHROpen.apply(this, args);
        };
    },

    removeAdsFromDOM() {
        // Eliminar elementos existentes que coincidan con los selectores
        const elements = document.querySelectorAll(this.adSelectors.join(','));
        elements.forEach(element => {
            element.remove();
            console.log('Removed ad element:', element);
        });

        // Limpiar iframes sospechosos
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const iframeUrl = iframe.src || iframe.getAttribute('src');
                if (this.adDomains.some(domain => iframeUrl?.includes(domain))) {
                    iframe.remove();
                    console.log('Removed ad iframe:', iframeUrl);
                }
            } catch (e) {
                // Ignorar errores de seguridad al acceder a iframes de otros dominios
            }
        });
    },

    setupMutationObserver() {
        // Crear un observador para detectar cambios en el DOM
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Solo elementos
                        // Verificar si el elemento coincide con algún selector
                        if (this.adSelectors.some(selector => 
                            node.matches && node.matches(selector)
                        )) {
                            node.remove();
                            console.log('Removed dynamically added ad:', node);
                        }

                        // Verificar iframes añadidos dinámicamente
                        if (node.tagName === 'IFRAME') {
                            const iframeUrl = node.src || node.getAttribute('src');
                            if (this.adDomains.some(domain => iframeUrl?.includes(domain))) {
                                node.remove();
                                console.log('Removed dynamic ad iframe:', iframeUrl);
                            }
                        }
                    }
                });
            });
        });

        // Configurar y iniciar el observador
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    initAggressivePopupBlocker() {
        this.blockAllWindowOpening();
        this.preventTabHijacking();
        this.blockRedirects();
        this.preventWindowManipulation();
        this.handleUserInteractions();
        this.blockBackgroundTabs();
        this.preventPopunder();
    },

    blockAllWindowOpening() {
        // Sobrescribir window.open
        const originalOpen = window.open;
        window.open = (...args) => {
            // Verificar límite de rate
            const now = Date.now();
            if (now - this.popupState.lastPopupTime < 1000) {
                this.popupState.popupCount++;
                if (this.popupState.popupCount > this.popupConfig.maxPopupsPerSecond) {
                    console.log('Blocked rapid popup attempt');
                    return null;
                }
            } else {
                this.popupState.popupCount = 1;
                this.popupState.lastPopupTime = now;
            }

            // Verificar si es una interacción genuina del usuario
            if (!this.popupState.isFirstUserInteraction) {
                console.log('Blocked non-user-initiated popup');
                return null;
            }

            const url = args[0];
            // Permitir solo si es una URL válida y no es un dominio de publicidad
            if (url && !this.adDomains.some(domain => url.includes(domain))) {
                return originalOpen.apply(window, args);
            }
            
            console.log('Blocked suspicious popup:', url);
            return null;
        };
    },

    preventTabHijacking() {
        // Bloquear modificaciones al histórico
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            if (AdBlocker.popupConfig.blockTabHijacking) {
                console.log('Blocked history.pushState attempt');
                return;
            }
            return originalPushState.apply(this, args);
        };

        history.replaceState = function(...args) {
            if (AdBlocker.popupConfig.blockTabHijacking) {
                console.log('Blocked history.replaceState attempt');
                return;
            }
            return originalReplaceState.apply(this, args);
        };

        // Prevenir cambios en location
        Object.defineProperty(window, 'location', {
            configurable: false,
            get: () => AdBlocker.popupState.originalWindowFeatures.location,
            set: (value) => {
                if (AdBlocker.popupConfig.blockTabHijacking) {
                    console.log('Blocked location change attempt');
                    return AdBlocker.popupState.originalWindowFeatures.location;
                }
                AdBlocker.popupState.originalWindowFeatures.location = value;
            }
        });
    },

    blockRedirects() {
        // Interceptar eventos beforeunload
        window.addEventListener('beforeunload', (event) => {
            if (this.popupConfig.preventRedirects && !this.popupState.isFirstUserInteraction) {
                event.preventDefault();
                event.returnValue = '';
                console.log('Blocked potential redirect');
            }
        }, true);

        // Monitorear cambios en meta refresh
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const metaTags = document.getElementsByTagName('meta');
                    for (const meta of metaTags) {
                        if (meta.httpEquiv?.toLowerCase() === 'refresh') {
                            meta.remove();
                            console.log('Removed meta refresh redirect');
                        }
                    }
                }
            });
        });

        observer.observe(document.head, {
            childList: true,
            subtree: true
        });
    },

    preventWindowManipulation() {
        // Bloquear intentos de manipulación de ventana
        if (this.popupConfig.preventWindowManipulation) {
            const properties = ['moveTo', 'moveBy', 'resizeTo', 'resizeBy', 'focus', 'blur'];
            properties.forEach(prop => {
                if (window[prop]) {
                    window[prop] = function() {
                        console.log(`Blocked window.${prop} manipulation`);
                    };
                }
            });

            // Prevenir cambios en el tamaño de la ventana
            Object.defineProperties(window, {
                'innerWidth': { configurable: false },
                'innerHeight': { configurable: false },
                'outerWidth': { configurable: false },
                'outerHeight': { configurable: false }
            });
        }
    },

    handleUserInteractions() {
        // Resetear el estado de interacción del usuario
        const resetUserInteraction = () => {
            this.popupState.isFirstUserInteraction = true;
            setTimeout(() => {
                this.popupState.isFirstUserInteraction = false;
            }, 50);
        };

        // Escuchar eventos de usuario
        ['click', 'touchstart', 'mousedown', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, resetUserInteraction, true);
        });
    },

    blockBackgroundTabs() {
        if (this.popupConfig.blockBackgroundTabs) {
            // Prevenir apertura de pestañas en segundo plano
            document.addEventListener('click', (event) => {
                if (event.target.tagName === 'A' && event.target.target === '_blank') {
                    const url = event.target.href;
                    if (!this.popupState.isFirstUserInteraction || 
                        this.adDomains.some(domain => url?.includes(domain))) {
                        event.preventDefault();
                        console.log('Blocked background tab:', url);
                    }
                }
            }, true);
        }
    },

    preventPopunder() {
        // Bloquear técnicas comunes de popunder
        window.addEventListener('load', () => {
            // Prevenir blur forzado
            window.addEventListener('blur', (event) => {
                if (document.activeElement === document.body) {
                    window.focus();
                }
            });

            // Bloquear intentos de click-under
            document.addEventListener('mouseup', (event) => {
                setTimeout(() => {
                    if (document.activeElement === document.body) {
                        window.focus();
                    }
                }, 0);
            }, true);
        });

        // Mantener el foco en la ventana actual
        setInterval(() => {
            if (document.hasFocus() && window.opener) {
                window.focus();
            }
        }, 500);
    }
};

// Inicializar el bloqueador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AdBlocker.init();
});

export default AdBlocker;

// adBlocker.js
const AdBlocker = {
    // Lista de dominios comunes de publicidad
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
    ],

    // Lista de selectores CSS comunes de anuncios
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

    init() {
        // Interceptar solicitudes de red
        this.setupRequestInterception();
        
        // Bloquear elementos DOM existentes
        this.removeAdsFromDOM();
        
        // Configurar observador para cambios dinámicos
        this.setupMutationObserver();
        
        // Bloquear ventanas emergentes
        this.blockPopups();
        
        console.log('AdBlocker initialized');
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

    blockPopups() {
        // Bloquear window.open
        const originalWindowOpen = window.open;
        window.open = function(...args) {
            const url = args[0];
            if (!url || AdBlocker.adDomains.some(domain => url.includes(domain))) {
                console.log('Blocked popup:', url);
                return null;
            }
            return originalWindowOpen.apply(this, args);
        };

        // Prevenir popunders
        window.addEventListener('load', () => {
            document.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' && e.target.target === '_blank') {
                    const url = e.target.href;
                    if (this.adDomains.some(domain => url?.includes(domain))) {
                        e.preventDefault();
                        console.log('Blocked popunder:', url);
                    }
                }
            }, true);
        });
    }
};

// Inicializar el bloqueador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AdBlocker.init();
});

export default AdBlocker;
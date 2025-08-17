// Define um nome e uma versão para o cache do aplicativo.
// Mudar a versão (ex: v2, v3) força o service worker a reinstalar e buscar novos arquivos.
const CACHE_NAME = 'compras-da-helena-cache-v3';

// Lista de arquivos essenciais para o funcionamento offline do app.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js'
];

// Evento 'install': disparado quando o Service Worker é instalado.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // Aguarda até que o cache seja aberto e todos os arquivos essenciais sejam adicionados.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto. Adicionando arquivos principais.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Força o novo Service Worker a se tornar ativo imediatamente após a instalação.
        // Essencial para o nosso mecanismo de atualização.
        return self.skipWaiting();
      })
  );
});

// Evento 'activate': disparado quando o Service Worker é ativado.
// Usado para limpar caches antigos e garantir consistência.
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Deleta qualquer cache que não seja o CACHE_NAME atual.
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
        // Garante que o Service Worker ativado controle a página imediatamente.
        console.log('Service Worker: Controle da página reivindicado.');
        return self.clients.claim();
    })
  );
});

// Evento 'fetch': intercepta todas as requisições de rede.
// Estratégia: Cache-First. Tenta servir do cache, se falhar, vai para a rede.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET para evitar problemas com Firebase, etc.
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta for encontrada no cache, a retorna.
        if (response) {
          return response;
        }
        // Se não, faz a requisição à rede.
        return fetch(event.request);
      })
  );
});

// Evento 'message': ouve mensagens enviadas da página (do index.html).
self.addEventListener('message', event => {
    // Se a mensagem contiver a ação 'skipWaiting', o Service Worker força sua ativação.
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('Service Worker: Recebida instrução skipWaiting.');
        self.skipWaiting();
    }
});
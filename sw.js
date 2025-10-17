/**
 * Service Worker - 后台更新和缓存管理
 * 支持推送通知、后台同步、离线缓存
 */

const CACHE_NAME = 'anime-raid-v1.0.0';
const STATIC_CACHE = 'anime-raid-static-v1';
const DYNAMIC_CACHE = 'anime-raid-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/database/units/index.html',
    '/codes/index.html',
    '/tier-lists/index.html',
    '/css/tailwind.css',
    '/js/main.js',
    '/js/api-service.js',
    '/js/update-manager.js',
    '/assets/icons/favicon.svg',
    '/assets/icons/favicon-32.png',
    '/assets/icons/favicon-16.png'
];

// API端点
const API_ENDPOINTS = [
    '/api/characters',
    '/api/codes',
    '/api/tier-list',
    '/api/updates'
];

/**
 * 安装事件 - 预缓存静态资源
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * 网络请求拦截 - 缓存策略
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API请求 - 网络优先，缓存回退
    if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // 静态资源 - 缓存优先
    if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // 页面请求 - 网络优先
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // 其他请求 - 正常处理
    event.respondWith(fetch(request));
});

/**
 * 网络优先策略
 */
async function networkFirstStrategy(request) {
    try {
        // 尝试网络请求
        const networkResponse = await fetch(request);

        // 缓存成功的响应
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);

        // 网络失败，尝试缓存
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 返回离线页面
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * 缓存优先策略
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // 在后台更新缓存
        updateCacheInBackground(request);
        return cachedResponse;
    }

    // 缓存中没有，从网络获取
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Cache and network both failed:', error);
        throw error;
    }
}

/**
 * 后台更新缓存
 */
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        console.log('Background cache update failed:', error);
    }
}

/**
 * 推送通知事件
 */
self.addEventListener('push', (event) => {
    console.log('Push message received:', event);

    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body || 'New content available',
        icon: '/assets/icons/favicon.svg',
        badge: '/assets/icons/favicon-32.png',
        tag: 'anime-raid-update',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View Update'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: {
            url: data.url || '/',
            updateData: data.updateData
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Anime Raid Update',
            options
        )
    );
});

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const url = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // 检查是否已有打开的窗口
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }

                // 打开新窗口
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

/**
 * 后台同步事件
 */
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'background-update') {
        event.waitUntil(performBackgroundUpdate());
    }
});

/**
 * 执行后台更新
 */
async function performBackgroundUpdate() {
    try {
        // 检查更新
        const updateResponse = await fetch('/api/updates');
        const updateData = await updateResponse.json();

        if (updateData.hasUpdates) {
            // 通知所有客户端
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    payload: updateData
                });
            });

            console.log('Background update completed');
        }
    } catch (error) {
        console.error('Background update failed:', error);
    }
}

/**
 * 消息事件处理
 */
self.addEventListener('message', (event) => {
    console.log('Service Worker message received:', event.data);

    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'FORCE_UPDATE':
            event.waitUntil(performBackgroundUpdate());
            break;

        case 'CACHE_URLS':
            event.waitUntil(
                caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.addAll(data.urls))
            );
            break;

        default:
            console.log('Unknown message type:', type);
    }
});

/**
 * 定期后台更新
 */
setInterval(() => {
    // 检查是否有活跃客户端
    self.clients.matchAll()
        .then(clients => {
            if (clients.length > 0) {
                // 有活跃客户端时触发后台同步
                if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                    self.registration.sync.register('background-update');
                } else {
                    // 回退到直接更新
                    performBackgroundUpdate();
                }
            }
        });
}, 30 * 60 * 1000); // 每30分钟检查一次

console.log('Service Worker loaded successfully');
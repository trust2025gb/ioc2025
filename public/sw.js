self.addEventListener('push', function(event) {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '新通知';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon.png',
      badge: data.badge || '/icon.png',
      data: data.data || {},
      tag: data.tag || undefined,
      renotify: data.renotify || false,
      actions: data.actions || [],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback to text
    event.waitUntil(self.registration.showNotification('通知', { body: event.data && event.data.text() }));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}); 
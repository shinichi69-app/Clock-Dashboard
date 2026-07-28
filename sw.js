const CACHE_NAME = 'world-clock-v3.1'; // เปลี่ยนเวอร์ชันทุกครั้งที่มีการอัปเดตใหญ่
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png', // ⚠️ อย่าลืมระบุชื่อไฟล์ไอคอนของคุณชินอิจิที่นี่นะคะ
  './icon2.png'
];

// 1. Install Event: เก็บไฟล์ลง แคช
self.addEventListener('install', (event) => {
  // บังคับให้ Service Worker ตัวใหม่ทำงานทันที ไม่ต้องรอปิ้ดแท็บ
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activate Event: ลบ แคช เวอร์ชันเก่าทิ้งอัตโนมัติ (สำคัญมาก!)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // ยึดการควบคุม client ทันที
  );
});

// 3. Fetch Event: ใช้ Network First สำหรับ HTML/Manifest เพื่อให้อัปเดตสดใหม่เสมอ
self.addEventListener('fetch', (event) => {
  // สำหรับไอคอน หรือไฟล์ Static ใช้ Cache First ได้ แต่ถ้าเป็นหน้าเว็บใช้ Network First
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // ถ้าดึงข้อมูลจาก Server สำเร็จ ให้อัปเดตลงแคชใหม่ด้วย
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // ถ้าออฟไลน์ ให้ดึงจากแคชมาใช้แทน
        return caches.match(event.request);
      })
  );
});

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import auth from './routes/auth'
import api from './routes/api'
import admin from './routes/admin'

// Import JS files as strings at build time
import appJs from '../public/app.js?raw'
import adminJs from '../public/admin.js?raw'

const app = new Hono<{ Bindings: Bindings }>()

// Serve JavaScript files
app.get('/app.js', (c) => {
  return c.text(appJs, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=3600'
  })
})

app.get('/admin.js', (c) => {
  return c.text(adminJs, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=3600'
  })
})

// Enable CORS for API routes
app.use('/auth/*', cors())
app.use('/api/*', cors())
app.use('/admin/*', cors())

// Mount routes
app.route('/auth', auth)
app.route('/api', api)
app.route('/admin', admin)

// Frontend pages
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Low-Competition Video Finder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8">
        <div class="flex justify-center items-center min-h-screen">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-600">로딩 중...</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      console.log('Axios loaded:', typeof axios !== 'undefined');
      console.log('Loading app.js...');
    </script>
    <script src="/app.js" onerror="console.error('Failed to load app.js')" onload="console.log('app.js loaded')"></script>
    <script>
      setTimeout(() => {
        if (document.getElementById('app').innerHTML.includes('로딩 중')) {
          console.error('App initialization failed - still showing loading screen');
          document.getElementById('app').innerHTML = '<div class="max-w-md mx-auto mt-20 p-8 bg-red-50 rounded-lg"><h1 class="text-xl font-bold text-red-600 mb-4">로딩 오류</h1><p>브라우저 콘솔(F12)을 열어 오류를 확인해주세요.</p></div>';
        }
      }, 3000);
    </script>
</body>
</html>`;
  
  return c.html(html);
})

// Admin page
app.get('/admin', (c) => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Video Finder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div id="app" class="container mx-auto px-4 py-8">
        <div class="flex justify-center items-center min-h-screen">
            <i class="fas fa-spinner fa-spin text-4xl text-red-600"></i>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/admin.js"></script>
</body>
</html>`;

  return c.html(html);
})

export default app

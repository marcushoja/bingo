# ==========================================
# STAGE 1: Build & Auto-Parse
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Frisches React-Projekt generieren
RUN npm create vite@latest frontend -- --template react
WORKDIR /app/frontend
RUN npm install

# 2. Tailwind CSS über CDN in die index.html einfügen
RUN sed -i 's|</head>|<script src="https://cdn.tailwindcss.com"></script></head>|' index.html
RUN echo "" > src/index.css && echo "" > src/App.css

# 3. DEINE dynamische Datei einfügen
COPY App.jsx src/App.jsx

# 4. Automatisches Code-Parsing: Liest die Imports aus der App.jsx und installiert sie
RUN node -e " \
    const fs = require('fs'); \
    const code = fs.readFileSync('src/App.jsx', 'utf8'); \
    const regex = /import.*from\s+['\"]([^'\"]+)['\"]/g; \
    let match; \
    const deps = new Set(); \
    while ((match = regex.exec(code)) !== null) { \
        let pkg = match[1]; \
        if (pkg.startsWith('@')) { \
            pkg = pkg.split('/').slice(0, 2).join('/'); \
        } else { \
            pkg = pkg.split('/')[0]; \
        } \
        if (!pkg.startsWith('.') && pkg !== 'react' && pkg !== 'react-dom') { \
            deps.add(pkg); \
        } \
    } \
    const depsArray = Array.from(deps); \
    if (depsArray.length > 0) { \
        console.log('📦 Installiere dynamische Abhängigkeiten: ' + depsArray.join(' ')); \
        require('child_process').execSync('npm install ' + depsArray.join(' '), {stdio: 'inherit'}); \
    } else { \
        console.log('✅ Keine externen Abhängigkeiten gefunden.'); \
    } \
"

# 5. App kompilieren
RUN npm run build

# ==========================================
# STAGE 2: Serve (Lightweight Nginx)
# ==========================================
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
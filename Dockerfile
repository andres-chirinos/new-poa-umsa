FROM node:20-alpine AS base

# 1. Instalar dependencias solo cuando sea necesario
FROM base AS deps
# libc6-compat es requerido por algunas librerías en Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
# Instalar dependencias limpiamente
RUN npm ci

# 2. Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED=1

# Compilar la aplicación para producción
RUN npm run build

# 3. Imagen de Producción, copiar solo los archivos necesarios y ejecutar
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear un usuario no root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar recursos públicos
COPY --from=builder /app/public ./public

# Crear directorio .next automáticamente para establecer permisos correctos
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario no root
USER nextjs

# Exponer el puerto
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ejecutar la aplicación usando el servidor standalone de node
CMD ["node", "server.js"]

# Script para limpiar el caché de Next.js
# Ejecuta este script si tienes problemas con el caché

Write-Host "Limpiando caché de Next.js..." -ForegroundColor Yellow

# Eliminar carpeta .next
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Carpeta .next eliminada" -ForegroundColor Green
} else {
    Write-Host "✓ La carpeta .next no existe" -ForegroundColor Gray
}

# Eliminar node_modules/.cache si existe
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ Caché de node_modules eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Caché limpiado exitosamente!" -ForegroundColor Green
Write-Host "Ahora ejecuta: npm run dev" -ForegroundColor Cyan



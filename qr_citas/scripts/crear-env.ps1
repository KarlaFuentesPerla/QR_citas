# Script para crear el archivo .env.local
# Ejecuta este script con: .\crear-env.ps1

$envContent = @"
# Variables de entorno para Supabase
# Reemplaza estos valores con tus credenciales reales de Supabase

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
"@

$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "El archivo .env.local ya existe." -ForegroundColor Yellow
    Write-Host "¿Deseas sobrescribirlo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Operación cancelada." -ForegroundColor Red
        exit
    }
}

$envContent | Out-File -FilePath $envFile -Encoding utf8
Write-Host "Archivo .env.local creado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Edita el archivo .env.local y agrega tus credenciales de Supabase:" -ForegroundColor Yellow
Write-Host "1. Ve a https://supabase.com y crea un proyecto" -ForegroundColor Cyan
Write-Host "2. Ve a Settings > API y copia:" -ForegroundColor Cyan
Write-Host "   - Project URL" -ForegroundColor Cyan
Write-Host "   - anon public key" -ForegroundColor Cyan
Write-Host "3. Reemplaza los valores en .env.local" -ForegroundColor Cyan



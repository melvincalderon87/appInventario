[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $PSCommandPath
$WebZip = Join-Path $ScriptRoot "sysInventario.zip"
$ApiZip = Join-Path $ScriptRoot "sysInventarioAPI.zip"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$StoppedPools = @()
$WebPath = "C:\inetpub\wwwroot\sysInventario"
$ApiPath = "C:\inetpub\wwwroot\sysInventarioAPI"
$WebAppPool = "Inventario"
$ApiAppPool = "InventarioAPI"

function Assert-DeployPath {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        throw "La carpeta de destino no existe: $Path"
    }

    $resolved = (Resolve-Path -LiteralPath $Path).Path.TrimEnd("\\")
    $root = [System.IO.Path]::GetPathRoot($resolved).TrimEnd("\\")
    if ($resolved -eq $root) {
        throw "No se permite publicar en la raiz de una unidad: $resolved"
    }

    return $resolved
}

function Stop-Pool {
    param([string]$Name)

    if ([string]::IsNullOrWhiteSpace($Name)) { return }
    if (-not (Test-Path "IIS:\AppPools\$Name")) {
        throw "No existe el Application Pool: $Name"
    }

    Stop-WebAppPool -Name $Name
    $script:StoppedPools += $Name
}

function Publish-Zip {
    param(
        [string]$Zip,
        [string]$Destination,
        [string]$Name
    )

    if (-not (Test-Path -LiteralPath $Zip -PathType Leaf)) {
        throw "No se encontro el paquete: $Zip"
    }

    $parent = Split-Path -Parent $Destination
    $staging = Join-Path $parent ".${Name}-staging-$Stamp"
    $backup = Join-Path $parent ".${Name}-backup-$Stamp"

    try {
        New-Item -ItemType Directory -Path $staging | Out-Null
        Expand-Archive -LiteralPath $Zip -DestinationPath $staging -Force

        if (-not (Get-ChildItem -LiteralPath $staging -Force | Select-Object -First 1)) {
            throw "El paquete esta vacio: $Zip"
        }

        Move-Item -LiteralPath $Destination -Destination $backup
        try {
            Move-Item -LiteralPath $staging -Destination $Destination
        }
        catch {
            Move-Item -LiteralPath $backup -Destination $Destination
            throw
        }

        Write-Host "Publicado $Name. Respaldo: $backup" -ForegroundColor Green
    }
    finally {
        if (Test-Path -LiteralPath $staging) {
            Remove-Item -LiteralPath $staging -Recurse -Force
        }
    }
}

try {
    Import-Module WebAdministration -ErrorAction Stop
    $WebPath = Assert-DeployPath $WebPath
    $ApiPath = Assert-DeployPath $ApiPath
    Stop-Pool $WebAppPool
    Stop-Pool $ApiAppPool

    Publish-Zip -Zip $WebZip -Destination $WebPath -Name "sysInventario"
    Publish-Zip -Zip $ApiZip -Destination $ApiPath -Name "sysInventarioAPI"
}
finally {
    foreach ($pool in $StoppedPools) {
        Start-WebAppPool -Name $pool
    }
}

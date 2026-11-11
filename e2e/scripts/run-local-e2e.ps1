param(
  [switch]$SkipBuild,
  [switch]$KeepDb,
  [switch]$SkipDbStart,
  [switch]$SkipStackStart,
  [string[]]$PlaywrightArgs = @()
)

$ErrorActionPreference = "Stop"
$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path
$E2eDir = Join-Path $RootDir "e2e"
$LogDir = Join-Path $E2eDir "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$StartedPids = @()

function Stop-StartedStack {
  foreach ($procId in $StartedPids) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    } catch {}
  }
}

try {
  if (-not $SkipStackStart) {
    if (-not $SkipDbStart) {
      Write-Host "[1/5] Starting isolated E2E PostgreSQL on port 5434..." -ForegroundColor Cyan
      if (-not $KeepDb) {
        docker compose -f "$RootDir\docker-compose.e2e.yml" down -v | Out-Null
      }
      docker compose -f "$RootDir\docker-compose.e2e.yml" up -d --wait
      if ($LASTEXITCODE -ne 0) { throw "Failed to start E2E Postgres container" }
    }

    if (-not $SkipBuild) {
      Write-Host "[2/5] Building backend JARs and frontend bundle..." -ForegroundColor Cyan
      if (Get-Command mvn -ErrorAction SilentlyContinue) {
        mvn -f "$RootDir\backend\pom.xml" -DskipTests package
      } else {
        & "$RootDir\backend\mvnw.cmd" -f "$RootDir\backend\pom.xml" -DskipTests package
      }
      if ($LASTEXITCODE -ne 0) { throw "Backend Maven package failed" }

      $env:API_GATEWAY_URL = "http://localhost:8088"
      $env:NEXT_PUBLIC_WS_URL = "ws://localhost:8088/ws-pos"
      Push-Location "$RootDir\frontend"
      try {
        npx next build --webpack
      } finally {
        Pop-Location
      }
      if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    }

    $busyPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -in 3000,8081,8082,8083,8088 } |
      Select-Object -ExpandProperty LocalPort -Unique
    if ($busyPorts) {
      throw "Ports already in use ($($busyPorts -join ', ')). Stop existing dev servers before running E2E."
    }

    Write-Host "[3/5] Starting backend microservices & Gateway against DB :5434..." -ForegroundColor Cyan
    $env:SPRING_PROFILES_ACTIVE = "dev"
    $env:POSTGRES_USER = "pos_admin"
    $env:POSTGRES_PASSWORD = "pos_password123"
    $env:AUTH_DB_PORT = "5434"
    $env:CATALOG_DB_URL = "jdbc:postgresql://localhost:5434/pos_catalog_inventory_db"
    $env:SALES_DB_URL = "jdbc:postgresql://127.0.0.1:5434/pos_sales_db"
    $env:JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
    $env:INTERNAL_SERVICE_SECRET = "smartpos-internal-secret-2026"
    $env:RATE_LIMIT_ENABLED = "true"
    $env:RATE_LIMIT_LOGIN_MAX_REQUESTS = if ($env:RATE_LIMIT_LOGIN_MAX_REQUESTS) { $env:RATE_LIMIT_LOGIN_MAX_REQUESTS } else { "40" }
    $env:RATE_LIMIT_ORDER_MAX_REQUESTS = if ($env:RATE_LIMIT_ORDER_MAX_REQUESTS) { $env:RATE_LIMIT_ORDER_MAX_REQUESTS } else { "60" }
    $env:API_GATEWAY_URL = "http://localhost:8088"
    $env:NEXT_PUBLIC_WS_URL = "ws://localhost:8088/ws-pos"

    $services = @(
      @{ Name = "auth-service"; Jar = (Get-ChildItem "$RootDir\backend\services\auth-service\target\*.jar" | Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "*.original" } | Select-Object -First 1).FullName },
      @{ Name = "catalog-inventory-service"; Jar = (Get-ChildItem "$RootDir\backend\services\catalog-inventory-service\target\*.jar" | Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "*.original" } | Select-Object -First 1).FullName },
      @{ Name = "sales-service"; Jar = (Get-ChildItem "$RootDir\backend\services\sales-service\target\*.jar" | Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "*.original" } | Select-Object -First 1).FullName },
      @{ Name = "gateway"; Jar = (Get-ChildItem "$RootDir\backend\gateway\target\*.jar" | Where-Object { $_.Name -notlike "*-plain.jar" -and $_.Name -notlike "*.original" } | Select-Object -First 1).FullName }
    )

    foreach ($svc in $services) {
      if (-not $svc.Jar) { throw "Boot JAR not found for $($svc.Name). Run without -SkipBuild first." }
      $proc = Start-Process -FilePath "java" -ArgumentList "-jar", "`"$($svc.Jar)`"" `
        -WorkingDirectory $RootDir `
        -RedirectStandardOutput "$LogDir\$($svc.Name).out.log" `
        -RedirectStandardError "$LogDir\$($svc.Name).err.log" `
        -PassThru -WindowStyle Hidden
      $StartedPids += $proc.Id
    }

    $feProc = Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next", "start" `
      -WorkingDirectory "$RootDir\frontend" `
      -RedirectStandardOutput "$LogDir\frontend.out.log" `
      -RedirectStandardError "$LogDir\frontend.err.log" `
      -PassThru -WindowStyle Hidden
    $StartedPids += $feProc.Id
  }

  Write-Host "[4/5] Waiting for full stack healthchecks..." -ForegroundColor Cyan
  node "$E2eDir\scripts\wait-for-stack.mjs"
  if ($LASTEXITCODE -ne 0) { throw "Stack healthcheck failed" }

  Write-Host "[5/5] Running Playwright E2E tests..." -ForegroundColor Cyan
  Push-Location $E2eDir
  try {
    if ($PlaywrightArgs.Count -gt 0) {
      npx playwright test @PlaywrightArgs
    } else {
      npx playwright test
    }
    $testExit = $LASTEXITCODE
  } finally {
    Pop-Location
  }

  if ($testExit -ne 0) {
    exit $testExit
  }
}
finally {
  if (-not $SkipStackStart) {
    Write-Host "Stopping E2E app processes..." -ForegroundColor Yellow
    Stop-StartedStack
  }
}

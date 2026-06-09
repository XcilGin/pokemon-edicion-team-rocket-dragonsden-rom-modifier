$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root "app"

Write-Host "口袋妖怪西班牙火箭队ROM修改器"
Write-Host "——百度贴吧 祖鲁桃源"
Write-Host ""

if (-not (Test-Path (Join-Path $appDir "index.html"))) {
  Write-Host "未找到 app\index.html。"
  Write-Host "请确认 app 文件夹和启动脚本放在同一目录下。"
  Read-Host "按回车关闭窗口"
  exit 1
}

function Test-PythonCommand {
  param(
    [string]$FilePath,
    [string[]]$BaseArgs
  )

  try {
    $versionArgs = @($BaseArgs + @("--version"))
    $output = & $FilePath @versionArgs 2>&1
    if ($LASTEXITCODE -eq 0 -and ($output -join "`n") -match "Python 3") {
      return $true
    }
  } catch {
    return $false
  }

  return $false
}

function Get-PythonCommand {
  $candidates = @(
    @{ FilePath = "py"; Args = @("-3") },
    @{ FilePath = "python"; Args = @() }
  )

  foreach ($candidate in $candidates) {
    if (Get-Command $candidate.FilePath -ErrorAction SilentlyContinue) {
      if (Test-PythonCommand -FilePath $candidate.FilePath -BaseArgs $candidate.Args) {
        return $candidate
      }
    }
  }

  return $null
}

function Test-PortFree {
  param([int]$Port)

  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
}

$python = Get-PythonCommand
if (-not $python) {
  Write-Host "未找到可用的 Python 3。"
  Write-Host "请安装 Python 3 后再运行本工具。"
  Read-Host "按回车关闭窗口"
  exit 1
}

$port = $null
foreach ($candidatePort in 4173..4190) {
  if (Test-PortFree -Port $candidatePort) {
    $port = $candidatePort
    break
  }
}

if (-not $port) {
  Write-Host "4173 到 4190 端口都被占用，无法启动本地页面。"
  Read-Host "按回车关闭窗口"
  exit 1
}

$url = "http://127.0.0.1:$port/"
$serverArgs = @($python.Args + @("-m", "http.server", "$port", "--bind", "127.0.0.1"))

Write-Host "正在启动本地页面..."
$server = Start-Process -FilePath $python.FilePath -ArgumentList $serverArgs -WorkingDirectory $appDir -WindowStyle Hidden -PassThru

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
  }
}

if (-not $ready) {
  try { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue } catch {}
  Write-Host "本地页面启动失败。"
  Write-Host "请确认安全软件没有拦截 Python 或本地网页服务。"
  Read-Host "按回车关闭窗口"
  exit 1
}

Start-Process $url
Write-Host "已打开浏览器：$url"
Write-Host "如果浏览器没有自动打开，请复制上面的地址到浏览器。"
Write-Host ""
Write-Host "本窗口可以关闭，修改器页面会继续运行。"
Read-Host "按回车关闭窗口"

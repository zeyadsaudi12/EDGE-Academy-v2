# Masar GitHub Realtime Auto-Sync Watcher
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:Path = "C:\Users\mzeya\AppData\Local\Programs\Git\cmd;$env:Path"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       Masar - المزامنة التلقائية اللحظية مع GitHub       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "يراقب هذا البرنامج أي تغيير في ملفات المشروع ويقوم برفعه تلقائياً إلى GitHub." -ForegroundColor Gray
Write-Host "لإيقاف المزامنة في أي وقت: اضغط Ctrl + C`n" -ForegroundColor DarkGray

$debounceSeconds = 5
$script:pendingSync = $false
$script:lastChangeTime = [DateTime]::MinValue

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PSScriptRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$ignoredPatterns = @('\.git', 'node_modules', 'scratch', 'dashboard',  '\.log$' )

$action = {
    param($source, $eventArgs)
    $path = $eventArgs.FullPath
    
    foreach ($pat in $ignoredPatterns) {
        if ($path -match $pat) { return }
    }

    $script:pendingSync = $true
    $script:lastChangeTime = [DateTime]::Now
    Write-Host "[تعديل تم رصده] $($eventArgs.ChangeType): $($eventArgs.Name)" -ForegroundColor Yellow
}

Register-ObjectEvent $watcher 'Changed' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Created' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Deleted' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Renamed' -Action $action | Out-Null

try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        if ($script:pendingSync) {
            $elapsed = ([DateTime]::Now - $script:lastChangeTime).TotalSeconds
            if ($elapsed -ge $debounceSeconds) {
                $script:pendingSync = $false
                Write-Host "`n[+] جاري التحضير ورفع التعديلات إلى GitHub..." -ForegroundColor Cyan
                
                git add .
                $status = git status --porcelain
                
                if ([string]::IsNullOrWhiteSpace($status)) {
                    Write-Host "[i] لا توجد تغييرات جديدة للمزامنة." -ForegroundColor DarkGray
                } else {
                    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                    git commit -m "Auto update: $timestamp"
                    
                    Write-Host "[>] جاري عمل push إلى GitHub..." -ForegroundColor Magenta
                    $pushOutput = git push origin main 2>&1
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[✔] تم الرفع بنجاح في: $timestamp" -ForegroundColor Green
                    } else {
                        Write-Host "[!] تعذر الرفع إلى GitHub. تأكد من إعداد رابط المستودع وصلاحيات الحساب." -ForegroundColor Red
                        Write-Host $pushOutput -ForegroundColor DarkRed
                    }
                }
            }
        }
    }
}
finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host "`nتم إيقاف المزامنة التلقائية." -ForegroundColor Yellow
}

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$branch = (& git symbolic-ref --quiet --short HEAD 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $branch) {
    throw 'Auto-push requires a checked-out Git branch.'
}

$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'

Write-Host '[auto-push] Watching for saved project changes.'
Write-Host '[auto-push] Ready'

$lastStatus = $null
$processedStatus = $null
$stablePolls = 0
$pushPending = $false
$lastPushAttempt = [DateTime]::MinValue

while ($true) {
    $statusLines = @(& git status --porcelain --untracked-files=normal)
    if ($LASTEXITCODE -ne 0) {
        Write-Warning '[auto-push] Could not read Git status; will retry.'
        Start-Sleep -Seconds 2
        continue
    }

    $status = [string]::Join("`n", $statusLines)
    if ($status -ne $lastStatus) {
        $lastStatus = $status
        $stablePolls = 1
    } elseif ($status) {
        $stablePolls++
    }

    if ($status -and $stablePolls -ge 2 -and $status -ne $processedStatus) {
        $processedStatus = $status
        & git add --all
        if ($LASTEXITCODE -ne 0) {
            Write-Warning '[auto-push] Could not stage changes; will retry after the next file change.'
        } else {
            & git diff --cached --quiet
            $diffExitCode = $LASTEXITCODE
            if ($diffExitCode -eq 1) {
                $commitMessage = 'Auto-sync saved changes ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
                & git commit -m $commitMessage -m 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'
                if ($LASTEXITCODE -eq 0) {
                    $pushPending = $true
                    Write-Host '[auto-push] Saved changes committed; pushing to GitHub.'
                } else {
                    Write-Warning '[auto-push] Commit failed. Check Git identity and resolve the reported issue.'
                }
            } elseif ($diffExitCode -ne 0) {
                Write-Warning '[auto-push] Could not inspect staged changes.'
            }
        }
    }

    $upstream = (& git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>$null)
    if ($LASTEXITCODE -eq 0 -and $upstream) {
        $ahead = (& git rev-list --count "$upstream..HEAD" 2>$null)
        if ($LASTEXITCODE -eq 0 -and [int]$ahead -gt 0) {
            $pushPending = $true
        }
    }

    if ($pushPending -and ((Get-Date) - $lastPushAttempt).TotalSeconds -ge 30) {
        $lastPushAttempt = Get-Date
        & git push --set-upstream origin $branch
        if ($LASTEXITCODE -eq 0) {
            $pushPending = $false
            Write-Host '[auto-push] GitHub is up to date.'
        } else {
            Write-Warning '[auto-push] Push failed. The commit is safe locally; will retry in 30 seconds.'
        }
    }

    Start-Sleep -Seconds 2
}

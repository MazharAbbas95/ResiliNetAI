$filePath = "src\agents\core\AgentManager.ts"
$lines = [System.IO.File]::ReadAllLines($filePath)
$truncated = $lines[0..1009]
[System.IO.File]::WriteAllLines((Resolve-Path $filePath), $truncated)
Write-Host "Done. Lines kept: $($truncated.Length)"

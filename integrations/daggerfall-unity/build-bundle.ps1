param(
    [Parameter(Mandatory=$true)][string]$GameDirectory,
    [Parameter(Mandatory=$true)][string]$BuildDirectory,
    [string]$UnityEditor = 'C:\Program Files\Unity\Hub\Editor\2019.4.41f2\Editor\Unity.exe'
)
$ErrorActionPreference = 'Stop'
$version = (Get-Item -LiteralPath $UnityEditor).VersionInfo.ProductVersion
if ($version -notlike '2019.4.41f2*') { throw 'Use Unity 2019.4.41f2 for this bundle.' }
$editorRoot = Split-Path -Parent $UnityEditor
foreach ($required in @('Data/Resources/PackageManager/Server/UnityPackageManager.exe','Data/Tools/nodejs/node.exe')) {
    if (!(Test-Path -LiteralPath (Join-Path $editorRoot $required))) { throw "Incomplete Editor installation: missing $required. Repair it in Unity Hub." }
}
$root = [IO.Path]::GetFullPath($BuildDirectory)
$project = Join-Path $root 'bundle-project'
New-Item -ItemType Directory -Force -Path "$project/Assets/Editor", "$project/Assets/Hearsay", "$project/ProjectSettings" | Out-Null
& "$PSScriptRoot/check-compile.ps1" -GameDirectory $GameDirectory -OutputDirectory "$root/compiled"
Copy-Item -LiteralPath "$root/compiled/HearsayDfu.dll" -Destination "$project/Assets/Hearsay/HearsayDfu.dll.bytes"
Copy-Item -LiteralPath "$PSScriptRoot/BuildBundle.cs" -Destination "$project/Assets/Editor/BuildBundle.cs"
@{
    ModTitle='Hearsay Game Test'; ModVersion='0.1.0'; ModAuthor='Goodness'; ContactInfo='https://github.com/Ayosensei/hearsay'
    DFUnity_Version='1.1.1'; GUID='04df6956-8bb9-4877-9af9-8f9510c37abf'
    ModDescription='Three bound NPCs, reported crime capture and graph-backed memory. Test trust network; F8 during dialogue.'
    Files=@('Assets/Hearsay/HearsayDfu.dll.bytes','Assets/Hearsay/hearsay.dfmod.json')
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$project/Assets/Hearsay/hearsay.dfmod.json" -Encoding utf8
'm_EditorVersion: 2019.4.41f2' | Set-Content -LiteralPath "$project/ProjectSettings/ProjectVersion.txt"
$env:HEARSAY_DFMOD_OUTPUT = Join-Path $root 'bundle'
$log = Join-Path $root 'unity-build.log'
$process = Start-Process -FilePath $UnityEditor -ArgumentList @('-batchmode','-nographics','-quit','-projectPath',('"'+$project+'"'),'-executeMethod','HearsayBundleBuilder.Build','-logFile',('"'+$log+'"')) -WindowStyle Hidden -PassThru
# Older Editors can wait indefinitely at a license dialog even in batch mode.
if (!$process.WaitForExit(300000)) {
    Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    throw "Unity build timed out. Inspect licensing/import errors in $log"
}
if ($process.ExitCode -ne 0) { throw "Unity build failed. See $log" }
if (!(Select-String -LiteralPath $log -SimpleMatch 'HEARSAY_BUNDLE_VERIFIED' -Quiet)) { throw "Bundle verification missing. See $log" }
Write-Output "Verified bundle: $env:HEARSAY_DFMOD_OUTPUT/hearsay.dfmod"

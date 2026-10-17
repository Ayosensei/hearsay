param(
  [Parameter(Mandatory=$true)][string]$GameDirectory,
  [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference='Stop'
$managed=Join-Path (Resolve-Path -LiteralPath $GameDirectory) 'DaggerfallUnity_Data\Managed'
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(-not(Test-Path -LiteralPath $compiler)){ throw 'Windows C# compiler unavailable; compile in Unity Editor instead.' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$output=Join-Path (Resolve-Path -LiteralPath $OutputDirectory) 'HearsayDfu.dll'
$names=@('mscorlib.dll','netstandard.dll','System.dll','System.Core.dll','Assembly-CSharp.dll','Assembly-CSharp-firstpass.dll','UnityEngine.dll','UnityEngine.CoreModule.dll','UnityEngine.IMGUIModule.dll','UnityEngine.InputLegacyModule.dll','UnityEngine.JSONSerializeModule.dll','UnityEngine.PhysicsModule.dll','UnityEngine.UnityWebRequestModule.dll')
$references=$names | ForEach-Object { '/reference:'+(Join-Path $managed $_) }
$sources=Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'mod') -Filter '*.cs' | Select-Object -ExpandProperty FullName
& $compiler /noconfig /nologo /target:library /nostdlib+ /langversion:5 "/out:$output" @references @sources
if($LASTEXITCODE -ne 0){ throw 'Daggerfall compile check failed.' }
Write-Output "Compiled against actual game assemblies: $output"
Write-Output 'This is a compile check, not a loadable .dfmod bundle or in-game runtime test.'

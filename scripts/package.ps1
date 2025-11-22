# Packaging script for Placement Form Autofill (Windows PowerShell)
# Produces a ZIP containing only the essential files for Chrome Web Store upload.

param(
  [string]$OutName = "placement_autofill_production.zip",
  [string]$Version = "0.1.0"
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$prodDir = Join-Path $root "prod_build"

# Clean previous build
if(Test-Path $prodDir){ Remove-Item -Path $prodDir -Recurse -Force }
New-Item -ItemType Directory -Path $prodDir | Out-Null

# List of files and folders to include
$include = @(
  'manifest.json',
  'popup.html',
  'popup.js',
  'content.js',
  'matcher.js',
  'privacy_policy.html',
  'profile.schema.json',
  'example_profile.json',
  'icons'
)

foreach($p in $include){
  $src = Join-Path $root $p
  if(Test-Path $src){
    Copy-Item -Path $src -Destination $prodDir -Recurse -Force
  }
}

# Create zip
if(Test-Path $OutName){ Remove-Item $OutName -Force }
Compress-Archive -Path (Join-Path $prodDir '*') -DestinationPath $OutName
Write-Output "Created $OutName"

# Cleanup prod_dir
Remove-Item -Path $prodDir -Recurse -Force
Write-Output "Packaged extension successfully."
param([string]$ApiBaseUrl = 'https://api.mtgbe.date/api/v1')

$ErrorActionPreference = 'Stop'
$signingDir = Join-Path $env:USERPROFILE '.android/MtgChecker-signing'
$keystore = Join-Path $signingDir 'mtgchecker.p12'
$vault = Join-Path $signingDir 'password.dpapi'
if (!(Test-Path $keystore) -or !(Test-Path $vault)) {
    throw 'Restore the original release signing key and its Windows password vault before building an update.'
}

$securePassword = ConvertTo-SecureString (Get-Content $vault -Raw).Trim()
$password = [Net.NetworkCredential]::new('', $securePassword).Password
$settings = @{
    'EXPO_PUBLIC_API_BASE_URL' = $ApiBaseUrl
    'NODE_ENV' = 'production'
    'ORG_GRADLE_PROJECT_android.injected.signing.store.file' = $keystore
    'ORG_GRADLE_PROJECT_android.injected.signing.store.password' = $password
    'ORG_GRADLE_PROJECT_android.injected.signing.key.alias' = 'mtgchecker'
    'ORG_GRADLE_PROJECT_android.injected.signing.key.password' = $password
}
$previous = @{}
Push-Location (Join-Path $PSScriptRoot '../android')
try {
    foreach ($name in $settings.Keys) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name)
        [Environment]::SetEnvironmentVariable($name, $settings[$name])
    }
    & .\gradlew.bat --init-script (Join-Path $PSScriptRoot 'android-windows.gradle') :app:assembleRelease
    if ($LASTEXITCODE) { throw "Android build failed ($LASTEXITCODE)" }
    Get-Item 'app/build/outputs/apk/release/app-release.apk'
} finally {
    foreach ($name in $previous.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previous[$name])
    }
    Pop-Location
}

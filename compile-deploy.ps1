# PowerShell script to backup static folder and replace with React build

# Define paths
$reactProjectPath = "E:\ide projects\Intellij Projects\sop prod\sop-hub"
$springBootProjectPath = "E:\ide projects\Intellij Projects\sop prod\sop-document"
$staticFolderPath = "E:\ide projects\Intellij Projects\sop prod\sop-document\src\main\resources\static"
$parentPath = "E:\ide projects\Intellij Projects\sop prod\sop-document\src\main\resources"

# Generate timestamp for backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFolderName = "static_$timestamp"
$backupPath = Join-Path $parentPath $backupFolderName

Write-Host "Starting deployment process..." -ForegroundColor Green
Write-Host "Timestamp: $timestamp" -ForegroundColor Cyan

# Step 1: Check and display current static folder info
Write-Host "`nStep 1: Checking current static folder..." -ForegroundColor Yellow
if (Test-Path $staticFolderPath) {
    $staticFolderInfo = Get-Item $staticFolderPath
    $lastModified = $staticFolderInfo.LastWriteTime
    Write-Host "Current static folder exists" -ForegroundColor Green
    Write-Host "Last Modified: $lastModified" -ForegroundColor Cyan
    Write-Host "Full Path: $staticFolderPath" -ForegroundColor Cyan
}
else {
    Write-Host "Static folder not found at: $staticFolderPath" -ForegroundColor Yellow
}

# Step 2: Backup existing static folder
Write-Host "`nStep 2: Creating backup of static folder..." -ForegroundColor Yellow
if (Test-Path $staticFolderPath) {
    try {
        Copy-Item -Path $staticFolderPath -Destination $backupPath -Recurse -Force
        $backupInfo = Get-Item $backupPath
        Write-Host "Backup created successfully!" -ForegroundColor Green
        Write-Host "Backup location: $backupPath" -ForegroundColor Cyan
        Write-Host "Backup timestamp: $($backupInfo.CreationTime)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "Error creating backup: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Static folder not found. Skipping backup." -ForegroundColor Yellow
}

# Step 3: Build React project
Write-Host "`nStep 3: Building React project..." -ForegroundColor Yellow
Set-Location $reactProjectPath

try {
    # Run npm build (or yarn build / pnpm build depending on your package manager)
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "React build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "React build completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error during build: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Remove old static folder
Write-Host "`nStep 4: Removing old static folder..." -ForegroundColor Yellow
if (Test-Path $staticFolderPath) {
    try {
        Remove-Item -Path $staticFolderPath -Recurse -Force
        Write-Host "Old static folder removed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "Error removing old static folder: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 5: Copy new build to static folder
Write-Host "`nStep 5: Copying new build to static folder..." -ForegroundColor Yellow
$distPath = Join-Path $reactProjectPath "dist"

if (Test-Path $distPath) {
    try {
        Copy-Item -Path $distPath -Destination $staticFolderPath -Recurse -Force
        Write-Host "New build copied successfully to static folder!" -ForegroundColor Green
    }
    catch {
        Write-Host "Error copying build: $_" -ForegroundColor Red
        Write-Host "Restoring backup..." -ForegroundColor Yellow
        Copy-Item -Path $backupPath -Destination $staticFolderPath -Recurse -Force
        exit 1
    }
}
else {
    Write-Host "Dist folder not found at: $distPath" -ForegroundColor Red
    Write-Host "Restoring backup..." -ForegroundColor Yellow
    Copy-Item -Path $backupPath -Destination $staticFolderPath -Recurse -Force
    exit 1
}

# Step 6: Validate new static folder
Write-Host "`nStep 6: Validating new static folder..." -ForegroundColor Yellow
if (Test-Path $staticFolderPath) {
    $newStaticInfo = Get-Item $staticFolderPath
    $newLastModified = $newStaticInfo.LastWriteTime
    Write-Host "New static folder validated successfully!" -ForegroundColor Green
    Write-Host "New Last Modified: $newLastModified" -ForegroundColor Cyan
    Write-Host "Full Path: $staticFolderPath" -ForegroundColor Cyan
    
    # Check if modification time is recent (within last 2 minutes)
    $timeDiff = (Get-Date) - $newLastModified
    if ($timeDiff.TotalMinutes -lt 2) {
        Write-Host "Timestamp validation passed - folder was just updated!" -ForegroundColor Green
    }
    else {
        Write-Host "Warning: Folder timestamp is older than expected" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Validation failed - static folder not found!" -ForegroundColor Red
    exit 1
}

# Step 7: Run Maven clean compile
Write-Host "`nStep 7: Running Maven clean compile on Spring Boot project..." -ForegroundColor Yellow
Set-Location $springBootProjectPath

try {
    mvn clean compile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Maven clean compile failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Maven clean compile completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error during Maven compile: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`nDeployment Summary:" -ForegroundColor Cyan
Write-Host "  Backup created: $backupPath" -ForegroundColor White
Write-Host "  Backup name: $backupFolderName" -ForegroundColor White
Write-Host "  Old static modified: $lastModified" -ForegroundColor White
Write-Host "  New static modified: $newLastModified" -ForegroundColor White
Write-Host "  Static folder location: $staticFolderPath" -ForegroundColor White
Write-Host "  Maven compile: Completed" -ForegroundColor White
Write-Host "`nYour Spring Boot application is ready to run!" -ForegroundColor Green
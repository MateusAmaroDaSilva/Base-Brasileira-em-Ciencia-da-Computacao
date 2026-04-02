#!/usr/bin/env pwsh
<#
.SYNOPSIS
Test runner script for Base Brasileira em Ciência da Computação backend tests

.DESCRIPTION
Convenient script to run various test configurations with proper setup and reporting

.PARAMETER Mode
Test running mode: all, unit, integration, e2e, coverage, quick, slow

.PARAMETER Verbose
Show detailed output

.EXAMPLE
.\run_tests.ps1 -Mode unit -Verbose

#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'unit', 'integration', 'e2e', 'coverage', 'quick', 'slow', 'failing')]
    [string]$Mode = 'quick',
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoReport,
    
    [Parameter(Mandatory=$false)]
    [int]$Workers = 1
)

# Colors for output
$colors = @{
    Success  = 'Green'
    Error    = 'Red'
    Warning  = 'Yellow'
    Info     = 'Cyan'
    Header   = 'Magenta'
}

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 70 -ForegroundColor $colors.Header
    Write-Host $Text -ForegroundColor $colors.Header
    Write-Host "=" * 70 -ForegroundColor $colors.Header
    Write-Host ""
}

function Write-Status {
    param([string]$Text, [string]$Color = 'Info')
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Test-Requirements {
    Write-Host "`n🔍 Checking requirements..." -ForegroundColor $colors.Info
    
    # Check pytest
    $pytest = pip list | Select-String "pytest"
    if (-not $pytest) {
        Write-Status "❌ pytest not installed" Error
        Write-Host "Run: pip install -r requirements-dev.txt"
        exit 1
    }
    
    Write-Status "✅ pytest found" Success
    return $true
}

function Run-Tests {
    param(
        [string]$TestPath,
        [string]$Description
    )
    
    Write-Header $Description
    Write-Host "Test path: $TestPath`n"
    
    $args = @(
        $TestPath,
        '-v'
    )
    
    if ($Verbose) { $args += '--tb=long' } else { $args += '--tb=short' }
    if ($Workers -gt 1) { $args += @('-n', $Workers.ToString()) }
    
    Write-Host "Command: pytest $(($args -join ' '))`n"
    
    & pytest @args
    
    return $LASTEXITCODE
}

function Show-Coverage {
    Write-Header "📊 Creating Coverage Report"
    
    Write-Host "Generating coverage report..." -ForegroundColor $colors.Info
    
    & pytest `
        --cov=app `
        --cov-report=html `
        --cov-report=term-missing `
        --cov-report=xml `
        tests/
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "`n✅ Coverage report generated at: htmlcov/index.html" Success
    }
    
    return $LASTEXITCODE
}

function Show-Menu {
    Write-Header "🧪 Test Runner Menu"
    Write-Host "Available modes:"
    Write-Host "  1. quick       - Unit tests only (fastest)"
    Write-Host "  2. unit        - All unit tests"
    Write-Host "  3. integration - Integration tests"
    Write-Host "  4. e2e         - End-to-end tests (slow)"
    Write-Host "  5. slow        - Slow tests only"
    Write-Host "  6. all         - All tests"
    Write-Host "  7. coverage    - All tests with coverage report"
    Write-Host "  8. failing     - Re-run last failures"
    Write-Host ""
}

# Main execution
Write-Header "🧪 Base Brasileira - Test Suite"
Write-Status "Mode: $Mode | Verbose: $Verbose | Workers: $Workers" Info

if (-not (Test-Requirements)) {
    exit 1
}

$exitCode = 0

switch ($Mode) {
    'quick' {
        $exitCode = Run-Tests "tests/unit" "⚡ Quick Test - Unit Tests Only"
    }
    
    'unit' {
        $exitCode = Run-Tests "tests/unit -m unit" "📦 Unit Tests"
    }
    
    'integration' {
        $exitCode = Run-Tests "tests/integration -m integration" "🔗 Integration Tests"
    }
    
    'e2e' {
        $exitCode = Run-Tests "tests/e2e -m e2e" "🌐 End-to-End Tests"
    }
    
    'slow' {
        $exitCode = Run-Tests "tests/e2e -m slow" "🐢 Slow Tests"
    }
    
    'all' {
        Write-Header "🔍 Running ALL Tests"
        Write-Host "tests/ -v`n"
        & pytest tests/ -v --tb=short
        $exitCode = $LASTEXITCODE
    }
    
    'coverage' {
        Show-Coverage
        $exitCode = $LASTEXITCODE
    }
    
    'failing' {
        Write-Header "🔄 Re-running Failed Tests"
        & pytest --lf -v
        $exitCode = $LASTEXITCODE
    }
}

# Summary
Write-Host "`n"
if ($exitCode -eq 0) {
    Write-Header "✅ All Tests Passed!"
} else {
    Write-Header "❌ Some Tests Failed"
}

Write-Host "Exit code: $exitCode`n"

# Show next steps
Write-Status "`nNext steps:" Info
Write-Host "  • View coverage report: start htmlcov/index.html"
Write-Host "  • Run specific test: pytest tests/unit/test_elasticsearch_client.py"
Write-Host "  • Debug test: pytest --pdb tests/unit/test_elasticsearch_client.py"
Write-Host ""

exit $exitCode

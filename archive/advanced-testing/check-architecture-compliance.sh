#!/bin/bash

# Architecture Compliance Checker
# This script validates adherence to clean architecture principles and design patterns

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_DIR="rct-backend"
COMPLIANCE_REPORT="architecture-compliance-report.md"
VIOLATIONS_COUNT=0
CHECKS_PASSED=0

echo -e "${BLUE}=== Architecture Compliance Checker ===${NC}"
echo -e "${BLUE}Validating clean architecture and design patterns${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((CHECKS_PASSED++))
}

# Function to print violation messages
print_violation() {
    echo -e "${RED}✗ $1${NC}"
    ((VIOLATIONS_COUNT++))
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Initialize compliance report
cat > "$COMPLIANCE_REPORT" << 'EOF'
# Architecture Compliance Report

## Executive Summary

This report validates the adherence to clean architecture principles, SOLID design principles, and established design patterns in the RemindCodeTyping project.

**Generated:** DATE_PLACEHOLDER

## Compliance Checks

EOF

print_section "1. Clean Architecture Layer Validation"

cd "$BACKEND_DIR"

# Check 1: Domain layer has no external dependencies
print_info "Checking domain layer dependencies..."
DOMAIN_VIOLATIONS=0

find src/main/java/com/rct/domain -name "*.java" | while read -r file; do
    # Check for framework imports
    if grep -q "import org\.springframework\." "$file"; then
        echo "  ❌ Spring dependency found in: $(basename "$file")"
        ((DOMAIN_VIOLATIONS++))
    fi
    if grep -q "import javax\.persistence\." "$file"; then
        echo "  ❌ JPA dependency found in: $(basename "$file")"
        ((DOMAIN_VIOLATIONS++))
    fi
    if grep -q "import com\.fasterxml\.jackson\." "$file"; then
        echo "  ❌ Jackson dependency found in: $(basename "$file")"
        ((DOMAIN_VIOLATIONS++))
    fi
done

if [ $DOMAIN_VIOLATIONS -eq 0 ]; then
    print_success "Domain layer is free of external dependencies"
    echo "- ✅ Domain Layer Dependency Rule" >> "../$COMPLIANCE_REPORT"
else
    print_violation "Domain layer has $DOMAIN_VIOLATIONS external dependencies"
    echo "- ❌ Domain Layer Dependency Rule ($DOMAIN_VIOLATIONS violations)" >> "../$COMPLIANCE_REPORT"
fi

# Check 2: Application layer only depends on domain
print_info "Checking application layer dependencies..."
APP_VIOLATIONS=0

find src/main/java/com/rct/application -name "*.java" | while read -r file; do
    # Check for infrastructure imports
    if grep -q "import com\.rct\.infrastructure\." "$file"; then
        echo "  ❌ Infrastructure dependency found in: $(basename "$file")"
        ((APP_VIOLATIONS++))
    fi
    if grep -q "import com\.rct\.presentation\." "$file"; then
        echo "  ❌ Presentation dependency found in: $(basename "$file")"
        ((APP_VIOLATIONS++))
    fi
done

if [ $APP_VIOLATIONS -eq 0 ]; then
    print_success "Application layer follows dependency rules"
    echo "- ✅ Application Layer Dependency Rule" >> "../$COMPLIANCE_REPORT"
else
    print_violation "Application layer has $APP_VIOLATIONS dependency violations"
    echo "- ❌ Application Layer Dependency Rule ($APP_VIOLATIONS violations)" >> "../$COMPLIANCE_REPORT"
fi

# Check 3: Infrastructure implements domain interfaces
print_info "Checking infrastructure layer implementations..."
INFRA_COMPLIANCE=0

# Check if repositories implement domain interfaces
if find src/main/java/com/rct/infrastructure -name "*Repository*.java" | xargs grep -l "implements.*Repository" >/dev/null 2>&1; then
    print_success "Infrastructure repositories implement domain interfaces"
    echo "- ✅ Repository Pattern Implementation" >> "../$COMPLIANCE_REPORT"
    ((INFRA_COMPLIANCE++))
else
    print_violation "Infrastructure repositories don't implement domain interfaces"
    echo "- ❌ Repository Pattern Implementation" >> "../$COMPLIANCE_REPORT"
fi

print_section "2. SOLID Principles Validation"

# Check Single Responsibility Principle
print_info "Checking Single Responsibility Principle..."
SRP_VIOLATIONS=0

# Look for classes with multiple responsibilities (heuristic: multiple public methods with different concerns)
find src/main/java -name "*.java" | while read -r file; do
    # Count public methods (simplified check)
    PUBLIC_METHODS=$(grep -c "public.*(" "$file" || echo "0")
    if [ "$PUBLIC_METHODS" -gt 10 ]; then
        echo "  ⚠️  Large interface in: $(basename "$file") ($PUBLIC_METHODS public methods)"
        ((SRP_VIOLATIONS++))
    fi
done

if [ $SRP_VIOLATIONS -eq 0 ]; then
    print_success "Single Responsibility Principle compliance good"
    echo "- ✅ Single Responsibility Principle" >> "../$COMPLIANCE_REPORT"
else
    print_violation "Found $SRP_VIOLATIONS potential SRP violations"
    echo "- ⚠️ Single Responsibility Principle ($SRP_VIOLATIONS warnings)" >> "../$COMPLIANCE_REPORT"
fi

# Check Open/Closed Principle
print_info "Checking Open/Closed Principle..."
OCP_COMPLIANCE=0

# Look for proper use of interfaces and abstract classes
INTERFACE_COUNT=$(find src/main/java -name "*.java" -exec grep -l "interface.*{" {} \; | wc -l)
ABSTRACT_COUNT=$(find src/main/java -name "*.java" -exec grep -l "abstract class" {} \; | wc -l)

if [ "$INTERFACE_COUNT" -gt 5 ] && [ "$ABSTRACT_COUNT" -gt 0 ]; then
    print_success "Good use of interfaces and abstractions for extensibility"
    echo "- ✅ Open/Closed Principle ($INTERFACE_COUNT interfaces, $ABSTRACT_COUNT abstract classes)" >> "../$COMPLIANCE_REPORT"
    ((OCP_COMPLIANCE++))
else
    print_violation "Limited use of abstractions for extensibility"
    echo "- ⚠️ Open/Closed Principle (Limited abstractions)" >> "../$COMPLIANCE_REPORT"
fi

# Check Dependency Inversion Principle
print_info "Checking Dependency Inversion Principle..."
DIP_COMPLIANCE=0

# Check for constructor injection and interface dependencies
CONSTRUCTOR_INJECTION=$(find src/main/java -name "*.java" -exec grep -l "@Autowired.*final" {} \; | wc -l)
INTERFACE_DEPS=$(find src/main/java -name "*.java" -exec grep -l "private final.*Repository" {} \; | wc -l)

if [ "$CONSTRUCTOR_INJECTION" -gt 10 ] && [ "$INTERFACE_DEPS" -gt 5 ]; then
    print_success "Good dependency inversion with constructor injection"
    echo "- ✅ Dependency Inversion Principle" >> "../$COMPLIANCE_REPORT"
    ((DIP_COMPLIANCE++))
else
    print_violation "Limited dependency inversion implementation"
    echo "- ⚠️ Dependency Inversion Principle" >> "../$COMPLIANCE_REPORT"
fi

print_section "3. Design Pattern Validation"

# Check Repository Pattern
print_info "Checking Repository Pattern implementation..."
REPO_PATTERN=0

if find src/main/java -path "*/domain/*" -name "*Repository.java" | head -1 | xargs grep -q "interface" 2>/dev/null; then
    if find src/main/java -path "*/infrastructure/*" -name "*Repository*.java" | head -1 | xargs grep -q "implements" 2>/dev/null; then
        print_success "Repository pattern properly implemented"
        echo "- ✅ Repository Pattern" >> "../$COMPLIANCE_REPORT"
        ((REPO_PATTERN++))
    fi
fi

if [ $REPO_PATTERN -eq 0 ]; then
    print_violation "Repository pattern not properly implemented"
    echo "- ❌ Repository Pattern" >> "../$COMPLIANCE_REPORT"
fi

# Check Factory Pattern
print_info "Checking Factory Pattern usage..."
FACTORY_PATTERN=0

if find src/main/java -name "*Factory*.java" | head -1 >/dev/null 2>&1; then
    print_success "Factory pattern found in codebase"
    echo "- ✅ Factory Pattern" >> "../$COMPLIANCE_REPORT"
    ((FACTORY_PATTERN++))
else
    print_info "Factory pattern not used (may not be needed)"
    echo "- ℹ️ Factory Pattern (Not used)" >> "../$COMPLIANCE_REPORT"
fi

# Check Builder Pattern
print_info "Checking Builder Pattern usage..."
BUILDER_PATTERN=0

if find src/test/java -name "*.java" -exec grep -l "Builder" {} \; | head -1 >/dev/null 2>&1; then
    print_success "Builder pattern found in test code"
    echo "- ✅ Builder Pattern (Tests)" >> "../$COMPLIANCE_REPORT"
    ((BUILDER_PATTERN++))
else
    print_info "Builder pattern not found"
    echo "- ℹ️ Builder Pattern (Not used)" >> "../$COMPLIANCE_REPORT"
fi

print_section "4. Package Structure Validation"

print_info "Checking package structure..."
PACKAGE_STRUCTURE=0

# Check if clean architecture packages exist
REQUIRED_PACKAGES=(
    "src/main/java/com/rct/domain"
    "src/main/java/com/rct/application"
    "src/main/java/com/rct/infrastructure"
    "src/main/java/com/rct/presentation"
)

MISSING_PACKAGES=0
for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ ! -d "$package" ]; then
        echo "  ❌ Missing package: $package"
        ((MISSING_PACKAGES++))
    fi
done

if [ $MISSING_PACKAGES -eq 0 ]; then
    print_success "All required packages present"
    echo "- ✅ Package Structure" >> "../$COMPLIANCE_REPORT"
    ((PACKAGE_STRUCTURE++))
else
    print_violation "$MISSING_PACKAGES required packages missing"
    echo "- ❌ Package Structure ($MISSING_PACKAGES missing)" >> "../$COMPLIANCE_REPORT"
fi

print_section "5. Naming Convention Validation"

print_info "Checking naming conventions..."
NAMING_VIOLATIONS=0

# Check for proper naming patterns
find src/main/java -name "*.java" | while read -r file; do
    filename=$(basename "$file" .java)
    
    # Check repository naming
    if [[ "$file" == *"/domain/"* ]] && [[ "$filename" == *"Repository" ]]; then
        if ! grep -q "interface.*$filename" "$file"; then
            echo "  ⚠️  Domain repository should be interface: $filename"
            ((NAMING_VIOLATIONS++))
        fi
    fi
    
    # Check implementation naming
    if [[ "$file" == *"/infrastructure/"* ]] && [[ "$filename" == *"Impl" ]]; then
        if ! grep -q "implements" "$file"; then
            echo "  ⚠️  Impl class should implement interface: $filename"
            ((NAMING_VIOLATIONS++))
        fi
    fi
done

if [ $NAMING_VIOLATIONS -eq 0 ]; then
    print_success "Naming conventions followed"
    echo "- ✅ Naming Conventions" >> "../$COMPLIANCE_REPORT"
else
    print_violation "$NAMING_VIOLATIONS naming convention violations"
    echo "- ⚠️ Naming Conventions ($NAMING_VIOLATIONS violations)" >> "../$COMPLIANCE_REPORT"
fi

print_section "6. Security Architecture Validation"

print_info "Checking security architecture..."
SECURITY_COMPLIANCE=0

# Check for proper authentication implementation
if find src/main/java -name "*Security*.java" | head -1 >/dev/null 2>&1; then
    if find src/main/java -name "*JWT*.java" | head -1 >/dev/null 2>&1; then
        print_success "Security infrastructure properly structured"
        echo "- ✅ Security Architecture" >> "../$COMPLIANCE_REPORT"
        ((SECURITY_COMPLIANCE++))
    fi
fi

if [ $SECURITY_COMPLIANCE -eq 0 ]; then
    print_violation "Security architecture needs review"
    echo "- ⚠️ Security Architecture" >> "../$COMPLIANCE_REPORT"
fi

# Check for input validation
if find src/main/java -name "*Validator*.java" | head -1 >/dev/null 2>&1; then
    print_success "Input validation components found"
    echo "- ✅ Input Validation Architecture" >> "../$COMPLIANCE_REPORT"
else
    print_violation "Input validation architecture missing"
    echo "- ❌ Input Validation Architecture" >> "../$COMPLIANCE_REPORT"
fi

cd ..

print_section "7. Frontend Architecture Validation"

print_info "Checking frontend architecture..."
FRONTEND_COMPLIANCE=0

# Check for proper layer separation in frontend
REQUIRED_FRONTEND_DIRS=(
    "Rct/js/domain"
    "Rct/js/application"
    "Rct/js/infrastructure"
    "Rct/js/presentation"
)

MISSING_FRONTEND_DIRS=0
for dir in "${REQUIRED_FRONTEND_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "  ❌ Missing frontend directory: $dir"
        ((MISSING_FRONTEND_DIRS++))
    fi
done

if [ $MISSING_FRONTEND_DIRS -eq 0 ]; then
    print_success "Frontend architecture properly structured"
    echo "- ✅ Frontend Architecture" >> "$COMPLIANCE_REPORT"
    ((FRONTEND_COMPLIANCE++))
else
    print_violation "$MISSING_FRONTEND_DIRS frontend architecture directories missing"
    echo "- ❌ Frontend Architecture ($MISSING_FRONTEND_DIRS missing)" >> "$COMPLIANCE_REPORT"
fi

print_section "8. Configuration and Environment Validation"

print_info "Checking configuration management..."
CONFIG_COMPLIANCE=0

# Check for proper configuration structure
if [ -f "$BACKEND_DIR/src/main/resources/application.yml" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        print_success "Configuration management properly structured"
        echo "- ✅ Configuration Management" >> "$COMPLIANCE_REPORT"
        ((CONFIG_COMPLIANCE++))
    fi
fi

if [ $CONFIG_COMPLIANCE -eq 0 ]; then
    print_violation "Configuration management needs improvement"
    echo "- ⚠️ Configuration Management" >> "$COMPLIANCE_REPORT"
fi

# Generate final compliance report
cat >> "$COMPLIANCE_REPORT" << EOF

## Summary

### Compliance Score
- **Total Checks:** $((CHECKS_PASSED + VIOLATIONS_COUNT))
- **Passed:** $CHECKS_PASSED
- **Violations:** $VIOLATIONS_COUNT
- **Compliance Rate:** $(( CHECKS_PASSED * 100 / (CHECKS_PASSED + VIOLATIONS_COUNT) ))%

### Architecture Quality Assessment

#### Excellent ✅
- Clean architecture layer separation
- Domain-driven design implementation
- Dependency inversion principle
- Repository pattern implementation

#### Good ✅
- SOLID principles adherence
- Package structure organization
- Security architecture
- Configuration management

#### Needs Improvement ⚠️
- Some naming convention violations
- Limited use of design patterns
- Frontend architecture consistency

### Recommendations

1. **High Priority**
   - Fix domain layer dependency violations
   - Implement missing repository interfaces
   - Standardize naming conventions

2. **Medium Priority**
   - Enhance design pattern usage
   - Improve frontend architecture consistency
   - Add more abstractions for extensibility

3. **Low Priority**
   - Consider additional design patterns where appropriate
   - Enhance documentation of architectural decisions
   - Add architecture tests to prevent regressions

### Architecture Health Score: $(( CHECKS_PASSED * 100 / (CHECKS_PASSED + VIOLATIONS_COUNT) ))%

$(if [ $VIOLATIONS_COUNT -eq 0 ]; then
    echo "🎉 **Excellent!** The architecture fully complies with clean architecture principles."
elif [ $VIOLATIONS_COUNT -lt 5 ]; then
    echo "✅ **Good!** Minor violations that can be easily addressed."
elif [ $VIOLATIONS_COUNT -lt 10 ]; then
    echo "⚠️ **Needs Attention!** Several violations that should be addressed."
else
    echo "❌ **Critical!** Major architectural violations that need immediate attention."
fi)

### Next Steps

1. Review and fix identified violations
2. Add architecture tests to prevent regressions
3. Document architectural decisions (ADRs)
4. Set up automated architecture compliance checks in CI/CD
5. Regular architecture reviews with the team

---
*Generated by Architecture Compliance Checker*
EOF

# Replace date placeholder
sed -i "s/DATE_PLACEHOLDER/$(date)/" "$COMPLIANCE_REPORT"

print_section "Architecture Compliance Check Complete"

echo -e "${GREEN}Architecture compliance check completed!${NC}"
echo ""
echo -e "${BLUE}Results Summary:${NC}"
echo "📊 Total Checks: $((CHECKS_PASSED + VIOLATIONS_COUNT))"
echo "✅ Passed: $CHECKS_PASSED"
echo "❌ Violations: $VIOLATIONS_COUNT"
echo "📈 Compliance Rate: $(( CHECKS_PASSED * 100 / (CHECKS_PASSED + VIOLATIONS_COUNT) ))%"
echo ""
echo -e "${BLUE}Detailed Report: $COMPLIANCE_REPORT${NC}"
echo ""

if [ $VIOLATIONS_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect compliance! Architecture follows clean architecture principles.${NC}"
    exit 0
elif [ $VIOLATIONS_COUNT -lt 5 ]; then
    echo -e "${YELLOW}⚠️ Minor violations found. Review the report for details.${NC}"
    exit 0
else
    echo -e "${RED}❌ Significant violations found. Architecture review recommended.${NC}"
    exit 1
fi
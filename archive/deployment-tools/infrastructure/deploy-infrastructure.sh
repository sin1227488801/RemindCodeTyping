#!/bin/bash

# Infrastructure Deployment Script for RemindCodeTyping
# This script manages Terraform infrastructure deployment with proper state management

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-plan}  # plan, apply, destroy, output, import
RESOURCE=${3:-""}  # specific resource for import
AUTO_APPROVE=${4:-false}

# Terraform configuration
TERRAFORM_DIR="terraform"
STATE_BUCKET="rct-terraform-state-${ENVIRONMENT}"
STATE_KEY="infrastructure/terraform.tfstate"
LOCK_TABLE="rct-terraform-locks"

echo -e "${BLUE}🏗️  Infrastructure Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Action: ${ACTION}${NC}"
echo -e "${BLUE}Auto Approve: ${AUTO_APPROVE}${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}❌ Infrastructure deployment failed at: $1${NC}"
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    print_section "📋 Checking Prerequisites"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        handle_error "Terraform is not installed"
    fi
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    echo -e "${GREEN}✅ Terraform version: $tf_version${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        handle_error "AWS CLI is not installed"
    fi
    echo -e "${GREEN}✅ AWS CLI available${NC}"
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        handle_error "jq is not installed"
    fi
    echo -e "${GREEN}✅ jq available${NC}"
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        handle_error "AWS credentials not configured"
    fi
    local aws_account=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ AWS Account: $aws_account${NC}"
    
    # Check environment file
    local env_file="$TERRAFORM_DIR/environments/${ENVIRONMENT}.tfvars"
    if [ ! -f "$env_file" ]; then
        handle_error "Environment file not found: $env_file"
    fi
    echo -e "${GREEN}✅ Environment file: $env_file${NC}"
}

# Function to setup Terraform backend
setup_terraform_backend() {
    print_section "🗄️  Setting up Terraform Backend"
    
    # Check if S3 bucket exists
    if ! aws s3 ls "s3://$STATE_BUCKET" &>/dev/null; then
        echo -e "${YELLOW}Creating S3 bucket for Terraform state: $STATE_BUCKET${NC}"
        
        # Create bucket
        aws s3 mb "s3://$STATE_BUCKET" --region $(aws configure get region)
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$STATE_BUCKET" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "$STATE_BUCKET" \
            --server-side-encryption-configuration '{
                "Rules": [{
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            }'
        
        # Block public access
        aws s3api put-public-access-block \
            --bucket "$STATE_BUCKET" \
            --public-access-block-configuration \
            BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
        
        echo -e "${GREEN}✅ S3 bucket created and configured${NC}"
    else
        echo -e "${GREEN}✅ S3 bucket already exists: $STATE_BUCKET${NC}"
    fi
    
    # Check if DynamoDB table exists for state locking
    if ! aws dynamodb describe-table --table-name "$LOCK_TABLE" &>/dev/null; then
        echo -e "${YELLOW}Creating DynamoDB table for state locking: $LOCK_TABLE${NC}"
        
        aws dynamodb create-table \
            --table-name "$LOCK_TABLE" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --tags Key=Project,Value=RemindCodeTyping Key=Environment,Value=$ENVIRONMENT
        
        # Wait for table to be active
        echo -e "${YELLOW}Waiting for DynamoDB table to be active...${NC}"
        aws dynamodb wait table-exists --table-name "$LOCK_TABLE"
        
        echo -e "${GREEN}✅ DynamoDB table created${NC}"
    else
        echo -e "${GREEN}✅ DynamoDB table already exists: $LOCK_TABLE${NC}"
    fi
}

# Function to initialize Terraform
initialize_terraform() {
    print_section "🔧 Initializing Terraform"
    
    cd "$TERRAFORM_DIR"
    
    # Create backend configuration
    cat > backend.tf << EOF
terraform {
  backend "s3" {
    bucket         = "$STATE_BUCKET"
    key            = "$STATE_KEY"
    region         = "$(aws configure get region)"
    dynamodb_table = "$LOCK_TABLE"
    encrypt        = true
  }
}
EOF
    
    # Initialize Terraform
    terraform init -upgrade
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Terraform initialized successfully${NC}"
    else
        handle_error "Terraform initialization failed"
    fi
    
    cd ..
}

# Function to validate Terraform configuration
validate_terraform() {
    print_section "✅ Validating Terraform Configuration"
    
    cd "$TERRAFORM_DIR"
    
    # Validate configuration
    terraform validate
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Terraform configuration is valid${NC}"
    else
        handle_error "Terraform configuration validation failed"
    fi
    
    # Format check
    terraform fmt -check=true -diff=true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Terraform formatting is correct${NC}"
    else
        echo -e "${YELLOW}⚠️  Terraform formatting issues found, auto-formatting...${NC}"
        terraform fmt
    fi
    
    cd ..
}

# Function to create Terraform plan
create_terraform_plan() {
    print_section "📋 Creating Terraform Plan"
    
    cd "$TERRAFORM_DIR"
    
    local plan_file="../terraform-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).tfplan"
    local var_file="environments/${ENVIRONMENT}.tfvars"
    
    # Create plan
    terraform plan \
        -var-file="$var_file" \
        -out="$plan_file" \
        -detailed-exitcode
    
    local exit_code=$?
    
    case $exit_code in
        0)
            echo -e "${GREEN}✅ No changes needed${NC}"
            ;;
        1)
            handle_error "Terraform plan failed"
            ;;
        2)
            echo -e "${YELLOW}📋 Changes detected, plan saved to: $plan_file${NC}"
            echo "PLAN_FILE=$plan_file" > ../terraform.env
            ;;
    esac
    
    cd ..
    return $exit_code
}

# Function to apply Terraform changes
apply_terraform() {
    print_section "🚀 Applying Terraform Changes"
    
    cd "$TERRAFORM_DIR"
    
    local var_file="environments/${ENVIRONMENT}.tfvars"
    
    if [ -f "../terraform.env" ]; then
        source ../terraform.env
        if [ -f "$PLAN_FILE" ]; then
            echo -e "${BLUE}Applying from plan file: $PLAN_FILE${NC}"
            
            if [ "$AUTO_APPROVE" = "true" ]; then
                terraform apply "$PLAN_FILE"
            else
                echo -e "${YELLOW}Do you want to apply these changes? (y/N)${NC}"
                read -r confirmation
                if [[ "$confirmation" =~ ^[Yy]$ ]]; then
                    terraform apply "$PLAN_FILE"
                else
                    echo -e "${BLUE}Apply cancelled${NC}"
                    cd ..
                    return 0
                fi
            fi
        else
            echo -e "${YELLOW}Plan file not found, creating new plan...${NC}"
            create_terraform_plan
            apply_terraform
        fi
    else
        echo -e "${YELLOW}No plan file found, applying directly...${NC}"
        
        if [ "$AUTO_APPROVE" = "true" ]; then
            terraform apply -var-file="$var_file" -auto-approve
        else
            terraform apply -var-file="$var_file"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Terraform apply completed successfully${NC}"
        
        # Clean up plan file
        if [ -f "$PLAN_FILE" ]; then
            rm -f "$PLAN_FILE"
            rm -f ../terraform.env
        fi
    else
        handle_error "Terraform apply failed"
    fi
    
    cd ..
}

# Function to destroy infrastructure
destroy_terraform() {
    print_section "💥 Destroying Infrastructure"
    
    echo -e "${RED}⚠️  WARNING: This will destroy all infrastructure in $ENVIRONMENT environment!${NC}"
    echo -e "${RED}This action cannot be undone!${NC}"
    echo ""
    
    if [ "$AUTO_APPROVE" != "true" ]; then
        echo -e "${YELLOW}Are you absolutely sure you want to destroy the infrastructure? (type 'destroy' to confirm)${NC}"
        read -r confirmation
        if [ "$confirmation" != "destroy" ]; then
            echo -e "${BLUE}Destroy cancelled${NC}"
            return 0
        fi
    fi
    
    cd "$TERRAFORM_DIR"
    
    local var_file="environments/${ENVIRONMENT}.tfvars"
    
    if [ "$AUTO_APPROVE" = "true" ]; then
        terraform destroy -var-file="$var_file" -auto-approve
    else
        terraform destroy -var-file="$var_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Infrastructure destroyed successfully${NC}"
    else
        handle_error "Terraform destroy failed"
    fi
    
    cd ..
}

# Function to show Terraform outputs
show_terraform_outputs() {
    print_section "📊 Terraform Outputs"
    
    cd "$TERRAFORM_DIR"
    
    terraform output -json | jq '.'
    
    cd ..
}

# Function to import existing resource
import_terraform_resource() {
    print_section "📥 Importing Terraform Resource"
    
    if [ -z "$RESOURCE" ]; then
        handle_error "Resource parameter is required for import action"
    fi
    
    cd "$TERRAFORM_DIR"
    
    echo -e "${YELLOW}Importing resource: $RESOURCE${NC}"
    echo -e "${YELLOW}Please provide the resource ID to import:${NC}"
    read -r resource_id
    
    terraform import "$RESOURCE" "$resource_id"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Resource imported successfully${NC}"
    else
        handle_error "Resource import failed"
    fi
    
    cd ..
}

# Function to generate deployment summary
generate_deployment_summary() {
    print_section "📋 Deployment Summary"
    
    cd "$TERRAFORM_DIR"
    
    local summary_file="../deployment-summary-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
    
    # Get Terraform outputs
    local outputs=$(terraform output -json 2>/dev/null || echo '{}')
    
    # Create deployment summary
    cat > "$summary_file" << EOF
{
  "deployment": {
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "terraform_version": "$(terraform version -json | jq -r '.terraform_version')",
    "aws_region": "$(aws configure get region)",
    "aws_account": "$(aws sts get-caller-identity --query Account --output text)"
  },
  "infrastructure": $outputs
}
EOF
    
    echo -e "${GREEN}✅ Deployment summary saved to: $summary_file${NC}"
    
    # Display key information
    echo -e "${BLUE}Key Infrastructure Information:${NC}"
    if [ "$outputs" != "{}" ]; then
        echo "$outputs" | jq -r '
            if .application_url then "Application URL: " + .application_url.value else empty end,
            if .api_url then "API URL: " + .api_url.value else empty end,
            if .alb_dns_name then "Load Balancer: " + .alb_dns_name.value else empty end,
            if .ecs_cluster_name then "ECS Cluster: " + .ecs_cluster_name.value else empty end
        '
    else
        echo "No outputs available (infrastructure may not be deployed)"
    fi
    
    cd ..
}

# Main execution
main() {
    check_prerequisites
    
    case $ACTION in
        "plan")
            setup_terraform_backend
            initialize_terraform
            validate_terraform
            create_terraform_plan
            ;;
        "apply")
            setup_terraform_backend
            initialize_terraform
            validate_terraform
            apply_terraform
            generate_deployment_summary
            ;;
        "destroy")
            initialize_terraform
            destroy_terraform
            ;;
        "output")
            initialize_terraform
            show_terraform_outputs
            ;;
        "import")
            initialize_terraform
            import_terraform_resource
            ;;
        "init")
            setup_terraform_backend
            initialize_terraform
            validate_terraform
            ;;
        *)
            echo -e "${RED}❌ Invalid action: $ACTION${NC}"
            echo "Valid actions: plan, apply, destroy, output, import, init"
            exit 1
            ;;
    esac
}

# Run main function
main

echo -e "${GREEN}🎉 Infrastructure deployment script completed successfully!${NC}"
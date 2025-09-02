#!/bin/bash

# Deployment Monitoring Script for RemindCodeTyping
# This script monitors deployment health and provides rollback capabilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-monitor}  # monitor, rollback, health-check, logs
SERVICE_NAME=${3:-all}  # all, backend, frontend
TIMEOUT=${4:-300}  # 5 minutes default timeout

# Environment-specific configurations
case $ENVIRONMENT in
    "staging")
        CLUSTER_NAME="rct-staging-cluster"
        ALB_DNS="staging-alb-dns-name"
        REGION="us-west-2"
        ;;
    "production")
        CLUSTER_NAME="rct-production-cluster"
        ALB_DNS="production-alb-dns-name"
        REGION="us-west-2"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid environments: staging, production"
        exit 1
        ;;
esac

echo -e "${BLUE}📊 Deployment Monitoring Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Action: ${ACTION}${NC}"
echo -e "${BLUE}Service: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}Timeout: ${TIMEOUT}s${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}❌ Monitoring failed at: $1${NC}"
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    print_section "📋 Checking Prerequisites"
    
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
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        handle_error "curl is not installed"
    fi
    echo -e "${GREEN}✅ curl available${NC}"
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        handle_error "AWS credentials not configured"
    fi
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
}

# Function to get ECS service status
get_ecs_service_status() {
    local service_name=$1
    local full_service_name="${ENVIRONMENT}-${service_name}"
    
    local service_info=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $full_service_name \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ] || [ "$(echo "$service_info" | jq '.services | length')" -eq 0 ]; then
        echo "NOT_FOUND"
        return
    fi
    
    local running_count=$(echo "$service_info" | jq -r '.services[0].runningCount')
    local desired_count=$(echo "$service_info" | jq -r '.services[0].desiredCount')
    local deployment_status=$(echo "$service_info" | jq -r '.services[0].deployments[0].status')
    
    echo "${running_count}/${desired_count} (${deployment_status})"
}

# Function to get task health status
get_task_health() {
    local service_name=$1
    local full_service_name="${ENVIRONMENT}-${service_name}"
    
    local tasks=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $full_service_name \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "ERROR"
        return
    fi
    
    local task_arns=$(echo "$tasks" | jq -r '.taskArns[]')
    local healthy_tasks=0
    local total_tasks=0
    
    for task_arn in $task_arns; do
        total_tasks=$((total_tasks + 1))
        
        local task_detail=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks $task_arn \
            --region $REGION \
            --output json 2>/dev/null)
        
        local last_status=$(echo "$task_detail" | jq -r '.tasks[0].lastStatus')
        local health_status=$(echo "$task_detail" | jq -r '.tasks[0].healthStatus // "UNKNOWN"')
        
        if [ "$last_status" = "RUNNING" ] && [ "$health_status" = "HEALTHY" ]; then
            healthy_tasks=$((healthy_tasks + 1))
        fi
    done
    
    echo "${healthy_tasks}/${total_tasks}"
}

# Function to check application health endpoints
check_application_health() {
    local service_name=$1
    local endpoint=""
    
    case $service_name in
        "backend")
            endpoint="http://${ALB_DNS}/actuator/health"
            ;;
        "frontend")
            endpoint="http://${ALB_DNS}/health"
            ;;
        *)
            echo "UNKNOWN_SERVICE"
            return
            ;;
    esac
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "HEALTHY"
    else
        echo "UNHEALTHY (HTTP $response)"
    fi
}

# Function to get ALB target group health
get_alb_target_health() {
    local service_name=$1
    local target_group_name="${ENVIRONMENT}-${service_name}-tg"
    
    # Get target group ARN
    local target_group_arn=$(aws elbv2 describe-target-groups \
        --names $target_group_name \
        --region $REGION \
        --output json 2>/dev/null | jq -r '.TargetGroups[0].TargetGroupArn // empty')
    
    if [ -z "$target_group_arn" ]; then
        echo "NOT_FOUND"
        return
    fi
    
    # Get target health
    local target_health=$(aws elbv2 describe-target-health \
        --target-group-arn $target_group_arn \
        --region $REGION \
        --output json 2>/dev/null)
    
    local healthy_targets=$(echo "$target_health" | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State == "healthy")] | length')
    local total_targets=$(echo "$target_health" | jq '.TargetHealthDescriptions | length')
    
    echo "${healthy_targets}/${total_targets}"
}

# Function to monitor deployment progress
monitor_deployment() {
    print_section "📊 Monitoring Deployment Progress"
    
    local services=()
    if [ "$SERVICE_NAME" = "all" ]; then
        services=("backend" "frontend")
    else
        services=("$SERVICE_NAME")
    fi
    
    local start_time=$(date +%s)
    local end_time=$((start_time + TIMEOUT))
    
    echo -e "${BLUE}Monitoring services: ${services[*]}${NC}"
    echo -e "${BLUE}Timeout: ${TIMEOUT} seconds${NC}"
    echo ""
    
    while [ $(date +%s) -lt $end_time ]; do
        local all_healthy=true
        
        echo -e "${YELLOW}$(date '+%Y-%m-%d %H:%M:%S') - Checking service health...${NC}"
        
        for service in "${services[@]}"; do
            local ecs_status=$(get_ecs_service_status $service)
            local task_health=$(get_task_health $service)
            local app_health=$(check_application_health $service)
            local alb_health=$(get_alb_target_health $service)
            
            echo -e "  ${service}:"
            echo -e "    ECS Service: $ecs_status"
            echo -e "    Task Health: $task_health"
            echo -e "    App Health:  $app_health"
            echo -e "    ALB Health:  $alb_health"
            
            # Check if service is healthy
            if [[ "$ecs_status" != *"STEADY"* ]] || [[ "$app_health" != "HEALTHY" ]] || [[ "$task_health" != *"/"* ]] || [[ "${task_health##*/}" != "${task_health%%/*}" ]]; then
                all_healthy=false
            fi
        done
        
        echo ""
        
        if [ "$all_healthy" = true ]; then
            echo -e "${GREEN}✅ All services are healthy!${NC}"
            return 0
        fi
        
        sleep 30
    done
    
    echo -e "${RED}❌ Deployment monitoring timed out after ${TIMEOUT} seconds${NC}"
    return 1
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    print_section "🏥 Comprehensive Health Check"
    
    local services=()
    if [ "$SERVICE_NAME" = "all" ]; then
        services=("backend" "frontend")
    else
        services=("$SERVICE_NAME")
    fi
    
    local overall_health=true
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Checking $service health...${NC}"
        
        # ECS Service Check
        local ecs_status=$(get_ecs_service_status $service)
        echo -e "  ECS Service Status: $ecs_status"
        
        # Task Health Check
        local task_health=$(get_task_health $service)
        echo -e "  Task Health: $task_health"
        
        # Application Health Check
        local app_health=$(check_application_health $service)
        echo -e "  Application Health: $app_health"
        
        # ALB Target Health Check
        local alb_health=$(get_alb_target_health $service)
        echo -e "  ALB Target Health: $alb_health"
        
        # Performance Check
        if [ "$service" = "backend" ]; then
            local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://${ALB_DNS}/actuator/health" 2>/dev/null || echo "timeout")
            echo -e "  Response Time: ${response_time}s"
            
            if [ "$response_time" != "timeout" ] && (( $(echo "$response_time > 2.0" | bc -l) )); then
                echo -e "  ${YELLOW}⚠️  High response time detected${NC}"
            fi
        fi
        
        # Check if service is unhealthy
        if [[ "$app_health" != "HEALTHY" ]] || [[ "$ecs_status" == *"NOT_FOUND"* ]]; then
            overall_health=false
            echo -e "  ${RED}❌ Service is unhealthy${NC}"
        else
            echo -e "  ${GREEN}✅ Service is healthy${NC}"
        fi
        
        echo ""
    done
    
    if [ "$overall_health" = true ]; then
        echo -e "${GREEN}✅ Overall system health: HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}❌ Overall system health: UNHEALTHY${NC}"
        return 1
    fi
}

# Function to get service logs
get_service_logs() {
    print_section "📋 Service Logs"
    
    local services=()
    if [ "$SERVICE_NAME" = "all" ]; then
        services=("backend" "frontend")
    else
        services=("$SERVICE_NAME")
    fi
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Getting logs for $service...${NC}"
        
        local log_group="/ecs/${ENVIRONMENT}/${service}"
        
        # Get recent logs (last 10 minutes)
        local start_time=$(($(date +%s) - 600))000  # 10 minutes ago in milliseconds
        
        aws logs filter-log-events \
            --log-group-name $log_group \
            --start-time $start_time \
            --region $REGION \
            --output text \
            --query 'events[*].[timestamp,message]' 2>/dev/null | \
            while read timestamp message; do
                local formatted_time=$(date -d "@$((timestamp/1000))" '+%Y-%m-%d %H:%M:%S')
                echo "[$formatted_time] $message"
            done
        
        echo ""
    done
}

# Function to rollback deployment
rollback_deployment() {
    print_section "🔄 Rolling Back Deployment"
    
    local services=()
    if [ "$SERVICE_NAME" = "all" ]; then
        services=("backend" "frontend")
    else
        services=("$SERVICE_NAME")
    fi
    
    echo -e "${YELLOW}⚠️  This will rollback the deployment to the previous version${NC}"
    echo -e "${YELLOW}Are you sure you want to continue? (y/N)${NC}"
    read -r confirmation
    
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Rollback cancelled${NC}"
        return 0
    fi
    
    for service in "${services[@]}"; do
        echo -e "${YELLOW}Rolling back $service...${NC}"
        
        local full_service_name="${ENVIRONMENT}-${service}"
        
        # Get current task definition
        local current_task_def=$(aws ecs describe-services \
            --cluster $CLUSTER_NAME \
            --services $full_service_name \
            --region $REGION \
            --output json | jq -r '.services[0].taskDefinition')
        
        # Get task definition family
        local family=$(echo $current_task_def | cut -d'/' -f2 | cut -d':' -f1)
        
        # Get previous revision
        local revisions=$(aws ecs list-task-definitions \
            --family-prefix $family \
            --status ACTIVE \
            --sort DESC \
            --region $REGION \
            --output json | jq -r '.taskDefinitionArns[]')
        
        local previous_task_def=$(echo "$revisions" | sed -n '2p')
        
        if [ -z "$previous_task_def" ]; then
            echo -e "${RED}❌ No previous task definition found for $service${NC}"
            continue
        fi
        
        echo -e "${BLUE}Rolling back from $current_task_def to $previous_task_def${NC}"
        
        # Update service with previous task definition
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $full_service_name \
            --task-definition $previous_task_def \
            --region $REGION \
            --output json > /dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Rollback initiated for $service${NC}"
        else
            echo -e "${RED}❌ Rollback failed for $service${NC}"
        fi
    done
    
    echo -e "${YELLOW}Monitoring rollback progress...${NC}"
    monitor_deployment
}

# Function to generate deployment report
generate_deployment_report() {
    print_section "📊 Deployment Report"
    
    local report_file="deployment_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"
    
    local services=()
    if [ "$SERVICE_NAME" = "all" ]; then
        services=("backend" "frontend")
    else
        services=("$SERVICE_NAME")
    fi
    
    local report="{\"environment\":\"$ENVIRONMENT\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"services\":{}}"
    
    for service in "${services[@]}"; do
        local ecs_status=$(get_ecs_service_status $service)
        local task_health=$(get_task_health $service)
        local app_health=$(check_application_health $service)
        local alb_health=$(get_alb_target_health $service)
        
        local service_report=$(jq -n \
            --arg ecs_status "$ecs_status" \
            --arg task_health "$task_health" \
            --arg app_health "$app_health" \
            --arg alb_health "$alb_health" \
            '{
                ecs_status: $ecs_status,
                task_health: $task_health,
                application_health: $app_health,
                alb_health: $alb_health
            }')
        
        report=$(echo "$report" | jq --arg service "$service" --argjson service_report "$service_report" '.services[$service] = $service_report')
    done
    
    echo "$report" | jq '.' > "$report_file"
    echo -e "${GREEN}✅ Deployment report saved to: $report_file${NC}"
    
    # Display summary
    echo -e "${BLUE}Report Summary:${NC}"
    echo "$report" | jq '.'
}

# Main execution
main() {
    check_prerequisites
    
    case $ACTION in
        "monitor")
            monitor_deployment
            ;;
        "health-check")
            comprehensive_health_check
            ;;
        "logs")
            get_service_logs
            ;;
        "rollback")
            rollback_deployment
            ;;
        "report")
            generate_deployment_report
            ;;
        *)
            echo -e "${RED}❌ Invalid action: $ACTION${NC}"
            echo "Valid actions: monitor, health-check, logs, rollback, report"
            exit 1
            ;;
    esac
}

# Run main function
main

echo -e "${GREEN}🎉 Deployment monitoring completed successfully!${NC}"
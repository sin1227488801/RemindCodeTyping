# Production Environment Configuration for RemindCodeTyping

# Environment
environment = "production"
aws_region  = "us-west-2"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.2.0/24"
]
private_subnet_cidrs = [
  "10.0.10.0/24",
  "10.0.20.0/24"
]

# Database Configuration
db_name                     = "rct_production"
db_username                 = "rct_user"
db_instance_class          = "db.t3.small"
db_allocated_storage       = 100
db_max_allocated_storage   = 500
db_backup_retention_period = 30
postgres_version           = "15.4"

# Redis Configuration
redis_node_type        = "cache.t3.small"
redis_num_cache_nodes  = 2

# ECS Configuration
ecs_cpu    = 1024
ecs_memory = 2048

# Service Configuration
backend_desired_count  = 2
frontend_desired_count = 2
backend_min_capacity   = 2
backend_max_capacity   = 10
frontend_min_capacity  = 2
frontend_max_capacity  = 5

# Docker Images
backend_image  = "rct-backend:latest"
frontend_image = "rct-frontend:latest"

# Application Configuration
cors_allowed_origins = "https://rct.example.com"

# Monitoring and Logging
log_retention_days = 90
enable_monitoring  = true

# Cost Optimization
enable_spot_instances     = false
spot_instance_percentage  = 0

# SSL Configuration
domain_name     = "rct.example.com"
certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Backup Configuration
enable_cross_region_backup = true
backup_region             = "us-east-1"
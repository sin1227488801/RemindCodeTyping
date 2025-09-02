# Staging Environment Configuration for RemindCodeTyping

# Environment
environment = "staging"
aws_region  = "us-west-2"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
public_subnet_cidrs = [
  "10.1.1.0/24",
  "10.1.2.0/24"
]
private_subnet_cidrs = [
  "10.1.10.0/24",
  "10.1.20.0/24"
]

# Database Configuration
db_name                     = "rct_staging"
db_username                 = "rct_user"
db_instance_class          = "db.t3.micro"
db_allocated_storage       = 20
db_max_allocated_storage   = 50
db_backup_retention_period = 3
postgres_version           = "15.4"

# Redis Configuration
redis_node_type        = "cache.t3.micro"
redis_num_cache_nodes  = 1

# ECS Configuration
ecs_cpu    = 512
ecs_memory = 1024

# Service Configuration
backend_desired_count  = 1
frontend_desired_count = 1
backend_min_capacity   = 1
backend_max_capacity   = 3
frontend_min_capacity  = 1
frontend_max_capacity  = 2

# Docker Images
backend_image  = "rct-backend:staging"
frontend_image = "rct-frontend:staging"

# Application Configuration
cors_allowed_origins = "http://localhost:3000,https://staging.rct.example.com"

# Monitoring and Logging
log_retention_days = 7
enable_monitoring  = true

# Cost Optimization
enable_spot_instances     = true
spot_instance_percentage  = 70

# SSL Configuration (leave empty for HTTP-only in staging)
domain_name     = "staging.rct.example.com"
certificate_arn = ""

# Backup Configuration
enable_cross_region_backup = false
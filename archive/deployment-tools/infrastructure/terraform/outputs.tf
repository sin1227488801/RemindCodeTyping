# Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "backend_task_definition_arn" {
  description = "ARN of the backend task definition"
  value       = aws_ecs_task_definition.backend.arn
}

output "frontend_task_definition_arn" {
  description = "ARN of the frontend task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "secrets_manager_db_password_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "secrets_manager_jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "secrets_manager_redis_auth_token_arn" {
  description = "ARN of the Redis auth token secret"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
  sensitive   = true
}

output "cloudwatch_log_group_backend" {
  description = "Name of the backend CloudWatch log group"
  value       = aws_cloudwatch_log_group.backend.name
}

output "cloudwatch_log_group_frontend" {
  description = "Name of the frontend CloudWatch log group"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "sns_topic_alerts_arn" {
  description = "ARN of the alerts SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "s3_bucket_alb_logs" {
  description = "Name of the S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.environment == "production" ? aws_wafv2_web_acl.main[0].arn : null
}

# Application URLs
output "application_url" {
  description = "URL of the application"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "URL of the API"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}/api" : "http://${aws_lb.main.dns_name}/api"
}

output "health_check_url" {
  description = "URL for health checks"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}/actuator/health" : "http://${aws_lb.main.dns_name}/actuator/health"
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information for CI/CD"
  value = {
    environment     = var.environment
    region         = var.aws_region
    cluster_name   = aws_ecs_cluster.main.name
    backend_service = aws_ecs_service.backend.name
    frontend_service = aws_ecs_service.frontend.name
    alb_dns_name   = aws_lb.main.dns_name
    database_endpoint = aws_db_instance.main.endpoint
    redis_endpoint = aws_elasticache_replication_group.main.primary_endpoint_address
  }
  sensitive = true
}
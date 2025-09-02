# ECS Configuration for RemindCodeTyping

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"
  
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }
  
  setting {
    name  = "containerInsights"
    value = var.enable_monitoring ? "enabled" : "disabled"
  }
  
  tags = local.common_tags
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name
  
  capacity_providers = var.enable_spot_instances ? ["FARGATE", "FARGATE_SPOT"] : ["FARGATE"]
  
  default_capacity_provider_strategy {
    base              = 1
    weight            = var.enable_spot_instances ? 100 - var.spot_instance_percentage : 100
    capacity_provider = "FARGATE"
  }
  
  dynamic "default_capacity_provider_strategy" {
    for_each = var.enable_spot_instances ? [1] : []
    content {
      base              = 0
      weight            = var.spot_instance_percentage
      capacity_provider = "FARGATE_SPOT"
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name_prefix}/backend"
  retention_in_days = var.log_retention_days
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-logs"
  })
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name_prefix}/frontend"
  retention_in_days = var.log_retention_days
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-logs"
  })
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/ecs/${local.name_prefix}/exec"
  retention_in_days = var.log_retention_days
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-exec-logs"
  })
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks (Application)
resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# IAM Policy for ECS Tasks
resource "aws_iam_role_policy" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.redis_auth_token.arn
        ]
      }
    ]
  })
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  description             = "Database password for ${local.name_prefix}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.name_prefix}-jwt-secret"
  description             = "JWT secret for ${local.name_prefix}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name                    = "${local.name_prefix}-redis-auth-token"
  description             = "Redis auth token for ${local.name_prefix}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = var.redis_auth_token
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "backend"
      image = var.backend_image
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "SPRING_PROFILES_ACTIVE"
          value = var.environment
        },
        {
          name  = "SPRING_DATASOURCE_URL"
          value = "jdbc:postgresql://${aws_db_instance.main.endpoint}:5432/${var.db_name}"
        },
        {
          name  = "SPRING_DATASOURCE_USERNAME"
          value = var.db_username
        },
        {
          name  = "CORS_ALLOWED_ORIGINS"
          value = var.cors_allowed_origins
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_replication_group.main.primary_endpoint_address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        }
      ]
      
      secrets = [
        {
          name      = "SPRING_DATASOURCE_PASSWORD"
          valueFrom = aws_secretsmanager_secret.db_password.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        },
        {
          name      = "REDIS_PASSWORD"
          valueFrom = aws_secretsmanager_secret.redis_auth_token.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:8080/actuator/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      essential = true
    }
  ])
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-task"
  })
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = var.frontend_image
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:8080/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }
      
      essential = true
    }
  ])
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-task"
  })
}

# Backend ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${local.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = var.enable_spot_instances ? 100 - var.spot_instance_percentage : 100
    base             = 1
  }
  
  dynamic "capacity_provider_strategy" {
    for_each = var.enable_spot_instances ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight           = var.spot_instance_percentage
      base             = 0
    }
  }
  
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  enable_execute_command = true
  
  depends_on = [aws_lb_listener.backend]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-service"
  })
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name            = "${local.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = var.enable_spot_instances ? 100 - var.spot_instance_percentage : 100
    base             = 1
  }
  
  dynamic "capacity_provider_strategy" {
    for_each = var.enable_spot_instances ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight           = var.spot_instance_percentage
      base             = 0
    }
  }
  
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 8080
  }
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  enable_execute_command = true
  
  depends_on = [aws_lb_listener.frontend]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-service"
  })
}
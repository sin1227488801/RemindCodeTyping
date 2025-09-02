# Auto Scaling Configuration for ECS Services

# Application Auto Scaling Target - Backend
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-autoscaling-target"
  })
}

# Application Auto Scaling Target - Frontend
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.frontend_max_capacity
  min_capacity       = var.frontend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-autoscaling-target"
  })
}

# Auto Scaling Policy - Backend CPU Utilization
resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name_prefix}-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Auto Scaling Policy - Backend Memory Utilization
resource "aws_appautoscaling_policy" "backend_memory" {
  name               = "${local.name_prefix}-backend-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Auto Scaling Policy - Backend Request Count
resource "aws_appautoscaling_policy" "backend_request_count" {
  name               = "${local.name_prefix}-backend-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.backend.arn_suffix}"
    }
    
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Auto Scaling Policy - Frontend CPU Utilization
resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${local.name_prefix}-frontend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Auto Scaling Policy - Frontend Request Count
resource "aws_appautoscaling_policy" "frontend_request_count" {
  name               = "${local.name_prefix}-frontend-request-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.frontend.arn_suffix}"
    }
    
    target_value       = 2000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Scheduled Scaling - Scale down during off-hours (optional)
resource "aws_appautoscaling_scheduled_action" "backend_scale_down" {
  count = var.environment == "production" ? 1 : 0
  
  name               = "${local.name_prefix}-backend-scale-down"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  
  schedule = "cron(0 22 * * ? *)"  # 10 PM UTC
  
  scalable_target_action {
    min_capacity = 1
    max_capacity = var.backend_max_capacity
  }
}

resource "aws_appautoscaling_scheduled_action" "backend_scale_up" {
  count = var.environment == "production" ? 1 : 0
  
  name               = "${local.name_prefix}-backend-scale-up"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  
  schedule = "cron(0 6 * * ? *)"  # 6 AM UTC
  
  scalable_target_action {
    min_capacity = var.backend_min_capacity
    max_capacity = var.backend_max_capacity
  }
}

# CloudWatch Alarms for monitoring scaling events
resource "aws_cloudwatch_metric_alarm" "backend_high_cpu" {
  alarm_name          = "${local.name_prefix}-backend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors backend CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = aws_ecs_service.backend.name
    ClusterName = aws_ecs_cluster.main.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-high-cpu-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "backend_high_memory" {
  alarm_name          = "${local.name_prefix}-backend-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors backend memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = aws_ecs_service.backend.name
    ClusterName = aws_ecs_cluster.main.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-high-memory-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  alarm_name          = "${local.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-response-time-alarm"
  })
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts-topic"
  })
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
# Application Load Balancer Configuration

# Target Groups
resource "aws_lb_target_group" "backend" {
  name     = "${local.name_prefix}-backend-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/actuator/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  
  deregistration_delay = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-tg"
  })
}

resource "aws_lb_target_group" "frontend" {
  name     = "${local.name_prefix}-frontend-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  
  deregistration_delay = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-tg"
  })
}

# ALB Listeners
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-http-listener"
  })
}

resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-https-listener"
  })
}

# HTTP Listener (for environments without SSL)
resource "aws_lb_listener" "frontend" {
  count = var.certificate_arn == "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-frontend-listener"
  })
}

# Backend Listener Rules
resource "aws_lb_listener_rule" "backend_api" {
  listener_arn = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.frontend[0].arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*", "/actuator/*", "/swagger-ui/*", "/v3/api-docs/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-rule"
  })
}

# Health Check Listener Rule
resource "aws_lb_listener_rule" "health_check" {
  listener_arn = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.frontend[0].arn
  priority     = 200
  
  action {
    type = "fixed-response"
    
    fixed_response {
      content_type = "text/plain"
      message_body = "OK"
      status_code  = "200"
    }
  }
  
  condition {
    path_pattern {
      values = ["/health", "/healthz"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-rule"
  })
}

# WAF Web ACL (optional, for production)
resource "aws_wafv2_web_acl" "main" {
  count = var.environment == "production" ? 1 : 0
  
  name  = "${local.name_prefix}-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-WAF"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  count = var.environment == "production" ? 1 : 0
  
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}
resource "aws_security_group" "this" {
  name_prefix = "${var.name_prefix}-"
  description = "SpeedyZoom app + SSH (Terraform)"
  # vpc_id omitted: AWS default VPC in this region

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH (restricted)"
  }

  dynamic "ingress" {
    for_each = length(var.http_cidr_blocks) > 0 ? [1] : []
    content {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = var.http_cidr_blocks
      description = "HTTP"
    }
  }

  ingress {
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = var.app_cidr_blocks
    description = "SpeedyZoom app port"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = {
    Name    = "${var.name_prefix}-sg"
    Project = var.project_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# This tells Terraform which cloud provider to use
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"  # Download AWS provider from HashiCorp
      version = "~> 5.0"         # Use version 5.x (latest stable)
    }
  }
}

# Configure the AWS provider
provider "aws" {
  region = "us-east-1"  # Virginia region (cheapest/fastest)
}

# Create a security group (firewall rules)
resource "aws_security_group" "speedyzoom_sg" {
  name        = "speedyzoom-learning-sg"
  description = "My first Terraform security group!"

  # Allow inbound SSH (port 22)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow from anywhere (be careful in production!)
    description = "SSH access"
  }

  # Allow inbound HTTP (port 80)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"           # -1 means all protocols
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name    = "SpeedyZoom Learning SG"
    Project = "Learning Terraform"
  }
} 
data "aws_ami" "amazon_linux_2023" {
  count       = var.enable_free_tier_compute ? 1 : 0
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-202*-kernel-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_vpc" "default" {
  count   = var.enable_free_tier_compute ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.enable_free_tier_compute ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

resource "aws_instance" "speedyzoom" {
  count                       = var.enable_free_tier_compute ? 1 : 0
  ami                         = data.aws_ami.amazon_linux_2023[0].id
  instance_type               = "t3.micro"
  subnet_id                   = sort(tolist(data.aws_subnets.default[0].ids))[0]
  vpc_security_group_ids      = [module.sg_us_east_1.security_group_id]
  associate_public_ip_address = true
  key_name                    = var.ec2_key_name != "" ? var.ec2_key_name : null

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name    = "speedyzoom-free-tier"
    Project = var.project_name
  }
}

# India (ap-south-1) instance
data "aws_ami" "amazon_linux_2023_india" {
  count       = var.enable_free_tier_compute ? 1 : 0
  most_recent = true
  owners      = ["amazon"]
  provider    = aws.ap_south_1

  filter {
    name   = "name"
    values = ["al2023-ami-202*-kernel-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_vpc" "default_india" {
  count    = var.enable_free_tier_compute ? 1 : 0
  default  = true
  provider = aws.ap_south_1
}

data "aws_subnets" "default_india" {
  count    = var.enable_free_tier_compute ? 1 : 0
  provider = aws.ap_south_1
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default_india[0].id]
  }
}

resource "aws_instance" "speedyzoom_india" {
  count                       = var.enable_free_tier_compute ? 1 : 0
  provider                    = aws.ap_south_1
  ami                         = data.aws_ami.amazon_linux_2023_india[0].id
  instance_type               = "t3.micro"
  subnet_id                   = sort(tolist(data.aws_subnets.default_india[0].ids))[0]
  vpc_security_group_ids      = [module.sg_ap_south_1.security_group_id]
  associate_public_ip_address = true
  key_name                    = var.ec2_key_name != "" ? var.ec2_key_name : null

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name    = "speedyzoom-india"
    Project = var.project_name
  }
}

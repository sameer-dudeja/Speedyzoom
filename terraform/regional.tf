# One security group per listed region — no hourly charge; good for Phase 2 “edges” later.
# EC2 is created only in us-east-1 (default provider) to stay within typical EC2 free-tier hours.

module "sg_us_east_1" {
  source = "./modules/regional_sg"

  name_prefix       = "speedyzoom-useast1"
  project_name      = var.project_name
  ssh_cidr_blocks   = var.ssh_ingress_cidrs
  http_cidr_blocks  = var.http_ingress_cidrs
  app_cidr_blocks   = var.app_ingress_cidrs
  app_port          = var.app_port
}

module "sg_eu_west_1" {
  source = "./modules/regional_sg"
  providers = {
    aws = aws.eu_west_1
  }

  name_prefix       = "speedyzoom-euwest1"
  project_name      = var.project_name
  ssh_cidr_blocks   = var.ssh_ingress_cidrs
  http_cidr_blocks  = var.http_ingress_cidrs
  app_cidr_blocks   = var.app_ingress_cidrs
  app_port          = var.app_port
}

module "sg_ap_southeast_1" {
  source = "./modules/regional_sg"
  providers = {
    aws = aws.ap_southeast_1
  }

  name_prefix       = "speedyzoom-apsoutheast1"
  project_name      = var.project_name
  ssh_cidr_blocks   = var.ssh_ingress_cidrs
  http_cidr_blocks  = var.http_ingress_cidrs
  app_cidr_blocks   = var.app_ingress_cidrs
  app_port          = var.app_port
}

module "sg_ap_south_1" {
  source = "./modules/regional_sg"
  providers = {
    aws = aws.ap_south_1
  }

  name_prefix       = "speedyzoom-apsouth1"
  project_name      = var.project_name
  ssh_cidr_blocks   = var.ssh_ingress_cidrs
  http_cidr_blocks  = var.http_ingress_cidrs
  app_cidr_blocks   = var.app_ingress_cidrs
  app_port          = var.app_port
}

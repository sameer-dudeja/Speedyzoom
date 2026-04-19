output "security_group_ids" {
  description = "Regional security groups (ready for future EC2 in EU / Singapore / India / US)."
  value = {
    us_east_1      = module.sg_us_east_1.security_group_id
    eu_west_1      = module.sg_eu_west_1.security_group_id
    ap_southeast_1 = module.sg_ap_southeast_1.security_group_id
    ap_south_1     = module.sg_ap_south_1.security_group_id
  }
}

output "ec2_public_ip" {
  description = "Public IPv4 of the single t3.micro (empty if enable_free_tier_compute is false)."
  value       = try(aws_instance.speedyzoom[0].public_ip, null)
}

output "ec2_public_dns" {
  description = "Public DNS of the t3.micro."
  value       = try(aws_instance.speedyzoom[0].public_dns, null)
}

output "app_url_hint" {
  description = "Example URL for the Node app once the server is installed and running."
  value       = var.enable_free_tier_compute ? "http://${try(aws_instance.speedyzoom[0].public_dns, "")}:${var.app_port}" : null
}

output "india_ec2_public_ip" {
  description = "Public IPv4 of the India (ap-south-1) instance."
  value       = try(aws_instance.speedyzoom_india[0].public_ip, null)
}

output "india_ec2_public_dns" {
  description = "Public DNS of the India instance."
  value       = try(aws_instance.speedyzoom_india[0].public_dns, null)
}

output "india_app_url_hint" {
  description = "Example URL for the India Node app."
  value       = var.enable_free_tier_compute ? "http://${try(aws_instance.speedyzoom_india[0].public_dns, "")}:${var.app_port}" : null
}

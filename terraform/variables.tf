variable "project_name" {
  type        = string
  description = "Tag value for Project on all resources."
  default     = "SpeedyZoom"
}

variable "ec2_key_name" {
  type        = string
  description = "Name of an existing EC2 Key Pair in us-east-1 (empty = no SSH key on instance)."
  default     = ""
}

variable "ssh_ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks allowed to SSH (22), e.g. [\"203.0.113.10/32\"] for your public IP. Get IP: curl -4 ifconfig.me"
  validation {
    condition     = length(var.ssh_ingress_cidrs) > 0
    error_message = "ssh_ingress_cidrs must be a non-empty list so SSH is not accidentally left undefined."
  }
}

variable "http_ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks for HTTP (80). Empty = no inbound port 80 rule (recommended until you add a reverse proxy)."
  default     = []
}

variable "app_ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks for the SpeedyZoom app TCP port. Use [\"0.0.0.0/0\"] only if the server should be reachable from the whole internet (typical public speed test)."
  default     = ["0.0.0.0/0"]
}

variable "enable_free_tier_compute" {
  type        = bool
  description = "When true, create one t3.micro in us-east-1. Set false to manage only security groups."
  default     = true
}

variable "app_port" {
  type        = number
  description = "Inbound TCP port for the SpeedyZoom Node server (default matches server/index.js)."
  default     = 3002
}

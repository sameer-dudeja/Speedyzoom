variable "name_prefix" {
  type        = string
  description = "Prefix for security group name (AWS adds uniqueness)."
}

variable "project_name" {
  type = string
}

variable "ssh_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks allowed for SSH (port 22)."
}

variable "http_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks for HTTP (port 80). Empty list = no HTTP ingress rule."
  default     = []
}

variable "app_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks for the app port (e.g. 0.0.0.0/0 for a public speed test)."
}

variable "app_port" {
  type = number
}

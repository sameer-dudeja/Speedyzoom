# Default region: single place we run the free-tier EC2 + matching primary SG.
# (Changing this requires aligning module regions and data sources.)
provider "aws" {
  region = "us-east-1"
}

# Aliases let the same AWS account talk to other regions (extra security groups only).
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

# India (Mumbai) — same account free-tier rules as other regions; SG has no hourly cost.
provider "aws" {
  alias  = "ap_south_1"
  region = "ap-south-1"
}

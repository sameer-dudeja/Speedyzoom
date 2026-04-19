# Infrastructure Teardown Guide

This document provides instructions for safely destroying AWS infrastructure created by Terraform.

---

## ⚠️ Important Notes

- **Backup Data**: Ensure you have saved any important logs or data from EC2 instances
- **Stop Running Tests**: Make sure no active speed tests are running
- **SSH Keys**: Terraform will not delete SSH keys from AWS - you must delete them manually if desired
- **State Files**: Keep `terraform.tfstate` files backed up for recovery if needed

---

## Complete Infrastructure Teardown

### Step 1: Review Current Infrastructure

```powershell
# Navigate to terraform directory
cd terraform

# Review what will be destroyed
terraform plan -destroy

# List all resources
terraform state list
```

**Expected Resources**:
```
data.aws_ami.amazon_linux_2023[0]
data.aws_subnets.default[0]
data.aws_vpc.default[0]
aws_instance.speedyzoom[0]
module.sg_ap_south_1.aws_security_group.this
module.sg_ap_southeast_1.aws_security_group.this
module.sg_eu_west_1.aws_security_group.this
module.sg_us_east_1.aws_security_group.this
```

### Step 2: Destroy All Resources

```powershell
# Destroy everything (requires confirmation)
terraform destroy

# OR destroy without confirmation (use carefully!)
terraform destroy -auto-approve
```

**Expected Output**:
```
Plan: 0 to add, 0 to change, 5 to destroy.

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes
```

**Destruction Order** (Terraform handles automatically):
1. EC2 instances terminated
2. Security groups deleted (in each region)
3. State updated to reflect destruction

**Estimated Time**: 1-2 minutes

---

## Partial Infrastructure Teardown

### Destroy Only EC2 Instances (Keep Security Groups)

```powershell
# Destroy only the EC2 instance
terraform destroy -target="aws_instance.speedyzoom[0]" -auto-approve

# Security groups remain for future deployments
```

**Use Case**: You want to stop EC2 costs but keep security groups configured

### Destroy Specific Region Security Groups

```powershell
# Destroy India security group
terraform destroy -target="module.sg_ap_south_1" -auto-approve

# Destroy Europe security group
terraform destroy -target="module.sg_eu_west_1" -auto-approve

# Destroy Singapore security group
terraform destroy -target="module.sg_ap_southeast_1" -auto-approve

# Destroy US East security group (if EC2 is already destroyed)
terraform destroy -target="module.sg_us_east_1" -auto-approve
```

**Note**: Cannot destroy security groups while they're attached to running instances

---

## Manual Cleanup (After Terraform Destroy)

### 1. Delete SSH Key Pairs from AWS

Terraform does not manage imported SSH keys. You must delete them manually:

```powershell
# List key pairs in each region
aws ec2 describe-key-pairs --region us-east-1
aws ec2 describe-key-pairs --region ap-south-1
aws ec2 describe-key-pairs --region eu-west-1
aws ec2 describe-key-pairs --region ap-southeast-1

# Delete key pairs
aws ec2 delete-key-pair --region us-east-1 --key-name speedyzoom-key
aws ec2 delete-key-pair --region ap-south-1 --key-name speedyzoom-key
aws ec2 delete-key-pair --region eu-west-1 --key-name speedyzoom-key
aws ec2 delete-key-pair --region ap-southeast-1 --key-name speedyzoom-key
```

### 2. Delete Local SSH Keys (Optional)

```powershell
# Remove local SSH keys (if no longer needed)
Remove-Item $env:USERPROFILE\.ssh\speedyzoom-key
Remove-Item $env:USERPROFILE\.ssh\speedyzoom-key.pub
Remove-Item $env:USERPROFILE\.ssh\speedyzoom-key-india  # If created
```

### 3. Verify No Resources Remain

```powershell
# Check for any remaining EC2 instances
aws ec2 describe-instances --region us-east-1 --filters "Name=tag:Project,Values=SpeedyZoom"
aws ec2 describe-instances --region ap-south-1 --filters "Name=tag:Project,Values=SpeedyZoom"

# Check for any remaining security groups
aws ec2 describe-security-groups --region us-east-1 --filters "Name=group-name,Values=speedyzoom-*"
```

### 4. Clean Up Terraform State

```powershell
# Remove Terraform state files (if starting fresh)
# ⚠️ WARNING: Only do this if you're sure all resources are destroyed
Remove-Item terraform.tfstate
Remove-Item terraform.tfstate.backup
Remove-Item .terraform.lock.hcl
Remove-Item -Recurse .terraform/

# Reinitialize if needed in the future
terraform init
```

---

## Cost Verification

After destroying infrastructure, verify no ongoing charges:

### 1. AWS Cost Explorer
- Go to: https://console.aws.amazon.com/cost-management/home
- Check "Cost by Service" for the last 7 days
- Verify EC2 and Data Transfer costs drop to $0

### 2. Check for Orphaned Resources

Common resources that may remain:
- **EBS Volumes**: Should be deleted automatically with EC2 (check anyway)
- **Elastic IPs**: Not used in this project, but verify none allocated
- **Snapshots**: Not created by this project, but check for orphans
- **CloudWatch Logs**: Not created by this project

```powershell
# Check for unattached EBS volumes
aws ec2 describe-volumes --region us-east-1 --filters "Name=status,Values=available"

# Check for allocated Elastic IPs
aws ec2 describe-addresses --region us-east-1

# Check for snapshots
aws ec2 describe-snapshots --region us-east-1 --owner-ids self
```

---

## Troubleshooting Teardown Issues

### Issue 1: Security Group Deletion Fails

**Error**:
```
Error: deleting security group: DependencyViolation: resource sg-xxx has a dependent object
```

**Solution**:
```powershell
# Destroy EC2 instances first
terraform destroy -target="aws_instance.speedyzoom[0]" -auto-approve

# Wait 30 seconds for AWS to process
Start-Sleep -Seconds 30

# Then destroy security groups
terraform destroy
```

### Issue 2: State Lock Error

**Error**:
```
Error: Error acquiring the state lock
```

**Solution**:
```powershell
# Force unlock (use carefully, only if you're sure no other terraform is running)
terraform force-unlock LOCK_ID

# Replace LOCK_ID with the ID from the error message
```

### Issue 3: Instance Still Running After Destroy

**Solution**:
```powershell
# Manually terminate instance
aws ec2 terminate-instances --region us-east-1 --instance-ids i-xxxxx

# Wait for termination
aws ec2 wait instance-terminated --region us-east-1 --instance-ids i-xxxxx

# Re-run terraform destroy
terraform destroy -auto-approve
```

### Issue 4: Terraform State Drift

**Solution**:
```powershell
# Refresh Terraform state
terraform refresh

# Review differences
terraform plan

# Force destroy even if state is drifted
terraform destroy -auto-approve
```

---

## Re-Deployment After Teardown

### Quick Re-Deploy

```powershell
# 1. Ensure SSH keys are imported (if previously deleted)
aws ec2 import-key-pair --region us-east-1 --key-name speedyzoom-key --public-key-material fileb://$env:USERPROFILE\.ssh\speedyzoom-key.pub

# 2. Re-run Terraform
terraform init  # If state was cleaned
terraform plan -out=tfplan
terraform apply tfplan

# 3. Re-deploy application to new instance
# (Follow DEPLOYMENT_GUIDE.md server setup section)
```

### Fresh Start (Complete Reset)

```powershell
# 1. Clean all Terraform files
Remove-Item terraform.tfstate*
Remove-Item .terraform.lock.hcl
Remove-Item -Recurse .terraform/

# 2. Initialize Terraform
terraform init

# 3. Create terraform.tfvars from example
Copy-Item terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

# 4. Deploy fresh infrastructure
terraform plan -out=tfplan
terraform apply tfplan
```

---

## Verification Checklist

After completing teardown, verify:

- [ ] No EC2 instances running in any region
- [ ] No security groups with "speedyzoom" prefix
- [ ] No unattached EBS volumes
- [ ] No allocated Elastic IPs
- [ ] AWS Cost Explorer shows $0 for EC2/Data Transfer
- [ ] SSH keys deleted from AWS (optional)
- [ ] Local SSH keys backed up or deleted (optional)
- [ ] Terraform state reflects "0 resources"

### Final Verification Command

```powershell
# Check Terraform knows everything is destroyed
terraform show

# Should output: "No state."
# Or show empty state with no resources
```

---

## Emergency Full Cleanup Script

If you need to force-clean everything (use as last resort):

```powershell
# ⚠️ WARNING: This will forcefully remove all resources
# Only use if normal terraform destroy fails multiple times

# 1. Terminate all SpeedyZoom EC2 instances
$regions = @("us-east-1", "ap-south-1", "eu-west-1", "ap-southeast-1")
foreach ($region in $regions) {
    $instances = aws ec2 describe-instances --region $region --filters "Name=tag:Project,Values=SpeedyZoom" --query "Reservations[].Instances[].InstanceId" --output text
    if ($instances) {
        aws ec2 terminate-instances --region $region --instance-ids $instances
    }
}

# 2. Wait for termination
Start-Sleep -Seconds 60

# 3. Delete security groups
foreach ($region in $regions) {
    $sgs = aws ec2 describe-security-groups --region $region --filters "Name=group-name,Values=speedyzoom-*" --query "SecurityGroups[].GroupId" --output text
    foreach ($sg in $sgs -split "\s+") {
        if ($sg) {
            aws ec2 delete-security-group --region $region --group-id $sg
        }
    }
}

# 4. Delete key pairs
foreach ($region in $regions) {
    aws ec2 delete-key-pair --region $region --key-name speedyzoom-key
}

# 5. Clean Terraform state
terraform destroy -auto-approve
```

---

## Support

If you encounter issues during teardown:

1. Check AWS Console manually for remaining resources
2. Review CloudTrail logs for deletion errors
3. Ensure IAM permissions are sufficient for resource deletion
4. Try destroying resources manually via AWS Console
5. Use `terraform state rm` to remove stuck resources from state

---

## Cost Summary

**Resources Destroyed**:
- EC2 t3.micro instance: ~$0.0104/hour ($7.50/month)
- Security groups: Free
- EBS volume (8GB gp3): ~$0.08/month
- Data transfer: Variable based on usage

**Expected Savings After Teardown**: ~$10-15/month per region

---

## Conclusion

After completing this teardown:
- All AWS infrastructure is removed
- No ongoing charges (verify in Cost Explorer)
- State files preserved for future reference
- SSH keys can be reused for future deployments

To redeploy in the future, follow the [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md).

# ==============================================================================
# Terraform Outputs Configuration
# ==============================================================================

output "primary_eks_cluster_endpoint" {
  description = "The api entry point url for the primary Kubernetes controller plane"
  value       = module.primary_eks.cluster_endpoint
}

output "primary_vpc_id" {
  description = "Network identifier for the primary region"
  value       = module.primary_vpc.vpc_id
}

output "rds_global_cluster_arn" {
  description = "Unified identifier for multi-region Aurora cluster"
  value       = aws_rds_global_cluster.db_global.arn
}

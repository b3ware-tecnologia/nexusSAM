# ==============================================================================
# Terraform Input Variables for Multi-Region Resilient Infrastructure Setup
# ==============================================================================

variable "project_name" {
  description = "The corporate namespace for resource naming conventions"
  type        = string
  default     = "snow-atlas-itam"
}

variable "environment" {
  description = "Target deployment lifecycle tier (staging, production, sandbox)"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "The main target deployment region for core database clusters and file vault"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Failover secondary region for compliance calculations backup and metadata caching"
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Top level corporate enterprise DNS record"
  type        = string
  default     = "snowatlas-enterprise.com"
}

variable "database_version" {
  description = "The engine release version for high performance PostgreSQL cluster"
  type        = string
  default     = "POSTGRES_15"
}

variable "eks_node_instance_type" {
  description = "Instance type matching compliance load memory profiles"
  type        = string
  default     = "m5.2xlarge"
}

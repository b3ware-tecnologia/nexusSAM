# ==============================================================================
# Terraform Core Infrastructure Configuration (Multi-Region Cloud Setup)
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

# ------------------------------------------------------------------------------
# Primary Region Configuration: Us-East-1 (North America HQ)
# ------------------------------------------------------------------------------
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

module "primary_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  providers = {
    aws = aws.primary
  }

  name = "${var.project_name}-primary-vpc"
  cidr = "10.100.0.0/16"

  azs             = ["${var.primary_region}a", "${var.primary_region}b", "${var.primary_region}c"]
  private_subnets = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
  public_subnets  = ["10.100.101.0/24", "10.100.102.0/24", "10.100.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  enable_vpn_gateway = true

  tags = {
    Environment = var.environment
    Region      = "Primary"
  }
}

# ------------------------------------------------------------------------------
# Secondary Region Configuration: Eu-Central-1 (EMEA HQ)
# ------------------------------------------------------------------------------
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

module "secondary_vpc" {
  source = "terraform-aws-modules/vpc/aws"
  providers = {
    aws = aws.secondary
  }

  name = "${var.project_name}-secondary-vpc"
  cidr = "10.200.0.0/16"

  azs             = ["${var.secondary_region}a", "${var.secondary_region}b", "${var.secondary_region}c"]
  private_subnets = ["10.200.1.0/24", "10.200.2.0/24", "10.200.3.0/24"]
  public_subnets  = ["10.200.101.0/24", "10.200.102.0/24", "10.200.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = true

  tags = {
    Environment = var.environment
    Region      = "Secondary"
  }
}

# ------------------------------------------------------------------------------
# Multi-Region Database: Aurora PostgreSQL Global Database Cluster
# ------------------------------------------------------------------------------
resource "aws_rds_global_cluster" "db_global" {
  provider                  = aws.primary
  global_cluster_identifier = "${var.project_name}-global-rds"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = "snowatlas"
}

# ------------------------------------------------------------------------------
# Primary EKS Cluster Setup for Snow Atlas Applications
# ------------------------------------------------------------------------------
module "primary_eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  providers = {
    aws = aws.primary
  }

  cluster_name    = "${var.project_name}-eks-primary"
  cluster_version = "1.28"

  vpc_id     = module.primary_vpc.vpc_id
  subnet_ids = module.primary_vpc.private_subnets

  eks_managed_node_groups = {
    compute_nodes = {
      min_size     = 3
      max_size     = 10
      desired_size = 4

      instance_types = [var.eks_node_instance_type]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = {
    Environment = var.environment
    Tier        = "AppOrchestration"
  }
}

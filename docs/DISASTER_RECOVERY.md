# Disaster Recovery Runbook - RevFlow AI

This document outlines the standard operating procedures (SOPs) for handling disasters, outages, and data loss in the RevFlow AI production environment.

## 1. Database Restoration

The PostgreSQL database is backed up daily via a Kubernetes CronJob. Backups are stored in the `/backup` PVC (and theoretically synced to an offsite S3 bucket).

### Restore from SQL Dump
1. **Identify the backup file**: Locate the correct `.sql.gz` file in your backup storage.
2. **Copy the backup into the Postgres Pod**:
   ```bash
   kubectl cp db_backup_20260101.sql.gz revflow-prod/postgres-0:/tmp/
   ```
3. **Execute the restore**:
   ```bash
   kubectl exec -it postgres-0 -n revflow-prod -- bash -c "gunzip -c /tmp/db_backup_20260101.sql.gz | psql -U postgres -d revflow"
   ```

## 2. Cluster Complete Failure (Loss of Kubernetes Cluster)

In the event of a total cluster failure, the infrastructure must be rebuilt from scratch.

1. **Re-provision infrastructure**: Use Terraform/CloudFormation to recreate the underlying nodes and load balancers.
2. **Apply Kubernetes Manifests**:
   ```bash
   kubectl apply -f infrastructure/k8s/namespace.yaml
   kubectl apply -f infrastructure/k8s/
   ```
3. **Restore Secrets**: Ensure that `revflow-secrets` and `revflow-config` ConfigMaps/Secrets are recreated from your secure vault (e.g. AWS Secrets Manager, HashiCorp Vault).
4. **Restore Database**: Follow the Database Restoration steps above.
5. **Restart Deployments**:
   ```bash
   kubectl rollout restart deployment backend -n revflow-prod
   kubectl rollout restart deployment frontend -n revflow-prod
   ```

## 3. High Availability & Failover

- **Backend & Frontend**: Both are stateless and managed by horizontal pod autoscalers (HPA). If a node dies, the pods will be rescheduled onto healthy nodes automatically.
- **Database**: The current setup uses a single-replica StatefulSet. For true zero-downtime HA, consider upgrading this to a managed service (e.g. AWS RDS Multi-AZ, GCP Cloud SQL) or using Patroni for PostgreSQL HA on Kubernetes.
- **Redis**: Caching layer is ephemeral. If it goes down, it will restart empty. No restore is necessary, but initial cache misses will spike DB load.

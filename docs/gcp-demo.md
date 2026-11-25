# GCP demo deployment

This deployment runs the production Next.js server on one Debian 12 `e2-micro` VM in `us-central1-a`. SQLite is stored on its persistent disk at `/var/lib/mithaiflow/mithai.db`, rather than on a disposable serverless filesystem. This is a single-machine hackathon deployment, not a highly available production service.

## Live demo, 25 November 2026

- Storefront: <https://mithaiflow.35.208.30.98.sslip.io>
- Shop desk: <https://mithaiflow.35.208.30.98.sslip.io/shop>
- Automatic removal: **11:59:59 PM IST on 25 November 2026**. The user requested an extension through the end of the day.
- The isolated new project's billing association was denied (`billing.resourceAssociations.create`), so the VM is deployed in an existing Texmed project with billing already enabled. It uses its own VPC, subnet and tagged firewall rules. Existing VMs were not changed.
- HTTPS health, live Flagsmith policy, fictional order confirmation, server pricing, confirmation replay, one stock reservation, protected shop access, unauthenticated recovery rejection, and receipt persistence across an app restart all passed.
- NudgeBee's **MithaiFlow Application Demo** account and **MithaiFlow demo proxy** are connected; its UI reported **Agent connected**. Automatic network discovery is disabled. The GCP JSON-key policy was not weakened.
- The real **webhook → GET health → human approval → bearer POST recovery → GET health** execution passed on live version **v4, Direct approval gate**. All four tasks completed successfully. Gowtham explicitly approved in chat; the assistant submitted that decision with an attribution comment in NudgeBee. The public endpoint independently returned healthy afterward. See [recorded checks](evidence/gcp-deployment.json).

## Demo lifetime and cost controls

- An absolute termination time of `2026-11-25T18:29:59Z` and `instanceTerminationAction=DELETE` are enforced by Compute Engine. The auto-delete boot disk and its sample orders expire with the VM. Export any needed demo evidence before expiry.
- One 20 GB standard persistent disk, Standard network tier, and an ephemeral IPv4 address. No Cloud SQL, load balancer, Cloud NAT, paid DNS zone, or second VM. The existing IP was temporarily reserved to preserve the submitted URL during the required stop/start, then the reservation was released while the IP remained in use.
- The approved demo budget is US$1. Free Tier eligibility is account-wide and cannot be assumed. External IPv4 and network traffic can be billed. A billing budget is not a hard spending cap.
- The installer limits total internet egress, including sponsor API uploads and web responses, to 512 MiB using an outbound firewall quota. Loopback, metadata and management SSH are exempt. After the end-of-day extension restart, the remaining quota was conservatively set to 500 MiB. VM startup metadata now restores both the 4 GiB swap file and the traffic rules on boot. The quota is in memory and resets if its rules are recreated; do not restart or recreate the deployment without reviewing the remaining budget.
- VM removal stops its compute/IP/disk charges. The empty VPC, subnet and firewall rules are not billable resources, but can be removed after the demo.

## Access and secrets

Only ports 80 and 443 are public. SSH is restricted to Google's IAP source range. The VM has no cloud service account or OAuth scopes. Caddy terminates HTTPS and forwards to Next.js on loopback port 3000. The app runs as an unprivileged system user.

The deployment archive comes from `git archive HEAD`; it excludes local `.env`, SQLite files and private dashboard captures. A separately uploaded environment file contains fresh shop/session/recovery secrets and the authorised sponsor credentials. It is installed with mode 0600. Never commit it or include it in build logs.

`deploy/gcp/install.sh` installs Node 24 from the official distribution, verifies its SHA-256 checksum, installs locked dependencies, applies migrations, seeds sample inventory, builds the app, and creates its system service. Run it only on a dedicated disposable VM; it creates a swap file and configures Caddy and firewall rules.

## Verify before recording

1. Open the HTTPS storefront and shop desk; verify Flagsmith reads **LIVE**.
2. Fetch `/api/health`; verify a healthy JSON response. An unauthenticated POST to `/api/recover` must return 401.
3. Confirm one fictional order, repeat its confirmation, and check that the receipt and stock reservation remain unique.
4. Restart only the application service and verify the receipt survives. Do not restart the VM or reinstall the traffic quota.
5. Use the real NudgeBee approval workflow for recovery. An agent heartbeat or local recovery request does not prove an approval workflow.

## Operations

On the VM, inspect `systemctl status mithaiflow caddy`, application logs with `journalctl -u mithaiflow`, and read-only database checks as the app user. Keep logs free of credentials. The private shop password is in the separate deployment environment file on the operator's machine.

The GCP organization JSON-key restriction is separate from app deployment. The alternative NudgeBee proxy connection is scoped to the disposable demo VM, with automatic network discovery disabled. It does not grant NudgeBee access to other Texmed projects or resolve their organization IAM permissions.

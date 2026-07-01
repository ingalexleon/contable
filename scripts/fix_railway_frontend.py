#!/usr/bin/env python3
"""
Fix Railway frontend deployment: switch from RAILPACK to DOCKERFILE builder
and fix port configuration to resolve 502 errors.

This script:
1. Sets dockerfilePath on the service instance to use the Dockerfile
2. Sets railwayConfigFile to read railway.json for deploy settings
3. Configures PORT=3000 as env variable for nginx to listen on
4. Updates domain targetPort to 3000 to match
5. Triggers a redeployment

Root cause:
- Railway service had dockerfilePath=null, causing builds with RAILPACK
- Domain targetPort was 8000 but container was listening on different port
- Solution: set dockerfilePath, align PORT and targetPort to 3000

Usage:
    python3 scripts/fix_railway_frontend.py

Requires: Railway API token with project access.
"""

import json
import urllib.request
import urllib.error
import time
import sys

API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "14959d0a-a044-45d8-ad47-d937fe9dd6cd"

PROJECT_ID = "60d0ad69-059a-4c70-a112-68b9cb82425b"
SERVICE_ID = "8622f4be-6036-48f1-8952-febdb33a8415"
ENVIRONMENT_ID = "73613840-1342-4660-a69a-d408a5eabd55"
DOMAIN_ID = "c3457554-c954-4562-b12e-c3d1a913f572"
DOMAIN_NAME = "contable-production-048e.up.railway.app"

TARGET_PORT = 3000


def graphql_request(query, variables=None):
    """Make a GraphQL request to Railway API."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
            "User-Agent": "Mozilla/5.0 (compatible; RailwayCLI/3.0)",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("errors"):
                print(f"  GraphQL errors: {json.dumps(body['errors'], indent=2)}")
                return None
            return body
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"  HTTP Error {e.code}: {error_body[:500]}")
        return None
    except Exception as e:
        print(f"  Request error: {e}")
        return None


def main():
    print("=" * 60)
    print("Railway Frontend Deployment Fix")
    print("=" * 60)
    print(f"Service: {SERVICE_ID}")
    print(f"Environment: {ENVIRONMENT_ID}")
    print(f"Target Port: {TARGET_PORT}")
    print()

    # Step 1: Update service instance to use Dockerfile
    print("[1/5] Updating service instance (dockerfilePath, railwayConfigFile)...")
    mutation = """
    mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
    """
    result = graphql_request(mutation, {
        "serviceId": SERVICE_ID,
        "environmentId": ENVIRONMENT_ID,
        "input": {
            "dockerfilePath": "Dockerfile",
            "rootDirectory": "/frontend",
            "railwayConfigFile": "railway.json",
        },
    })
    if result and result.get("data", {}).get("serviceInstanceUpdate"):
        print("  OK - service instance updated")
    else:
        print("  FAILED")
        sys.exit(1)

    # Step 2: Set PORT env variable
    print(f"\n[2/5] Setting PORT={TARGET_PORT} environment variable...")
    var_mutation = """
    mutation variableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
    """
    result = graphql_request(var_mutation, {
        "input": {
            "projectId": PROJECT_ID,
            "serviceId": SERVICE_ID,
            "environmentId": ENVIRONMENT_ID,
            "name": "PORT",
            "value": str(TARGET_PORT),
        }
    })
    if result and result.get("data", {}).get("variableUpsert"):
        print("  OK - PORT variable set")
    else:
        print("  FAILED")
        sys.exit(1)

    # Step 3: Update domain targetPort
    print(f"\n[3/5] Updating domain targetPort to {TARGET_PORT}...")
    domain_mutation = """
    mutation serviceDomainUpdate($input: ServiceDomainUpdateInput!) {
      serviceDomainUpdate(input: $input)
    }
    """
    result = graphql_request(domain_mutation, {
        "input": {
            "domain": DOMAIN_NAME,
            "environmentId": ENVIRONMENT_ID,
            "serviceDomainId": DOMAIN_ID,
            "serviceId": SERVICE_ID,
            "targetPort": TARGET_PORT,
        }
    })
    if result and result.get("data", {}).get("serviceDomainUpdate"):
        print("  OK - domain targetPort updated")
    else:
        print("  FAILED")
        sys.exit(1)

    # Step 4: Trigger redeployment
    print("\n[4/5] Triggering redeployment...")
    # Find the latest successful deployment to redeploy
    deploy_query = """
    query deployments($projectId: String!, $serviceId: String!, $environmentId: String!) {
      deployments(
        input: {
          projectId: $projectId,
          serviceId: $serviceId,
          environmentId: $environmentId
        }
        first: 10
      ) {
        edges {
          node {
            id
            status
            canRedeploy
          }
        }
      }
    }
    """
    result = graphql_request(deploy_query, {
        "projectId": PROJECT_ID,
        "serviceId": SERVICE_ID,
        "environmentId": ENVIRONMENT_ID,
    })
    if not result:
        print("  FAILED to query deployments")
        sys.exit(1)

    edges = result.get("data", {}).get("deployments", {}).get("edges", [])
    redeploy_id = None
    for edge in edges:
        node = edge["node"]
        if node["status"] == "SUCCESS" and node.get("canRedeploy"):
            redeploy_id = node["id"]
            break

    if not redeploy_id:
        # Fallback: use serviceInstanceRedeploy
        print("  No redeployable deployment found, using serviceInstanceRedeploy...")
        mutation = """
        mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
          serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
        }
        """
        result = graphql_request(mutation, {
            "serviceId": SERVICE_ID,
            "environmentId": ENVIRONMENT_ID,
        })
        if result:
            print("  OK - serviceInstanceRedeploy triggered")
        else:
            print("  FAILED")
            sys.exit(1)
    else:
        mutation = """
        mutation deploymentRedeploy($id: String!) {
          deploymentRedeploy(id: $id) {
            id
            status
          }
        }
        """
        result = graphql_request(mutation, {"id": redeploy_id})
        if result and result.get("data", {}).get("deploymentRedeploy"):
            new_id = result["data"]["deploymentRedeploy"]["id"]
            print(f"  OK - new deployment: {new_id}")
        else:
            print("  FAILED")
            sys.exit(1)

    # Step 5: Wait and verify
    print("\n[5/5] Waiting for deployment and verifying...")
    time.sleep(30)

    try:
        req = urllib.request.Request(
            f"https://{DOMAIN_NAME}/",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                print(f"  OK - Frontend responding (HTTP {resp.status})")
                print(f"  URL: https://{DOMAIN_NAME}")
            else:
                print(f"  WARNING - Unexpected status: {resp.status}")
    except urllib.error.HTTPError as e:
        if e.code == 502:
            print("  WARNING - Still getting 502, deployment may need more time")
            print("  Try again in 1-2 minutes")
        else:
            print(f"  HTTP Error: {e.code}")
    except Exception as e:
        print(f"  Error checking URL: {e}")

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()

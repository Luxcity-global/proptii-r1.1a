#!/bin/bash

# Exit on error
set -e

# Set variables
RESOURCE_GROUP="proptii-rg"
LOCATION="eastus2"  # East US 2 region
SUBSCRIPTION_ID="93714023-0875-491f-bd2f-dbc0ce275c4c"

# Verify subscription
echo "Verifying subscription..."
CURRENT_SUB=$(az account show --query id -o tsv)
if [ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]; then
    echo "Switching to subscription $SUBSCRIPTION_ID..."
    az account set --subscription $SUBSCRIPTION_ID
fi

# Define tags for different resource types
INFRA_TAGS="Environment=Production Project=Proptii ManagedBy=DevTeam Component=infrastructure"
FRONTEND_TAGS="Environment=Production Project=Proptii ManagedBy=DevTeam Component=frontend"
BACKEND_TAGS="Environment=Production Project=Proptii ManagedBy=DevTeam Component=backend"
DATABASE_TAGS="Environment=Production Project=Proptii ManagedBy=DevTeam Component=database"
MONITORING_TAGS="Environment=Production Project=Proptii ManagedBy=DevTeam Component=monitoring"

# Function to check if resource exists
check_resource_exists() {
    local resource_type=$1
    local resource_name=$2
    az resource show --name $resource_name --resource-group $RESOURCE_GROUP --resource-type $resource_type &>/dev/null
    return $?
}

# Core Infrastructure
echo "Setting up Core Infrastructure..."

# Network Security
echo "Creating Network Security Group..."
if ! check_resource_exists "Microsoft.Network/networkSecurityGroups" "proptii-prod-nsg-01"; then
    az network nsg create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-nsg-01 \
        --location $LOCATION \
        --tags $INFRA_TAGS
fi

# Virtual Network
echo "Creating Virtual Network..."
if ! check_resource_exists "Microsoft.Network/virtualNetworks" "proptii-prod-vnet-01"; then
    az network vnet create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-vnet-01 \
        --location $LOCATION \
        --address-prefix 10.0.0.0/16 \
        --tags $INFRA_TAGS
fi

# Key Vault
echo "Creating Key Vault..."
if ! check_resource_exists "Microsoft.KeyVault/vaults" "proptii-prod-kv-01"; then
    az keyvault create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-kv-01 \
        --location $LOCATION \
        --sku standard \
        --tags $INFRA_TAGS
fi

# Application Insights
echo "Creating Application Insights..."
if ! check_resource_exists "Microsoft.Insights/components" "proptii-prod-ai-01"; then
    az monitor app-insights component create \
        --resource-group $RESOURCE_GROUP \
        --app proptii-prod-ai-01 \
        --location $LOCATION \
        --tags $INFRA_TAGS
fi

# Log Analytics Workspace
echo "Creating Log Analytics Workspace..."
if ! check_resource_exists "Microsoft.OperationalInsights/workspaces" "proptii-prod-law-01"; then
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name proptii-prod-law-01 \
        --location $LOCATION \
        --tags $INFRA_TAGS
fi

# Application Services
echo "Setting up Application Services..."

# Create Storage Accounts for Function Apps
echo "Creating Storage Accounts for Function Apps..."
if ! check_resource_exists "Microsoft.Storage/storageAccounts" "proptiiprodst01"; then
    az storage account create \
        --name proptiiprodst01 \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS \
        --tags $BACKEND_TAGS
fi

if ! check_resource_exists "Microsoft.Storage/storageAccounts" "proptiistagingst01"; then
    az storage account create \
        --name proptiistagingst01 \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS \
        --tags $BACKEND_TAGS Environment=Staging
fi

# Static Web App (Production)
echo "Creating Static Web App (Production)..."
if ! check_resource_exists "Microsoft.Web/staticSites" "proptii-prod-web-static-01"; then
    az staticwebapp create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-web-static-01 \
        --location $LOCATION \
        --tags $FRONTEND_TAGS
fi

# Static Web App (Staging)
echo "Creating Static Web App (Staging)..."
if ! check_resource_exists "Microsoft.Web/staticSites" "proptii-staging-web-static-01"; then
    az staticwebapp create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-staging-web-static-01 \
        --location $LOCATION \
        --tags $FRONTEND_TAGS Environment=Staging
fi

# CDN Profile
echo "Creating CDN Profile..."
if ! check_resource_exists "Microsoft.Cdn/profiles" "proptii-prod-cdn-01"; then
    az cdn profile create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-cdn-01 \
        --location $LOCATION \
        --sku Standard_Microsoft \
        --tags $FRONTEND_TAGS
fi

# Function App (Production)
echo "Creating Function App (Production)..."
if ! check_resource_exists "Microsoft.Web/sites" "proptii-prod-func-api-01"; then
    az functionapp create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-func-api-01 \
        --storage-account proptiiprodst01 \
        --runtime node \
        --runtime-version 18 \
        --functions-version 4 \
        --location $LOCATION \
        --tags $BACKEND_TAGS
fi

# Function App (Staging)
echo "Creating Function App (Staging)..."
if ! check_resource_exists "Microsoft.Web/sites" "proptii-staging-func-api-01"; then
    az functionapp create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-staging-func-api-01 \
        --storage-account proptiistagingst01 \
        --runtime node \
        --runtime-version 18 \
        --functions-version 4 \
        --location $LOCATION \
        --tags $BACKEND_TAGS Environment=Staging
fi

# API Management
echo "Creating API Management..."
if ! check_resource_exists "Microsoft.ApiManagement/service" "proptii-prod-apim-01"; then
    az apim create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-apim-01 \
        --location $LOCATION \
        --publisher-name "Proptii" \
        --publisher-email "admin@proptii.com" \
        --sku-name Developer \
        --tags $BACKEND_TAGS
fi

# Database
echo "Setting up Database..."

# Cosmos DB Account
echo "Creating Cosmos DB Account..."
if ! check_resource_exists "Microsoft.DocumentDB/databaseAccounts" "proptii-prod-cosmos-01"; then
    az cosmosdb create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-cosmos-01 \
        --locations regionName=$LOCATION failoverPriority=0 isZoneRedundant=False \
        --default-consistency-level Session \
        --enable-multiple-write-locations false \
        --enable-automatic-failover true \
        --tags $DATABASE_TAGS
fi

# Create Cosmos DB Database and Containers
echo "Creating Cosmos DB Database and Containers..."
if ! check_resource_exists "Microsoft.DocumentDB/databaseAccounts/sqlDatabases" "proptii-prod-cosmos-01/proptii-prod-db-01"; then
    az cosmosdb sql database create \
        --resource-group $RESOURCE_GROUP \
        --account-name proptii-prod-cosmos-01 \
        --name proptii-prod-db-01
fi

# Properties Container
if ! check_resource_exists "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers" "proptii-prod-cosmos-01/proptii-prod-db-01/properties"; then
    az cosmosdb sql container create \
        --resource-group $RESOURCE_GROUP \
        --account-name proptii-prod-cosmos-01 \
        --database-name proptii-prod-db-01 \
        --name properties \
        --partition-key-path "/id" \
        --throughput 400
fi

# ViewingRequests Container
if ! check_resource_exists "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers" "proptii-prod-cosmos-01/proptii-prod-db-01/viewingRequests"; then
    az cosmosdb sql container create \
        --resource-group $RESOURCE_GROUP \
        --account-name proptii-prod-cosmos-01 \
        --database-name proptii-prod-db-01 \
        --name viewingRequests \
        --partition-key-path "/propertyId" \
        --throughput 400
fi

# Users Container
if ! check_resource_exists "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers" "proptii-prod-cosmos-01/proptii-prod-db-01/users"; then
    az cosmosdb sql container create \
        --resource-group $RESOURCE_GROUP \
        --account-name proptii-prod-cosmos-01 \
        --database-name proptii-prod-db-01 \
        --name users \
        --partition-key-path "/id" \
        --throughput 400
fi

# DevOps & CI/CD
echo "Setting up DevOps & CI/CD..."

# Create Action Group for Alerts
echo "Creating Action Group for Alerts..."
if ! check_resource_exists "Microsoft.Insights/actionGroups" "proptii-prod-ag-01"; then
    az monitor action-group create \
        --resource-group $RESOURCE_GROUP \
        --name proptii-prod-ag-01 \
        --action email admin admin@proptii.com \
        --tags $MONITORING_TAGS
fi

echo "Resource setup completed successfully!" 
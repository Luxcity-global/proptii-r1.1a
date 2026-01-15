#!/bin/bash

# Exit on error
set -e

# Set variables
RESOURCE_GROUP="proptii-rg"
LOCATION="eastus2"  # East US 2 region
SUBSCRIPTION_ID="93714023-0875-491f-bd2f-dbc0ce275c4c"
ACTION_GROUP="proptii-prod-ag-01"

# Verify subscription
echo "Verifying subscription..."
CURRENT_SUB=$(az account show --query id -o tsv)
if [ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]; then
    echo "Switching to subscription $SUBSCRIPTION_ID..."
    az account set --subscription $SUBSCRIPTION_ID
fi

# Function to check if alert rule exists
check_alert_rule_exists() {
    local rule_name=$1
    az monitor metrics alert show --name $rule_name --resource-group $RESOURCE_GROUP &>/dev/null
    return $?
}

# Function to create alert rule
create_alert_rule() {
    local name=$1
    local resource=$2
    local metric=$3
    local threshold=$4
    local operator=$5
    local aggregation=$6
    local window_size=$7
    local evaluation_frequency=$8
    local severity=$9

    if ! check_alert_rule_exists $name; then
        echo "Creating alert rule: $name"
        az monitor metrics alert create \
            --name $name \
            --resource-group $RESOURCE_GROUP \
            --scopes $resource \
            --condition "avg $metric $operator $threshold" \
            --window-size $window_size \
            --evaluation-frequency $evaluation_frequency \
            --action $ACTION_GROUP \
            --severity $severity \
            --description "Alert when $metric $operator $threshold"
    else
        echo "Alert rule $name already exists, skipping..."
    fi
}

# Cosmos DB Alerts
echo "Setting up Cosmos DB Alerts..."

# RU Consumption Alert
create_alert_rule \
    "proptii-cosmos-ru-consumption" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/proptii-prod-cosmos-01" \
    "TotalRequestUnits" \
    80 \
    ">" \
    "Total" \
    "PT5M" \
    "PT1M" \
    2

# Storage Usage Alert
create_alert_rule \
    "proptii-cosmos-storage-usage" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/proptii-prod-cosmos-01" \
    "DataUsage" \
    80 \
    ">" \
    "Average" \
    "PT5M" \
    "PT1M" \
    2

# Function App Alerts
echo "Setting up Function App Alerts..."

# CPU Usage Alert
create_alert_rule \
    "proptii-func-cpu-usage" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/proptii-prod-func-api-01" \
    "CpuTime" \
    80 \
    ">" \
    "Average" \
    "PT5M" \
    "PT1M" \
    2

# Memory Usage Alert
create_alert_rule \
    "proptii-func-memory-usage" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/proptii-prod-func-api-01" \
    "MemoryWorkingSet" \
    85 \
    ">" \
    "Average" \
    "PT5M" \
    "PT1M" \
    2

# Static Web App Alerts
echo "Setting up Static Web App Alerts..."

# Response Time Alert
create_alert_rule \
    "proptii-web-response-time" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/staticSites/proptii-prod-web-static-01" \
    "ResponseTime" \
    500 \
    ">" \
    "Average" \
    "PT5M" \
    "PT1M" \
    2

# Error Rate Alert
create_alert_rule \
    "proptii-web-error-rate" \
    "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/staticSites/proptii-prod-web-static-01" \
    "Http5xx" \
    1 \
    ">" \
    "Count" \
    "PT5M" \
    "PT1M" \
    2

echo "Monitoring setup completed successfully!" 
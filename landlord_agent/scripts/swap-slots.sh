#!/bin/bash

# Deployment Slot Swap Automation for Azure App Service
# Usage: ./scripts/swap-slots.sh <app-name> <resource-group> [source-slot] [target-slot]

APP_NAME=$1
RESOURCE_GROUP=$2
SOURCE_SLOT=${3:-staging}
TARGET_SLOT=${4:-production}

if [ -z "$APP_NAME" ] || [ -z "$RESOURCE_GROUP" ]; then
  echo "Error: App Name and Resource Group are required."
  echo "Usage: $0 <app-name> <resource-group> [source-slot] [target-slot]"
  exit 1
fi

echo "----------------------------------------------------------"
echo "Starting Deployment Slot Swap"
echo "App: $APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "Source Slot: $SOURCE_SLOT"
echo "Target Slot: $TARGET_SLOT"
echo "----------------------------------------------------------"

# Check if logged in
if ! az account show &> /dev/null; then
  echo "Error: Not logged in to Azure CLI. Please run 'az login' first."
  exit 1
fi

# Perform the swap
echo "Performing swap... this may take a few minutes."
az webapp deployment slot swap \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --slot "$SOURCE_SLOT" \
  --target-slot "$TARGET_SLOT"

if [ $? -eq 0 ]; then
  echo "SUCCESS: Slot swap completed successfully."
else
  echo "ERROR: Slot swap failed."
  exit 1
fi

echo "----------------------------------------------------------"
echo "Finalizing Verification"
# Optional: Ping the production URL to warm it up
PROD_URL=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" -o tsv)
echo "Warming up production at https://$PROD_URL ..."
curl -s -I "https://$PROD_URL" | grep HTTP
echo "Deployment Complete."

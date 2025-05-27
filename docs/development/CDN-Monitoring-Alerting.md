# CDN Monitoring & Alerting

## Table of Contents
1. [Performance Monitoring](#performance-monitoring)
2. [Alert Configuration](#alert-configuration)
3. [Dashboard Creation](#dashboard-creation)

## Performance Monitoring

### Core Web Vitals

#### LCP (Largest Contentful Paint)
```javascript
// Application Insights configuration
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
  .setAutoCollectPerformance(true)
  .start();

// LCP tracking
appInsights.defaultClient.trackMetric({
  name: 'LCP',
  value: performance.now(),
  properties: {
    url: window.location.href,
    element: largestContentfulPaint.element
  }
});
```

#### FID (First Input Delay)
```javascript
// FID monitoring
appInsights.defaultClient.trackMetric({
  name: 'FID',
  value: firstInputDelay,
  properties: {
    url: window.location.href,
    interaction: firstInputType
  }
});
```

#### CLS (Cumulative Layout Shift)
```javascript
// CLS measurement
appInsights.defaultClient.trackMetric({
  name: 'CLS',
  value: cumulativeLayoutShift,
  properties: {
    url: window.location.href,
    sources: layoutShiftSources
  }
});
```

### Custom Metrics

#### Cache Hit Rates
```javascript
// Cache hit rate tracking
appInsights.defaultClient.trackMetric({
  name: 'CacheHitRate',
  value: cacheHits / totalRequests,
  properties: {
    endpoint: cdnEndpoint,
    contentType: responseContentType
  }
});
```

#### Response Times
```javascript
// Response time tracking
appInsights.defaultClient.trackMetric({
  name: 'ResponseTime',
  value: responseTime,
  properties: {
    endpoint: cdnEndpoint,
    path: requestPath,
    status: responseStatus
  }
});
```

#### Error Rates
```javascript
// Error rate tracking
appInsights.defaultClient.trackMetric({
  name: 'ErrorRate',
  value: errorCount / totalRequests,
  properties: {
    endpoint: cdnEndpoint,
    errorType: errorType
  }
});
```

## Alert Configuration

### Performance Alerts

#### Response Time Thresholds
```json
{
  "name": "HighResponseTime",
  "description": "Alert when response time exceeds threshold",
  "severity": 1,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "PT5M",
  "windowSize": "PT5M",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "ResponseTime",
        "metricName": "ResponseTime",
        "operator": "GreaterThan",
        "threshold": 1000,
        "timeAggregation": "Average"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

#### Error Rate Limits
```json
{
  "name": "HighErrorRate",
  "description": "Alert when error rate exceeds threshold",
  "severity": 1,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "PT5M",
  "windowSize": "PT5M",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "ErrorRate",
        "metricName": "ErrorRate",
        "operator": "GreaterThan",
        "threshold": 0.05,
        "timeAggregation": "Average"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

#### Cache Hit Ratio
```json
{
  "name": "LowCacheHitRatio",
  "description": "Alert when cache hit ratio falls below threshold",
  "severity": 2,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "PT5M",
  "windowSize": "PT5M",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "CacheHitRatio",
        "metricName": "CacheHitRatio",
        "operator": "LessThan",
        "threshold": 0.8,
        "timeAggregation": "Average"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

### Security Alerts

#### WAF Triggers
```json
{
  "name": "WAFRuleTriggered",
  "description": "Alert when WAF rule is triggered",
  "severity": 1,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "PT5M",
  "windowSize": "PT5M",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "WAFRuleTriggered",
        "metricName": "WAFRuleTriggered",
        "operator": "GreaterThan",
        "threshold": 0,
        "timeAggregation": "Count"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

#### Access Violations
```json
{
  "name": "AccessViolation",
  "description": "Alert when access violation occurs",
  "severity": 1,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "PT5M",
  "windowSize": "PT5M",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "AccessViolation",
        "metricName": "AccessViolation",
        "operator": "GreaterThan",
        "threshold": 0,
        "timeAggregation": "Count"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

#### SSL Issues
```json
{
  "name": "SSLIssue",
  "description": "Alert when SSL certificate is about to expire",
  "severity": 2,
  "enabled": true,
  "scopes": [
    "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile"
  ],
  "evaluationFrequency": "P1D",
  "windowSize": "P1D",
  "criteria": {
    "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
    "allOf": [
      {
        "name": "SSLExpiryDays",
        "metricName": "SSLExpiryDays",
        "operator": "LessThan",
        "threshold": 30,
        "timeAggregation": "Minimum"
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/microsoft.insights/actionGroups/cdn-alerts"
    }
  ]
}
```

## Dashboard Creation

### Performance Dashboard

#### Core Metrics
```json
{
  "name": "CDN Performance Dashboard",
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "queryInputs",
                  "value": {
                    "timespan": {
                      "duration": "PT24H"
                    },
                    "id": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile",
                    "chartType": 0,
                    "metrics": [
                      {
                        "name": "ResponseTime",
                        "aggregationType": 4
                      }
                    ]
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
          }
        }
      }
    }
  }
}
```

#### Cache Performance
```json
{
  "name": "CDN Cache Dashboard",
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "queryInputs",
                  "value": {
                    "timespan": {
                      "duration": "PT24H"
                    },
                    "id": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile",
                    "chartType": 0,
                    "metrics": [
                      {
                        "name": "CacheHitRatio",
                        "aggregationType": 4
                      }
                    ]
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
          }
        }
      }
    }
  }
}
```

### Security Dashboard

#### WAF Metrics
```json
{
  "name": "CDN Security Dashboard",
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "queryInputs",
                  "value": {
                    "timespan": {
                      "duration": "PT24H"
                    },
                    "id": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile",
                    "chartType": 0,
                    "metrics": [
                      {
                        "name": "WAFRuleTriggered",
                        "aggregationType": 1
                      }
                    ]
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
          }
        }
      }
    }
  }
}
```

### Operational Dashboard

#### Health Status
```json
{
  "name": "CDN Health Dashboard",
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "queryInputs",
                  "value": {
                    "timespan": {
                      "duration": "PT24H"
                    },
                    "id": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile",
                    "chartType": 0,
                    "metrics": [
                      {
                        "name": "HealthProbeStatus",
                        "aggregationType": 4
                      }
                    ]
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
          }
        }
      }
    }
  }
}
```

#### Resource Utilization
```json
{
  "name": "CDN Resource Dashboard",
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "queryInputs",
                  "value": {
                    "timespan": {
                      "duration": "PT24H"
                    },
                    "id": "/subscriptions/{subscriptionId}/resourceGroups/proptii-rg-eastus2/providers/Microsoft.Cdn/profiles/proptii-cdn-profile",
                    "chartType": 0,
                    "metrics": [
                      {
                        "name": "Bandwidth",
                        "aggregationType": 4
                      }
                    ]
                  }
                }
              ],
              "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
          }
        }
      }
    }
  }
}
``` 
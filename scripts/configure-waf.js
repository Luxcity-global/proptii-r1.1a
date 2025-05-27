import { DefaultAzureCredential } from '@azure/identity';
import { FrontDoorManagementClient } from '@azure/arm-frontdoor';
import chalk from 'chalk';

const configureWAF = async () => {
    try {
        console.log(chalk.blue('🔧 Configuring WAF rules...'));

        const credential = new DefaultAzureCredential();
        const frontDoorClient = new FrontDoorManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

        const resourceGroupName = process.env.RESOURCE_GROUP_NAME;
        const wafPolicyName = 'proptii-waf-policy';

        // Create/Update WAF policy
        await frontDoorClient.policies.beginCreateOrUpdateAndWait(
            resourceGroupName,
            wafPolicyName,
            {
                location: 'global',
                sku: {
                    name: 'Standard_AzureFrontDoor'
                },
                customRules: {
                    rules: [
                        {
                            name: 'BlockMaliciousIPs',
                            priority: 100,
                            enabledState: 'Enabled',
                            ruleType: 'MatchRule',
                            matchConditions: [
                                {
                                    matchVariable: 'RemoteAddr',
                                    operator: 'IPMatch',
                                    negateCondition: false,
                                    matchValue: process.env.BLOCKED_IP_RANGES?.split(',') || []
                                }
                            ],
                            action: 'Block'
                        },
                        {
                            name: 'RateLimitRequests',
                            priority: 200,
                            enabledState: 'Enabled',
                            ruleType: 'RateLimitRule',
                            rateLimitDurationInMinutes: 1,
                            rateLimitThreshold: 1000,
                            action: 'Block'
                        }
                    ]
                },
                managedRules: {
                    managedRuleSets: [
                        {
                            ruleSetType: 'DefaultRuleSet',
                            ruleSetVersion: '1.0'
                        },
                        {
                            ruleSetType: 'BotProtection',
                            ruleSetVersion: '1.0'
                        }
                    ]
                },
                policySettings: {
                    enabledState: 'Enabled',
                    mode: 'Prevention',
                    requestBodyCheck: true,
                    maxRequestBodySizeInKb: 128
                }
            }
        );

        // Associate WAF policy with Front Door endpoint
        const frontDoorName = process.env.AZURE_FRONTDOOR_NAME;
        const endpointName = process.env.AZURE_FRONTDOOR_ENDPOINT;

        await frontDoorClient.endpoints.beginUpdateAndWait(
            resourceGroupName,
            frontDoorName,
            endpointName,
            {
                wafPolicyLink: {
                    id: `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/frontDoorWebApplicationFirewallPolicies/${wafPolicyName}`
                }
            }
        );

        console.log(chalk.green('✅ WAF configuration completed successfully!'));
        console.log(chalk.blue('📝 Applied configurations:'));
        console.log(chalk.blue('   - IP blocking rules'));
        console.log(chalk.blue('   - Rate limiting'));
        console.log(chalk.blue('   - Bot protection'));
        console.log(chalk.blue('   - OWASP core rule set'));

    } catch (error) {
        console.error(chalk.red('❌ WAF configuration failed:'), error.message);
        process.exit(1);
    }
};

configureWAF(); 
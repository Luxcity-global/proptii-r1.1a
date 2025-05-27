import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

const validateFeatureFlags = () => {
    try {
        console.log(chalk.blue('🔍 Validating feature flags configuration...'));

        // Read environment files
        const environments = ['development', 'staging', 'production'];
        const envFiles = environments.map(env => {
            try {
                return {
                    env,
                    content: readFileSync(join(process.cwd(), `.env.${env}`), 'utf8')
                };
            } catch (error) {
                console.warn(chalk.yellow(`⚠️ No .env.${env} file found`));
                return { env, content: '' };
            }
        });

        // Required feature flags for each environment
        const requiredFlags = {
            development: [
                'VITE_ENABLE_DEBUG_LOGGING',
                'VITE_ENABLE_DETAILED_ERRORS',
                'VITE_ENABLE_BETA_FEATURES'
            ],
            staging: [
                'VITE_ENABLE_DEBUG_LOGGING',
                'VITE_ENABLE_PERFORMANCE_MONITORING',
                'VITE_ENABLE_ERROR_REPORTING',
                'VITE_ENABLE_BETA_FEATURES',
                'VITE_ENABLE_SECURITY_HEADERS',
                'VITE_ENABLE_CACHING'
            ],
            production: [
                'VITE_ENABLE_PERFORMANCE_MONITORING',
                'VITE_ENABLE_ERROR_REPORTING',
                'VITE_ENABLE_SECURITY_HEADERS',
                'VITE_ENABLE_CACHING'
            ]
        };

        // Validate each environment
        envFiles.forEach(({ env, content }) => {
            if (!content) return;

            console.log(chalk.blue(`\nValidating ${env} environment:`));

            const envVars = content
                .split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .reduce((acc, line) => {
                    const [key, value] = line.split('=');
                    acc[key.trim()] = value?.trim();
                    return acc;
                }, {});

            // Check required flags
            const missingFlags = requiredFlags[env].filter(flag => !envVars[flag]);
            if (missingFlags.length > 0) {
                console.error(chalk.red(`❌ Missing required feature flags in ${env}:`));
                missingFlags.forEach(flag => {
                    console.error(chalk.red(`   - ${flag}`));
                });
                process.exit(1);
            }

            // Validate flag values
            Object.entries(envVars)
                .filter(([key]) => key.startsWith('VITE_ENABLE_'))
                .forEach(([key, value]) => {
                    if (!['true', 'false'].includes(value?.toLowerCase())) {
                        console.error(chalk.red(`❌ Invalid value for ${key} in ${env}: ${value}`));
                        console.error(chalk.red('   Feature flag values must be "true" or "false"'));
                        process.exit(1);
                    }
                });

            // Environment-specific validations
            if (env === 'production') {
                if (envVars.VITE_ENABLE_DEBUG_LOGGING === 'true') {
                    console.error(chalk.red('❌ Debug logging should be disabled in production'));
                    process.exit(1);
                }
                if (envVars.VITE_ENABLE_DETAILED_ERRORS === 'true') {
                    console.error(chalk.red('❌ Detailed errors should be disabled in production'));
                    process.exit(1);
                }
                if (envVars.VITE_ENABLE_BETA_FEATURES === 'true') {
                    console.error(chalk.red('❌ Beta features should be disabled in production'));
                    process.exit(1);
                }
            }

            console.log(chalk.green(`✅ ${env} environment feature flags are valid`));
        });

        console.log(chalk.green('\n✅ Feature flags validation completed successfully!'));

    } catch (error) {
        console.error(chalk.red('❌ Feature flags validation failed:'), error.message);
        process.exit(1);
    }
};

validateFeatureFlags(); 
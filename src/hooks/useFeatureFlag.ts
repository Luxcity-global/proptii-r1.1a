import { useMemo } from 'react';
import featureFlags, { isFeatureEnabled } from '../config/featureFlags';

export const useFeatureFlag = (featureName: keyof typeof featureFlags) => {
    return useMemo(() => isFeatureEnabled(featureName), [featureName]);
};

export const useFeatureFlags = () => {
    return useMemo(() => {
        const currentEnv = process.env.VITE_ENVIRONMENT || 'development';
        return Object.entries(featureFlags).reduce((acc, [name, flag]) => {
            acc[name as keyof typeof featureFlags] = flag.isEnabled && flag.environments.includes(currentEnv as any);
            return acc;
        }, {} as Record<keyof typeof featureFlags, boolean>);
    }, []);
};

export default useFeatureFlag; 
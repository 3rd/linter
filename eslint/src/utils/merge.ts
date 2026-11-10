import isEqual from "lodash/isEqual";
import mergeWith from "lodash/mergeWith";
import unionWith from "lodash/unionWith";

const merge = (...configs: unknown[]) => {
  const mergedConfig: unknown = {};

  for (const config of configs) {
    // eslint-disable-next-line @typescript-eslint/consistent-return
    mergeWith(mergedConfig, config, (existingValue: unknown, incomingValue: unknown) => {
      const areBothArrays = Array.isArray(existingValue) && Array.isArray(incomingValue);
      if (areBothArrays) {
        const hasSameSingleValue =
          existingValue.length === 1 && incomingValue.length === 1 && isEqual(existingValue[0], incomingValue[0]);
        if (hasSameSingleValue) return existingValue;

        return unionWith(existingValue, incomingValue, isEqual);
      }
    });
  }

  return mergedConfig;
};

export { merge };

import mergeWith from "lodash/mergeWith";
import unionWith from "lodash/unionWith";
import isEqual from "lodash/isEqual";

const merge = (...objs: unknown[]) => {
  const out: unknown = {};
  for (const obj of objs) {
    // eslint-disable-next-line @typescript-eslint/consistent-return
    mergeWith(out, obj, (a: unknown, b: unknown) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length === 1 && b.length === 1 && isEqual(a[0], b[0])) return a as unknown[];
        return unionWith(a, b, isEqual) as unknown[];
      }
    });
  }
  return out;
};

export { merge };

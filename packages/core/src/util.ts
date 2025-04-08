export function flatten<T extends NonNullable<unknown>>(array: T[][], depth?: number): T[] {
    depth = depth ?? math.huge;

    const result = [] as T[];

    for (const [, v] of ipairs(array)) {
        if (typeIs(v, "table") && depth > 0) {
            const nested = flatten<T>(v as unknown as T[][], depth - 1);

            for (const [, nv] of ipairs(nested)) {
                if (nv !== undefined) {
                    result.push(nv);
                }
            }
        } else {
            result.push(v as unknown as T);
        }
    }

    return result;
}